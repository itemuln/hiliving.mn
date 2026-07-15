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
