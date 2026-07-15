# Project Status

## Current project state

HiLiving is a modular monorepo with an independently buildable React/Vite storefront in `frontend/` and a Java 21 Spring Boot catalog API in `backend/`. Phase 3 is complete: the storefront now reads categories, brands, paginated products, and product details from the backend through a typed frontend adapter. Root Docker Compose provides local PostgreSQL, and local frontend development reaches the API through a same-origin Vite proxy.

## Features currently working

- Responsive React/Vite storefront with preserved home, category, brand, product, and news routes
- Environment-based catalog API configuration with same-origin defaults
- Typed backend DTO definitions, explicit frontend-domain mapping, centralized fetch/status handling, cancellation, and safe normalized errors
- Backend-driven home categories, brands, and featured products
- Backend-driven category and brand pages with URL-based search, controlled sorting, and server pagination
- Slug-based product cards and a minimal product-detail page
- Loading skeletons plus successful, empty, safe error, retry, 400, 404, and backend-unavailable states
- Static hero, promotion, and news content retained independently from catalog data
- Frontend Vitest and Testing Library coverage at the HTTP boundary
- Frontend clean install, ESLint, tests, TypeScript compilation, and production Vite build
- Spring Boot 4.1.0 catalog API compiled and tested on Temurin Java 21
- PostgreSQL 17, Flyway through version 2, Hibernate schema validation, and Testcontainers integration coverage
- GitHub Actions and Jenkins frontend test stages

## Current active task

No implementation task is active. Phase 3 is complete and ready for review.

## Latest meaningful changes

- 2026-07-15: Added `VITE_API_BASE_URL` and local Vite proxy configuration through the root environment boundary.
- 2026-07-15: Added a typed catalog client, backend DTO types, safe API errors, explicit frontend models, and request cancellation.
- 2026-07-15: Migrated home, category, brand, search, sort, pagination, and product-detail data flows to `/api/v1`.
- 2026-07-15: Removed obsolete category, brand, and product mocks plus the incorrect legacy product service; retained non-catalog marketing/news data.
- 2026-07-15: Added loading, empty, retry, safe failure, product 404, and unavailable-service UI states without changing the established design language.
- 2026-07-15: Added 10 frontend adapter/UI tests and added frontend tests to GitHub Actions and Jenkins.
- 2026-07-15: Verified live categories, brands, filters, sorting, pagination, product details, safe 400/404 handling, backend unavailability, news deep links, and a 390×844 responsive layout.
- 2026-07-15: Reverified the backend with 11 passing tests on Temurin Java 21, Flyway V1–V2, PostgreSQL 17, and Hibernate validation.

## Known issues

- This workstation already has services on ports 5432 and 8080. Its ignored `.env` uses PostgreSQL 5433, and integration uses Spring Boot 18080. Committed and production defaults remain 5432 and 8080.
- Direct cross-origin `VITE_API_BASE_URL` values require a deliberately configured backend/API gateway origin policy. No backend CORS configuration is added because local Vite and future NGINX use same-origin `/api` proxying.
- Frontend API DTOs are manually mirrored from the backend contract; future contract changes must update both sides and their tests together.
- The catalog remains read-only. Authentication, cart persistence, inventory reservation, checkout, orders, payments, administration, variants, and reviews are not implemented.
- Product currency is still implicit, and public slug changes do not yet have a redirect or alias policy.

## Next recommended step

Begin Phase 4 with a reviewed shopping-cart design. Define anonymous cart identity, persistence, line-item quantity rules, authoritative server-side price recalculation, expiration, and the frontend cart state/API contract before implementing cart mutations. Keep checkout, orders, payments, and inventory reservation outside that phase unless explicitly approved.
