# Documentation map

The repository keeps documentation for two audiences. Human documentation explains the system and the reasons behind it. Agent documentation contains short operating rules for automated coding tools.

## Human documentation

Start here when joining the project:

1. [`human/README.md`](human/README.md) — human reading order
2. [`human/DEVELOPMENT_GUIDE.md`](human/DEVELOPMENT_GUIDE.md) — how to find code, make a change, and verify it
3. [`ARCHITECTURE.md`](ARCHITECTURE.md) — system boundaries and domain design
4. [`human/ADVANCED_WEB_APPLICATION.md`](human/ADVANCED_WEB_APPLICATION.md) — security, authentication, authorization, RBAC/ABAC, performance, and bundle size
5. [`DECISIONS.md`](DECISIONS.md) — why important technical choices were made

Task-specific references:

- [`PRESENTATION_GUIDE.md`](PRESENTATION_GUIDE.md) — demo flow and presentation script
- [`CI.md`](CI.md) — automated checks and deployment gates
- [`TRANSACTIONAL_EMAIL.md`](TRANSACTIONAL_EMAIL.md) — email and outbox operations
- [`DEMO_CONTENT_SOURCES.md`](DEMO_CONTENT_SOURCES.md) — local demonstration assets and attribution
- [`../infrastructure/production/README.md`](../infrastructure/production/README.md) — production topology and release process

## Agent documentation

Automated tools start with the root [`AGENTS.md`](../AGENTS.md), then read only the rules relevant to the change:

- [`agent/CODE_CHANGE_RULES.md`](agent/CODE_CHANGE_RULES.md)
- [`agent/SECURITY_RULES.md`](agent/SECURITY_RULES.md)
- [`agent/DOCUMENTATION_RULES.md`](agent/DOCUMENTATION_RULES.md)

`frontend/AGENTS.md` and `backend/AGENTS.md` add rules scoped to each application.

## Living records

- [`PROJECT_STATUS.md`](PROJECT_STATUS.md) records verified current behavior and meaningful completed work.
- [`TODO.md`](TODO.md) records unfinished work and production gates.

These stay at stable paths because development tools and existing workflows refer to them directly. They are records, not onboarding guides.

## Source-of-truth order

When documentation and implementation disagree, verify in this order:

1. Executable behavior and tests
2. Flyway migrations and runtime configuration
3. CI and deployment scripts
4. Architecture and decision documents
5. Status, TODO, and presentation material

Correct stale documentation in the same change. Never copy secrets, real customer data, or production access details into a document.
