# HiLiving repository rules

These instructions apply to the whole repository. A closer `AGENTS.md` adds application-specific rules.

## Start here

- Read `docs/agent/CODE_CHANGE_RULES.md` before changing code.
- Read `docs/agent/SECURITY_RULES.md` for identity, authorization, commerce, content, media, email, or deployment work.
- Follow `docs/agent/DOCUMENTATION_RULES.md` for material changes.
- Use `docs/human/DEVELOPMENT_GUIDE.md` when the system boundary is unclear.

## Non-negotiable boundaries

- Preserve unrelated working-tree changes.
- Keep secrets and production/customer data out of source, output, tests, and documentation.
- Keep backend authority over identity, roles, prices, discounts, inventory, orders, and payments.
- Keep frontend HTTP behavior in `frontend/src/api` and schema changes in new Flyway migrations.
- Do not edit applied migrations or bypass CSRF, role checks, ownership checks, payment verification, or the email outbox.
- Do not commit, push, deploy, or mutate production unless explicitly requested.

## Completion

Run focused checks during development and the relevant full application checks before handoff. Report verified results and any live integration that was not exercised. Keep `docs/PROJECT_STATUS.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/TODO.md` consistent with material completed behavior.

<!-- OPENWIKI:START -->

## OpenWiki

This repository has a generated `openwiki/` evidence index. It is optional just-in-time context, not required startup reading.

- Treat source code and tests as authoritative. A brief's unknowns and review items are verification gaps, not automatic requirements.
- Prefer the narrowest quiet validation that proves the changed behavior. Preserve complete failure output.

The scheduled OpenWiki GitHub Actions workflow refreshes the repository wiki. Do not hand-edit generated OpenWiki pages unless explicitly asked; prefer updating source code/docs and letting OpenWiki regenerate.

<!-- OPENWIKI:END -->
