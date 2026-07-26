# Architecture

## Repository architecture

HiLiving is a modular monorepo with independently buildable and deployable applications:

- `frontend/`: React, TypeScript, Vite storefront, and frontend tests
- `backend/`: Java 21, Maven, and Spring Boot API
- `docs/`: project memory and operating guidance
- `infrastructure/`: future deployment assets and infrastructure guidance
- `compose.yaml`: local development services only

Java source stays inside `backend/`; frontend source stays inside `frontend/`.

## Frontend architecture

The frontend is a client-rendered React application using React Router, Tailwind CSS, and focused local hooks. Catalog integration is divided into explicit boundaries:

- `src/api`: backend response DTOs, URL/query serialization, HTTP status handling, safe error normalization, and DTO-to-domain mapping
- `src/config`: environment normalization
- `src/features/catalog`: presentation-safe catalog models and cancellation-aware resource/query hooks
- `src/features/auth`: three-state session hydration, auth context, login/registration forms, and protected routing
- `src/features/account`: profile, password, membership, and delivery-address UI
- `src/features/cart`: versioned minimal local persistence, cart quotation state, reconciliation, and the cart page
- `src/features/checkout`: order/payment contracts, protected QPay checkout orchestration, status labels, and order confirmation
- `src/features/admin`: separate responsive shell, centralized admin adapters, dashboard, catalog, order, user, banner, and news administration
- `src/components/catalog`: reusable loading, empty, error, retry, navigation, filter, grid, and pagination UI
- `src/pages`: category, brand, news, and slug-based product-detail routes

Only API adapter modules call `fetch`. Presentational components receive mapped frontend models rather than backend DTOs. No global state or server-state library is installed. Catalog reads keep focused local hooks; session identity and cart coordination use small React contexts because header, route protection, cart, and checkout share them.

The cart persists only `{version, items: [{productSlug, quantity}]}` under `hiliving.cart.v1`; it never stores trusted prices, discounts, stock, customer identity, or order state. Malformed entries are discarded, duplicate slugs merge within the quantity limit, and every cart/auth change is reconciled through the quote API. Cart data survives login and is cleared only after confirmed order creation.

Category, brand, product, hero-banner, and news mocks are no longer application sources. Active banners and published news are read from the API; the unrelated promotional strip remains static.

## Frontend environment and same-origin API path

The browser calls `/api/v1` by default. `VITE_API_BASE_URL` may provide an explicit base URL, but its safe default is blank. During local development, Vite proxies `/api` and `/media` to `VITE_DEV_API_PROXY_TARGET`, which defaults to `http://localhost:8080`. Production NGINX is expected to proxy `/api` to Spring Boot and expose `/media` from the external upload root as a read-only static alias.

This same-origin design avoids browser CORS requirements in both the preferred local and target production topology. The backend does not enable wildcard or default cross-origin access. An explicitly cross-origin deployment must add a narrow, environment-configured allowlist as a separate reviewed decision.

Vite loads configuration from the root environment directory. Only `VITE_` variables are exposed to client code; secrets must never use that prefix.

## Routing and UI states

Catalog routes are:

- `/categories` and `/categories/:categorySlug`
- `/brands` and `/brands/:brandSlug`
- `/products/:productSlug`
- `/news`
- `/cart`
- `/checkout`
- `/checkout/payment/:orderNumber`
- `/checkout/success/:orderNumber`
- `/account/orders` and `/account/orders/:orderNumber`
- `/admin/orders` and `/admin/orders/:orderNumber`

Identity and account routes are `/login`, `/register`, `/account`, `/account/profile`, `/account/addresses`, and `/account/security`. Account and checkout routes hydrate through `GET /api/v1/account/me` and distinguish loading, anonymous, and authenticated state. Anonymous checkout navigation is redirected to `/login?returnTo=%2Fcheckout`; only same-origin relative paths are accepted, so a successful login safely returns to checkout without losing the browser cart.

Catalog query state uses the URL. The browser exposes one-based `page` values while the adapter converts requests to the backend's zero-based page convention. Search and controlled sort selections also remain shareable in the URL. Product cards navigate by slug.

Category and brand collection routes share one persistent catalog shell containing the storefront header, hero carousel, footer, and mobile navigation. Optional slug routes swap only the collection content, so internal catalog navigation does not remount or refetch the hero. The hero stores its validated banner snapshot, selected banner ID, and completed-entrance flag in per-tab session storage. Home, catalog, and other storefront owners can therefore restore the same visible image immediately after reload or route-driven remount, while a background public-banner read refreshes the session snapshot. The visible image loads eagerly, later slides remain lazy, and the reduced-motion-aware fade/scale entrance runs only once per tab session. Moving between category and brand URLs scrolls to the catalog-content boundary instead of replaying the top banner, and the collection layout uses the same reduced-motion-aware ease-out reveal as home-page sections.

On mobile category pages, the active category icon tile is the category-switching trigger. It opens a bounded scrollable link menu with active-page state, closes after navigation or focus leaves the control, and supports Escape-to-close with focus restoration. The former separate native select is not rendered.

Every API-backed section starts with a dimensionally similar skeleton, then renders data, an explicit empty state, or a safe generic error with retry. Product 404 has a dedicated not-found page. Backend messages, codes, SQL details, exception names, and stack traces are never rendered. Browser navigation uses React Router deep links; target NGINX configuration must later use an SPA fallback such as `try_files ... /index.html` while routing `/api` separately.

## Backend architecture

The backend uses Java 21, Maven, and Spring Boot 4.1.0. `com.hiliving` is the component-scan root. Shared HTTP envelopes and safe error handling live under `com.hiliving.api`; catalog, identity, and commerce code use feature-first packages. Commerce separates cart quotation, centralized pricing, order persistence/orchestration, and QPay provider orchestration. Controllers expose DTOs rather than JPA entities. Services own normalization, authorization-sensitive behavior, and mapping; repositories own persistence queries. Actuator supplies `/actuator/health`.

Spring Security uses server-side sessions. The session cookie is HttpOnly and `SameSite=Lax`; `SESSION_COOKIE_SECURE` must be true behind production HTTPS. Login explicitly rotates the session identifier. The browser never stores an auth token. A readable `XSRF-TOKEN` cookie is mirrored into `X-XSRF-TOKEN` for state-changing requests; the cookie exists only for CSRF defense and is not an authentication credential.

Phase 7B/7C adds a PostgreSQL transactional-email outbox, SMTP provider boundary, purpose-specific hashed email verification/password reset tokens, bounded rate limiting, and per-user session versions for password-reset invalidation. Unverified password accounts retain login/checkout compatibility, but password recovery requires a verified email. Full operational details are in `docs/TRANSACTIONAL_EMAIL.md`.

Public catalog GETs, public cart quotation, registration, login, CSRF initialization, and health are permitted. `/api/v1/account/**` requires authentication, `/api/v1/orders/**` requires `CUSTOMER`, `/api/v1/admin/**` requires `ADMIN`, and unmatched routes are denied. CSRF remains required for anonymous quote POSTs and authenticated order POSTs. No broad CORS policy is enabled because Vite and future NGINX preserve same-origin requests.

## Identity and account data model

Flyway migration `V3__create_identity_and_account_schema.sql` creates `membership_tiers`, `users`, and `user_addresses`. Membership rows are permanent reference data: REGULAR 0%, BRONZE 3%, SILVER 5%, and GOLD 10%. Users may have a nullable validated override; the effective discount is the override when present and otherwise the tier default.

Emails are trimmed and lowercased. Supported Mongolian phone inputs are normalized to `+976` plus eight digits before lookup and uniqueness checks. Passwords use Spring Security's delegating encoder and are never returned. Public registration creates only active `CUSTOMER`/`REGULAR` users and does not automatically log in.

Users are soft-disabled with `ACTIVE`, `DISABLED`, or `LOCKED`; they are not deleted through this phase. Five failed password attempts set a 15-minute `locked_until`, while successful login clears the failed state. Address reads and mutations include both address ID and authenticated user ID. A PostgreSQL partial unique index allows at most one default address per user, and default switching clears and sets within one transaction. Address deletion is physical; deleting a default leaves no default.

## Catalog data model

Flyway migration `V2__create_catalog_schema.sql` creates Category, Brand, Product, and ProductImage tables. Category deletion is restricted while referenced, brand deletion nulls the optional product relationship, and product deletion cascades to image metadata. Slugs are unique validated public identifiers. Product status is `DRAFT`, `ACTIVE`, or `ARCHIVED`; public reads require active products/categories and an active or absent brand. Prices use `NUMERIC(12,2)`, and image content remains URL-based.

Flyway V4 adds catalog descriptions/order fields, unique product codes, stock and low-stock thresholds, new/active flags, and `membership_discount_eligible`. Lifecycle status controls draft/published/archived workflow; `active` is the independent operational visibility switch labeled `Visible` in the product editor. Public products require lifecycle `ACTIVE`, product `active=true`, an active category, and an active or absent brand. Inventory state is computed: zero is `OUT_OF_STOCK`, positive stock at or below the threshold is `LOW_STOCK`, and higher stock is `IN_STOCK`.

Normal product create/update requests do not accept or require `slug` or `productCode`. On creation, the backend transliterates supported Mongolian Cyrillic, normalizes the name to the existing lowercase ASCII slug constraint, and holds a transaction-scoped PostgreSQL advisory lock for that base slug while selecting the first free value (`name`, `name-2`, `name-3`, and so on). Flyway V7 creates `product_code_sequence`; each new product receives the next concurrency-safe `PRD-######` value independently of its name. Updates never assign either field, so renaming preserves public URLs, cart identifiers, order references, and internal product codes. Responses, admin search/list display, public slug routing, and the existing unique database constraints retain both fields.

The normal product editor and admin write DTO expose one `description` value. The backend stores that complete value in `description` and derives the compatible `short_description` summary from its first 500 Unicode code points. Existing read DTOs keep both fields because catalog cards/search and product detail consume different representations; editing a legacy product prefers its full description and falls back to the old short value when no full value exists.

Product, brand, banner, and news associations remain URL metadata, which preserves existing external URL compatibility. New administration uploads return same-origin `/media/...` URLs backed by managed media records. Product administration permits at most six images, unique order values, at most one primary image while drafting, and exactly one primary image for a publicly usable active product.

Public product detail resolves the optional authenticated customer and returns ordered images, the primary image, SKU, effective price, membership savings/eligibility, available quantity, and up to four other public products from the same category. The current product is excluded. The server does not expose draft, archived, inactive, hidden-category/brand, or otherwise unpurchasable products through this route.

## Pricing, cart quotation, and orders

`PricingService` is the single authority for product purchasability and checkout money. Requests contain product slugs, quantities, and the selected delivery method; the server reloads products and customer membership, rejects duplicate/invalid/unpublished/out-of-stock/excess lines, and returns regular, catalog-discount, membership-discount, effective subtotal, delivery, and grand totals. Catalog `discount_price` is applied first. If the product is eligible, the customer's effective membership percentage is then applied to that catalog-adjusted price. Every money operation uses `BigDecimal`, scale 2, and `HALF_UP`; order and quote currency is explicitly `MNT`.

`STANDARD_DELIVERY` uses the temporary flat fee configured by `HILIVING_STANDARD_SHIPPING_FEE`, defaulting to `5000.00`, and requires an owned customer address. `SELF_PICKUP` is quoted at `0.00`, must omit the customer address ID, and displays a clearly marked sample Hiliving collection location. The browser displays the amount returned by the backend and does not calculate it. Quotation does not reserve inventory; the final order request is fully revalidated and repriced.

Flyway V6 creates `orders`, `order_items`, and `order_address_snapshots`; Flyway V12 expands the delivery-method constraint to include `SELF_PICKUP`. Order items snapshot product identity, slug, SKU, name, primary-image URL, regular/effective unit price, catalog and membership discounts, quantity, and line total. Standard orders copy the owned delivery address. Pickup orders snapshot the sample collection location, hours, phone, and customer recipient details so order history remains explicit even after the configured location changes. Orders store totals, currency, delivery/payment choices, customer note, explicit order/payment state, request hash, idempotency key, and timestamps.

`POST /api/v1/orders` requires a `CUSTOMER` session, CSRF, and an `Idempotency-Key` UUID. Standard delivery additionally requires an owned address; self-pickup rejects an address ID. The transaction locks the customer row to serialize that customer's retries, then locks all requested product rows in sorted ID order, reprices, validates stock, writes snapshots, and deducts stock. Any failed line rolls back the entire order and all deductions. Deterministic lock order avoids deadlocks, and the stock invariant plus locks prevents negative inventory under concurrent low-stock purchases.

Idempotency is scoped by `(customer_id, idempotency_key)`. A canonical SHA-256 request hash covers sorted line quantities, address, delivery/payment methods, and note. An exact replay returns the original order; reusing a key for a different request is rejected. The browser keeps one key per unchanged checkout submission fingerprint, disables repeat submission while pending, and does not clear the cart on failure.

Cash-on-delivery remains a backend-compatible method and starts `PENDING_CONFIRMATION`/`UNPAID`, but the storefront submits QPay. A QPay order starts `PENDING_PAYMENT`/`PENDING`, holds the already-deducted inventory, creates a durable provider attempt, and returns the QR image plus bank deeplinks. The browser may poll only HiLiving's stored payment state; an explicit check action and QPay's GET callback both cause the backend to call QPay `POST /v2/payment/check`. Only a `PAID` row with the expected payment ID when supplied, exact order amount, and `MNT` currency confirms the order. Browser redirects and callback query values never confirm payment directly.

Flyway V11 adds payment attempts, ordered deeplinks, provider invoice/payment uniqueness, callback-token hashes, expiry, failure, and reconciliation states. Callback URLs contain a random token whose SHA-256 hash alone is stored. The live Merchant V2 invoice response supplies bank deeplinks in `urls`; their provider order is preserved. Provider-supplied short/logo URLs must be HTTPS, dangerous deeplink schemes are rejected, credentials remain server-only, and QPay is disabled by default. Expiry processing cancels the provider invoice before restoring stock and marks the order `CANCELLED`/`EXPIRED`; a late payment after release is held as `RECONCILIATION_REQUIRED` rather than silently confirming. QPay-side expiry must be configured to match `QPAY_INVOICE_TTL` because Merchant V2 owns the actual expiry duration. If authentication or invoice initiation fails before usable instructions are returned, the attempt row is locked, products are locked in sorted ID order, inventory is restored, and the order becomes `CANCELLED`/`FAILED` in one transaction. `inventory_released_at` makes repeated failure handling a no-op. The browser rotates its idempotency key only after an explicit QPay initiation error; it retains the key for network-ambiguous responses so a lost successful response cannot create a duplicate order.

`GET /api/v1/orders` and `GET /api/v1/orders/{orderNumber}` are customer-owned list/detail APIs. Payment instructions/checks are also ownership-scoped. ADMIN list/detail APIs support pagination, search, order/payment filters, and validated fulfillment: standard delivery advances from processing to shipped, while pickup advances from processing directly to delivered/collected. An omitted search is normalized to a non-null empty string before the case-insensitive repository query. Cancellation and refunds are not exposed. Order confirmation email is enqueued only for cash-on-delivery placement or after verified QPay payment, never when an unpaid QR is created.

## Media upload, processing, and storage

`POST /api/v1/admin/media/images` accepts `multipart/form-data` with `file` and a `purpose` of `PRODUCT`, `BRAND`, `BANNER`, or `NEWS`. It uses the existing session, ADMIN authorization, and CSRF boundary. Multipart requests must not set their own `Content-Type` boundary. Successful responses contain the public URL and authoritative media metadata; editor forms persist only that returned URL after the upload completes.

The product editor uses one batch picker and renders image cards only for selected photos. It accepts only enough JPEG/PNG files to stay within the six-image limit, uploads them through the same endpoint, appends successful uploads in selection order, and makes the first product image primary. Completed uploads remain attached if a later file in the same selection fails; individual cards still handle replacement, removal, primary selection, and ordering. Banner administration uses the same dynamic pattern with a two-image limit: the first selected image becomes desktop and the second becomes mobile, while either resulting card can still be replaced or removed. News thumbnails remain a single-image control.

The processor never trusts the supplied name, extension, or MIME type. It checks upload size before decode, uses ImageIO readers to inspect source dimensions, rejects dimension bombs, decodes the image, requires the claimed MIME type and filename extension to match the detected format, and accepts only JPEG and PNG. The decoded pixels are resized proportionally without upscaling and re-encoded to strip embedded metadata and untrusted payloads. JPEG output is RGB; PNG preserves alpha. EXIF orientation is not normalized. WEBP remains rejected because this Java baseline has no verified built-in decode-and-encode path.

Purpose policy is centralized:

| Purpose | Maximum upload | Maximum source | Maximum output | Directory |
| --- | ---: | ---: | ---: | --- |
| Product | 5 MB | 4000×4000 | 1600×1600 | `products/` |
| Brand | 2 MB | 3000×3000 | 1000×1000 | `brands/` |
| Banner | 8 MB | 6000×4000 | 2400×1600 | `banners/` |
| News | 5 MB | 4000×3000 | 1600×1200 | `news/` |

`MediaStorageService` is the provider boundary. `LocalMediaStorageService` is used for both development and the first Contabo deployment; changing the absolute configured root does not change application code. It creates server-selected purpose directories, generates UUID filenames with the processor-selected extension, stages within the destination filesystem, and uses an atomic move where supported with a safe non-replacing fallback. It normalizes and validates every resolved path, rejects traversal and symlink destinations, never uses the original filename as a path, and does not overwrite an existing key.

`HILIVING_MEDIA_STORAGE_PATH` configures the external storage root. The development default is `../infrastructure/data/uploads` relative to `backend/`; the directory is gitignored and is outside `backend/target` and `frontend/dist`, so Maven/npm clean builds do not delete uploads. Production should use `/var/lib/hiliving/uploads`, owned by a restricted `hiliving` service account, with directory/file permissions equivalent to `0750`/`0640`. The application needs read/write access; NGINX needs read-only traversal/read access. Binaries are never stored in PostgreSQL.

Flyway V5 creates `media_assets` for provider, relative storage key, purpose, original filename, detected content type, byte size, final dimensions, creator, and timestamps. Only relative storage keys are stored. Upload processing first creates a temporary re-encoded file, storage moves it to its immutable final key, and a transaction records metadata plus the `MEDIA_UPLOADED` audit event. If metadata/audit persistence fails, the service attempts to remove the final file; all processing temporary files are cleaned. A process or machine failure between the filesystem move and compensating cleanup can still leave an orphan, so future maintenance must reconcile database keys and filesystem files. Replacing/removing an association deliberately does not delete the previous immutable file because a reference-count and retention policy do not yet exist.

Spring serves `GET` and `HEAD /media/**` from the configured root during development with a bounded public cache policy. Directory listing and non-read methods are unavailable. In production, NGINX should serve the same URL space directly with a read-only `alias /var/lib/hiliving/uploads/`, deny dotfiles, disable auto-indexing, and keep `/api` routing ahead of the SPA fallback. Spring must not expose an unrelated working directory.

PostgreSQL and the upload root form one recoverable dataset and must be snapshotted/backed up together, then copied off-server. Restore exercises must verify both metadata rows and referenced files. An S3-compatible implementation should replace only `MediaStorageService` when multi-node application instances, CDN delivery, off-server durability, storage growth, or operational backup burden justify it; URLs/keys may then require a reviewed migration strategy.

## Administration and managed content

All `/api/v1/admin/**` endpoints require `ADMIN`; anonymous requests receive 401 and authenticated customers receive 403. The React admin routes use the same session/CSRF authentication but render a separate sidebar/header workspace. Orders is an active navigation route backed by server pagination and detail APIs; Pages remains a disabled future label.

The Add product and All products sidebar links use exact route matching, preventing the `/admin/products` parent path from appearing active while the dedicated `/admin/products/new` editor is selected.

The category data model remains hierarchical and services still prevent cycles, but normal category administration no longer exposes parent selection or parent/children columns. Deletion remains blocked while relationships or products reference a category. Brand deletion preserves products through the existing nullable foreign-key rule; brand administration no longer accepts a sort number and server lists are alphabetical. Normal banner administration has no start/end scheduling, destination URL, or link-label inputs. The storefront carousel currently renders images only, so those click-through fields had no public effect. News administration no longer accepts or displays a sort number: public news is ordered by effective publication time descending and the admin list by most recent update.

Admin numeric fields use one controlled input boundary across product, banner, category, and user-discount forms. It keeps an editable text representation while focused, normalizes integer-leading zeros, preserves decimal prefixes, keeps browser-native step controls, restores required empty values to zero, retains nullable empty values, and clamps configured minimum/maximum bounds on blur. Catalog discounting is opt-in in the product editor: an unchecked checkbox sends `discountPrice=null`, while enabling it reveals percentage and final-price entry modes. Percentage entry derives a two-decimal discounted price, final-price entry derives the displayed percentage, and only the existing nullable `discountPrice` crosses the API boundary. Invalid or incomplete enabled discounts are rejected before save.

`admin_audit_log` stores actor email, action, entity type/id, a short non-sensitive detail, and timestamp for administration mutations. It never stores credentials, passwords, sessions, CSRF tokens, or secrets.

## Local development environment

Docker Compose manages PostgreSQL 17 only, persists data in a named volume, publishes it on loopback, and checks readiness. Backend, frontend, and database remain independently runnable. The standard ports are PostgreSQL 5432, Spring Boot 8080, and Vite 5173. This workstation overrides PostgreSQL to 5433 and uses backend 18080 because existing services occupy the defaults.

The current workstation may contain explicitly requested local test rows for administration and storefront verification. These rows are written only to the local PostgreSQL volume, use clearly marked `.local` identities and `dev-` catalog slugs, and are not shipped through Flyway, application startup, tests, or production deployment. Image associations and optional news thumbnails are left empty; image-free products remain draft, archived, or operationally inactive.

The `local` Spring profile adds a small sample catalog only when catalog tables are empty. Migrations contain schema rather than sample rows.

## PostgreSQL and Flyway strategy

Flyway is the only schema-management mechanism. Versioned SQL lives in `backend/src/main/resources/db/migration`; applied migrations are immutable. Hibernate uses `ddl-auto=validate`. Flyway V6 adds checkout/order persistence, V7 adds the product-code sequence, V8-V10 add email/recovery/contact snapshots, and V11 adds QPay payment lifecycle persistence. PostgreSQL 17 is pinned for local and integration tests, and the production version must be compatibility-tested before deployment.

## API boundaries

Public reads remain under `/api/v1/categories`, `/api/v1/brands`, `/api/v1/products`, `/api/v1/products/{slug}`, `/api/v1/banners`, and `/api/v1/news`. `POST /api/v1/cart/quote` is public but CSRF-protected and optionally applies the authenticated customer's eligible membership discount. Auth endpoints are under `/api/v1/auth`; customer self-service is under `/api/v1/account`; customer order/payment access is under `/api/v1/orders`; administration is under `/api/v1/admin`. The only public payment write is QPay's GET callback at `/api/v1/payments/qpay/callback/{token}`, which performs server-to-server verification before mutation. Successful responses use `data`; pages include items and page metadata. Failures use the existing safe `error` envelope with stable account, cart, order, payment, and security codes where useful.

## Validation strategy

Frontend validation uses `npm ci`, ESLint, Vitest/Testing Library HTTP-boundary tests, TypeScript compilation, and a Vite production build. The current 72 tests preserve catalog, account, administration, and commerce coverage and include persistent catalog-shell navigation, catalog-aware scrolling, mobile icon-triggered category switching, QPay requests, QR/deeplinks, checkout labels, payment checks, and safe idempotency-key retry behavior. Isolated browser rehearsals cover the 390×844 category menu, category-to-brand navigation without hero refetches, customer registration/address/cart/checkout, pending and paid transitions, customer history, callback replay, and ADMIN list/detail visibility.

Live validation runs Vite against the real Spring Boot/PostgreSQL stack. Phase 6 verified product gallery selection, anonymous cart persistence after refresh, authoritative quotation, login return to checkout, address creation/selection, cash-on-delivery order placement, success details, inventory deduction, cart clearing only on success, exact idempotent replay, cross-customer order denial, and no horizontal overflow at mobile, tablet, and desktop widths. Temporary customers, address, order, product image, and stock changes were removed/restored immediately afterward. Existing Phase 5.1 media files were not modified.

Backend validation uses Maven with compiler release 21, PostgreSQL Testcontainers, Flyway through V11, Hibernate validation, repository/service/controller/security coverage, and JAR packaging. Coverage includes the QPay V2 JSON contract, durable QR/deeplink creation, ownership-scoped order listing, public callback verification through `payment/check`, exact paid-state confirmation, confirmation-email timing, and exact-once stock restoration after initiation failure. The 2026-07-26 local verification passed all 64 tests and packaging on JDK 26 targeting release 21; the workstation lacks JDK 21, so CI/deployment must repeat the full verification on the exact Java 21 runtime.

## Target Contabo deployment architecture

The production target is one Ubuntu LTS VPS with NGINX on ports 80 and 443, frontend releases under `/opt/hiliving/frontend`, static assets and SPA fallback from NGINX, same-origin `/api` reverse proxying to Spring Boot on localhost 8080, a read-only `/media/` alias to `/var/lib/hiliving/uploads/`, and locally bound PostgreSQL. Backend releases live under `/opt/hiliving/backend` and run under systemd. Restricted environment files or secret management supply secrets. PostgreSQL and upload backups are coordinated and copied off-server.

## NGINX, systemd, and HTTPS plan

NGINX will terminate Let's Encrypt HTTPS, serve the frontend, preserve React Router deep links, proxy `/api` to Spring Boot, and expose `/media/` read-only without directory listing. systemd will manage backend lifecycle and restricted environment loading, including `HILIVING_MEDIA_STORAGE_PATH=/var/lib/hiliving/uploads` and an explicitly reviewed `HILIVING_STANDARD_SHIPPING_FEE`. The QPay callback must use a stable owner-controlled HTTPS origin such as `https://api.hiliving.mn`; a temporary Cloudflare Quick Tunnel is testing-only. A named Cloudflare Tunnel may replace direct public API ingress if the owner deliberately selects it and moves/configures DNS without losing existing mail records. Production configuration and deployment remain deferred.
