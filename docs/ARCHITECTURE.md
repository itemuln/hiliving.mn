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
- `src/components/catalog`: reusable loading, empty, error, retry, navigation, filter, grid, and pagination UI
- `src/pages`: category, brand, news, and slug-based product-detail routes

Only the API client calls `fetch`. Presentational components receive frontend catalog models using names such as `listPrice`, `currentPrice`, `imageUrl`, and presentation icon metadata; they do not consume backend DTOs directly. No global state or server-state library is installed. Read-only resources use local React state, `AbortController`, stable request callbacks, and explicit retry.

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

Catalog query state uses the URL. The browser exposes one-based `page` values while the adapter converts requests to the backend's zero-based page convention. Search and controlled sort selections also remain shareable in the URL. Product cards navigate by slug.

Every API-backed section starts with a dimensionally similar skeleton, then renders data, an explicit empty state, or a safe generic error with retry. Product 404 has a dedicated not-found page. Backend messages, codes, SQL details, exception names, and stack traces are never rendered. Browser navigation uses React Router deep links; target NGINX configuration must later use an SPA fallback such as `try_files ... /index.html` while routing `/api` separately.

## Backend architecture

The backend uses Java 21, Maven, and Spring Boot 4.1.0. `com.hiliving` is the component-scan root. Shared HTTP envelopes and error handling live under `com.hiliving.api`; catalog code is organized by feature under category, brand, product, and local seed packages. Controllers expose DTOs rather than JPA entities. Services own visibility and mapping; repositories own persistence queries and specifications. Actuator supplies `/actuator/health`.

Phase 3 found no backend contract mismatch and made no backend API or CORS change.

## Catalog data model

Flyway migration `V2__create_catalog_schema.sql` creates Category, Brand, Product, and ProductImage tables. Category deletion is restricted while referenced, brand deletion nulls the optional product relationship, and product deletion cascades to image metadata. Slugs are unique validated public identifiers. Product status is `DRAFT`, `ACTIVE`, or `ARCHIVED`; public reads require active products/categories and an active or absent brand. Prices use `NUMERIC(12,2)`, and image content remains URL-based.

## Local development environment

Docker Compose manages PostgreSQL 17 only, persists data in a named volume, publishes it on loopback, and checks readiness. Backend, frontend, and database remain independently runnable. The standard ports are PostgreSQL 5432, Spring Boot 8080, and Vite 5173. This workstation overrides PostgreSQL to 5433 and uses backend 18080 because existing services occupy the defaults.

The `local` Spring profile adds a small sample catalog only when catalog tables are empty. Migrations contain schema rather than sample rows.

## PostgreSQL and Flyway strategy

Flyway is the only schema-management mechanism. Versioned SQL lives in `backend/src/main/resources/db/migration`; applied migrations are immutable. Hibernate uses `ddl-auto=validate`. PostgreSQL 17 is pinned for local and integration tests, and the production version must be compatibility-tested before deployment.

## API boundaries

Public reads remain under `/api/v1/categories`, `/api/v1/brands`, `/api/v1/products`, and `/api/v1/products/{slug}`. Successful responses use `data`; pages include items and page metadata. Product filters are category, brand, search, and featured. Sorts are limited to newest, price ascending/descending, and name ascending. Failures use a safe `error` envelope.

## Validation strategy

Frontend validation uses `npm ci`, ESLint, Vitest/Testing Library HTTP-boundary tests, TypeScript compilation, and a Vite production build. Tests cover product loading, skeletons, empty pages, safe unavailable state and retry, filter serialization, adapter mapping/errors, malformed success responses, and detail 404.

Live validation runs Vite against the real Spring Boot/PostgreSQL stack and checks category/brand filters, search, sorting, pagination, detail deep links, 400/404 behavior, backend unavailability, and responsive layout. Temporary pagination rows are removed immediately after verification.

Backend validation uses Maven on Temurin Java 21 with PostgreSQL Testcontainers, Flyway through V2, Hibernate validation, repository/service/controller coverage, and JAR packaging. GitHub Actions runs independent frontend and backend jobs; Jenkins remains a frontend delivery pipeline and now runs frontend tests before building.

## Target Contabo deployment architecture

The production target is one Ubuntu LTS VPS with NGINX on ports 80 and 443, static frontend assets and SPA fallback from NGINX, same-origin `/api` reverse proxying to Spring Boot on localhost 8080, and locally bound PostgreSQL. Spring Boot will run under systemd. Restricted environment files or secret management supply secrets, and database backups are copied off-server.

## NGINX, systemd, and HTTPS plan

NGINX will terminate Let's Encrypt HTTPS, serve the frontend, preserve React Router deep links, and proxy `/api` to Spring Boot. systemd will manage backend lifecycle and restricted environment loading. Production assets remain deferred.
