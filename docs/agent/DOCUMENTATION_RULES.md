# Documentation rules

## Audience

- Write onboarding and technical explanations for people under `docs/human/` or the established topic document.
- Write short imperative operating rules for automated tools under `docs/agent/`.
- Do not duplicate the same long explanation for both audiences. Agent rules may link to human context.

## Living documents

After a material completed change, keep these files aligned:

- `docs/PROJECT_STATUS.md` — verified current state and completed result
- `docs/ARCHITECTURE.md` — boundaries and runtime data flow
- `docs/DECISIONS.md` — decisions with meaningful alternatives or consequences
- `docs/TODO.md` — remaining work and production gates

Update only the documents affected by the change, but check all four for contradictions.

## Evidence and style

- Describe current behavior in present tense and planned work as planned.
- Give exact test counts, bundle sizes, versions, or live status only when verified in the same work or tied to a dated snapshot.
- Distinguish local verification from production verification.
- Prefer short paragraphs, concrete paths, and examples from this repository.
- Remove stale claims instead of appending a correction that leaves both versions visible.
- Never include credentials, secret values, customer data, private host access details, or copied provider payloads.

Documentation-only changes still require link review, formatting, and `git diff --check`.
