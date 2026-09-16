# HiLiving

HiLiving is a full-stack e-commerce and content-management application for the Mongolian market. The repository contains a React storefront and administration UI, a Spring Boot API, PostgreSQL migrations, secure media and email workflows, QPay checkout integration, and a guarded VPS deployment pipeline.

## System at a glance

```text
Browser (React/Vite)
  ├─ /                    -> NGINX static SPA
  ├─ /api/v1/**           -> Spring Boot -> PostgreSQL
  └─ /media/**            -> Spring Boot -> managed upload storage

Spring Boot
  ├─ sessions + CSRF      -> users, memberships, addresses
  ├─ catalog + CMS        -> products, categories, brands, pages, news, banners
  ├─ checkout             -> authoritative pricing, inventory locks, order snapshots
  ├─ QPay                 -> invoice creation and server-verified reconciliation
  └─ email outbox         -> durable PostgreSQL events -> SMTP
```

## Repository structure

| Path                                       | Responsibility                                                             |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `frontend/`                                | React 18, TypeScript, Vite, storefront, account, checkout, and admin UI    |
| `backend/`                                 | Java 21, Spring Boot 4, Spring Security, QPay, media, and email            |
| `backend/src/main/resources/db/migration/` | Append-only PostgreSQL schema history, currently V1-V18                    |
| `docs/human/`                              | Developer onboarding and advanced-web explanations                         |
| `docs/agent/`                              | Rules for automated coding tools                                           |
| `docs/*.md`                                | Architecture, decisions, status, CI, operations, and presentation material |
| `infrastructure/production/`               | NGINX, systemd, PostgreSQL, bootstrap, and atomic release scripts          |
| `.github/workflows/ci.yml`                 | Frontend/backend tests and push-to-`main` production deployment            |
| `compose.yaml`                             | Loopback-only PostgreSQL for local development                             |

Start with the [documentation map](docs/README.md) and [developer guide](docs/human/DEVELOPMENT_GUIDE.md). See [Architecture](docs/ARCHITECTURE.md) for the detailed design.

## Prerequisites

- Node.js 24 and npm
- Java 21
- Docker with Docker Compose (required for PostgreSQL and backend integration tests)

## Local setup

```bash
cp .env.example .env
```

Start PostgreSQL from the repository root:

```bash
docker compose up -d --wait postgres
```

Start the backend:

```bash
cd backend
set -a
source ../.env
set +a
./mvnw spring-boot:run
```

Start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. The Vite server proxies `/api` and `/media` to `http://localhost:8080` by default. Check the API at <http://localhost:8080/actuator/health>.

QPay and outbound email are disabled by default.
Enable them only with owner-controlled test or production credentials stored outside Git.

## Tests

Frontend:

```bash
cd frontend
npm run lint
npm test
npm run build
npm run bundle:check
npm run format:check
```

Backend (Docker must be running for Testcontainers):

```bash
cd backend
./mvnw --batch-mode --no-transfer-progress verify
```

Repository hygiene:

```bash
git diff --check
```

## Deployment and CI/CD

Pull requests and pushes to `main` run independent frontend and backend jobs. A successful push to `main` deploy the commit through the GitHub `production` environment:

```text
frontend checks + backend verify
              -> rebuild release artifacts
              -> checksum and pinned-SSH transfer
              -> activate backend
              -> local health gate
              -> activate frontend
              -> public smoke checks
              -> rollback code links on failure
```

In the repository-defined production topology, NGINX terminates HTTPS and serves the Vite build, Spring Boot runs under a restricted systemd account on loopback port 8080, PostgreSQL 17 runs in Docker on loopback port 5432, and uploads plus secrets remain outside release directories. Flyway migrations are forward-only, so a code rollback does not reverse a database migration.

Operational details are in [Production deployment](infrastructure/production/README.md) and [Continuous Integration](docs/CI.md).

## Security and production gates

- Secrets belong only in the `.env`, protected GitHub environment, or restricted VPS environment file.
- Authentication uses server-side sessions; mutating requests use cookie-to-header CSRF protection.
- QPay callbacks are notifications. The backend verifies the provider payment ID, invoice, amount, and MNT currency before confirming an order.
- Uploaded images are decoded, validated, re-encoded, size-limited, and stored with generated keys.
- Transactional email is persisted in an idempotent outbox before asynchronous SMTP delivery.
- Before accepting real payments, complete the remaining owner-controlled backup, credential, business-data, sender-domain, and paid/expiry rehearsal gates listed in [TODO](docs/TODO.md).

## Further documentation

- [Documentation map](docs/README.md)
- [Developer guide](docs/human/DEVELOPMENT_GUIDE.md)
- [Advanced web application notes](docs/human/ADVANCED_WEB_APPLICATION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Presentation guide](docs/PRESENTATION_GUIDE.md)
- [Project status](docs/PROJECT_STATUS.md)
- [Architectural decisions](docs/DECISIONS.md)
- [Transactional email](docs/TRANSACTIONAL_EMAIL.md)
- [CI/CD](docs/CI.md)
- [Backlog and production gates](docs/TODO.md)
- [Agent rules](docs/agent/README.md)
