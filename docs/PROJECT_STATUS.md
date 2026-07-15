# Project Status

## Current project state

HiLiving is a modular monorepo. The existing React/Vite application is in `frontend/`, the Java 21 Spring Boot foundation is in `backend/`, local PostgreSQL is defined in root `compose.yaml`, and project/infrastructure documentation is separated from application source.

## Features currently working

- React/Vite storefront pages and static catalog data
- Frontend dependency installation, ESLint, and production build from `frontend/`
- Jenkins frontend pipeline with updated monorepo paths, SonarQube quality gate, and JFrog packaging
- Spring Boot 4.1.0 application startup with Java 21 compilation target
- Local PostgreSQL 17 through Docker Compose with a persistent volume and health check
- PostgreSQL connectivity, Flyway migration execution, Hibernate schema validation, and Actuator health
- Testcontainers-backed Spring context and Flyway integration test

## Current active task

No implementation task is active. Phase 1 is complete and ready for review.

## Latest meaningful changes

- 2026-07-15: Migrated all frontend-owned files into `frontend/` and updated Jenkins and Sonar paths.
- 2026-07-15: Added the Java 21/Spring Boot 4.1.0 Maven backend foundation, Maven wrapper, Actuator, JPA, Flyway, PostgreSQL, validation, and Testcontainers support.
- 2026-07-15: Added root Compose PostgreSQL, secret-safe environment handling, root documentation, and the infrastructure boundary.
- 2026-07-15: Verified frontend install/lint/build, backend tests/package/startup, Compose health, PostgreSQL connectivity, Flyway version 1, Hibernate validation, and Actuator health.
- 2026-07-15: Preserved and minimally corrected the pre-existing untracked frontend product service so the frontend compiles; it is not connected to the backend.

## Known issues

- This workstation already has services on ports 5432 and 8080. The gitignored local `.env` uses PostgreSQL port 5433; backend startup was verified on port 18080. Committed defaults and the production target remain 5432 and 8080.
- This workstation has Java 26 but not Java 21. Maven produced Java 21-compatible bytecode and all backend checks passed on Java 26; the exact Java 21 runtime still needs coverage in CI or a Java 21 development environment.
- The Jenkins pipeline remains frontend-specific. Backend CI stages are not yet configured.
- No business schema, entities, repositories, services, or API endpoints exist by design.

## Next recommended step

Begin Phase 2 with a reviewed PostgreSQL schema design and ERD. Define table boundaries, keys, constraints, indexes, audit columns, and migration sequencing before creating Java entities or business APIs.
