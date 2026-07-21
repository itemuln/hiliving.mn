# TODO

## Active

- No active implementation task. Phase 7B/7C transactional email, verification, and password recovery are implemented and validated.

## Planned

- [x] **P1 - Phase 4B/7C:** implement email verification and password-reset tokens, expiry, one-time use, abuse protection, session invalidation, and transactional SMTP/outbox delivery. Phone/SMS verification remains out of scope.
- [ ] **P1 - Phase 7:** add ADMIN-only order list/detail workflows, validated fulfillment/status transitions, operational audit events, and customer order history before enabling the Orders navigation item.
- [ ] **P1 - Phase 7:** define cancellation, rejection, and stock-restoration rules, including idempotent transitions and concurrency behavior, before allowing order cancellation.
- [ ] **P1:** design the real payment-provider lifecycle, signed callbacks, reconciliation, settlement, refunds, failure recovery, and secret handling before implementing `PaymentProvider`; retain `UNPAID` cash-on-delivery until then.
- [ ] **P1:** provision the production upload root and NGINX read-only `/media/` alias, then rehearse paired PostgreSQL/filesystem backup and restore before deployment.
- [ ] **P2:** add reference-aware media deletion/orphan reporting after defining retention and recovery policy; do not delete shared or externally hosted URLs.
- [ ] **P2:** switch the existing media storage boundary to an S3-compatible provider only when multi-node deployment, CDN/off-server durability, or storage growth justifies it.
- [ ] **P2:** decide whether browser-local carts need authenticated cross-device synchronization, expiry, abandoned-cart handling, or inventory reservation; do not add them without a concrete business requirement.
- [x] **P1:** invalidate prior sessions after password recovery through a database-backed per-user session version; ordinary authenticated password change keeps its current behavior.
- [ ] **P2:** define a redirect/alias and migration policy before ever introducing an exceptional product-slug correction or import tool; normal product editing keeps generated slugs immutable.
- [ ] **P2:** migrate the catalog itself to explicit currency before supporting anything beyond the current MNT quote/order boundary.
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
- [x] Add Flyway V6 orders, item snapshots, address snapshots, explicit MNT totals/states, customer-scoped idempotency, and supporting constraints/indexes.
- [x] Centralize product purchasability and catalog-first/member-second pricing; add public authoritative cart quotation with configured standard-delivery totals.
- [x] Extend public product detail with ordered images, SKU, membership savings, stock limits, and related public products.
- [x] Add transactionally repriced order placement with owned addresses, sorted pessimistic inventory locks, all-or-nothing deduction, immutable snapshots, and secure own-order retrieval.
- [x] Add the `PaymentProvider` extension boundary while keeping Phase 6 orders explicitly `UNPAID` and cash-on-delivery only.
- [x] Add a versioned minimal browser cart, real header badges, complete product-detail UI, responsive cart, protected checkout/login return, address creation/selection, double-submit prevention, and order confirmation.
- [x] Verify 44 backend tests on Java 21 with PostgreSQL/Flyway V1-V6/Hibernate/JAR packaging and 48 frontend tests with clean install, lint, TypeScript/Vite build, and Prettier checks.
- [x] Live-verify the anonymous product/cart flow, refresh persistence, checkout login return, address creation, authoritative totals, order success, inventory deduction, idempotent replay, cross-customer denial, cleanup, and responsive no-overflow layouts.
- [x] Remove product slug/code inputs and write fields; generate collision-safe stable slugs and sequence-backed `PRD-######` codes on creation while preserving both identifiers on rename.
- [x] Verify the product-identifier refactor with all 44 backend tests, PostgreSQL/Flyway V1-V7/Hibernate/JAR packaging, all 50 frontend tests, lint, TypeScript, and the production build.
- [x] Replace separate short/full product-description inputs with one admin Description field and derive the compatible 500-character catalog summary on the backend.
