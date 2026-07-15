# TODO

## Active

- No active implementation task. Phase 3 is complete.

## Planned

- [ ] **P1 - Phase 4:** review and design the shopping-cart boundary: anonymous identity, persistence, line-item quantities, server-authoritative prices, expiration, API shape, and frontend state. Do not combine checkout, orders, payments, or inventory reservation without explicit approval.
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
