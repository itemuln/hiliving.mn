# Advanced web application notes

This document connects HiLiving's implementation to the topics normally discussed in an advanced web application course. It distinguishes controls that exist today from future improvements.

## Trust boundaries

```text
Untrusted browser
  -> NGINX: TLS, request limits, static caching
  -> Spring Security: session, CSRF, route policy
  -> application services: ownership, state, price, and inventory rules
  -> repositories/PostgreSQL: queries, locks, uniqueness, and constraints
  -> QPay/SMTP: external systems reached only by backend adapters
```

Anything received from the browser is input, including a displayed price, role, order number, image type, and payment result. The backend reloads trusted state before acting.

## Authentication and authorization are different

Authentication answers “who is making this request?” HiLiving uses a server-side Spring Security session. `JSESSIONID` is HttpOnly, the session ID is rotated at login, and `/api/v1/account/me` is the frontend's identity source. Password or login-email changes increment a session version so older sessions stop working.

Authorization answers “may this identity perform this action on this resource?” HiLiving applies it in two layers:

1. Spring Security route rules provide coarse role-based access control.
2. Services and repository queries enforce ownership and state-dependent rules.

The React `ProtectedRoute` is only a user-experience guard. It is not authorization because a caller can bypass React and send an HTTP request directly.

## RBAC and ABAC in this project

### RBAC

The stored roles are `CUSTOMER` and `ADMIN`.

| Request area                         | Anonymous |      CUSTOMER |                              ADMIN |
| ------------------------------------ | --------: | ------------: | ---------------------------------: |
| Published catalog/content reads      |     allow |         allow |                              allow |
| Cart quote                           |     allow |         allow |                              allow |
| Account profile and addresses        |      deny |   own account |              authenticated account |
| Customer orders and QPay status      |      deny | own resources | denied by customer-role route rule |
| Administration APIs and media upload |      deny |          deny |                              allow |

The backend returns `401` when authentication is missing and `403` when an authenticated role is insufficient. Integration tests cover the administration and media boundaries.

### Attribute and context checks

HiLiving does not use a general-purpose ABAC policy engine. It does use ABAC-style checks where a role alone is not enough:

- Order reads query by both `orderNumber` and the authenticated `customerId`.
- Address reads and writes include the authenticated owner's user ID.
- QPay instructions and customer reconciliation first resolve an owned order.
- Order and payment transitions inspect current order status, payment status, deadlines, and inventory-release state.
- Public catalog/content queries require publication and active-state attributes.

This hybrid is intentional: RBAC keeps broad endpoint policy visible, while domain code keeps resource-specific rules beside the business operation. If policy combinations grow beyond a few roles and clear ownership rules, a central authorization service or policy engine should be evaluated. It is not justified by the current model.

## Web security controls

| Risk                     | Current control                                                                         | Important limit                                                          |
| ------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Session theft            | HttpOnly, Secure-by-default, SameSite=Lax cookie; HTTPS/HSTS in production              | Compromised browser/device sessions still require operational revocation |
| CSRF                     | readable `XSRF-TOKEN` mirrored into `X-XSRF-TOKEN` for mutations                        | same-origin routing and correct proxy headers remain required            |
| Session fixation         | session migration plus explicit login ID rotation                                       | test after authentication framework upgrades                             |
| Brute force and spraying | per-IP, per-identifier, and account lock controls; dummy hash for unknown users         | limiter is in-memory and designed for the current single backend node    |
| IDOR                     | ownership-constrained repository/service lookups                                        | every new resource endpoint must repeat this pattern                     |
| Stored XSS               | backend HTML allowlist on write and public read; CSP on API/media                       | the SPA document CSP is also an NGINX responsibility                     |
| Malicious uploads        | decode, real-type/size/dimension/pixel checks, re-encode, generated storage keys        | only supported image types should be accepted                            |
| Price/payment tampering  | backend repricing, exact decimal arithmetic, QPay provider check, amount/currency match | real credentials and paid/expiry rehearsals remain production gates      |
| Duplicate orders/events  | idempotency keys and unique outbox event keys                                           | callers must keep the same key after an ambiguous network failure        |
| Secret exposure          | ignored local environment, protected CI environment, restricted VPS file                | never prefix secrets with `VITE_`; those values enter browser code       |

The security model is deny-by-default: unlisted routes are denied. A new endpoint should not be made public simply to make a frontend call work.

## Performance model

### Browser and bundle

- Every route-level page is loaded with `React.lazy`, so administration, checkout, account, and editor code are not part of every page visit.
- The Leaflet address map is a separate lazy chunk and loads only when the address form needs it.
- Homepage sections below the first viewport are deferred.
- Vite gives production assets content hashes. NGINX serves hashed assets with a one-year immutable cache policy and keeps `index.html` uncacheable.
- NGINX gzip-compresses JavaScript, CSS, and SVG.
- Local Roboto imports include only Latin and the two Cyrillic subsets required by Mongolian content.

The checked-in bundle budget protects the initial application shell rather than total code downloaded across every route:

| Asset                         | Gzip budget |
| ----------------------------- | ----------: |
| Initial JavaScript entry      |     150 KiB |
| Initial CSS                   |      25 KiB |
| Largest lazy JavaScript chunk |      75 KiB |

Run `npm run build && npm run bundle:check`. The check reads the generated files, so it measures the current build rather than a hard-coded filename. On 2026-09-03 the initial JavaScript was 119.0 KiB gzip, initial CSS was 9.2 KiB, and the largest lazy JavaScript chunk—the map—was 45.3 KiB.

A budget is a regression signal, not a performance score. If it fails, inspect why the initial route changed before raising the threshold. Large features should normally remain behind an existing route or interaction boundary.

### Rendering and network

- The hero reserves its layout space and supplies image dimensions to reduce layout shift.
- The visible hero image receives high fetch priority; managed images use lazy loading where appropriate.
- Public lists are paginated instead of loading unbounded result sets.
- Cancellation-aware catalog requests prevent stale responses from replacing newer route/filter state.
- Loading, empty, error, and retry states are explicit so slow networks do not look like broken pages.

### Backend and database

- Collection APIs enforce bounded page sizes and enumerated sort choices.
- `@EntityGraph` is used for known aggregate reads to avoid accidental N+1 behavior.
- Checkout locks product rows in a stable order before changing stock.
- Order/payment transitions use transactions and pessimistic locks where concurrent writes matter.
- The email outbox moves SMTP latency and retries out of customer-facing transactions.
- Scheduled outbox claims use `FOR UPDATE SKIP LOCKED` and processing leases.

The application currently targets one backend node and one PostgreSQL instance. Horizontal scaling would require shared session storage, a distributed rate limiter, coordinated scheduler ownership, and load tests before adding nodes.

## What to measure

Use measurements to justify optimization:

- Browser: LCP, CLS, INP, transferred bytes, cache reuse, and route-specific chunk loading
- API: latency percentiles, error rate, request rate, and slow queries
- Database: query count per request, lock time, pool saturation, index use, and migration duration
- Background work: outbox age, retry count, failed rows, and QPay reconciliation backlog

Do not optimize a component because it “looks expensive.” Reproduce the slow path, record a baseline, change one boundary, and compare the same scenario.

## Review questions for class

- Why are sessions a better fit than JWT for this same-origin single-service deployment?
- Why does a frontend route guard not provide authorization?
- Which rules are RBAC, and which depend on resource attributes?
- Why is a QPay callback treated as a notification instead of proof of payment?
- Why does checkout lock inventory and use an idempotency key?
- Why is email written to an outbox inside the transaction instead of sent immediately?
- What does route-level code splitting improve, and what does it not improve?
- Which parts must change before the backend can scale horizontally?
