# Architecture

## Repository architecture

The target repository is a modular monorepo with independently buildable and deployable applications:

- `frontend/`: React, TypeScript, and Vite storefront
- `backend/`: Java 21, Maven, and Spring Boot API
- `docs/`: project memory and operating guidance
- `infrastructure/`: future deployment assets and infrastructure guidance
- `compose.yaml`: local development services only

Java source must remain inside `backend/`; frontend source must remain inside `frontend/`.

## Frontend architecture

The existing frontend is a client-rendered React application built by Vite. It uses React Router, Tailwind CSS, local static catalog data, and public image assets. This migration changes its repository path, not its runtime behavior.

## Backend architecture

The backend is a Java 21 Maven application using Spring Boot 4.1.0. `com.hiliving` is the root package so future feature packages remain inside component scanning. Spring Web MVC, Data JPA, Bean Validation, Actuator, PostgreSQL, Flyway, and Testcontainers support are installed. No business domain packages or endpoints exist. Actuator supplies foundation health verification at `/actuator/health`.

## Local development environment

The frontend, backend, and PostgreSQL are independently runnable. Docker Compose manages PostgreSQL 17 only, persists data in a named volume, publishes the database on loopback only, and checks readiness with `pg_isready`. The backend runs on the host at `localhost:8080`, and the Vite development server runs separately. Local secrets belong in a gitignored root `.env` file; committed environment examples contain placeholders only.

The standard local PostgreSQL port is 5432. On the current workstation it is overridden to 5433 in the ignored `.env` because another service owns 5432. Jenkins owns local port 8080, so concurrent backend verification can use a temporary `SERVER_PORT` override. These local overrides do not change production ports.

## PostgreSQL and Flyway strategy

Flyway is the only schema management mechanism. Versioned SQL migrations live in `backend/src/main/resources/db/migration`. Hibernate uses `ddl-auto=validate` and must never create or update schema objects. `V1__initialize_schema.sql` establishes migration history without creating business tables. PostgreSQL 17 is pinned for local reproducibility; a production major version will be selected and tested before deployment.

## API boundaries

The browser will eventually call versioned backend HTTP endpoints. No business API boundary is implemented in Phase 1. Actuator endpoints are operational endpoints, not business APIs, and only `health` and `info` are exposed.

## Validation strategy

Frontend validation consists of clean dependency installation, ESLint, TypeScript compilation, and a Vite production build. Backend validation consists of Maven tests and packaging. The Spring integration test starts an isolated PostgreSQL 17 container, loads the application context, runs Flyway, initializes JPA with schema validation, and asserts that migration version 1 succeeded. Local integration validation additionally starts Compose PostgreSQL and checks the live Actuator health endpoint. The application compiles to Java 21 bytecode; this workstation currently runs the checks on Java 26 because no Java 21 runtime is installed.

## Target Contabo deployment architecture

The production target is one Ubuntu LTS VPS with NGINX on ports 80 and 443, static frontend assets served by NGINX, Spring Boot bound to localhost port 8080, and PostgreSQL bound locally. Spring Boot will run under systemd. Secrets will be provided through restricted environment files or a secret-management mechanism, and PostgreSQL backups will be copied off-server.

## NGINX, systemd, and HTTPS plan

NGINX will terminate HTTPS using Let's Encrypt, serve the frontend, and reverse-proxy API traffic to Spring Boot. systemd will manage backend lifecycle and environment loading. These production assets are intentionally deferred until a later phase.
