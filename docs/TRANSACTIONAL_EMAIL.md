# Transactional email, verification, and password recovery

## Architecture

Phase 7B adds a provider-independent `TransactionalEmailService`, one SMTP implementation, HTML/plain-text templates, and a PostgreSQL outbox. Registration, password recovery, checkout, and order-status transactions only persist outbox events. A scheduled worker claims a bounded batch with `FOR UPDATE SKIP LOCKED`, commits a processing lease, sends outside the business transaction, then records success or a sanitized failure in a separate transaction. A unique deterministic `event_id` prevents duplicate business events. SMTP is at-least-once: a process failure after SMTP acceptance but before `SENT` is recorded can cause a duplicate because SMTP has no provider idempotency key.

Phase 7C stores purpose-specific verification and reset records. Token values are 32 random bytes encoded as URL-safe Base64 without padding. Only SHA-256 hashes are stored in token tables. The short-lived raw value needed by the durable email event is AES-256-GCM protected in the outbox; it is never stored or logged in plaintext. Links are built only from `APP_PUBLIC_URL`. Verification defaults to 24 hours and reset to 30 minutes.

Password registrations remain able to log in and check out while unverified for backward compatibility. The authenticated account response exposes `emailVerified` and `emailVerifiedAt`. Password reset requires an active, verified email. V9 maps the old `email_verified=true` state to `email_verified_at`; legacy false/unverified accounts must verify before recovery.

Password reset increments `users.session_version` in the same transaction as the password update. Authenticated sessions contain their original version and are rejected/inactivated on the next request if it differs. This invalidates all prior sessions for the reset user without affecting another user and retains Spring Security session authentication.

## Migrations

- V8 creates `email_outbox`, unique event idempotency, retry/poll indexes, JSONB payloads, and bounded states.
- V9 replaces the verification boolean with `email_verified_at`, adds `session_version`, and creates separate hashed verification/reset token tables.
- V10 adds immutable customer email/first-name snapshots to orders so notifications do not change after profile edits.

## Environment

Copy `.env.example` to the ignored `.env`. Required for real delivery: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `MAIL_SUPPORT_ADDRESS`, `APP_PUBLIC_URL`, `EMAIL_DELIVERY_ENABLED`, and `EMAIL_TOKEN_PROTECTION_KEY`. The protection key must be a stable Base64-encoded 32-byte value. Generate one with `openssl rand -base64 32`; store it with other production secrets. Rotating it while token emails remain queued makes those protected payloads unreadable.

SMTP behavior is controlled by `MAIL_SMTP_AUTH`, `MAIL_SMTP_STARTTLS_ENABLED`, `MAIL_CONNECTION_TIMEOUT_MS`, `MAIL_READ_TIMEOUT_MS`, and `MAIL_WRITE_TIMEOUT_MS`. Outbox batch, poll, lease, maximum attempts, and exponential delay are controlled by the `EMAIL_OUTBOX_*` variables. Token expiry and bounded single-instance rate limits use `EMAIL_VERIFICATION_EXPIRY`, `PASSWORD_RESET_EXPIRY`, `EMAIL_RATE_LIMIT_MAX_ENTRIES`, `EMAIL_VERIFICATION_RATE_*`, and `PASSWORD_RESET_*_RATE_*`.

`EMAIL_DELIVERY_ENABLED=false` is the default and is used by automated tests. Events remain pending; no test contacts an external SMTP server. Failed delivery never rolls back registration, checkout, or a completed password reset.

## Endpoints and frontend routes

- `POST /api/v1/auth/email-verification/request` — authenticated account only; generic/idempotent response.
- `POST /api/v1/auth/email-verification/confirm` — public token confirmation; still CSRF-protected.
- `POST /api/v1/auth/password-reset/request` — public generic response for known, unknown, verified, and ineligible accounts; still CSRF-protected.
- `POST /api/v1/auth/password-reset/confirm` — public token/password confirmation; still CSRF-protected.
- `PATCH /api/v1/admin/orders/{orderNumber}/status` — ADMIN-only validated status transition; unchanged status is idempotent.

React routes are `/forgot-password`, `/reset-password`, and `/verify-email`. Token query parameters are copied only into component memory and immediately removed from browser history. No arbitrary redirect or return URL is accepted.

## Retry and operations

The worker starts with one-minute retry delay, doubles it to the configured cap, and permanently marks an event failed after the configured maximum. Invalid stored payloads, protected-token failures, malformed messages, and SMTP authentication rejection fail permanently. A failed row never blocks later rows. `PROCESSING` rows become claimable after the processing lease expires.

Inspect without printing payloads for token-bearing messages:

```sql
SELECT id, event_id, event_type, recipient, status, attempt_count,
       next_attempt_at, created_at, processed_at, last_error
FROM email_outbox
ORDER BY id DESC;
```

After fixing the provider/configuration and confirming the event is safe to replay, requeue one failed event explicitly:

```sql
UPDATE email_outbox
SET status = 'PENDING', attempt_count = 0, next_attempt_at = CURRENT_TIMESTAMP,
    processed_at = NULL, last_error = NULL
WHERE id = :reviewed_id AND status = 'FAILED';
```

Do not bulk-requeue without reviewing recipient, event type, and the original failure. SMTP cannot guarantee exactly-once delivery across a worker crash.

## Local and CI commands

```bash
docker compose up -d --wait postgres
cd backend
set -a; source ../.env; set +a
./mvnw --batch-mode --no-transfer-progress verify

cd ../frontend
npm ci
npm run lint
npm run test
npm run build
```

CI and `mvn verify` do not run the manual SMTP test. The class name ends in `IT`, outside the normal Surefire patterns.

## Explicit manual delivery test

Configure real SMTP credentials, a stable protection key, a verified sender, and all three opt-ins:

```text
EMAIL_DELIVERY_ENABLED=true
EMAIL_MANUAL_TEST_ENABLED=true
EMAIL_TEST_RECIPIENT=temuulenikhmandal22@gmail.com
```

Then run only:

```bash
cd backend
set -a; source ../.env; set +a
./mvnw --batch-mode --no-transfer-progress -Dtest=ManualEmailDeliveryIT test
```

It sends `[HiLiving Test] Transactional email configuration` only to `EMAIL_TEST_RECIPIENT`; there is no test-send HTTP endpoint and nothing is sent on normal startup. Delivery is confirmed only when this command completes through the configured SMTP server and the mailbox is checked.

For the real forgot-password flow, create or use a development account whose own email is `temuulenikhmandal22@gmail.com`, verify that account, visit `/forgot-password`, complete the received `/reset-password?token=...` link, confirm the old password fails, the new password works, and prior sessions receive 401. Do not change another account's email for this test.

## Security and recovery notes

No password or raw token belongs in logs, audit details, outbox errors, documentation, or support tickets. Do not inspect token-bearing payloads casually. Rate limiting is bounded in memory and appropriate for the current single instance; replace the service with a shared Redis/database implementation before horizontal scaling. Source IP currently uses the servlet remote address; configure trusted proxy handling at the deployment edge rather than trusting arbitrary forwarding headers.
