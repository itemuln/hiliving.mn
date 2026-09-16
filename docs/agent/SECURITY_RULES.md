# Security rules

Apply these rules to endpoints, authentication, account data, administration, checkout, payment, content, media, email, and deployment changes.

## Authentication and sessions

- Keep authentication server-side. Do not introduce browser-stored bearer tokens without a new reviewed architecture decision.
- Preserve HttpOnly session cookies, Secure-by-default behavior, SameSite policy, session fixation protection, and session-version invalidation.
- Keep CSRF enabled for cookie-authenticated mutations. Use the shared frontend HTTP client rather than recreating token handling.
- Do not reveal whether an unknown login, verification, or recovery identity exists.

## Authorization

- Treat frontend guards as navigation only.
- Define coarse access in `SecurityConfiguration` and keep `.anyRequest().denyAll()`.
- Enforce resource ownership and legal state in services or ownership-constrained repository queries.
- For a new protected resource, test anonymous, wrong-role, wrong-owner, invalid-state, and allowed cases.
- Return `401` for missing authentication and `403` for insufficient authority. Use a non-revealing `404` where exposing another customer's resource existence would be unsafe.

## Commerce and integrations

- Recalculate money, discounts, delivery, and stock on the backend using `BigDecimal`.
- Lock inventory consistently and keep order placement idempotent.
- Never accept browser or callback claims as proof of payment. Verify QPay invoice, provider payment ID, exact amount, and currency server-side.
- Preserve explicit reconciliation for late or mismatched payments and exactly-once stock restoration.
- Write transactional email intent to the outbox; do not add direct SMTP calls to business transactions.

## Input, content, media, and secrets

- Validate length, format, bounds, and allowed states at the API boundary; add database constraints for durable invariants.
- Sanitize administrator-authored HTML on write and at public legacy-read boundaries.
- Decode and re-encode uploads. Do not trust filename, extension, or declared content type.
- Keep generated storage keys inside the configured media root and retain path/symlink defenses.
- Never print or commit `.env` values, session cookies, customer records, private provider payloads, keys, or production database data.
- `VITE_` variables are public browser configuration, never secrets.

If a change weakens one of these controls, stop and record the threat, alternative, and reason in `docs/DECISIONS.md` before implementation.
