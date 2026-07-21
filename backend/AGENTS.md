# Repository Guidelines

## Project Structure & Module Organization

This directory is the independently buildable Spring Boot backend; keep Java code out of the sibling `frontend/` project. Production code lives under `src/main/java/com/hiliving`, grouped by domain (`catalog`, `commerce`, `identity`, `content`, `media`, and `email`) and then, where useful, by `api`, `application`, and `persistence`. Runtime configuration is in `src/main/resources/application*.yml`. Flyway migrations are append-only files in `src/main/resources/db/migration` named like `V11__add_order_index.sql`. Tests mirror production packages under `src/test/java/com/hiliving`.

## Build, Test, and Development Commands

- `./mvnw spring-boot:run` starts the API (normally port 8080).
- `./mvnw --batch-mode --no-transfer-progress verify` compiles and runs the full automated suite.
- `./mvnw -Dtest=CatalogApiIntegrationTests test` runs one test class while iterating.
- From the repository root, `docker compose up -d --wait postgres` starts PostgreSQL. Load the ignored root `.env` before running locally; use `SERVER_PORT=18080` when 8080 is occupied.

Java 21 and a running Docker engine are required for Testcontainers-based tests.

## Coding Style & Naming Conventions

Use four-space indentation, one public top-level type per file, and existing Spring constructor-injection patterns. Classes and records use `PascalCase`; methods, variables, and fields use `camelCase`; constants use `UPPER_SNAKE_CASE`. Keep controllers thin, business rules in services, and database access in repositories. Preserve the `/api/v1` prefix and the shared response/error envelopes. No formatter is enforced, so match nearby code and organize imports consistently.

## Testing Guidelines

Tests use JUnit 5, Spring Boot Test, MockMvc, and Testcontainers PostgreSQL. Name normal suites `*Tests`; use descriptive lower-camel-case test methods such as `productsSupportPaginationFiltersAndControlledSorting`. Add repository/service tests for persistence rules and MockMvc integration tests for status codes, security, validation, and JSON contracts. Docker must be available before running `verify`.

## Commit & Pull Request Guidelines

History uses short sentence-style summaries without Conventional Commit prefixes. Prefer a focused imperative subject, for example `Validate order status transitions`, and avoid bundling unrelated frontend and backend work. Pull requests should explain behavior and migration/configuration impact, link the relevant issue, list verification commands, and include sample requests or responses for API contract changes.

## Security & Agent Notes

Never commit credentials or tokens. Keep developer secrets in the gitignored root `.env`; `.env.example` must contain placeholders or safe defaults only. Before and after project changes, keep `docs/PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/TODO.md` aligned with the implementation.
