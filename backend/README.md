# HiLiving Backend

Java 21 and Spring Boot backend for the HiLiving platform.

## Local startup

Start PostgreSQL from the repository root, load the ignored local environment, and run the backend:

```bash
docker compose up -d --wait postgres
cd backend
set -a
source ../.env
set +a
./mvnw spring-boot:run
```

The committed defaults are PostgreSQL 5432 and Spring Boot 8080. This workstation currently overrides PostgreSQL to 5433 in `.env`; use `SERVER_PORT=18080` when Jenkins occupies 8080.

## Verification

```bash
./mvnw --batch-mode --no-transfer-progress verify
```

GitHub Actions runs the complete backend suite on Temurin Java 21. To run the same Maven and Testcontainers verification locally on Docker Desktop without installing a second JDK, execute this from the repository root:

```bash
docker run --rm \
  --volume /var/run/docker.sock:/var/run/docker.sock \
  --volume "$PWD:/workspace" \
  --workdir /workspace/backend \
  --env TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal \
  eclipse-temurin:21-jdk \
  ./mvnw --batch-mode --no-transfer-progress clean verify
```

## Public commerce API

- `GET /api/v1/categories`
- `GET /api/v1/brands`
- `GET /api/v1/products`
- `GET /api/v1/products/{slug}`
- `POST /api/v1/cart/quote`

Product listing is zero-based and supports `page`, `size`, `category`, `brand`, `search`, `featured`, and the controlled sort values `newest`, `price_asc`, `price_desc`, and `name_asc`.

Product detail includes ordered images, authoritative current pricing, membership savings when a customer session is present and the product is eligible, available quantity, and related products. Cart quotation accepts only product slugs and quantities and returns server-calculated MNT prices, discounts, delivery, and totals. The quote POST is public but still requires the normal CSRF cookie/header pair.

## Customer checkout API

- Existing delivery-address CRUD: `/api/v1/account/addresses`
- `POST /api/v1/orders` with an `Idempotency-Key` UUID
- `GET /api/v1/orders/{orderNumber}`

Order endpoints require an authenticated `CUSTOMER`; POST also requires CSRF. Placement reloads prices and membership, enforces address ownership and stock, stores immutable item/address snapshots, and deducts inventory transactionally. Exact idempotent retries return the original order. New orders use `STANDARD_DELIVERY`, `CASH_ON_DELIVERY`, `PENDING_CONFIRMATION`, and `UNPAID`; there is no real payment-provider implementation.

`HILIVING_STANDARD_SHIPPING_FEE` configures the flat MNT standard-delivery amount and defaults to `5000.00`. Keep the production value in the restricted environment configuration; the committed `.env.example` contains only the non-secret default.

Sample catalog data is created only when the `local` profile is active and the catalog is empty.

## Transactional email and account recovery

Registration queues email verification while preserving the existing login and checkout behavior for unverified customers. Password recovery is available only to active accounts with a verified email. Public recovery endpoints remain CSRF-protected, return generic request responses, and use the configured `APP_PUBLIC_URL` rather than request host headers. Email delivery is asynchronous through the PostgreSQL outbox and disabled by default.

See [`../docs/TRANSACTIONAL_EMAIL.md`](../docs/TRANSACTIONAL_EMAIL.md) for SMTP configuration, retry operations, token/session security, endpoint details, and the manual test command.

## Security controls

Sessions are server-side with an HttpOnly, `SameSite=Lax` cookie. `SESSION_COOKIE_SECURE` defaults to true; set it to `false` only for plain-HTTP local development. The security filter chain emits a locked-down `Content-Security-Policy` (`default-src 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, and HSTS (effective over HTTPS), in addition to the framework `nosniff` and `X-Frame-Options: DENY` defaults.

Login and registration apply pre-credential abuse throttles before any password work: login is limited per source IP and per submitted identifier, registration per source IP. Exceeding a limit returns `429 RATE_LIMITED` with `Retry-After`. Limits are configurable and default to login `15`/IP and `10`/identifier per 5 minutes and registration `20`/IP per hour:

| Property | Env override | Default |
| --- | --- | --- |
| `hiliving.security.rate-limit.login-ip-limit` | `LOGIN_IP_RATE_LIMIT` | `15` |
| `hiliving.security.rate-limit.login-identifier-limit` | `LOGIN_IDENTIFIER_RATE_LIMIT` | `10` |
| `hiliving.security.rate-limit.login-window` | `LOGIN_RATE_WINDOW` | `5m` |
| `hiliving.security.rate-limit.register-ip-limit` | `REGISTER_IP_RATE_LIMIT` | `20` |
| `hiliving.security.rate-limit.register-window` | `REGISTER_RATE_WINDOW` | `1h` |

These throttles share the same in-memory, per-instance store as the email/recovery limits and must move to a shared backend (for example Redis) before multi-node deployment. Password recovery, self-service password change, and login-email change all revoke every existing session through the per-user session version.
