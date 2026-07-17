# Project Status

## Current project state

HiLiving is a modular monorepo with an independently buildable React/Vite storefront in `frontend/` and a Java 21 Spring Boot API in `backend/`. Phase 6 is implemented: complete product detail, a persistent anonymous cart, backend-authoritative quotation, authenticated checkout preparation, transactional order placement, and secure order confirmation now extend the existing catalog, account, administration, and managed-media features.

## Features currently working

- Responsive React/Vite storefront with preserved home, category, brand, product, and news routes
- Environment-based catalog API configuration with same-origin defaults
- Typed backend DTO definitions, explicit frontend-domain mapping, centralized fetch/status handling, cancellation, and safe normalized errors
- Backend-driven home categories, brands, and featured products
- Backend-driven category and brand pages with URL-based search, controlled sorting, and server pagination
- Complete slug-based product detail with ordered gallery images, SKU, membership-aware pricing, bounded quantities, stock state, add-to-cart, and related products
- Loading skeletons plus successful, empty, safe error, retry, 400, 404, and backend-unavailable states
- API-backed active hero banners and published news list/detail content
- Frontend Vitest and Testing Library coverage at the HTTP boundary
- Frontend clean install, ESLint, tests, TypeScript compilation, and production Vite build
- Customer registration followed by explicit login; public registration never grants `ADMIN`
- Server-side Spring Security sessions with an HttpOnly `JSESSIONID`, `SameSite=Lax`, session fixation protection, and no browser-stored auth token
- Cookie-to-header CSRF protection through `XSRF-TOKEN` and `X-XSRF-TOKEN`
- Auth hydration through `/api/v1/account/me`, protected account routes, safe internal `returnTo`, session-expiry handling, and responsive auth/account header states
- Customer profile and password updates plus ownership-scoped delivery-address CRUD and transactional default switching
- Permanent `REGULAR`, `BRONZE`, `SILVER`, and `GOLD` tiers with default, override, and effective discount display
- Responsive separate admin shell, dashboard counts, catalog CRUD, managed image upload, inventory, users, banners, and news
- Permanent membership tiers with admin-only assignment, nullable override management, account status control, and address viewing
- Product lifecycle, operational active flag, computed inventory state, four-image limit, and membership-discount eligibility controls
- Reusable safe admin audit logging for catalog, price, inventory, membership, status, banner, and news changes
- JPEG/PNG decode-and-reencode processing with purpose-specific limits, safe UUID keys, external filesystem storage, and public read-only `/media/**` delivery
- Reusable upload controls with picker, drag/drop, progress, preview, replacement, removal, retry, and save blocking while uploads are pending
- Versioned browser cart persistence containing only product slugs and quantities, with duplicate merging, malformed-data recovery, live item counts, and server reconciliation
- Public backend-authoritative cart quotation in MNT, including catalog discounts, eligible customer membership discounts, configured standard delivery, stock validation, and final totals
- Protected checkout with safe post-login return, ownership-scoped address selection/creation, cash-on-delivery confirmation, submission locking, and failure-safe cart retention
- Transactional order creation with immutable item/address/pricing snapshots, row-locked inventory deduction, per-customer idempotency keys, and ownership-scoped order confirmation
- Explicit initial `PENDING_CONFIRMATION`/`UNPAID` order state plus a payment-provider interface boundary without a real payment integration
- Spring Boot 4.1.0 catalog API compiled and tested on Temurin Java 21
- PostgreSQL 17, Flyway through version 6, Hibernate schema validation, and Testcontainers integration coverage
- GitHub Actions and Jenkins frontend test stages

## Current active task

No implementation task is active. Phase 6 implementation, automated verification, concurrency checks, and the live product-to-order browser/API workflow are complete.

## Latest meaningful changes

- 2026-07-17: Added Flyway V6 order, order-item, and delivery-address snapshot persistence with explicit lifecycle/payment states, idempotency constraints, and lookup indexes.
- 2026-07-17: Centralized purchasability and MNT pricing, including catalog-first then membership discounting, authoritative cart quotation, configured standard delivery, and transactional inventory locking/deduction.
- 2026-07-17: Replaced the minimal product page and fake cart controls with a complete product-detail gallery, persistent cart, protected checkout, order placement, and ownership-scoped success page.
- 2026-07-17: Verified 44 backend tests on Java 21 with PostgreSQL/Flyway V1-V6/Hibernate/JAR packaging, 48 frontend tests with lint/build, live anonymous-to-authenticated checkout, idempotent replay, cross-customer denial, inventory deduction, and responsive layouts at mobile, tablet, and desktop widths.

- 2026-07-17: Removed the Starts at and Ends at controls from normal banner administration. New and edited banners are saved without scheduling dates; legacy response fields remain compatible.

- 2026-07-16: Added Flyway V5 media metadata, an ADMIN-only multipart image endpoint, validated JPEG/PNG processing, purpose-specific limits/resizing, UUID storage keys, external local storage, read-only `/media/**` delivery, and media audit events.
- 2026-07-16: Replaced product, brand, banner, and news manual image-URL entry with a reusable progress-aware upload control while preserving compatible stored/external URLs.
- 2026-07-16: Verified 38 backend tests on Temurin Java 21 and 35 frontend tests, lint, production build, storage persistence across clean builds/restart, authorization/rejection paths, replacement immutability, public rendering, and 390×844 no-overflow layouts.

- 2026-07-16: Populated the current local PostgreSQL volume with non-production administration, customer, membership, address, category, brand, product, inventory, and news test records. Media fields remain empty and the dataset is intentionally not part of Flyway or production startup.
- 2026-07-16: Added Flyway V4 catalog administration fields, banner/news content, and a minimal admin audit log.
- 2026-07-16: Added ADMIN-only dashboard, category, brand, product, inventory, user, banner, and news APIs plus public banner/news reads.
- 2026-07-16: Added a responsive dark-sidebar administration shell and all Phase 5 admin routes inside the existing React authentication system.
- 2026-07-16: Replaced static storefront hero/news sources with active/scheduled API content and added public news detail routing.
- 2026-07-16: Verified 31 backend tests on Temurin Java 21 and 28 frontend tests, lint, and production build; live-verified admin access, catalog creation, draft/publish/archive visibility, same-image editing, inventory and membership flags, and 390×844 no-overflow navigation before removing temporary data.

- 2026-07-16: Added the V3 identity/account schema with seeded membership reference rows, normalized unique users, account status/role controls, discount rules, and ownership-bound delivery addresses.
- 2026-07-16: Added Spring Security session authentication, cookie/header CSRF, registration, login/logout, account self-service, lockout protection, and minimal admin user APIs.
- 2026-07-16: Added responsive login, registration, account, profile, addresses, and security routes with three-state auth hydration and safe protected-route returns.
- 2026-07-16: Clean verification passed with 27 backend and 25 frontend tests; live registration, login, address, logout, protected redirects, and 390×844 overflow checks also passed.

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
- Inventory is validated and deducted only during order placement; there is no cart-time reservation, reservation expiry, backorder, or cancellation-driven stock restoration yet.
- Checkout currently supports one `STANDARD_DELIVERY` option with a configurable flat MNT 5,000 default and only `CASH_ON_DELIVERY`. Orders start `UNPAID`; no real payment provider, payment callback, refund, or settlement flow exists.
- The cart is browser-local and anonymous-capable. It does not synchronize across devices or customer sessions, and server repricing can change or remove lines when stock/catalog state changes.
- Customer order access is limited to the success/detail endpoint. Administration order lists, fulfillment/status transitions, cancellation policy, audit history, notifications, and customer order history are not implemented.
- Variants, reviews, password reset, and verification delivery are not implemented.
- Password changes keep the current session valid and cannot invalidate other sessions until shared/session-registry infrastructure is deliberately added.
- WEBP is deliberately rejected until the Java runtime has a verified decoder/encoder; supported uploads are JPEG and PNG only.
- EXIF orientation is not normalized, so phone photos must already have display-correct pixel orientation.
- Existing external image URLs remain readable, but new administration uploads return same-origin `/media/...` URLs. There is no delete/reference-count endpoint yet, so replaced or removed files require a future safe orphan-maintenance job.
- Local storage and PostgreSQL must be backed up together. Production backup automation and an S3-compatible provider are designed but not implemented.
- Checkout and order amounts explicitly use MNT, but the older catalog tables still do not store a per-product currency. Public slug changes do not yet have a redirect or alias policy.

## Next recommended step

Implement Phase 7 as administration order management and fulfillment: secure order list/detail views, explicit validated status transitions, cancellation and stock-restoration policy, operational audit events, and customer order history. Keep the existing cash-on-delivery flow while that lifecycle is proven; design provider callbacks, reconciliation, and refunds before connecting a real payment service. Production media provisioning and paired database/upload backup rehearsal remain required before deployment.
