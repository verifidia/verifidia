# Problems

## 2026-02-23 - Runtime route verification limited by missing local secrets
- `bun run start` responds with HTTP 500 because `OPENAI_API_KEY` is missing in current shell environment.
- This blocks runtime HTML verification of routes in production-mode server despite successful compilation/build.
