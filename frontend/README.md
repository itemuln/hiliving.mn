# HiLiving Frontend

React, TypeScript, and Vite storefront for HiLiving.

## Catalog API configuration

The storefront uses same-origin `/api/v1` requests by default. During local development, Vite proxies `/api` to `http://localhost:8080`. This matches the planned production NGINX path and does not require browser CORS access.

Configuration is loaded from the gitignored root `.env`:

```text
VITE_API_BASE_URL=
VITE_DEV_API_PROXY_TARGET=http://localhost:8080
```

Leave `VITE_API_BASE_URL` blank for same-origin requests. Override `VITE_DEV_API_PROXY_TARGET` when the local backend uses a different port, such as `http://localhost:18080`. An absolute `VITE_API_BASE_URL` is supported only when that API origin explicitly allows the frontend origin.

Only variables beginning with `VITE_` are available to browser code. Never put secrets in a Vite variable.

## Commands

```bash
npm ci
npm run lint
npm test
npm run build
npm run dev
```

The tests mock the HTTP boundary and cover catalog success, loading, empty results, safe failures, retry, filter serialization, adapter errors, and product-detail 404 behavior.

For local integration when the backend is running on port 18080:

```bash
VITE_DEV_API_PROXY_TARGET=http://localhost:18080 npm run dev
```
