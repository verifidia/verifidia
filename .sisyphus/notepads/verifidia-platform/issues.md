# Issues

## 2026-02-23 - Local dev verification blocked by TanStack devtools event bus port conflict
- `bun run dev` fails before app startup with `EADDRINUSE :::42069` from `@tanstack/devtools-vite` event bus.
- This prevented end-to-end SSR verification via local dev server for `/`, `/search`, and `/documents/$documentId`.
- Build verification still completed successfully via `bun run build`.
