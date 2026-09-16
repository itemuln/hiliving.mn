# Code-change rules

## Before editing

- Read the root `README.md`, the closest scoped `AGENTS.md`, and the smallest relevant source/test files.
- Check `git status` and preserve unrelated changes.
- Use the implementation, migrations, and tests as the source of truth. Treat status and presentation prose as secondary evidence.
- Identify the trust boundary and data owner before moving code or adding a shared abstraction.

## Boundaries

- Keep Java under `backend/` and React/TypeScript under `frontend/`.
- The backend owns identity, authorization, prices, discounts, stock, orders, payment state, and persistent content.
- Frontend pages compose features; API adapters own transport; reusable components do not call endpoints directly.
- Backend controllers own HTTP translation, services own use cases/transactions, repositories own queries/locks, and entities protect state invariants.
- Flyway is the only schema writer. Add a migration; never edit an applied migration.

## Maintainability

- Make the smallest coherent change. Do not combine a behavior change with broad formatting or package movement.
- Use domain names and one public Java type per file.
- Prefer explicit control flow over generic frameworks or helpers with one caller.
- Add an abstraction only after the shared responsibility and error semantics are clear.
- Do not add comments that narrate syntax. Explain a business invariant, security reason, or non-obvious trade-off.
- Do not delete backend code merely because the current React application has no direct import for it.

## Validation

- Run the smallest focused test while iterating.
- Before completion, run frontend lint, tests, build, bundle check, and formatting for frontend changes.
- Run Maven `verify` with Docker for backend behavior, persistence, security, or migration changes.
- Run `git diff --check` and inspect the final diff.
- State anything not tested, especially live QPay, SMTP, DNS, TLS, or deployment behavior.

Do not commit, push, deploy, modify production data, or rotate credentials unless the user explicitly asks.
