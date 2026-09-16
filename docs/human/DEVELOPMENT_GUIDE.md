# Developer guide

This guide is the shortest route from cloning HiLiving to making a safe change. It describes how the repository is actually organized rather than prescribing a generic Spring or React layout.

## Build a mental model first

HiLiving has two applications in one repository:

- `frontend/` is a React and TypeScript single-page application.
- `backend/` is a Java 21 Spring Boot API backed by PostgreSQL.

They build independently and communicate through `/api/v1`. The browser also requests managed images through `/media`. Vite proxies both paths in development; NGINX proxies them in production. This same-origin design is important because authentication uses a server-side session cookie.

The backend owns business truth. The frontend can display a price or a role, but the backend must reload and verify both before making a protected change.

## First local run

From the repository root:

```bash
cp .env.example .env
docker compose up -d --wait postgres
```

Use local-only values in `.env`. Do not reuse production credentials.

Start the API:

```bash
cd backend
set -a
source ../.env
set +a
./mvnw spring-boot:run
```

Start the browser application in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. The backend health endpoint is `http://localhost:8080/actuator/health`.

## Follow one request through the system

A useful example is viewing an order:

1. `App.tsx` selects the route-level React page.
2. The page calls a domain adapter under `frontend/src/api`.
3. `api/http.ts` adds credentials, initializes CSRF when needed, and normalizes the response envelope.
4. Spring Security authenticates the session and checks the coarse route policy.
5. `OrderController` passes the authenticated principal to `OrderService`.
6. The repository query includes both the order number and customer ID. This is the object-ownership check.
7. The response is mapped to a frontend model and rendered.

The frontend route guard improves navigation, but steps 4–6 are the security boundary.

## Where a change belongs

### Frontend

| Change                         | Start here                                                |
| ------------------------------ | --------------------------------------------------------- |
| Add or change an endpoint call | `frontend/src/api/*Api.ts`                                |
| Change login/session behavior  | `frontend/src/features/auth`                              |
| Change cart coordination       | `frontend/src/features/cart`                              |
| Change a route                 | `frontend/src/App.tsx` and `frontend/src/pages`           |
| Change one admin workflow      | matching folder in `frontend/src/features/admin`          |
| Add reusable UI                | the closest domain folder under `frontend/src/components` |

Route pages compose features. API modules handle transport. Components should not construct API URLs or interpret backend error payloads themselves.

### Backend

| Change                               | Start here                                              |
| ------------------------------------ | ------------------------------------------------------- |
| HTTP contract or status              | domain controller or request/response record            |
| Business rule or transaction         | domain service                                          |
| Query, lock, or ownership constraint | repository                                              |
| Entity invariant or state transition | entity method                                           |
| Schema change                        | a new file in `backend/src/main/resources/db/migration` |
| Authentication/route policy          | `identity/auth/security`                                |

Controllers translate HTTP into a service call. Services own use cases and transaction boundaries. Repositories own data access. Entities protect state transitions that must remain true regardless of entry point.

## Naming and code shape

- Name files after one responsibility: `PublicNewsController`, not `NewsControllers`.
- Prefer domain language such as `confirmPaid`, `restoreInventory`, and `findOwned` over generic names such as `process` or `handleData`.
- Use one public Java type per file.
- Keep React components small enough that data loading, orchestration, and presentation can be identified separately.
- Keep types close to the domain that owns them. Move a type to a shared module only when two domains genuinely share the same contract.
- Avoid comments that repeat the code. Comment the security reason, business invariant, or surprising trade-off.
- Keep API errors safe for users and useful for clients; internal exceptions and provider payloads belong in server logs, not responses.
- Use `BigDecimal` and database `NUMERIC` for money. Never calculate authoritative totals in JavaScript.

## Common change recipes

### Add a public read endpoint

1. Add or extend the backend response type, service, and repository query.
2. Keep pagination bounded and sorting enumerated.
3. Add the exact GET route to the public allowlist only if anonymous access is intended.
4. Add a frontend DTO and explicit mapping in the relevant API adapter.
5. Test success, empty, validation, and not-found behavior.

### Add a protected mutation

1. Decide who may perform it and on which resource.
2. Add the coarse role rule and the service/repository ownership or state check.
3. Keep CSRF enabled; use the shared frontend HTTP client.
4. Put related database writes in one transaction.
5. Add tests for anonymous `401`, wrong-role `403`, invalid state, ownership, and success.
6. Audit sensitive administration or payment state changes.

### Change the database

1. Add the next Flyway migration; never edit an applied migration.
2. Prefer constraints that protect the invariant for every writer.
3. Update the entity mapping and tests.
4. Consider forward compatibility because a code rollback does not reverse the migration.

## Verification before review

Frontend:

```bash
cd frontend
npm run lint
npm test
npm run build
npm run bundle:check
npm run format:check
```

Backend, with Docker running:

```bash
cd backend
./mvnw --batch-mode --no-transfer-progress verify
```

Finally run `git diff --check` from the repository root and review the diff as a reader, not only as its author.

## Definition of done

A change is ready when:

- behavior is implemented at the correct trust boundary;
- names and package ownership make the change discoverable;
- success and important failure paths are tested;
- schema, configuration, security, and deployment effects are stated;
- no secret or customer data is present;
- relevant human documentation is current; and
- `PROJECT_STATUS.md`, `DECISIONS.md`, and `TODO.md` agree with the implementation.
