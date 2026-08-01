# Architectural Decisions

## 2026-07-15 - Modular monorepo boundaries

**Context:** The repository currently contains only a root-level React/Vite application and repository-wide CI files. A Spring Boot backend must be added without coupling either application's build.

**Decision:** Move all frontend-owned files into `frontend/`, create the Java application in `backend/`, keep repository-wide automation at the root, and place operational documentation in `docs/` and future deployment assets in `infrastructure/`.

**Rationale:** Explicit application boundaries preserve independent builds and deployments while allowing shared documentation and local orchestration.

**Consequences:** CI and static-analysis paths must be updated. Commands must be run from the relevant application directory unless documented otherwise.

## 2026-07-15 - Spring Boot and Java baseline

**Context:** Phase 1 needs a current, supported backend foundation.

**Decision:** Use Java 21, Maven, and Spring Boot 4.1.0, identified as the current stable Spring Boot release on 2026-07-15.

**Rationale:** Java 21 is an LTS release and Spring Boot 4.1.0 is the current stable framework baseline.

**Consequences:** Development and production environments must provide a Java 21-compatible runtime. Framework upgrades must preserve this decision record rather than silently replacing it.

## 2026-07-15 - Database schema ownership

**Context:** Automatic ORM schema mutation creates drift and makes production changes difficult to audit.

**Decision:** Flyway versioned migrations are the only source of truth for PostgreSQL schemas. Hibernate is configured with `ddl-auto=validate`.

**Rationale:** Explicit migrations are reviewable, repeatable, and compatible with controlled VPS deployments and backups.

**Consequences:** Every schema change must be a new Flyway migration. Existing migrations must not be edited after they have been applied to shared environments.

## 2026-07-15 - Secret handling

**Context:** Local services require credentials, while the repository will eventually be deployed to production.

**Decision:** Local secrets are stored only in a gitignored `.env`; `.env.example` contains placeholders. Production secrets will use strong unique values supplied through restricted environment files or secret management.

**Rationale:** This prevents credentials from entering Git, source files, Compose definitions, documentation, and deployable artifacts.

**Consequences:** A developer must create or receive a local `.env` before starting protected services. Local credentials must never be reused in staging or production.

## 2026-07-15 - Local PostgreSQL baseline

**Context:** Local development needs a repeatable database close to the eventual single-VPS topology without bundling the frontend or backend into one runtime.

**Decision:** Pin local PostgreSQL to `postgres:17-alpine`, manage it through root Docker Compose, bind it only to loopback, persist it in a named volume, and keep the frontend and backend running independently on the host.

**Rationale:** A pinned major version and explicit health check improve reproducibility while independent application processes preserve deployment boundaries.

**Consequences:** Developers need Docker for local database and integration tests. Host port conflicts are handled through ignored environment overrides, not committed machine-specific values. The production PostgreSQL version must be compatibility-tested before deployment.

## 2026-07-15 - Foundation health verification

**Context:** Phase 1 needs an operational startup check but must not introduce business APIs.

**Decision:** Use Spring Boot Actuator health and readiness/liveness support rather than a custom controller. Expose only `health` and `info`.

**Rationale:** Actuator provides standardized operational verification without creating a business-domain endpoint that would need later migration.

**Consequences:** `/actuator/health` is the foundation verification path. Production exposure and NGINX routing must be reviewed before deployment.

## 2026-07-15 - PostgreSQL integration testing

**Context:** A context-only unit test would not prove PostgreSQL compatibility, Flyway execution, or JPA startup.

**Decision:** Use Spring Boot Testcontainers support with PostgreSQL 17 and assert the initial Flyway history row in the application integration test.

**Rationale:** An isolated real database proves the foundation without depending on a developer's persistent Compose data.

**Consequences:** Backend tests require a working Docker environment. Each test run starts a disposable PostgreSQL container.

## 2026-07-15 - Catalog model and foreign-key behavior

**Context:** The first public catalog needs hierarchical categories, optional brands, products, and ordered image metadata without introducing later business domains.

**Decision:** Model Category, Brand, Product, and ProductImage in Flyway migration version 2. Restrict category deletion while a child category or product references it, set a deleted optional brand reference to null, and cascade product deletion to product images.

**Rationale:** Restriction prevents accidental catalog-tree or product damage, an optional brand should not make a product undeletable, and images have no lifecycle outside their product.

**Consequences:** Category removal requires explicit reassignment or child cleanup. Brand removal preserves products without a brand. Product removal deletes only its dependent image metadata.

## 2026-07-15 - Slugs as public catalog identifiers

**Context:** Public URLs and filters need readable identifiers that do not expose database sequencing as the navigation contract.

**Decision:** Give categories, brands, and products globally unique slugs constrained to lowercase ASCII letters, digits, and single hyphens. The API uses product slug for detail lookup and category/brand slug for filters.

**Rationale:** Stable, validated slugs create predictable URLs and indexed exact lookups.

**Consequences:** Slug changes are externally visible URL changes and should later receive an explicit redirect or alias policy if edits are introduced.

## 2026-07-15 - Monetary representation

**Context:** Floating-point values cannot represent catalog prices exactly and invalid discounts must be rejected at the schema boundary.

**Decision:** Store `price` and optional `discount_price` as PostgreSQL `NUMERIC(12,2)` and map them to Java `BigDecimal`. Require non-negative prices and require any discount price to be non-negative and lower than the base price.

**Rationale:** Fixed-precision decimal values preserve exact monetary values while database checks protect every write path.

**Consequences:** The current model assumes one implicit currency and two decimal places. Multi-currency support requires a future migration and explicit currency modeling rather than reinterpretation of existing values. Public price sorting uses base price.

## 2026-07-15 - Product status and public visibility

**Context:** Catalog entries need a lifecycle, but public clients must not choose a status or discover draft and archived content.

**Decision:** Limit stored product status to `DRAFT`, `ACTIVE`, or `ARCHIVED`. Public reads hard-code `ACTIVE` and also require an active category and either an active brand or no brand. Status remains available only as an internal service criterion.

**Rationale:** Centralized visibility rules prevent request parameters from bypassing publication controls and leave room for later administration workflows.

**Consequences:** Inactive brands and categories hide their products from public results. No public endpoint accepts a status filter.

## 2026-07-15 - Catalog pagination, filtering, and sorting

**Context:** Product collections need bounded queries from their first release and request input must not be translated into arbitrary persistence properties.

**Decision:** Use zero-based pages with a default size of 20 and maximum size of 100. Support exact category and brand slug filters, case-insensitive name/short-description search, featured filtering, and only `newest`, `price_asc`, `price_desc`, and `name_asc` sorts.

**Rationale:** Bounded responses protect the service, and an enumerated sort contract prevents accidental coupling or unsafe property selection.

**Consequences:** New filters and sort modes require explicit code, tests, and documentation. The current search is relational and intentionally does not introduce a separate search engine.

## 2026-07-15 - Development catalog seed strategy

**Context:** Local API verification needs representative rows, but fake data must never become permanent production schema history.

**Decision:** Initialize a small sample catalog only under the Spring `local` profile and only when catalog tables are empty. Keep production Flyway migrations data-free except for future required reference data.

**Rationale:** Local startup remains useful without contaminating shared or production environments.

**Consequences:** Automated tests create their own fixtures. Local initialization is not a general import or reset mechanism.

## 2026-07-15 - Exact Java 21 validation

**Context:** The workstation JDK is newer than the Java 21 production baseline, so release-target compilation alone does not prove runtime compatibility.

**Decision:** Add an independent GitHub Actions backend job using Temurin Java 21 and Maven verification. Also document and execute a Docker-based Temurin Java 21 build with Testcontainers for reproducible local proof.

**Rationale:** Both paths run the application tests on the actual baseline runtime without changing machine-wide Java installation.

**Consequences:** CI requires Docker-capable runners for Testcontainers. Local containerized test execution needs Docker socket access and a Docker Desktop host override on this workstation.

## 2026-07-15 - Frontend catalog adapter boundary

**Context:** Backend DTO names and envelopes should not spread through presentational components, and network behavior must not be duplicated across screens.

**Decision:** Centralize catalog URLs, query serialization, `fetch`, response-status checks, error normalization, and backend DTO definitions under `frontend/src/api`. Map DTOs explicitly to presentation-safe catalog models before returning data to components.

**Rationale:** One adapter makes contract changes visible, prevents ad hoc endpoint construction, and keeps UI concerns independent from backend representation.

**Consequences:** Backend contract changes require coordinated DTO, mapper, and test updates. Frontend code outside the adapter must not call catalog endpoints directly.

## 2026-07-15 - Local server-state hooks without a new library

**Context:** Phase 3 needs loading, cancellation, retry, and request-key changes, but the catalog is read-only and the application has no existing global state system.

**Decision:** Use focused React hooks with local state, stable request callbacks, `AbortController`, and explicit retry rather than adding Redux or a server-state dependency.

**Rationale:** The current request graph is small enough that a library would add more policy and bundle cost than value.

**Consequences:** Caching and request deduplication are intentionally minimal. Reconsider a dedicated server-state library only when mutations, shared cache invalidation, or many concurrent consumers make it materially simpler.

## 2026-07-15 - Same-origin API integration and CORS

**Context:** Local Vite and Spring Boot use separate processes, while the target NGINX deployment will serve the storefront and proxy the API from one public origin.

**Decision:** Browser requests default to relative `/api/v1` URLs. Vite proxies `/api` to an environment-selected local backend, and future NGINX will proxy the same path. Do not add backend CORS for this topology.

**Rationale:** Same-origin requests match production, avoid duplicate origin policy, and prevent permissive development CORS from becoming a production default.

**Consequences:** `VITE_API_BASE_URL` may be absolute only when that origin has an explicit narrow allowlist. Production NGINX must route `/api` before the SPA fallback.

## 2026-07-15 - Catalog mock-data retirement

**Context:** Two incompatible mock catalog shapes and an incomplete legacy service could mask integration failures and create competing sources of truth.

**Decision:** Remove category, brand, product, and legacy product-service mocks after all consumers move to the backend adapter. Retain hero, promotion, and news data because those domains are not provided by the catalog API.

**Rationale:** The backend becomes the single catalog source while unrelated marketing content remains stable.

**Consequences:** Backend unavailability is shown explicitly instead of silently falling back to stale catalog data. Marketing content will require its own future domain decision if it becomes managed.

## 2026-07-15 - Catalog loading and error presentation

**Context:** API-backed screens need predictable behavior without revealing backend implementation details or causing large layout shifts.

**Decision:** Use dimensionally similar skeletons for initial loads, explicit empty states for successful empty responses, safe generic error states with retry for operational failures, and a dedicated product-not-found state for 404. Never render backend error messages or codes.

**Rationale:** Users receive actionable, stable feedback while server internals remain private.

**Consequences:** Diagnostics remain in tests, browser/server logs, and backend observability rather than customer-visible messages.

## 2026-07-15 - Frontend catalog testing boundary

**Context:** Frontend tests should prove request/response integration behavior without reimplementing backend filtering or visibility rules.

**Decision:** Use Vitest, jsdom, and Testing Library. Mock `fetch` at the HTTP boundary and test adapter serialization/mapping/error behavior plus observable loading, success, empty, retry, unavailable, and 404 UI states.

**Rationale:** Boundary mocks keep tests fast and focused while backend Testcontainers tests remain authoritative for business and persistence rules.

**Consequences:** CI runs frontend tests before production builds. Live integration remains necessary to prove the proxy and cross-application contract together.

## 2026-07-16 - Server-side session authentication

**Context:** HiLiving's target deployment serves the SPA and `/api` from one NGINX origin, and Phase 4A does not need independently delegated bearer tokens.

**Decision:** Use Spring Security server-side sessions instead of JWT. `JSESSIONID` is HttpOnly and `SameSite=Lax`; `SESSION_COOKIE_SECURE` is enabled in production. Login rotates the session identifier, logout invalidates it, and the frontend determines identity only through `/api/v1/account/me`. Registration does not automatically log the customer in. No auth credential is stored in localStorage or sessionStorage.

**Rationale:** This minimizes credential exposure and token lifecycle complexity while matching same-origin deployment.

**Consequences:** Horizontal scaling later needs shared/sticky session design. Password change keeps the current session and cannot yet invalidate every other session; that capability is deferred rather than simulated.

## 2026-07-16 - SPA-compatible CSRF defense

**Context:** Cookie-authenticated mutations require CSRF protection.

**Decision:** Keep Spring Security CSRF enabled. `GET /api/v1/auth/csrf` initializes a readable `XSRF-TOKEN` cookie, and the frontend mirrors its value in `X-XSRF-TOKEN` for POST, PATCH, and DELETE requests. The token cookie is not an auth credential. Same-origin Vite/NGINX routing remains authoritative; no permissive CORS policy is added.

**Rationale:** The double-submit cookie/header pattern works with a client-rendered SPA without exposing the HttpOnly session cookie.

**Consequences:** Every new state-changing frontend adapter must use the shared account request boundary. Security tests verify missing-token rejection and real cookie/header acceptance.

## 2026-07-16 - Identity normalization, password storage, and login lockout

**Context:** Email and Mongolian phone aliases must not bypass uniqueness or authentication controls, and local brute-force resistance is required without Redis.

**Decision:** Trim and lowercase emails. Normalize supported Mongolian phone input to `+976` plus eight digits before uniqueness checks and lookup. Hash passwords with `PasswordEncoderFactories.createDelegatingPasswordEncoder()` and enforce at least 10 characters, one letter, one number, and the encoder-compatible byte limit. After five invalid passwords, set a 15-minute `locked_until`; successful login clears failure state. Unknown identifiers and bad passwords return the same `INVALID_CREDENTIALS` response.

**Rationale:** Canonical identity values create reliable unique constraints, delegating hashes preserve upgrade paths, and bounded database lockout provides basic protection without introducing distributed infrastructure.

**Consequences:** Future international phone support requires a deliberate normalization migration. Distributed rate limiting remains future work.

## 2026-07-16 - Roles, statuses, memberships, and discounts

**Context:** Customer self-service and a minimal admin boundary need explicit authorization and account lifecycle state, while membership discounts must remain auditable.

**Decision:** Roles are `CUSTOMER` and `ADMIN`; public registration always grants `CUSTOMER`. Statuses are `ACTIVE`, `DISABLED`, and `LOCKED`; customer accounts are soft-disabled rather than deleted. Permanent Flyway reference tiers are REGULAR 0%, BRONZE 3%, SILVER 5%, and GOLD 10%. Each user references one tier and may have a nullable 0–100% manual override. Effective discount is override-first, otherwise tier default.

**Rationale:** Explicit enums and relational reference data keep authorization and pricing policy visible at both database and service boundaries.

**Consequences:** Admin APIs may update status, tier, and override but never passwords. Full admin UI, role expansion, and automatic tier progression are deferred.

## 2026-07-16 - Delivery-address ownership and lifecycle

**Context:** Address IDs alone are insufficient authorization and concurrent default switching could create multiple defaults.

**Decision:** Every address lookup and mutation is scoped by authenticated user ID. A PostgreSQL partial unique index permits at most one `is_default` row per user, and services clear the prior default before setting another in the same transaction. Address deletion is physical; deleting the default deliberately leaves no default. Recipient phones use the same canonical Mongolian format.

**Rationale:** Ownership-scoped repositories prevent horizontal access, while the database index protects all write paths.

**Consequences:** Address history is not retained in Phase 4A. Future orders must snapshot delivery details rather than rely on mutable account addresses.

## 2026-07-16 - Separate administration workspace

**Decision:** Keep administration inside the React application and session system, but render a separate responsive dark-sidebar shell guarded by `ADMIN`. Orders and Pages appear only as disabled future navigation labels and have no routes.

**Consequences:** Public storefront chrome is not reused in admin pages. Anonymous admin navigation returns through login, customers are rejected, and every admin API remains server-authorized.

## 2026-07-16 - Catalog lifecycle, inventory, media, and membership eligibility

**Decision:** Preserve `DRAFT`, `ACTIVE`, and `ARCHIVED` lifecycle status; add an independent operational `active` switch, presented to administrators as `Visible`. Public visibility requires both active lifecycle and operational state plus visible category/brand relationships. Compute inventory state from stock and threshold. Store at most four URL-only images and require exactly one primary image for a publicly usable product. Store `membership_discount_eligible` as a required boolean.

**Consequences:** At this point product eligibility only permitted a future membership discount. Phase 5.1 subsequently added managed binary uploads, and the Phase 6 pricing decision below now defines checkout pricing. Object storage and cart-time inventory reservation remain future work.

## 2026-07-16 - Category hierarchy and safe deletion

**Decision:** Validate self-parent and indirect cycles in the administration service. Reject deletion while children or products reference a category and offer deactivation through normal updates. Preserve the existing brand `ON DELETE SET NULL` rule.

**Consequences:** Administrators must resolve references before deleting categories. Stable conflict codes make these restrictions safe to present in the UI.

## 2026-07-16 - Managed banners, news, and administration audit

**Decision:** Add URL-based scheduled banners and draft/published plain-text news. Public endpoints filter by active/publication windows. Record administration changes in a small relational audit log with actor, action, entity identity, safe detail, and timestamp.

**Consequences:** Static hero/news data is retired. Rich-text building, media analytics, binary storage, and a generic event platform are out of scope.

## 2026-07-16 - Local development sample data

**Decision:** Keep manually requested test accounts and catalog/content samples in the current local PostgreSQL volume rather than a Flyway migration or automatic application seeder. Use clearly marked local identities and `dev-` slugs, and leave media unset until real URLs are supplied.

**Consequences:** Production and clean test databases remain free of shared credentials and demonstration records. Resetting the local Docker volume removes this dataset, and image-free products cannot be published as operationally active through the administration API until a primary image URL is assigned.

## 2026-07-16 - Managed media processing and storage boundary

**Context:** Phase 5 URL-only image fields required administrators to host files elsewhere and provided no validation, processing, persistence, or deployment-safe storage path. The first production target is a single Contabo VPS, but the application must not couple domain records to one storage provider.

**Decision:** Add an ADMIN/CSRF-protected multipart image endpoint and a `MediaStorageService` provider boundary. Accept only positively decoded JPEG/PNG uploads whose claimed MIME type and extension match the detected format. Enforce purpose-specific byte and source-dimension limits, resize proportionally without upscaling, and re-encode before storage. Use UUID filenames in server-selected purpose directories under an external configurable root. Store media metadata and relative keys in PostgreSQL, but keep image binaries on the filesystem. Serve same-origin `/media/**` read-only in development; use a restricted NGINX alias in production. Preserve existing product/brand/banner/news URL columns as the association bridge so external URLs remain compatible. This supersedes Phase 5's deferral of binary uploads; it does not introduce an object store.

**Rationale:** Decode-and-reencode validates actual image content and strips metadata, while generated keys and normalized paths prevent original-filename and traversal risks. An external root survives application clean builds and release replacement. The storage interface lets the same local implementation use a different root on Contabo and gives an S3-compatible implementation a narrow future seam.

**Consequences:** Supported files are JPEG and PNG; WEBP remains rejected until the Java baseline has verified codec support. EXIF orientation is not normalized. Upload completion means the immutable file, media row, and audit event were created; database failure triggers best-effort file compensation, but a machine/process failure can still leave an orphan. Replacing or removing a URL does not delete the old file until reference-aware retention is designed. PostgreSQL and the upload directory require coordinated off-server backup and restore testing. Move to S3-compatible storage when multi-node deployment, CDN delivery, durability, growth, or backup operations justify it.

## 2026-07-17 - Remove banner scheduling from normal administration

**Decision:** Remove the Starts at and Ends at fields from the banner editor. New and edited banners omit scheduling values, while the existing nullable backend response fields and database columns remain for backward compatibility.

**Consequences:** Administrators control banner visibility with the Active switch. Editing a previously scheduled banner clears its schedule through the existing nullable request contract; untouched legacy rows may still be filtered by their stored schedule until edited or migrated.

## 2026-07-17 - Minimal browser cart with backend-authoritative quotation

**Context:** Anonymous customers need a cart that survives refresh and login, but browser state must never become an authority for product availability, customer discounts, or order money.

**Decision:** Persist a versioned cart containing only product slugs and bounded quantities in localStorage. Merge duplicate slugs and discard malformed data. Send those identifiers to public, CSRF-protected `POST /api/v1/cart/quote`; the backend reloads products, validates purchasability and stock, resolves the optional authenticated membership, and returns every displayable price and total. Requote on cart or authentication changes and again immediately before order placement.

**Consequences:** Anonymous carts survive refresh and the safe login-to-checkout redirect without creating server-side cart tables. They do not synchronize across devices or accounts, expire server-side, or reserve stock. A quote can become stale, so the order transaction must always revalidate and reprice; the UI removes or corrects rejected lines and presents safe errors.

## 2026-07-17 - MNT price composition and temporary delivery policy

**Context:** Catalog prices, catalog discounts, membership tiers, and checkout delivery charges must produce one reproducible server result without floating-point drift or client calculation.

**Decision:** Use Java `BigDecimal` at scale 2 with `HALF_UP`. Apply an existing product `discount_price` first, then apply the customer's effective membership percentage only when `membership_discount_eligible` is true. Sum regular subtotal, catalog savings, membership savings, effective subtotal, configured delivery, and grand total. Quote and order currency is `MNT`. Configure `STANDARD_DELIVERY` through `HILIVING_STANDARD_SHIPPING_FEE`, default `5000.00`; the browser renders the quoted value.

**Consequences:** The calculation order and snapshots are deterministic and testable, while ineligible products receive no membership savings. There is one currency, one delivery method, and one flat fee for this phase; zones, free-shipping thresholds, taxes, coupons, variants, and multiple currencies require later explicit policies and schema changes.

## 2026-07-17 - Immutable order snapshots and pessimistic inventory control

**Context:** Orders must remain historically correct after catalog/address changes, and concurrent customers must not both buy the last unit or cause partial orders.

**Decision:** Flyway V6 creates orders, item snapshots, and address snapshots. During one database transaction, serialize a customer's placement attempts, resolve and pessimistically lock product rows in sorted ID order, revalidate/reprice all lines, persist immutable identity/money/address snapshots, and deduct stock. Any invalid line fails the whole transaction. Scope order retrieval by authenticated customer and public order number.

**Consequences:** Catalog price, title, image, and customer-address edits cannot rewrite order history. Deterministic locks and the nonnegative stock invariant allow exactly one successful last-unit buyer and prevent partial deductions. There is intentionally no cart-time inventory reservation, expiry, backorder, cancellation stock restoration, admin fulfillment UI, or customer order-history list yet.

## 2026-07-17 - Customer-scoped idempotency and unpaid cash-on-delivery

**Context:** Double clicks, slow responses, and network retries must not create duplicate orders, while Phase 6 must not pretend a payment was collected or couple core ordering to a provider that has not been chosen.

**Decision:** Require an `Idempotency-Key` UUID on order placement and enforce uniqueness with the customer ID. Store a SHA-256 hash of the canonical request. Return the original order for an exact replay and reject the key when the request differs. Start orders as `PENDING_CONFIRMATION` and `UNPAID`, with only `CASH_ON_DELIVERY` and `STANDARD_DELIVERY`. Define a `PaymentProvider` interface extension point but provide no implementation or fake call.

**Consequences:** Retrying the same request is safe and conflicting key reuse is visible. The browser disables an in-flight submission, retains the same key for the unchanged checkout fingerprint, and clears its cart only after success. No payment authorization, capture, callback, reconciliation, settlement, refund, or paid state is implemented; those require a reviewed provider/security lifecycle later.

## 2026-07-18 - Backend-owned immutable product identifiers

**Context:** Requiring administrators and browser clients to invent both a public slug and internal product code exposed implementation details, created avoidable validation errors, and made normal product renames capable of breaking public links.

**Decision:** Remove `slug` and `productCode` from the admin product write DTO and editor. On creation, normalize the product name into the existing lowercase ASCII slug format, transliterating supported Mongolian Cyrillic and appending `-2`, `-3`, and later suffixes when needed. Serialize same-base slug allocation with a PostgreSQL transaction advisory lock. Generate product codes independently from the Flyway V7 `product_code_sequence` as `PRD-######`. Never assign either identifier during update.

**Consequences:** Existing product columns, unique constraints, response contracts, public slug routes, and admin code search/display remain unchanged. Product renaming is URL-safe because the original slug and code persist. Sequence gaps after rolled-back transactions are accepted, and any future exceptional slug correction/import requires an explicit redirect/alias policy rather than an editable field in the normal form.

## 2026-07-18 - One product-description authoring field

**Context:** Separate Short description and Full description controls made administrators maintain two versions of the same product copy, while existing catalog cards/search and detail pages still rely on their established read fields.

**Decision:** Expose only one `description` field in normal product creation/editing and in the admin write DTO. Persist the complete normalized value as the product description and derive the compatible short description from its first 500 Unicode code points. Keep both database columns and read-response fields.

**Consequences:** Administrators author product copy once without a schema migration or public contract break. Catalog summaries/search and detail pages remain compatible. Legacy records load the full description when present and otherwise fall back to the old short description.

## 2026-07-22 - Consistent admin numbers and dynamic batch product photos

**Context:** Numeric admin fields initialized to zero could retain typed leading zeros such as `01` or `023`, invalid product price combinations produced misleading negative percentages, and fixed empty product-image slots required repeated picker actions.

**Decision:** Use one controlled numeric-input component across all admin number fields. Normalize integer-leading zeros, preserve decimals and native step controls, clamp declared bounds on blur, and distinguish required zero from nullable empty values. Render product discount percentages only for a nonnegative discount price below a positive base price. Replace fixed empty product-image slots with one multi-file picker and dynamic cards for selected photos, and raise the frontend and backend product-image limit from four to six.

**Consequences:** Product, news, banner, category, brand, and user-discount inputs behave consistently without API or database changes. Product requests with up to six unique ordered images are accepted; seven are rejected. Product photo selection and selected-image controls live in the opening product-information panel so administrators handle core details and media together. A failed later batch upload keeps earlier completed photos, and banner/news controls remain single-image because their slots have different meanings. This supersedes the four-image limit in the 2026-07-16 product administration decision.

## 2026-07-22 - Explicit optional catalog discount authoring

**Context:** A permanently visible discounted-price input did not clearly distinguish products with no catalog discount, and administrators needed to author a discount using either the business percentage or the final customer-facing price.

**Decision:** Keep base price mandatory and place catalog discounting behind an explicit checkbox. When enabled, let the administrator choose percentage or discounted-price entry. Convert percentage entry to a two-decimal discounted price for the existing write contract, derive a display percentage from direct price entry, and submit `discountPrice=null` when discounting is disabled.

**Consequences:** The create and edit forms communicate non-discounted products clearly without a schema or API change. Existing discounted products open with discounting enabled, clearing the checkbox removes their catalog discount, and backend-authoritative quotation continues consuming the same nullable discounted price.

## 2026-07-22 - Automatic content ordering and simpler taxonomy/banner authoring

**Context:** News and brand sort numbers, category parent/children controls, and unused banner click-through fields exposed implementation details without helping the current storefront. Banner desktop/mobile images also required separate file-picker actions.

**Decision:** Remove news sort order from the write contract and order public news by effective publication time descending, with the admin list ordered by most recent update. Remove brand sort order from the write contract and order brands alphabetically. Hide category parent selection and parent/children table columns in normal administration while retaining existing backend integrity constraints. Replace separate empty banner upload slots with one dynamic two-file batch where selection order maps to desktop then mobile, and omit destination URL/link label from normal banner payloads because the carousel does not render click-through content.

**Consequences:** Administrators no longer manage technical ordering or unused relationships/links. Existing catalog/category persistence remains valid, news and brand ordering is deterministic, and banner upload requires one picker action while retaining per-image replacement/removal. The media service still supplies secure stored URLs; client filenames are never trusted as storage paths.

## 2026-07-26 - QPay-confirmed orders with durable payment attempts

**Context:** The storefront needs QPay QR/deeplink checkout before final production merchant ownership is configured. Test merchant credentials can exercise the integration, but QPay callbacks indicate only that a payment may have changed and must not be trusted as proof of payment. Inventory cannot remain permanently deducted for an unpaid expired invoice.

**Decision:** Keep all credentials and QPay calls in the backend and disable the provider until explicit environment values are present. Store each provider attempt and ordered bank deeplinks under an order. Start QPay orders as `PENDING_PAYMENT`/`PENDING`; return QR/deeplinks without confirming the order. Give each callback an unguessable token and store only its hash. On callback or explicit customer check, call Merchant V2 `payment/check` and confirm only an exact `PAID`, amount, currency, and callback-payment-ID match. Cancel an expired provider invoice before restoring held stock. Treat a payment received after stock release as reconciliation-required. Expose ownership-scoped customer history/detail/payment endpoints and ADMIN list/detail/filter plus forward-only fulfillment transitions.

**Rationale:** Server-to-server reconciliation makes QPay the payment authority without making callback parameters or browser state authoritative. Durable attempts and database constraints make retries, exact-once confirmation email, expiry, support, and later auditing observable.

**Consequences:** The code can be deployed before production merchant onboarding and fails explicitly while QPay is disabled or incomplete. Environment-only test credentials have proven real invoice, QR, and deeplink creation, but the owner must rotate/provide production credentials and a stable public HTTPS callback base URL. Cash-on-delivery remains backend-compatible but is not the storefront checkout choice. ADMIN order queries normalize an omitted search to an explicit empty string so PostgreSQL never receives an untyped null inside case-folding expressions. Cancellation, refunds, settlement reporting, and Ebarimt 3.0 receipt issuance require separate reviewed policies and are not implied by payment confirmation.

## 2026-07-26 - Exact QPay response and production callback boundary

**Context:** Live Merchant V2 invoice creation showed that bank application links are returned in `urls`, while the earlier workbook-derived mapping expected `qPay_deeplink`. A Cloudflare Quick Tunnel supplied callback HTTPS for local testing, but its generated hostname is temporary and not owner-controlled.

**Decision:** Parse the provider's exact `urls` field and preserve its order when storing deeplinks. Keep all merchant values in environment configuration with QPay disabled by committed defaults. Use Quick Tunnels only for local testing. Production callbacks must use a stable owner-controlled hostname, either through the planned public NGINX/Let's Encrypt ingress or a deliberately provisioned named Cloudflare Tunnel.

**Consequences:** QR and deeplink creation matches the live provider contract and fails explicitly if that contract changes again. No temporary `trycloudflare.com` hostname may be configured in production. Selecting a named Cloudflare Tunnel requires owner access to Cloudflare and authoritative DNS planning that preserves existing web and mail records; selecting direct NGINX ingress requires the corresponding firewall, TLS, and reverse-proxy deployment.

## 2026-07-26 - Application-owned QPay invoice expiry

**Context:** Live payment attempts showed that `enable_expiry=true` delegated the duration to QPay's merchant configuration and produced expiry timestamps at or shortly after invoice creation. Merchant V2 does not accept a per-invoice expiry duration, so HiLiving's configured 15-minute hold and QPay's effective expiry diverged and bank applications rejected otherwise valid QR invoices.

**Decision:** Create new QPay invoices with provider-managed expiry disabled. Keep `QPAY_INVOICE_TTL`, defaulting to 15 minutes, as the single expiry authority recorded on the durable payment attempt. When that deadline passes, the scheduled processor must cancel the still-open QPay invoice successfully before marking the attempt/order expired and restoring inventory.

**Consequences:** New QR and deeplink payments receive the full application-owned payment window without depending on hidden merchant expiry configuration. Expiry can be adjusted through `QPAY_INVOICE_TTL`; the polling interval may delay cancellation by up to its configured interval. The backend scheduler must remain operational, cancellation failures keep inventory held for retry, and a real cancellation/stock-restoration rehearsal remains required before release.

## 2026-07-26 - Terminal QPay initiation failure and safe checkout retry

**Context:** Order placement deducts inventory before the provider call. Previously, a QPay authentication or invoice-initiation exception marked only the attempt `FAILED`, leaving the order pending and stock reserved forever. Simply generating a fresh idempotency key after every browser error would introduce duplicate-order risk when the server succeeded but its response was lost.

**Decision:** Handle an explicit provider initiation exception in a separate transaction that pessimistically locks the attempt and ordered products, restores inventory, marks the order `CANCELLED` with payment `FAILED`, stamps `inventory_released_at`, and records an audit. Repeated handling returns without another stock change. After receiving one of these explicit QPay error codes, the browser generates a new idempotency key so the retained cart can create a fresh order. Network-ambiguous errors keep the existing key.

**Consequences:** A failed initiation no longer strands inventory, retries do not reuse a cancelled order, and response-loss retries retain customer-scoped idempotency protection. The provider failure still returns an explicit HTTP error and does not clear the cart. Successful unpaid invoices continue using provider cancellation before expiry release and are not affected by this path.

## 2026-07-26 - Persistent catalog hero and home-style collection reveal

**Context:** Category and brand pages each owned a hero carousel and complete storefront chrome. URL navigation could remount or rerender the carousel, refetch banners, and scroll customers back through the hero before showing the newly selected products. The collection content also appeared without the ease-out reveal used by home-page sections.

**Decision:** Put category and brand routes under one persistent catalog shell, use one optional-slug route per collection type, and keep the hero outside the changing route outlet. Internal category/brand path changes scroll to the catalog boundary while other routes retain normal scroll-to-top behavior. Render catalog layouts through the shared reduced-motion-aware `SectionReveal` primitive and memoize the hero against unrelated parent renders. Persist a validated, display-only hero banner snapshot, selected banner ID, and completed-entrance flag in per-tab session storage; restore that state before refreshing banners from the public API, eagerly load only the visible image, and never replay the entrance during the same tab session. On mobile category pages, make the active icon tile the semantic category-menu button and remove the separate select; expose category choices as normal route links in a bounded menu with active-page, focus-loss, and Escape behavior.

**Consequences:** The hero loads once while users move among all-products, category, and brand collection URLs; navigation presents the selected product area first without replaying the banner. Reloads and route remounts during the same tab session render the last known hero immediately and keep it settled, including while a fresh banner request is pending or temporarily unavailable. The cache is presentation-only and never replaces the public API as the source of current banner data. Initial collection content uses the same ease-out motion as the home page, and users requesting reduced motion still receive a non-animated layout. Mobile users switch categories directly from the visible icon tile without a duplicate control, while keyboard and assistive-technology users receive explicit expanded/current-page state and focus restoration. Product detail and non-catalog routes retain their existing page ownership and scroll behavior.

## 2026-07-26 - Backend-authoritative zero-fee self-pickup

**Context:** Customers need a no-delivery option and must know where to collect the product. Treating this as display-only checkout text would let the standard delivery fee and address requirement remain on the authoritative order.

**Decision:** Add `SELF_PICKUP` beside `STANDARD_DELIVERY` in quotation and order placement. The backend returns a `0.00 MNT` shipping amount for pickup, requires standard orders to reference an owned address, and requires pickup orders to omit an address ID. A pickup order stores an immutable collection-location snapshot using clearly labeled sample data: Hiliving Mongolia төв оффис near Zaisan bridge, Monday-Saturday 10:00-20:00, phone 7755-8888. Customer and ADMIN order details render that snapshot. Pickup fulfillment moves directly from processing to delivered/collected instead of entering a shipped state.

**Consequences:** The displayed and persisted total cannot diverge from the selected delivery method, pickup works for customers without saved delivery addresses, and historical orders retain the collection instructions they were shown. The fixed sample address, hours, and phone are not production truth and must be replaced with owner-confirmed values before launch. Supporting multiple pickup sites or administrator-managed locations will require a dedicated authoritative location model rather than more frontend mock data.

## 2026-07-26 - Mongolian administration language and shared interaction primitives

**Context:** Administration screens mixed English operational copy with Mongolian storefront behavior, duplicated pagination/search/status formatting, sent list requests on every keystroke, allowed stale responses to replace newer results, and deleted several managed-content records without confirmation. Sequential batch uploads also increased waiting time, and an interrupted replacement upload could leave its parent form permanently pending.

**Decision:** Make Mongolian the single administration presentation language while retaining backend enum and API payload values. Centralize locale labels, date/money formatting, search, pagination, dialog, and common state presentation under the admin feature. Keep a clearly separated storefront-home action in the shared responsive admin sidebar. Debounce search-backed reads and ignore superseded responses, require in-app confirmation for destructive managed-content actions, upload product/banner batches concurrently while preserving selection order, and treat one image-control replacement chain as one pending operation.

**Consequences:** Administrators receive consistent Mongolian navigation, forms, validation, filters, statuses, and accessible names without a backend or database migration. The sidebar uses the existing HiLiving logo without a second text lockup and dashboard summaries navigate as semantic links. Membership administration uses the full content width, shows only the tier default and actual applied discount, keeps set/clear actions contained, and places a single account-status selector below the panel; the redundant override summary and status badge are omitted. Clearing the discount editor restores the default. Shared primitives reduce page duplication and future wording drift. Search produces fewer requests and cannot display out-of-order results; deletion requires a deliberate second action; ordered batch selection remains deterministic even though transfers run in parallel. A future multilingual requirement should add an explicit localization framework rather than reintroducing page-level English strings.

## 2026-07-26 - Open-source delivery-address map

**Context:** Customers benefit from choosing a delivery point visually, but a Google Maps implementation would introduce a proprietary SDK, billing account, and API key. The existing address contract already stores editable address text and does not require coordinates.

**Decision:** Use a lazily loaded Leaflet map centered on Ulaanbaatar with OpenStreetMap tiles. Reverse-geocode only after an explicit customer confirmation through a configurable Nominatim-compatible endpoint, prefer Mongolian results, show required attribution, prevent concurrent or faster-than-once-per-second lookups, and keep every populated field editable. Present dependent dropdowns for the capital's nine districts and 204 numbered khoroos, remove postal/country suffix segments from fallback addresses, and collect entrance/apartment separately. Hide nickname and recipient-name controls while supplying a neutral internal label and the authenticated account name to the unchanged address API. Do not implement autocomplete, movement-triggered requests, coordinate persistence, or a Google dependency.

**Consequences:** The address picker needs no browser secret or Google billing account and does not change backend/database compatibility. Customers receive a shorter form with consistent Ulaanbaatar district/khoroo values, while saved orders retain their required internal recipient snapshot. Entrance and apartment remain readable through existing additional-details consumers. The dependent options intentionally cover Ulaanbaatar only; nationwide aimag/soum/bag delivery requires a separate authoritative dataset and delivery-scope decision. Initial public OpenStreetMap services remain best-effort and policy-limited; configurable endpoints allow migration to an owner-operated or contracted OSM-compatible service without rebuilding the feature. Reverse geocoding may return incomplete nearby-object data, so required fields remain visibly editable and normal form validation still applies.

## 2026-07-26 - Direct-channel public contact page

**Context:** The primary contact navigation only jumped to the shared footer, and the storefront has no backend contract or operational owner for receiving public inquiry-form submissions.

**Decision:** Replace the contact footer-anchor navigation with a lazy-loaded `/contact` route. Reuse the storefront's existing office address, hours, phone, and email, and expose them through native click-to-call/email actions plus an external maps search. Use a restrained white layout with simple dividers rather than a promotional hero, gradient, floating cards, or repeated actions. Keep the shared footer as a compact contact summary and add a route link there for mobile discovery. Do not render a form until a delivery, ownership, retention, spam-control, and customer-response workflow is defined.

**Consequences:** Contact information now has a responsive, directly addressable page without creating a misleading submission flow or a new API. The current office details remain presentation configuration duplicated with the footer and the clearly marked sample pickup snapshot; owner-confirmed production values must replace them consistently before launch.

## 2026-07-26 - Five-item mobile navigation with a secondary menu

**Context:** Mobile navigation exposed only Home, Categories, Cart, and Account/Login. Brands, news, the Hiliving MGL home anchor, and the new contact route were discoverable only through desktop navigation or scattered page content. Putting those destinations inside `Ангилал` would mix product taxonomy with site-level navigation.

**Decision:** Keep the four task-oriented mobile destinations and add a fifth `Цэс` button. Open a compact, focus-contained text list for Hiliving MGL, brands, news, and contact without repeated branding/title, row arrows, or a separate X control. Close it through the trigger, backdrop, or Escape. Suppress the underlying route highlight while the sheet is open, keep `Ангилал` product-only, mark the menu active for secondary routes, and make the existing `#hiliving-mgl` target explicit on the home page with hash-aware scrolling.

**Consequences:** All desktop navigation destinations are now reachable from the persistent mobile bar without diluting category semantics. Five equal-width actions still fit the supported mobile baseline, labels truncate safely, the sheet locks background scrolling, and keyboard users can close with Escape and regain trigger focus. Any future mobile destination must justify displacing an existing primary action or joining this secondary menu rather than increasing bottom-bar density.

## 2026-07-26 - Embedded account email-verification status

**Context:** The account overview rendered membership, email verification, and registration information as three unrelated cards even though email verification describes the email already shown in registration information.

**Decision:** Keep membership as one compact, content-sized primary panel and combine email, phone, verification state, resend action, feedback, and profile-edit navigation in one registration-information panel. Represent a verified email with a small accessible green check directly beside the address; render the embedded status/action boundary only while unverified. Remove the duplicate order-history shortcut because the account navigation already owns that destination. Remove similarly redundant visible headings where contact actions are already self-explanatory.

**Consequences:** The account overview has two proportionate information groups, avoids repeating the customer email or order destination, and retains the existing verification API and error/status behavior. Customers edit registration details through Personal Information. Verified and unverified states remain accessible without changing authentication contracts or backend data.

## 2026-07-26 - Dependency monitoring and immutable media caching

**Context:** A hardening pass found patched frontend tooling dependencies, an upstream React Router advisory limited to RSC server actions, and managed UUID image responses cached for only 30 days despite never being overwritten.

**Decision:** Override Spring Boot's managed PostgreSQL JDBC version with patched 42.7.12 for CVE-2026-54291, upgrade and pin the reviewed lint toolchain, keep React Router 7.18.2 because it fixes older browser/redirect vulnerabilities and the app does not use the newly advised RSC/action path, and monitor npm plus Maven weekly through Dependabot. Treat generated media URLs as immutable content and serve them with a one-year public cache lifetime. Add explicit eager/high priority only to primary above-the-fold images and lazy asynchronous decoding to secondary/list images.

**Consequences:** The development-only dependency advisory is removed, future package fixes are surfaced automatically, and repeat media views avoid unnecessary transfers. `npm audit` remains non-zero until React Router publishes an applicable patched release, but the affected server execution mode is absent from this client-only `BrowserRouter` application. Replacing an image must continue producing a new UUID URL; production NGINX must preserve the same immutable cache policy.

## 2026-07-27 - Licensed production-looking local storefront data

**Context:** The current local storefront mixed sparse test products with unrelated uploaded imagery and development-oriented copy, which made customer and administration screens look artificial. The requested replacement needed realistic presentation without turning sample claims, pricing, or stock into production reference data or altering existing customer/order history.

**Decision:** Replace only the current workstation's catalog/content presentation with exactly nine active products across the existing nine categories, realistic fictional Mongolian copy, MNT prices, stock, two banners, and four published news articles. Download Pexels photos permitted by its public license, review them for visible third-party branding, resize and re-encode them into the configured local media root, persist managed metadata, and use same-origin `/media/...` associations rather than hotlinks. Record every source page in `docs/DEMO_CONTENT_SOURCES.md`. Keep the dataset outside Flyway and automatic startup, and do not mutate users, orders, or order snapshots.

**Consequences:** The local home, catalog, product, and news screens now provide coherent production-like demo content while clean/test/production databases remain unaffected. Resetting the local PostgreSQL volume or external upload root removes the corresponding half of the dataset, so local backup/restore must keep them paired. The content is fictional and requires owner-approved real product data, commercial media, pricing, stock, and claims before launch. This decision supersedes the image-empty local catalog presentation described on 2026-07-16 without changing the local-volume-only boundary.

## 2026-07-29 - Authentication hardening from a security assessment

**Context:** An authenticated whitebox and dynamic security assessment of the backend confirmed that the high-risk surfaces were already controlled (QPay callback forgery, order IDOR, price/total tampering, SQL injection, upload/path-traversal, SSRF, admin authorization, and secret exposure), but identified concrete lower-severity gaps: unlimited login attempts allowed brute-force/spraying and made the per-account lockout a repeatable denial-of-service, registration returned an unauthenticated existence oracle, self-service password and email change did not revoke other sessions, cookies were not `Secure` by default, and no `Content-Security-Policy`/`Referrer-Policy`/`Permissions-Policy`/HSTS headers were emitted.

**Decision:** Add pre-credential abuse throttles reusing the existing rate-limit service — login capped per source IP and per submitted identifier, registration capped per source IP — configurable under `hiliving.security.rate-limit.*` with single-node defaults. Default `SESSION_COOKIE_SECURE` to true (fail-closed) so only an explicit opt-out serves cookies over plain HTTP for local development. Emit a locked-down `Content-Security-Policy` (`default-src 'none'`), `Referrer-Policy`, `Permissions-Policy`, and HSTS from the security filter chain. Increment the per-user session version on self-service password change and login-email change so they revoke existing sessions exactly like password recovery. Keep the distinct registration email/phone conflict codes because removing them would degrade sign-up feedback; rely on the per-IP registration throttle to bound enumeration instead.

**Rationale:** The changes close the confirmed gaps with minimal, reviewable code, reuse existing infrastructure, and keep security controls tunable per deployment rather than hardcoded. Fail-closed cookie and header defaults protect any environment that forgets to configure them, while the enumeration decision balances a real but low-severity oracle against usable registration.

**Consequences:** Exceeding a limit returns `429 RATE_LIMITED` with `Retry-After`. The rate-limit store is in-memory and per instance, so a multi-node deployment must move it to a shared backend (for example Redis) before scaling or the limits multiply across replicas; this is tracked in `docs/TODO.md`. The per-account lockout DoS is reduced but not eliminated without CAPTCHA or soft-backoff. After a password or email change the active session is also revoked, so clients must re-authenticate; one integration test was updated to reflect this. HSTS only takes effect over HTTPS. Behavioural tests relax the throttles through a test-only property override because the cached `@SpringBootTest` context shares one in-memory counter across all methods.

## 2026-07-31 - Single-node Hostinger staging deployment

**Context:** HiLiving needed a stable public environment for end-to-end verification before changing `hiliving.mn`. The chosen Hostinger VPS provides Ubuntu 24.04, 2 vCPUs, about 8 GiB RAM, 96 GB disk, Docker, IPv4/IPv6, and an assigned hostname that resolves directly to the server. The production database must be isolated from workstation identities/orders, and test QPay/SMTP credentials must not become production secrets.

**Decision:** Deploy one same-origin staging stack at `https://srv1869478.hstgr.cloud`. Use NGINX for HTTPS, static Vite releases, SPA fallback, and localhost proxying; a restricted systemd service for the Spring JAR; and PostgreSQL 17 in Docker bound only to loopback. Store media outside releases at `/var/lib/hiliving/uploads`, secrets at `/etc/hiliving/hiliving.env`, and frontend/backend artifacts in versioned release directories with atomic `current` symlinks. Generate fresh database and token-protection secrets on the server. Keep QPay and email delivery disabled. Import only the reviewed public catalog/content and its referenced media; do not import workstation users, addresses, orders, payments, sessions, tokens, audits, or outbox rows. Preserve `hiliving.mn` DNS until admin ownership, durable backups, integrations, and business details are approved.

**Consequences:** The full stack and reviewed demo storefront are reachable over renewable HTTPS without risking the existing web/mail domain. UFW exposes only 22/80/443; Spring and PostgreSQL remain localhost-only. A reboot verified automatic recovery of Docker/PostgreSQL, systemd/Spring, NGINX, UFW, and the public API. The public-only import left users, orders, payments, and email empty. A coordinated database/media backup copied off the VPS restored successfully in isolated PostgreSQL 17/filesystem targets. Deployment assets now live under `infrastructure/production`. Production readiness still requires an owner account promoted after normal registration, durable scheduled off-server backups, QPay and SMTP activation rehearsals, owner-confirmed pickup/contact details, and the deliberate `hiliving.mn` web-record cutover.

## 2026-07-31 - Staging SMTP activation and inline email branding

**Context:** Transactional email code was complete but disabled in deployment. Hostinger staging needed real verification delivery and a professional HiLiving presentation without depending on email-client SVG support or remote-image loading. The available sender is suitable for staging but is not the final authenticated `hiliving.mn` sending identity.

**Decision:** Use Brevo's authenticated SMTP relay on port 587 for staging, authorize the fixed VPS address, keep credentials only in `/etc/hiliving/hiliving.env`, and retain delivery-off committed defaults. Render the approved HiLiving SVG into a transparent high-resolution PNG stored in backend classpath resources and attach it inline with a stable content ID. Use conservative table-based HTML, inline CSS, visible headings, coral action buttons, fallback action URLs, support details, and a plain-text alternative for every transactional message.

**Consequences:** Verification mail is delivered from the deployed outbox with consistent branding even when remote images are blocked, and the application health check covers the live SMTP connection. Provider/API/SMTP credentials shared during staging must be rotated before production, the final sending domain must be authenticated, and end-to-end password-reset plus order-notification mailbox checks remain production gates.

## 2026-07-31 - Canonical hilivingmgl.mn origin on Hostinger

**Context:** The owner controls `hilivingmgl.mn` through Datacom and explicitly directed its web DNS to the deployed Hostinger VPS. The Hostinger hostname already served the same-origin application over HTTPS, while QPay remained disabled and application-generated links still used that temporary hostname.

**Decision:** Keep Datacom's existing authoritative nameservers and change only the apex and `www` A records to the VPS IPv4 address. Issue a Let's Encrypt certificate covering both public names, make `https://hilivingmgl.mn` canonical, and redirect `www` plus the original Hostinger hostname to it. Update `APP_PUBLIC_URL` and the disabled `QPAY_CALLBACK_BASE_URL` to the canonical origin without enabling QPay or changing credentials.

**Consequences:** Storefront, administration routes, API, media, and future transactional links now share the branded HTTPS origin. Both certificate lineages pass simulated renewal, and the prior NGINX/environment files remain recoverable on the server. Recursive resolvers may show Datacom's former endpoint until its 7,200-second DNS TTL expires. The domain cutover does not remove the remaining launch gates: scheduled encrypted off-server backups, rotated owner-controlled QPay/mail credentials, paid and expiry rehearsals, authenticated mail domain, and approved business details.

## 2026-07-31 - Successful-main automatic Hostinger deployment

**Context:** The deployed application used reviewed versioned release directories but required manual artifact transfer and symlink activation. A normal push to `main` needed to update Hostinger only after both independently buildable applications passed their existing validation gates, without giving GitHub or a general SSH account unrestricted root access.

**Decision:** Add a production job to the repository-wide GitHub Actions workflow after the frontend and backend jobs. Build commit-addressed frontend/JAR artifacts, checksum them, and transfer them over a pinned SSH connection owned by a dedicated `hiliving-deploy` account. Permit that account to invoke only a root-owned activator that validates a full Git SHA and expected artifacts, installs versioned releases, starts and health-checks the backend before switching the frontend, verifies the public origin, and restores the previous code links on failure. Keep production application/integration secrets solely in `/etc/hiliving/hiliving.env` and keep database/media state outside releases.

**Consequences:** Every successful push to `main` deploys without a manual server login; failed CI never reaches the VPS, missing credentials fail explicitly, and a release activation cannot silently pass without local and public health checks. Main deployments queue instead of canceling an in-progress release. The SSH principal can upload artifacts but cannot read the restricted application environment or run arbitrary sudo commands. Infrastructure activator changes still require deliberate root installation. Automatic code rollback cannot reverse a Flyway migration, so migrations must remain forward-safe and the separate durable off-server backup gate remains mandatory before accepting production payments.

## 2026-08-01 - Managed homepage banner placements and brand presentation

**Context:** The homepage needed the supplied HiLiving Mongolia logo, restrained 1440×300 upper and lower banner regions, denser product/news cards, larger category icons, and every brand logo visible on desktop. The lower banner had no administration source. Brand pages also needed optional brand-specific artwork and a more compact mobile toolbar.

**Decision:** Treat the supplied transparent PNG as the storefront header/footer logo. Give banners an explicit `HERO` or `PROMOTIONAL` placement, migrate existing rows to `HERO`, require placement on public reads and admin writes, and source both homepage banner regions exclusively from managed content. Use the same centered 1440×300 desktop frame for both placements without stretching them edge to edge. Add one optional banner URL to each brand and render it only on that brand's route. Remove the decorative brand-navigation icon, place mobile brand search and sorting on one row, and let the desktop homepage brand list wrap naturally.

**Consequences:** Administrators can upload upper and lower homepage artwork through the existing banner workflow and can attach one banner to each brand. A lower region or brand banner is intentionally absent until matching managed content is saved; the storefront does not substitute hard-coded artwork. Existing banners continue as upper banners after Flyway V13. Production receives the schema and behavior only through the normal CI-gated deployment, and content editors should use 1440×300 desktop banner assets.

## 2026-08-01 - Simplified news authoring and mobile catalog controls

**Context:** News editors should write only a title and one description rather than managing technical slugs and duplicate summary text. Mobile catalog controls were too crowded, and product detail exposed operational stock/help copy while vertically centering its desktop information far below the image top. Homepage banners and brand cards also needed a quieter relationship to the page background.

**Decision:** Generate a unique transliterated news slug on the server at creation, keep it immutable on update, and remove summary from the write/read contracts and database through Flyway V14. Render news cards with the title and a right-aligned `Унших` link, while detail pages render the single content field. Hide catalog search below `sm` and pagination below `md`, retaining mobile sorting. Keep inventory authoritative for quantity bounds and availability without rendering stock counts, remove the generic membership-discount help sentence, and top-align desktop product information. Remove outer padding/background contrast from both homepage banner placements and use a nearly transparent resting border for homepage brand cards.

**Consequences:** Editors no longer handle URL identifiers or duplicate copy, while existing news URLs remain stable and newly created duplicate titles receive deterministic numeric suffixes. Applying V14 permanently removes stored summary values, so rollback requires database recovery rather than a code-link change. Mobile catalog navigation is simpler, desktop retains search and page navigation, and purchasing rules remain unchanged despite the reduced product-detail copy. Banners stay capped at 1440px but meet the page edge without an inset frame.

## 2026-08-01 - Three-section public information layout

**Context:** The public `Мэдээлэл` navigation needed to match the supplied reference with three subordinate areas—`Мэдээ`, `Мэдээлэл`, and `Сургалт`—and a desktop article list instead of the existing homepage hero plus card grid. Training will later be restricted to approved registered users, but its entitlement model and anonymous warning flow are intentionally outside this frontend pass.

**Decision:** Keep `/news` and all existing article-detail URLs stable, remove the hero from the index only, and render the current API-backed articles under the active `Мэдээлэл` section. Present the three requested labels as a desktop side menu and a compact mobile horizontal menu, with a vertical thumbnail/title/read-link list and explicit loading, empty, failure, and retry states. Do not fabricate training access checks, protected content, or duplicate article sources for the other labels.

**Consequences:** The information index now matches the requested responsive structure without changing backend data or existing deep links. `Мэдээ` and `Сургалт` establish the visible information architecture but need distinct content/authorization contracts before becoming interactive destinations. Training authorization and its registration/access notice remain a separately planned feature.

## 2026-08-01 - Controlled news categories and reference typography

**Context:** Information-list headlines still used the storefront sans-serif treatment instead of the serif type visible in the supplied reference, and articles had no editorial category even though the reference presents category metadata before the publication date. Editors needed common reusable choices rather than inconsistent free-form category text.

**Decision:** Define seven stable category codes—general, economy, business, society, health, education, and lifestyle—in the backend enum, required request contract, and Flyway V17 database constraint. Backfill existing news as general but remove the column default so every future write must choose explicitly. Share one typed Mongolian label map between the admin dropdown, admin list, and public list. Apply the serif font only to information-list headlines and retain smaller sans-serif type for category/date metadata and the rest of the storefront.

**Consequences:** Administrators can choose only recognized common categories, API responses carry the stable code, and invalid codes fail with a validation error. Existing articles remain readable as `Ерөнхий`; editors may reclassify them later. The public list more closely matches the reference without globally changing typography or requiring a remote font dependency.

## 2026-08-01 - Bounded product-photo scaling and explicit ordering

**Context:** The live Bluwell product used five valid PNG uploads with substantially different portrait/landscape canvases and built-in whitespace. A fixed responsive `object-contain` frame preserved every image but could not make their subjects look equally sized without cropping or stretching them. Product order was already persisted, but its small arrow-only controls were easy to miss.

**Decision:** Persist one `display_scale` percentage per product image through Flyway V16, constrain it to 75–150 with 100 as the existing-image default, and carry it through administrative requests plus public image/summary responses. Apply the same aspect-ratio-preserving scale in admin previews, catalog cards, main product images, and thumbnails. Keep order and primary-image choice independent; expose drag-and-drop ordering while retaining labeled previous/next buttons for keyboard and touch use, and normalize saved order values to contiguous zero-based positions.

**Consequences:** Administrators can visually balance mixed source canvases and choose a deterministic storefront sequence without re-encoding or destructively cropping uploads. Oversized scale values fail validation at both the API and database boundaries. Existing product images remain at their current 100% composition until an administrator deliberately adjusts them, and deploying the code does not mutate the live Bluwell content automatically.

## 2026-08-01 - Fixed-layout Hiliving MGL pages with sanitized rich content

**Context:** `Hiliving MGL` still linked to a homepage anchor, while administration showed a disabled `Хуудас` item with no route or API. The requested reference uses four stable company-information sections and a WordPress Classic Editor-style WYSIWYG experience with Visual and HTML/source authoring, images, headings, formatting, lists, alignment, links, and tables. Allowing administrators to edit whole application templates would make the header, footer, routing, and responsive behavior fragile, and rendering unsanitized HTML would create stored-XSS risk.

**Decision:** Replace the anchor with the dedicated `/hiliving-mgl/:sectionSlug?` React route and retain application ownership of the outer layout and responsive section navigation. Create four fixed section identities—company history, philosophy, membership, and awards—through Flyway V15; administrators may edit only title, rich HTML, and draft/published state. Use the official TinyMCE React integration loaded from Tiny Cloud with an environment-only `VITE_TINYMCE_API_KEY` and free/core plugins, including code view. Reuse managed media with a new `PAGE` purpose and require editor uploads to finish before save. Sanitize HTML with a backend allowlist before persistence, expose only published sections publicly, reject empty publication, and audit page state changes.

**Consequences:** Content editors get a familiar rich editor without control over application code or storefront chrome. Public pages keep the current white/neutral/coral responsive system and render only server-sanitized content. TinyMCE Cloud must be configured with the deployment key and allowed domain at build/deployment time; missing configuration fails visibly in the admin editor. Drafts may be empty, but publication requires text or an image. Page images use immutable same-origin managed URLs and share the existing backup, orphan-retention, and storage-boundary requirements.
