# Backend rules

These rules apply under `backend/` in addition to the root `AGENTS.md`.

## Structure

- Group code by domain: `catalog`, `commerce`, `identity`, `content`, `media`, `email`, and `admin`.
- Use `api`, `application`, and `persistence` subpackages when a domain is large enough to benefit from them. Do not move a whole domain only for visual symmetry.
- Keep one public top-level Java type per file.
- Controllers translate HTTP; services own use cases and transactions; repositories own queries and locks; entities protect state transitions.
- Keep shared response and error envelopes under `com.hiliving.api` and preserve the `/api/v1` prefix.

## Java and database

- Target Java 21 and use four-space indentation, constructor injection, explicit names, and focused methods.
- Use `BigDecimal` for money and validate monetary invariants in both application code and PostgreSQL.
- Flyway is the only schema writer. Add the next append-only `V#__description.sql`; never edit a migration used by a shared environment.
- Keep list endpoints paginated and sort/filter inputs allowlisted.
- Use transaction boundaries and stable lock ordering for inventory, order, payment, token, and outbox state changes.

## Security

- Keep `SecurityConfiguration` deny-by-default.
- Apply route-level RBAC and service/repository ownership or state checks together.
- Preserve server-side sessions, CSRF, session-version revocation, safe errors, QPay server verification, HTML sanitization, upload re-encoding, and the transactional email outbox.
- Do not log secrets, session identifiers, recovery tokens, private provider payloads, or customer data.

## Tests

Tests mirror production packages under `src/test/java/com/hiliving`. Use JUnit 5, MockMvc, and PostgreSQL Testcontainers. Cover security status codes, validation, ownership, persistence constraints, concurrency, and JSON contracts at the closest useful level.

Run a focused test while iterating. Before handoff, start Docker and run:

```bash
./mvnw --batch-mode --no-transfer-progress verify
```
