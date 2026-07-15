# HiLiving

HiLiving is a modular monorepo containing an independently buildable React/Vite frontend and Spring Boot backend.

## Repository layout

- `frontend/` - React, TypeScript, and Vite storefront
- `backend/` - Java 21 and Spring Boot API foundation
- `docs/` - project state, architecture, decisions, backlog, and CI guidance
- `infrastructure/` - future production infrastructure assets
- `compose.yaml` - local PostgreSQL service

## Prerequisites

- Node.js and npm
- Java 21 or newer runtime capable of compiling with Java 21 release compatibility
- Docker with Docker Compose

## Local environment

Local secrets must live only in the gitignored root `.env` file. Start from `.env.example`, replace all placeholders, and never reuse local credentials in staging or production.

## Frontend

```bash
cd frontend
npm ci
npm run lint
npm run build
npm run dev
```

## PostgreSQL

From the repository root:

```bash
docker compose up -d postgres
docker compose ps
```

PostgreSQL is exposed only on the local loopback interface.

If another local PostgreSQL instance already uses port 5432, set matching `POSTGRES_PORT` and `DB_URL` overrides in the gitignored `.env`.

## Backend

Load the root local environment, then run Maven from `backend/`:

```bash
set -a
source ../.env
set +a
./mvnw test
./mvnw spring-boot:run
```

Verify the backend at <http://localhost:8080/actuator/health>. No business endpoints exist in Phase 1.

If another local service such as Jenkins already uses port 8080, override the backend for that run with `SERVER_PORT`, for example `SERVER_PORT=18080 ./mvnw spring-boot:run`.

## Production target

The future Contabo Ubuntu LTS deployment will use NGINX for static assets and HTTPS, Spring Boot on localhost port 8080 under systemd, locally bound PostgreSQL, environment-based secrets, and off-server backups. Production deployment is intentionally outside Phase 1.
