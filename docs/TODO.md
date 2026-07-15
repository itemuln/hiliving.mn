# TODO

## Active

- No active implementation task. Phase 1 is complete.

## Planned

- [ ] **P1 - Phase 2:** create and review the initial relational model and ERD, including keys, constraints, indexes, audit fields, and migration sequencing; do not start Java entities or APIs until the schema is approved.
- [ ] **P1:** define API versioning, error representation, and frontend/backend integration conventions.
- [ ] **P2:** add backend build and integration-test coverage on an exact Java 21 runtime to CI while preserving the independent frontend pipeline.
- [ ] **P3:** design production deployment assets for NGINX, systemd, HTTPS, restricted environment files, and off-server backups in a later phase.

## Completed

- [x] Audit repository contents, Git state, frontend scripts, CI paths, and configuration.
- [x] Create the project-memory documentation set.
- [x] Move the existing frontend into `frontend/` and update Jenkins, Sonar, and documentation paths.
- [x] Preserve and minimally correct the pre-existing untracked frontend service file so the build succeeds.
- [x] Initialize the Java 21, Maven, and Spring Boot 4.1.0 backend foundation.
- [x] Add PostgreSQL, Flyway, JPA validation, Actuator, Bean Validation, and Testcontainers support.
- [x] Add root Docker Compose, ignored local environment configuration, and placeholder-only `.env.example`.
- [x] Validate frontend install/lint/build and backend tests/package/startup.
- [x] Validate Compose health, PostgreSQL connectivity, Flyway migration history, Hibernate startup, and Actuator health.
