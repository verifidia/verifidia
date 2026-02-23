# Decisions

## 2026-02-23 - SSR-safe internal API URL strategy for route loaders
- Decision: Use a small shared helper (`src/lib/get-api-url.ts`) and update all loader fetch calls to `fetch(getApiUrl(path))`.
- Rationale: This is the least invasive fix that preserves existing API routes/response formats and applies consistently across home/search/document loaders.
- SSR origin source: `process.env.BETTER_AUTH_URL` with localhost fallback for local development defaults.
- Rejected: importing `@tanstack/react-start/server` in route-level helper, because it pulled server-only modules into client build and caused build failures.
