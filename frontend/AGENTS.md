# Frontend rules

These rules apply under `frontend/` in addition to the root `AGENTS.md`.

- Keep TypeScript strict and follow the existing ESLint and Prettier configuration.
- Route-level composition belongs in `src/pages` or `App.tsx`; domain behavior belongs in `src/features`; reusable presentation belongs in the closest `src/components` domain.
- Only modules under `src/api` may call `fetch` or `XMLHttpRequest`. Use `api/http.ts` for credentials, CSRF, response envelopes, safe errors, and upload progress.
- Backend DTOs must be mapped before they spread through presentation components.
- `ProtectedRoute` improves navigation only. Never treat it as the authorization boundary.
- Store only product identifiers and quantities in the browser cart. Do not persist trusted prices, identity, roles, or payment state.
- Lazy-load route-only and interaction-only dependencies. Check the generated bundle before adding a large dependency.
- Preserve loading, empty, error, retry, keyboard, focus, reduced-motion, and responsive behavior when changing a flow.

Before handoff run:

```bash
npm run lint
npm test
npm run build
npm run bundle:check
npm run format:check
```
