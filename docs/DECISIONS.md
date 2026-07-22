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

**Decision:** Preserve `DRAFT`, `ACTIVE`, and `ARCHIVED` lifecycle status; add an independent operational `active` switch. Public visibility requires both active lifecycle and operational state plus visible category/brand relationships. Compute inventory state from stock and threshold. Store at most four URL-only images and require exactly one primary image for a publicly usable product. Store `membership_discount_eligible` as a required boolean.

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

**Consequences:** Product, news, banner, category, brand, and user-discount inputs behave consistently without API or database changes. Product requests with up to six unique ordered images are accepted; seven are rejected. A failed later batch upload keeps earlier completed photos, and banner/news controls remain single-image because their slots have different meanings. This supersedes the four-image limit in the 2026-07-16 product administration decision.

## 2026-07-22 - Explicit optional catalog discount authoring

**Context:** A permanently visible discounted-price input did not clearly distinguish products with no catalog discount, and administrators needed to author a discount using either the business percentage or the final customer-facing price.

**Decision:** Keep base price mandatory and place catalog discounting behind an explicit checkbox. When enabled, let the administrator choose percentage or discounted-price entry. Convert percentage entry to a two-decimal discounted price for the existing write contract, derive a display percentage from direct price entry, and submit `discountPrice=null` when discounting is disabled.

**Consequences:** The create and edit forms communicate non-discounted products clearly without a schema or API change. Existing discounted products open with discounting enabled, clearing the checkbox removes their catalog discount, and backend-authoritative quotation continues consuming the same nullable discounted price.

## 2026-07-22 - Automatic content ordering and simpler taxonomy/banner authoring

**Context:** News and brand sort numbers, category parent/children controls, and unused banner click-through fields exposed implementation details without helping the current storefront. Banner desktop/mobile images also required separate file-picker actions.

**Decision:** Remove news sort order from the write contract and order public news by effective publication time descending, with the admin list ordered by most recent update. Remove brand sort order from the write contract and order brands alphabetically. Hide category parent selection and parent/children table columns in normal administration while retaining existing backend integrity constraints. Replace separate empty banner upload slots with one dynamic two-file batch where selection order maps to desktop then mobile, and omit destination URL/link label from normal banner payloads because the carousel does not render click-through content.

**Consequences:** Administrators no longer manage technical ordering or unused relationships/links. Existing catalog/category persistence remains valid, news and brand ordering is deterministic, and banner upload requires one picker action while retaining per-image replacement/removal. The media service still supplies secure stored URLs; client filenames are never trusted as storage paths.
