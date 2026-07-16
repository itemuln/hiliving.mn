# TODO

## Active

- No active implementation task. Phase 4A is complete.

## Planned

- [ ] **P1 - Phase 4B:** design password-reset and email/phone verification tokens, expiry, one-time use, abuse protection, session invalidation, and the email/SMS delivery boundary. Do not add delivery providers before the boundary is reviewed.
- [ ] **P1:** review and design the shopping-cart boundary: anonymous identity, persistence, line-item quantities, server-authoritative prices, expiration, API shape, and frontend state. Keep checkout, orders, payments, and inventory reservation separate.
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
