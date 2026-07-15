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
