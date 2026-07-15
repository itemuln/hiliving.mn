# HiLiving

HiLiving is a modular monorepo containing an independently buildable React/Vite frontend and Spring Boot backend.

## Repository layout

- `frontend/` - React, TypeScript, and Vite storefront
- `backend/` - Java 21 and Spring Boot catalog API
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
npm test
npm run build
npm run dev
```

The storefront calls same-origin `/api/v1` paths. Vite proxies `/api` to `http://localhost:8080` by default. Set `VITE_DEV_API_PROXY_TARGET` in the ignored root `.env` when the backend uses another local port, or see `frontend/README.md` for the explicit base URL option.

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

Verify the backend at <http://localhost:8080/actuator/health>. Public catalog reads are available at `/api/v1/categories`, `/api/v1/brands`, `/api/v1/products`, and `/api/v1/products/{slug}`.

If another local service such as Jenkins already uses port 8080, override the backend for that run with `SERVER_PORT`, for example `SERVER_PORT=18080 ./mvnw spring-boot:run`.

## Production target

The future Contabo Ubuntu LTS deployment will use NGINX for static assets and HTTPS, Spring Boot on localhost port 8080 under systemd, locally bound PostgreSQL, environment-based secrets, and off-server backups. Production deployment remains intentionally deferred.
