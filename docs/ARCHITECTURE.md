# Architecture

## Repository architecture

HiLiving is a modular monorepo with independently buildable and deployable applications:

- `frontend/`: React, TypeScript, Vite storefront, and frontend tests
- `backend/`: Java 21, Maven, and Spring Boot API
- `docs/`: project memory and operating guidance
- `infrastructure/`: reviewed Hostinger deployment assets and infrastructure guidance
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
- `src/features/admin`: separate responsive logo-free shell, centralized admin adapters, dashboard, catalog, order, user, banner, and news administration
- `src/components/catalog`: reusable loading, empty, error, retry, navigation, filter, grid, and pagination UI
- `src/pages`: category, brand, news, and slug-based product-detail routes

Only API adapter modules call `fetch`. Presentational components receive mapped frontend models rather than backend DTOs. No global state or server-state library is installed. Catalog reads keep focused local hooks; session identity and cart coordination use small React contexts because header, route protection, cart, and checkout share them.

The cart persists only `{version, items: [{productSlug, quantity}]}` under `hiliving.cart.v1`; it never stores trusted prices, discounts, stock, customer identity, or order state. Malformed entries are discarded, duplicate slugs merge within the quantity limit, and every cart/auth change is reconciled through the quote API. Cart data survives login and is cleared only after confirmed order creation.

Category, brand, product, banner, and news mocks are no longer application sources. Active upper and lower banners and published news are read from the API; there is no hard-coded promotional-banner fallback.

## Frontend environment and same-origin API path

The browser calls `/api/v1` by default. `VITE_API_BASE_URL` may provide an explicit base URL, but its safe default is blank. During local development, Vite proxies `/api` and `/media` to `VITE_DEV_API_PROXY_TARGET`, which defaults to `http://localhost:8080`. Hostinger NGINX proxies both `/api` and `/media` to Spring Boot on `127.0.0.1:8080`; the application owns media path validation and immutable response caching while NGINX owns public TLS and request-size enforcement.

This same-origin design avoids browser CORS requirements in both the preferred local and target production topology. The backend does not enable wildcard or default cross-origin access. An explicitly cross-origin deployment must add a narrow, environment-configured allowlist as a separate reviewed decision.

Vite loads configuration from the root environment directory. Only `VITE_` variables are exposed to client code; secrets must never use that prefix.

## Routing and UI states

Catalog routes are:

- `/categories` and `/categories/:categorySlug`
- `/brands` and `/brands/:brandSlug`
- `/products/:productSlug`
- `/news`
- `/contact`
- `/cart`
- `/checkout`
- `/checkout/payment/:orderNumber`
- `/checkout/success/:orderNumber`
- `/account/orders` and `/account/orders/:orderNumber`
- `/admin/orders` and `/admin/orders/:orderNumber`

Identity and account routes are `/login`, `/register`, `/account`, `/account/profile`, `/account/addresses`, and `/account/security`. Account and checkout routes hydrate through `GET /api/v1/account/me` and distinguish loading, anonymous, and authenticated state. Anonymous checkout navigation is redirected to `/login?returnTo=%2Fcheckout`; only same-origin relative paths are accepted, so a successful login safely returns to checkout without losing the browser cart.

The account overview presents a compact membership summary and registration information as its two primary panels, with the narrower membership panel sized to its content. Registration information owns the customer's email and phone plus direct `Мэдээлэл засах` navigation to `/account/profile`. A verified address displays only a small accessible green check beside the email; unverified accounts render the resend action and response/error feedback below the fields. Order history remains available through the dedicated account navigation instead of a duplicate panel shortcut.

`/contact` is a public, lazy-loaded storefront route using the shared header, footer, container, and mobile navigation. It uses a plain white, divider-based layout without decorative gradients or redundant section labels, renders the existing office address, hours, phone, and email as static presentation data, and provides native `tel:`/`mailto:` actions plus an external Google Maps search link. It deliberately has no inert inquiry form or backend write path.

Mobile storefront navigation reserves the persistent bottom bar for five destinations: Home, product Categories, Cart, Account/Login, and `Цэс`. The menu action opens a compact, visually unlabelled text list containing the lower-frequency Hiliving MGL home anchor, brands, news, and contact routes without row arrows or a separate X control. It locks background scrolling, moves focus into the sheet, contains Tab navigation, closes through Escape, the backdrop, or its persistent trigger, and restores trigger focus. While open, it suppresses the underlying route highlight so only `Цэс` appears selected; secondary routes activate `Цэс` when closed instead of incorrectly marking Home active. `Ангилал` remains exclusively product-category navigation.

Desktop and mobile cart icons use one small wrapper component that animates only when the derived cart item count increases. It uses the Web Animations API on the HTML wrapper rather than the SVG image, skips count decreases, and disables itself when `prefers-reduced-motion` is active.

Delivery-address creation and editing can lazy-load a Leaflet dialog centered on Ulaanbaatar. The customer pans or clicks to position one marker and explicitly confirms the point before the browser makes one Nominatim reverse-geocoding request; there is no autocomplete, map-movement lookup, or background polling. The returned Mongolian-preferred address is mapped into editable city/address fields plus dependent dropdowns for Ulaanbaatar's nine districts and 204 khoroos. Postal-code and Mongolia-country suffix segments are removed from fallback display addresses. Entrance and apartment values use a structured `Орц: … · Тоот: …` representation inside the compatible additional-details field. The customer UI omits the legacy nickname and recipient-name controls; new requests use a neutral internal address label and the authenticated account name while keeping the editable recipient phone. No coordinates, backend contract, or database schema are added. OpenStreetMap attribution stays visible, and the tile and Nominatim endpoints are replaceable through public `VITE_` configuration for a future owner-operated OSM deployment.

Catalog query state uses the URL. The browser exposes one-based `page` values while the adapter converts requests to the backend's zero-based page convention. Search and controlled sort selections also remain shareable in the URL. Product cards navigate by slug.

Category and brand collection routes share one persistent catalog shell containing the storefront header, hero carousel, footer, and mobile navigation. Optional slug routes swap only the collection content, so internal catalog navigation does not remount or refetch the hero. The hero stores its validated banner snapshot, selected banner ID, and completed-entrance flag in per-tab session storage. Home, catalog, and other storefront owners can therefore restore the same visible image immediately after reload or route-driven remount, while a background public-banner read refreshes the session snapshot. The visible image loads eagerly, later slides remain lazy, and the reduced-motion-aware fade/scale entrance runs only once per tab session. Moving between category and brand URLs scrolls to the catalog-content boundary instead of replaying the top banner, and the collection layout uses the same reduced-motion-aware ease-out reveal as home-page sections.

On mobile category pages, the active category icon tile is the category-switching trigger. It opens a bounded scrollable link menu with active-page state, closes after navigation or focus leaves the control, and supports Escape-to-close with focus restoration. The former separate native select is not rendered.

Every API-backed section starts with a dimensionally similar skeleton, then renders data, an explicit empty state, or a safe generic error with retry. Product 404 has a dedicated not-found page. Backend messages, codes, SQL details, exception names, and stack traces are never rendered. Browser navigation uses React Router deep links; deployed NGINX uses `try_files ... /index.html` while routing `/api` and `/media` separately.

## Backend architecture

The backend uses Java 21, Maven, and Spring Boot 4.1.0. `com.hiliving` is the component-scan root. Shared HTTP envelopes and safe error handling live under `com.hiliving.api`; catalog, identity, and commerce code use feature-first packages. Commerce separates cart quotation, centralized pricing, order persistence/orchestration, and QPay provider orchestration. Controllers expose DTOs rather than JPA entities. Services own normalization, authorization-sensitive behavior, and mapping; repositories own persistence queries. Actuator supplies `/actuator/health`.

Spring Security uses server-side sessions. The session and `XSRF-TOKEN` cookies are `SameSite=Lax`; the session cookie is HttpOnly. `SESSION_COOKIE_SECURE` now defaults to true (fail-closed) so any deployment is secure unless it explicitly opts out for plain-HTTP local development. Login explicitly rotates the session identifier. The browser never stores an auth token. A readable `XSRF-TOKEN` cookie is mirrored into `X-XSRF-TOKEN` for state-changing requests; the cookie exists only for CSRF defense and is not an authentication credential.

The security filter chain also emits hardening response headers on API and media responses: a locked-down `Content-Security-Policy` (`default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`, appropriate for JSON and image responses), `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, and HSTS (one year, `includeSubDomains`) that takes effect once served over HTTPS. Framework defaults continue to supply `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`.

Phase 7B/7C adds a PostgreSQL transactional-email outbox, SMTP provider boundary, purpose-specific hashed email verification/password reset tokens, bounded rate limiting, and per-user session versions for password-reset invalidation. Unverified password accounts retain login/checkout compatibility, but password recovery requires a verified email. Multipart delivery includes a plain-text alternative and a table-based HTML layout; the approved HiLiving SVG is rasterized to a high-resolution transparent PNG stored in backend classpath resources and embedded with a content ID so the logo does not depend on remote image loading. Hostinger staging uses Brevo SMTP with a verified sender and explicit VPS IP authorization, while committed defaults keep delivery off. Full operational details are in `docs/TRANSACTIONAL_EMAIL.md`.

Authentication endpoints apply pre-credential abuse throttles through the same rate-limit service: login is capped per source IP and per submitted identifier, and registration is capped per source IP to blunt brute-force, password spraying, and mass account/enumeration probing. The limits are configurable under `hiliving.security.rate-limit.*` (defaults: login 15/IP and 10/identifier per 5 minutes, registration 20/IP per hour); exceeding one returns `429 RATE_LIMITED` with `Retry-After`. The per-user session version is now also incremented on self-service password change and on login-email change, so those credential-sensitive actions revoke every existing session exactly as password recovery does. This throttle store is in-memory and per instance; a multi-node deployment must move it to a shared backend (for example Redis) so limits are not multiplied across replicas.

Public catalog GETs, public cart quotation, registration, login, CSRF initialization, and health are permitted. `/api/v1/account/**` requires authentication, `/api/v1/orders/**` requires `CUSTOMER`, `/api/v1/admin/**` requires `ADMIN`, and unmatched routes are denied. CSRF remains required for anonymous quote POSTs and authenticated order POSTs. No broad CORS policy is enabled because Vite and future NGINX preserve same-origin requests.

## Identity and account data model

Flyway migration `V3__create_identity_and_account_schema.sql` creates `membership_tiers`, `users`, and `user_addresses`. Membership rows are permanent reference data: REGULAR 0%, BRONZE 3%, SILVER 5%, and GOLD 10%. Users may have a nullable validated override; the effective discount is the override when present and otherwise the tier default.

Emails are trimmed and lowercased. Supported Mongolian phone inputs are normalized to `+976` plus eight digits before lookup and uniqueness checks. Passwords use Spring Security's delegating encoder and are never returned. Public registration creates only active `CUSTOMER`/`REGULAR` users and does not automatically log in.

Users are soft-disabled with `ACTIVE`, `DISABLED`, or `LOCKED`; they are not deleted through this phase. Five failed password attempts set a 15-minute `locked_until`, while successful login clears the failed state; the login rate limits above sit in front of this per-account lock and bound how quickly it can be driven. A locked account is only revealed after a correct password, so wrong-password attempts always return generic `INVALID_CREDENTIALS`. Address reads and mutations include both address ID and authenticated user ID. A PostgreSQL partial unique index allows at most one default address per user, and default switching clears and sets within one transaction. Address deletion is physical; deleting a default leaves no default.

## Catalog data model

Flyway migration `V2__create_catalog_schema.sql` creates Category, Brand, Product, and ProductImage tables. Category deletion is restricted while referenced, brand deletion nulls the optional product relationship, and product deletion cascades to image metadata. Slugs are unique validated public identifiers. Product status is `DRAFT`, `ACTIVE`, or `ARCHIVED`; public reads require active products/categories and an active or absent brand. Prices use `NUMERIC(12,2)`, and image content remains URL-based.

Flyway V4 adds catalog descriptions/order fields, unique product codes, stock and low-stock thresholds, new/active flags, and `membership_discount_eligible`. Lifecycle status controls draft/published/archived workflow; `active` is the independent operational visibility switch labeled `Visible` in the product editor. Public products require lifecycle `ACTIVE`, product `active=true`, an active category, and an active or absent brand. Inventory state is computed: zero is `OUT_OF_STOCK`, positive stock at or below the threshold is `LOW_STOCK`, and higher stock is `IN_STOCK`.

Flyway V13 gives every banner an explicit `HERO` or `PROMOTIONAL` placement and adds an optional `banner_image_url` to brands. Existing banner rows migrate to `HERO`; the public banner endpoint requires a placement query so upper and lower content cannot be mixed. Brand banners remain URL metadata and render only on their selected public brand route.

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

Flyway V11 adds payment attempts, ordered deeplinks, provider invoice/payment uniqueness, callback-token hashes, expiry, failure, and reconciliation states. Callback URLs contain a random token whose SHA-256 hash alone is stored. The live Merchant V2 invoice response supplies bank deeplinks in `urls`; their provider order is preserved. Provider-supplied short/logo URLs must be HTTPS, dangerous deeplink schemes are rejected, credentials remain server-only, and QPay is disabled by default. New QPay invoices disable provider-managed expiry because Merchant V2 exposes only a merchant-configured expiry switch, which produced effectively immediate expiry in live testing. HiLiving stores `expires_at` from `QPAY_INVOICE_TTL`, defaults it to 15 minutes, and its scheduler cancels the provider invoice before restoring stock and marking the order `CANCELLED`/`EXPIRED`; a late payment after release is held as `RECONCILIATION_REQUIRED` rather than silently confirming. If authentication or invoice initiation fails before usable instructions are returned, the attempt row is locked, products are locked in sorted ID order, inventory is restored, and the order becomes `CANCELLED`/`FAILED` in one transaction. `inventory_released_at` makes repeated failure handling a no-op. The browser rotates its idempotency key only after an explicit QPay initiation error; it retains the key for network-ambiguous responses so a lost successful response cannot create a duplicate order.

`GET /api/v1/orders` and `GET /api/v1/orders/{orderNumber}` are customer-owned list/detail APIs. Payment instructions/checks are also ownership-scoped. ADMIN list/detail APIs support pagination, search, order/payment filters, and validated fulfillment: standard delivery advances from processing to shipped, while pickup advances from processing directly to delivered/collected. An omitted search is normalized to a non-null empty string before the case-insensitive repository query. Cancellation and refunds are not exposed. Order confirmation email is enqueued only for cash-on-delivery placement or after verified QPay payment, never when an unpaid QR is created.

## Media upload, processing, and storage

`POST /api/v1/admin/media/images` accepts `multipart/form-data` with `file` and a `purpose` of `PRODUCT`, `BRAND`, `BANNER`, or `NEWS`. It uses the existing session, ADMIN authorization, and CSRF boundary. Multipart requests must not set their own `Content-Type` boundary. Successful responses contain the public URL and authoritative media metadata; editor forms persist only that returned URL after the upload completes.

The product editor places its image workflow inside the opening product-information panel, uses one batch picker, and renders image cards only for selected photos. It accepts only enough JPEG/PNG files to stay within the six-image limit, uploads a selected batch concurrently, appends successful uploads in original selection order, and makes the first product image primary. Completed uploads remain attached when another file in the same selection fails; individual cards still handle replacement, removal, primary selection, and ordering. Banner administration uses the same parallel ordered pattern with a two-image limit: the first selected image becomes desktop and the second becomes mobile, while either resulting card can still be replaced or removed. News thumbnails remain a single-image control, and replacement cannot leave the parent form stuck in a pending-upload state after interruption.

The processor never trusts the supplied name, extension, or MIME type. It checks upload size before decode, uses ImageIO readers to inspect source dimensions, rejects dimension bombs, decodes the image, requires the claimed MIME type and filename extension to match the detected format, and accepts only JPEG and PNG. The decoded pixels are resized proportionally without upscaling and re-encoded to strip embedded metadata and untrusted payloads. JPEG output is RGB; PNG preserves alpha. EXIF orientation is not normalized. WEBP remains rejected because this Java baseline has no verified built-in decode-and-encode path.

Purpose policy is centralized:

| Purpose | Maximum upload | Maximum source | Maximum output | Directory |
| --- | ---: | ---: | ---: | --- |
| Product | 5 MB | 4000×4000 | 1600×1600 | `products/` |
| Brand | 2 MB | 3000×3000 | 1000×1000 | `brands/` |
| Banner | 8 MB | 6000×4000 | 2400×1600 | `banners/` |
| News | 5 MB | 4000×3000 | 1600×1200 | `news/` |

`MediaStorageService` is the provider boundary. `LocalMediaStorageService` is used for both development and the first Hostinger deployment; changing the absolute configured root does not change application code. It creates server-selected purpose directories, generates UUID filenames with the processor-selected extension, stages within the destination filesystem, and uses an atomic move where supported with a safe non-replacing fallback. It normalizes and validates every resolved path, rejects traversal and symlink destinations, never uses the original filename as a path, and does not overwrite an existing key.

`HILIVING_MEDIA_STORAGE_PATH` configures the external storage root. The development default is `../infrastructure/data/uploads` relative to `backend/`; the directory is gitignored and is outside `backend/target` and `frontend/dist`, so Maven/npm clean builds do not delete uploads. Production should use `/var/lib/hiliving/uploads`, owned by a restricted `hiliving` service account, with directory/file permissions equivalent to `0750`/`0640`. The application needs read/write access; NGINX needs read-only traversal/read access. Binaries are never stored in PostgreSQL.

Flyway V5 creates `media_assets` for provider, relative storage key, purpose, original filename, detected content type, byte size, final dimensions, creator, and timestamps. Only relative storage keys are stored. Upload processing first creates a temporary re-encoded file, storage moves it to its immutable final key, and a transaction records metadata plus the `MEDIA_UPLOADED` audit event. If metadata/audit persistence fails, the service attempts to remove the final file; all processing temporary files are cleaned. A process or machine failure between the filesystem move and compensating cleanup can still leave an orphan, so future maintenance must reconcile database keys and filesystem files. Replacing/removing an association deliberately does not delete the previous immutable file because a reference-count and retention policy do not yet exist.

Spring serves `GET` and `HEAD /media/**` from the configured root with `Cache-Control: max-age=31536000, public, immutable`. UUID filenames are never overwritten, so this one-year policy cannot make a replaced image URL stale. Directory listing and non-read methods are unavailable. Hostinger NGINX keeps `/media` ahead of the SPA fallback and proxies it to the localhost-only backend, preserving Spring's path validation, authorization boundary, and immutable cache contract. Spring does not expose an unrelated working directory.

PostgreSQL and the upload root form one recoverable dataset and must be snapshotted/backed up together, then copied off-server. Restore exercises must verify both metadata rows and referenced files. An S3-compatible implementation should replace only `MediaStorageService` when multi-node application instances, CDN delivery, off-server durability, storage growth, or operational backup burden justify it; URLs/keys may then require a reviewed migration strategy.

## Administration and managed content

All `/api/v1/admin/**` endpoints require `ADMIN`; anonymous requests receive 401 and authenticated customers receive 403. The React admin routes use the same session/CSRF authentication but render a separate sidebar/header workspace. The responsive sidebar includes a direct `/` link back to the storefront home. Orders is an active navigation route backed by server pagination and detail APIs; Pages remains a disabled future label.

The administration workspace presents all operational copy, navigation, filters, status labels, validation messages, dialogs, and accessible names in Mongolian while API enum values and payload contracts remain unchanged. The shared sidebar uses the storefront HiLiving logo as its sole brand lockup. Dashboard summary cards are semantic links to the corresponding products, categories, brands, users, banners, or news management route. Customer account status is represented once by its editable selector, positioned below the full-width membership/discount panel; no duplicate current-status badge is rendered. Shared admin primitives own panels, fields, search, pagination, status presentation, loading/error/empty states, and keyboard-safe dialogs. Search-backed lists debounce typing and ignore superseded responses so slower requests cannot replace newer results. Brand, banner, category, and news deletion requires an explicit in-app confirmation instead of mutating immediately.

The Add product and All products sidebar links use exact route matching, preventing the `/admin/products` parent path from appearing active while the dedicated `/admin/products/new` editor is selected.

The category data model remains hierarchical and services still prevent cycles, but normal category administration no longer exposes parent selection or parent/children columns. Deletion remains blocked while relationships or products reference a category. Brand deletion preserves products through the existing nullable foreign-key rule; brand administration no longer accepts a sort number, server lists are alphabetical, and an optional managed banner can be uploaded for each brand. Normal banner administration requires upper/lower placement but has no start/end scheduling, destination URL, or link-label inputs. Both homepage placements use the same centered 1440×300 desktop presentation; the lower section is absent when no active `PROMOTIONAL` banner exists. News administration no longer accepts or displays a sort number: public news is ordered by effective publication time descending and the admin list by most recent update.

Admin numeric fields use one controlled input boundary across product, banner, category, and user-discount forms. It keeps an editable text representation while focused, normalizes integer-leading zeros, preserves decimal prefixes, keeps browser-native step controls, restores required empty values to zero, retains nullable empty values, and clamps configured minimum/maximum bounds on blur. The customer membership/discount panel occupies the full content width and separates its three summary cards from its responsive membership and applied-discount controls, keeping the input and set/clear actions within their container. Membership administration shows the tier default and actual applied discount but omits a separate override summary because it duplicates the applied value whenever present; clearing the nullable editor restores the tier default. Catalog discounting is opt-in in the product editor: an unchecked checkbox sends `discountPrice=null`, while enabling it reveals percentage and final-price entry modes. Percentage entry derives a two-decimal discounted price, final-price entry derives the displayed percentage, and only the existing nullable `discountPrice` crosses the API boundary. Invalid or incomplete enabled discounts are rejected before save.

`admin_audit_log` stores actor email, action, entity type/id, a short non-sensitive detail, and timestamp for administration mutations. It never stores credentials, passwords, sessions, CSRF tokens, or secrets.

## Local development environment

Docker Compose manages PostgreSQL 17 only, persists data in a named volume, publishes it on loopback, and checks readiness. Backend, frontend, and database remain independently runnable. The standard ports are PostgreSQL 5432, Spring Boot 8080, and Vite 5173. This workstation overrides PostgreSQL to 5433 and uses backend 18080 because existing services occupy the defaults.

The current workstation contains explicitly requested local test identities plus a production-looking storefront demo dataset. The data is not shipped through Flyway, application startup, or tests. A reviewed public-only export copied nine active products across nine categories, four brands, one primary image per product, two active banners, four published news articles, and 15 referenced JPEGs to Hostinger staging. Customer accounts, addresses, orders, payments, tokens, email rows, audits, and immutable order snapshots were explicitly excluded and remain empty in staging. Source and license traceability is maintained in `docs/DEMO_CONTENT_SOURCES.md`; product copy, pricing, stock, brands, banners, and news remain fictional presentation data pending owner approval for production use.

The `local` Spring profile adds a small sample catalog only when catalog tables are empty. Migrations contain schema rather than sample rows.

## PostgreSQL and Flyway strategy

Flyway is the only schema-management mechanism. Versioned SQL lives in `backend/src/main/resources/db/migration`; applied migrations are immutable. Hibernate uses `ddl-auto=validate`. Flyway V6 adds checkout/order persistence, V7 adds the product-code sequence, V8-V10 add email/recovery/contact snapshots, and V11 adds QPay payment lifecycle persistence. PostgreSQL 17 is pinned for local and integration tests, and the production version must be compatibility-tested before deployment.

## API boundaries

Public reads remain under `/api/v1/categories`, `/api/v1/brands`, `/api/v1/products`, `/api/v1/products/{slug}`, `/api/v1/banners?placement=HERO|PROMOTIONAL`, and `/api/v1/news`. `POST /api/v1/cart/quote` is public but CSRF-protected and optionally applies the authenticated customer's eligible membership discount. Auth endpoints are under `/api/v1/auth`; customer self-service is under `/api/v1/account`; customer order/payment access is under `/api/v1/orders`; administration is under `/api/v1/admin`. The only public payment write is QPay's GET callback at `/api/v1/payments/qpay/callback/{token}`, which performs server-to-server verification before mutation. Successful responses use `data`; pages include items and page metadata. Failures use the existing safe `error` envelope with stable account, cart, order, payment, and security codes where useful.

## Validation strategy

Frontend validation uses `npm ci`, ESLint, Vitest/Testing Library HTTP-boundary tests, TypeScript compilation, a Vite production build, and npm advisory review. The current 97 tests preserve catalog, account, administration, and commerce coverage and include explicit banner placement, brand-banner presentation, wrapped brand lists, compact home news/product cards, persistent catalog-shell navigation, mobile brand toolbar/category switching, Mongolian admin interactions, address-map cleanup and dependent administrative selections, QPay requests, QR/deeplinks, checkout labels, payment checks, and safe idempotency-key retry behavior. Isolated browser rehearsals cover the 390×844 category and brand layouts, desktop homepage presentation, category-to-brand navigation without hero refetches, customer registration/address/cart/checkout, pending and paid transitions, customer history, callback replay, and ADMIN list/detail visibility. Dependabot checks npm and Maven weekly. The remaining npm advisory concerns React Router's RSC server-action path, which this client-only `BrowserRouter` application does not use; it remains monitored rather than forcing a downgrade with broader browser vulnerabilities.

Live validation runs Vite against the real Spring Boot/PostgreSQL stack. Phase 6 verified product gallery selection, anonymous cart persistence after refresh, authoritative quotation, login return to checkout, address creation/selection, cash-on-delivery order placement, success details, inventory deduction, cart clearing only on success, exact idempotent replay, cross-customer order denial, and no horizontal overflow at mobile, tablet, and desktop widths. Temporary customers, address, order, product image, and stock changes were removed/restored immediately afterward. Existing Phase 5.1 media files were not modified.

Backend validation uses Maven with compiler release 21, PostgreSQL Testcontainers, Flyway through V13, Hibernate validation, repository/service/controller/security coverage, and JAR packaging. Coverage includes separated upper/lower banners, public and administrative brand banners, managed brand-banner media associations, immutable media cache headers, the QPay V2 JSON contract, durable QR/deeplink creation, ownership-scoped order listing, public callback verification through `payment/check`, exact paid-state confirmation, confirmation-email timing, and exact-once stock restoration after initiation failure. On 2026-08-01 all 68 tests, migrations, and JAR packaging passed inside exact Temurin Java 21, matching the Hostinger runtime major version.

## Hostinger staging deployment architecture

The deployed staging target is one Hostinger Ubuntu 24.04 VPS with UFW default-deny ingress and only SSH/HTTP/HTTPS open. NGINX serves versioned frontend releases under `/opt/hiliving/frontend`, provides SPA fallback, terminates auto-renewing Let's Encrypt HTTPS, and proxies same-origin `/api` and `/media` to Spring Boot on `127.0.0.1:8080`. Versioned backend releases under `/opt/hiliving/backend` run as the restricted `hiliving` account under systemd. PostgreSQL 17 runs in Docker, binds only to `127.0.0.1:5432`, and uses the named `hiliving-postgres-data` volume. Managed media persists at `/var/lib/hiliving/uploads`; fresh database and token-protection secrets live only in `/etc/hiliving/hiliving.env` with `root:hiliving` ownership and `0640` mode.

Pushes to `main` deploy only after the independent frontend and backend GitHub Actions jobs pass. The deployment job uses a dedicated SSH key and pinned VPS host key to transfer checksummed frontend/JAR artifacts into a non-privileged incoming directory. A narrowly sudo-authorized, root-owned activator validates the commit SHA and artifacts, installs immutable commit-addressed releases, switches the backend link, waits for local health, switches the frontend link, and runs public-origin smoke checks. A failed activation restores the previous links. Application secrets, PostgreSQL state, and managed uploads stay outside this path; Flyway may advance the database during backend startup and is not reversed by link rollback.

## NGINX, systemd, and HTTPS plan

NGINX terminates Let's Encrypt HTTPS, serves the frontend, preserves React Router deep links, and proxies `/api` plus `/media` to Spring Boot. `https://hilivingmgl.mn` is canonical; `www.hilivingmgl.mn` and the original Hostinger hostname redirect to it. systemd manages backend lifecycle and restricted environment loading, including `HILIVING_MEDIA_STORAGE_PATH=/var/lib/hiliving/uploads` and the reviewed standard shipping fee. Certificate renewal is timer-managed and its deploy hook validates and reloads NGINX; dry runs pass for both certificate lineages. `APP_PUBLIC_URL` and the QPay callback base use the canonical origin, but QPay remains disabled until owner-controlled credentials and paid/expiry rehearsals are complete. A coordinated PostgreSQL/media backup was copied to ignored restricted storage on the deployment workstation and restored successfully into isolated PostgreSQL 17/filesystem targets; accepting production payments still requires a durable scheduled off-server destination rather than relying on manual workstation copies.
