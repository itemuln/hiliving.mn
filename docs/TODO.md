# TODO

## Active

- No active implementation task. Phase 5.1 media upload and local server storage are implemented.

## Planned

- [ ] **P1 - Phase 4B:** design password-reset and email/phone verification tokens, expiry, one-time use, abuse protection, session invalidation, and the email/SMS delivery boundary. Do not add delivery providers before the boundary is reviewed.
- [ ] **P1:** review and design the shopping-cart boundary: anonymous identity, persistence, line-item quantities, server-authoritative prices, expiration, API shape, and frontend state. Keep checkout, orders, payments, and inventory reservation separate.
- [ ] **P1:** define membership discount stacking and final-price calculation in the pricing/cart phase; `membership_discount_eligible` currently grants permission only.
- [ ] **P1:** provision the production upload root and NGINX read-only `/media/` alias, then rehearse paired PostgreSQL/filesystem backup and restore before deployment.
- [ ] **P2:** add reference-aware media deletion/orphan reporting after defining retention and recovery policy; do not delete shared or externally hosted URLs.
- [ ] **P2:** switch the existing media storage boundary to an S3-compatible provider only when multi-node deployment, CDN/off-server durability, or storage growth justifies it.
- [ ] **P2:** design order management before enabling the disabled admin navigation item.
- [ ] **P1:** decide whether password changes need shared session storage or a session registry before promising cross-session invalidation.
- [ ] **P1:** define the catalog slug-change and redirect policy before management workflows can edit public slugs.
- [ ] **P2:** decide and model currency explicitly before supporting more than the current implicit currency.
- [ ] **P2:** add contract automation or schema generation if manual frontend/backend DTO synchronization becomes error-prone.
- [ ] **P3:** design production NGINX, systemd, HTTPS, restricted environment files, SPA fallback, `/api` proxying, and off-server backups in a later phase.

## Completed

- [x] Audit and restructure the repository into independent frontend/backend modules.
- [x] Create and maintain project-memory documentation.
- [x] Establish Java 21 Spring Boot, PostgreSQL, Flyway, JPA validation, Actuator, Testcontainers, Compose, and secret-safe environment foundations.
- [x] Add exact Java 21 GitHub Actions and Docker verification.
- [x] Create the Category, Brand, Product, and ProductImage Flyway schema and read-only `/api/v1` endpoints.
- [x] Test backend migrations, constraints, repositories, services, visibility, pagination, filters, sorting, validation, and 404 handling.
- [x] Add same-origin frontend API configuration and a local Vite `/api` proxy.
- [x] Add the typed catalog adapter, DTO/domain mapping, cancellation, safe errors, focused resource hooks, and URL query state.
- [x] Migrate home categories/brands/featured products plus category and brand catalog pages to backend reads.
- [x] Add search, controlled sorting, server pagination, slug product navigation, and the minimal product-detail page.
- [x] Add skeleton, empty, retry, safe 400/404, and backend-unavailable states.
- [x] Remove obsolete catalog mocks and retain only non-catalog marketing/news data.
- [x] Add and integrate 10 frontend HTTP-boundary/UI tests into GitHub Actions and Jenkins.
- [x] Verify clean frontend install/lint/tests/build, Java 21 backend tests, live API integration, deep links, pagination, and mobile responsive layout.
- [x] Add Flyway V3 membership, user, and delivery-address schemas with canonical identity constraints and permanent membership reference data.
- [x] Add Spring Security session login/logout, cookie/header CSRF, session fixation protection, password hashing, and failed-login lockout.
- [x] Add registration, current account, profile, password, delivery-address, and minimal admin user APIs with safe error envelopes.
- [x] Add three-state frontend auth hydration, login/registration/account routes, protected returns, membership display, profile/security forms, and address CRUD UI.
- [x] Add identity/security/account tests; verify 27 backend tests on Temurin Java 21 and 25 frontend tests after a clean install.
- [x] Verify live registration, login, default address, logout, protected redirects, and 390×844 no-overflow account layouts; remove temporary verification data.
- [x] Add Flyway V4 catalog administration, banner/news, and audit schema while preserving V1–V3.
- [x] Add ADMIN-only dashboard, category, brand, product, inventory, image, user, banner, and news APIs.
- [x] Add a responsive separate admin shell and guarded dashboard/catalog/user/content routes; keep Orders and Pages disabled.
- [x] Replace static storefront hero/news sources with active scheduled/published API data.
- [x] Add administration authorization, hierarchy, product rule, inventory, public visibility, banner, news, shell, guard, and image-editor tests.
- [x] Verify 31 backend tests on Temurin Java 21, 28 frontend tests, lint/build, the core live admin catalog workflow, public visibility, archive removal, and 390×844 no-overflow navigation; remove temporary verification data.
- [x] Populate the current local PostgreSQL volume with clearly marked administration, customer, membership, address, catalog, inventory, and news test data without adding production seed credentials or image records.
- [x] Add Flyway V5 media metadata, validated JPEG/PNG processing, purpose-specific limits/resizing, secure UUID storage keys, configurable external local storage, media audit events, and public read-only `/media/**` delivery.
- [x] Replace product, brand, banner, and news URL-entry fields with a reusable picker/drag-drop/progress/preview/retry upload control while retaining compatible existing external URLs.
- [x] Verify 38 backend tests on Temurin Java 21, 35 frontend tests, lint/build, clean-build persistence, restart persistence, authorization/rejection paths, replacement immutability, public media rendering, and mobile admin layouts.
- [x] Remove Starts at and Ends at from normal banner administration while preserving backward-compatible banner response fields.
