# Architecture

## Repository architecture

HiLiving is a modular monorepo with independently buildable and deployable applications:

- `frontend/`: React, TypeScript, Vite storefront, and frontend tests
- `backend/`: Java 21, Maven, and Spring Boot API
- `docs/`: project memory and operating guidance
- `infrastructure/`: future deployment assets and infrastructure guidance
- `compose.yaml`: local development services only

Java source stays inside `backend/`; frontend source stays inside `frontend/`.

## Frontend architecture

The frontend is a client-rendered React application using React Router, Tailwind CSS, and focused local hooks. Catalog integration is divided into explicit boundaries:

- `src/api`: backend response DTOs, URL/query serialization, HTTP status handling, safe error normalization, and DTO-to-domain mapping
- `src/config`: environment normalization
- `src/features/catalog`: presentation-safe catalog models and cancellation-aware resource/query hooks
- `src/features/auth`: three-state session hydration, auth context, login/registration forms, and protected routing
- `src/features/account`: profile, password, membership, and delivery-address UI
- `src/components/catalog`: reusable loading, empty, error, retry, navigation, filter, grid, and pagination UI
- `src/pages`: category, brand, news, and slug-based product-detail routes

Only API adapter modules call `fetch`. Presentational components receive mapped frontend models rather than backend DTOs. No global state or server-state library is installed. Catalog reads keep focused local hooks; session identity uses a small React context because header, route protection, and account pages share it.

Category, brand, and product mocks have been removed. Static hero banners, promotions, and news remain because they are marketing content outside the catalog API.

## Frontend environment and same-origin API path

The browser calls `/api/v1` by default. `VITE_API_BASE_URL` may provide an explicit base URL, but its safe default is blank. During local development, Vite proxies `/api` to `VITE_DEV_API_PROXY_TARGET`, which defaults to `http://localhost:8080`. Production NGINX is expected to proxy the same `/api` path to Spring Boot.

This same-origin design avoids browser CORS requirements in both the preferred local and target production topology. The backend does not enable wildcard or default cross-origin access. An explicitly cross-origin deployment must add a narrow, environment-configured allowlist as a separate reviewed decision.

Vite loads configuration from the root environment directory. Only `VITE_` variables are exposed to client code; secrets must never use that prefix.

## Routing and UI states

Catalog routes are:

- `/categories` and `/categories/:categorySlug`
- `/brands` and `/brands/:brandSlug`
- `/products/:productSlug`
- `/news`

Identity and account routes are `/login`, `/register`, `/account`, `/account/profile`, `/account/addresses`, and `/account/security`. Account routes hydrate through `GET /api/v1/account/me` and distinguish loading, anonymous, and authenticated state. Anonymous navigation is redirected to `/login?returnTo=<internal-path>`; only same-origin relative paths are accepted.

Catalog query state uses the URL. The browser exposes one-based `page` values while the adapter converts requests to the backend's zero-based page convention. Search and controlled sort selections also remain shareable in the URL. Product cards navigate by slug.

Every API-backed section starts with a dimensionally similar skeleton, then renders data, an explicit empty state, or a safe generic error with retry. Product 404 has a dedicated not-found page. Backend messages, codes, SQL details, exception names, and stack traces are never rendered. Browser navigation uses React Router deep links; target NGINX configuration must later use an SPA fallback such as `try_files ... /index.html` while routing `/api` separately.

## Backend architecture

The backend uses Java 21, Maven, and Spring Boot 4.1.0. `com.hiliving` is the component-scan root. Shared HTTP envelopes and safe error handling live under `com.hiliving.api`; catalog and identity code use feature-first packages. Identity separates auth behavior, user persistence, customer account service, and admin user policy. Controllers expose DTOs rather than JPA entities. Services own normalization, authorization-sensitive behavior, and mapping; repositories own persistence queries. Actuator supplies `/actuator/health`.

Spring Security uses server-side sessions. The session cookie is HttpOnly and `SameSite=Lax`; `SESSION_COOKIE_SECURE` must be true behind production HTTPS. Login explicitly rotates the session identifier. The browser never stores an auth token. A readable `XSRF-TOKEN` cookie is mirrored into `X-XSRF-TOKEN` for state-changing requests; the cookie exists only for CSRF defense and is not an authentication credential.

Public catalog GETs, registration, login, CSRF initialization, and health are permitted. `/api/v1/account/**` requires authentication, `/api/v1/admin/**` requires `ADMIN`, and unmatched routes are denied. No broad CORS policy is enabled because Vite and future NGINX preserve same-origin requests.

## Identity and account data model

Flyway migration `V3__create_identity_and_account_schema.sql` creates `membership_tiers`, `users`, and `user_addresses`. Membership rows are permanent reference data: REGULAR 0%, BRONZE 3%, SILVER 5%, and GOLD 10%. Users may have a nullable validated override; the effective discount is the override when present and otherwise the tier default.

Emails are trimmed and lowercased. Supported Mongolian phone inputs are normalized to `+976` plus eight digits before lookup and uniqueness checks. Passwords use Spring Security's delegating encoder and are never returned. Public registration creates only active `CUSTOMER`/`REGULAR` users and does not automatically log in.

Users are soft-disabled with `ACTIVE`, `DISABLED`, or `LOCKED`; they are not deleted through this phase. Five failed password attempts set a 15-minute `locked_until`, while successful login clears the failed state. Address reads and mutations include both address ID and authenticated user ID. A PostgreSQL partial unique index allows at most one default address per user, and default switching clears and sets within one transaction. Address deletion is physical; deleting a default leaves no default.

## Catalog data model

Flyway migration `V2__create_catalog_schema.sql` creates Category, Brand, Product, and ProductImage tables. Category deletion is restricted while referenced, brand deletion nulls the optional product relationship, and product deletion cascades to image metadata. Slugs are unique validated public identifiers. Product status is `DRAFT`, `ACTIVE`, or `ARCHIVED`; public reads require active products/categories and an active or absent brand. Prices use `NUMERIC(12,2)`, and image content remains URL-based.

## Local development environment

Docker Compose manages PostgreSQL 17 only, persists data in a named volume, publishes it on loopback, and checks readiness. Backend, frontend, and database remain independently runnable. The standard ports are PostgreSQL 5432, Spring Boot 8080, and Vite 5173. This workstation overrides PostgreSQL to 5433 and uses backend 18080 because existing services occupy the defaults.

The `local` Spring profile adds a small sample catalog only when catalog tables are empty. Migrations contain schema rather than sample rows.

## PostgreSQL and Flyway strategy

Flyway is the only schema-management mechanism. Versioned SQL lives in `backend/src/main/resources/db/migration`; applied migrations are immutable. Hibernate uses `ddl-auto=validate`. PostgreSQL 17 is pinned for local and integration tests, and the production version must be compatibility-tested before deployment.

## API boundaries

Public reads remain under `/api/v1/categories`, `/api/v1/brands`, `/api/v1/products`, and `/api/v1/products/{slug}`. Auth endpoints are under `/api/v1/auth`; customer self-service is under `/api/v1/account`; minimal administrative user management is under `/api/v1/admin/users`. Successful responses use `data`; pages include items and page metadata. Failures use the existing safe `error` envelope with stable account/security codes where useful.

## Validation strategy

Frontend validation uses `npm ci`, ESLint, Vitest/Testing Library HTTP-boundary tests, TypeScript compilation, and a Vite production build. The 25 tests cover existing catalog behavior plus auth hydration, operational hydration failure, login/logout, CSRF headers, registration errors, safe returns, profile/password changes, address states, and session expiry.

Live validation runs Vite against the real Spring Boot/PostgreSQL stack. Phase 4A verified registration, session login, membership display, default-address creation, logout, protected redirects, and 390×844 no-overflow layouts. Temporary verification users and dependent addresses are removed immediately afterward.

Backend validation uses Maven on Temurin Java 21 with PostgreSQL Testcontainers, Flyway through V3, Hibernate validation, repository/service/controller/security coverage, and JAR packaging. The 27 tests include the existing catalog suite plus identity constraints, normalization, password hashing, lockout, session fixation, CSRF, account operations, address ownership, and admin authorization.

## Target Contabo deployment architecture

The production target is one Ubuntu LTS VPS with NGINX on ports 80 and 443, static frontend assets and SPA fallback from NGINX, same-origin `/api` reverse proxying to Spring Boot on localhost 8080, and locally bound PostgreSQL. Spring Boot will run under systemd. Restricted environment files or secret management supply secrets, and database backups are copied off-server.

## NGINX, systemd, and HTTPS plan

NGINX will terminate Let's Encrypt HTTPS, serve the frontend, preserve React Router deep links, and proxy `/api` to Spring Boot. systemd will manage backend lifecycle and restricted environment loading. Production assets remain deferred.
