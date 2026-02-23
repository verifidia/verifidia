# Learnings

## Initial Context
- Framework: TanStack Start (Vite + Nitro SSR + TanStack Router), NOT Next.js
- Path aliases: `#/*` -> `./src/*`, `@/*` -> `./src/*`
- Existing shadcn components: button, input, select, label, switch, slider, textarea
- DB: PostgreSQL via `DATABASE_URL`
- API routes use `createFileRoute` with `server.handlers` (NOT `createAPIFileRoute`)
- Env vars: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, OPENAI_API_KEY, EXA_API_KEY, NUCLEO_LICENSE_KEY, RESEND_API_KEY
- No em-dashes (U+2014) anywhere in codebase
- All AI calls async, no streaming
- Nucleo Icons only, no Lucide

## env.ts Configuration (Verifidia)
- Server vars: DATABASE_URL, OPENAI_API_KEY, EXA_API_KEY, BETTER_AUTH_SECRET, BETTER_AUTH_URL, INNGEST_EVENT_KEY (optional), INNGEST_SIGNING_KEY (optional), RESEND_API_KEY (optional)
- Client vars: empty object (no VITE_ prefixed vars needed currently)
- Pattern: `@t3-oss/env-core` with `runtimeEnv: import.meta.env` (Vite exposes all env vars on server side)
- Validation: URLs use z.string().url(), secrets use z.string().min(1)
- Demo leftovers removed: SERVER_URL, VITE_APP_TITLE

## Paraglide JS i18n Configuration (T20)
- Expanded locales from 2 to 23: en, de, es, fr, pt, ru, ja, ko, zh, ar, hi, bn, id, ms, tr, vi, th, pl, uk, nl, it, fa, tl
- Created `src/lib/i18n-config.ts` as single source of truth for locale lists
- SUPPORTED_LOCALES array uses `as const` for type safety
- SupportedLocale type derived from SUPPORTED_LOCALES tuple
- DEFAULT_LOCALE set to 'en'
- messages/en.json contains 27 Verifidia UI keys (not demo keys)
- messages/de.json kept as placeholder with only $schema
- Paraglide runtime auto-regenerates from settings.json changes
- No manual translations created for non-English locales (T21 handles that)

## Demo Content Cleanup (T22)
- Removed 17 demo files from src/ (components, hooks, data, libs)
- Deleted entire src/routes/demo/ directory (20+ route files)
- Deleted MCP-related files: src/mcp-todos.ts, src/utils/mcp-handler.ts, src/routes/mcp.ts
- Deleted src/db-collections/ directory
- Removed 7 demo guitar images from public/ (example-guitar-*.jpg)
- Removed 2 TanStack logo files from public/ (tanstack-*.svg, tanstack-*.png)
- Removed 14 demo dependencies from package.json:
  - @faker-js/faker, @modelcontextprotocol/sdk
  - @tanstack/ai, @tanstack/ai-anthropic, @tanstack/ai-client, @tanstack/ai-gemini, @tanstack/ai-ollama, @tanstack/ai-openai, @tanstack/ai-react
  - @tanstack/query-db-collection, @tanstack/react-db, @tanstack/react-store, @tanstack/store
  - highlight.js, lucide-react
- Updated Header.tsx: removed all demo navigation links, removed deleted demo-AIAssistant import, kept only Home link
- Updated index.tsx: removed TanStack logo references, updated branding to Verifidia
- Kept lucide-react imports in Header.tsx and index.tsx (Menu, X, Home, Zap, Server, etc. icons)
- bun install completed successfully: 3 packages installed, 15 removed
- Verified: 0 demo files remain, 0 demo imports remain

## T2: Production Dependencies Installation (2026-02-23)

### Completed
- ✅ Created `.npmrc` with NUCLEO_LICENSE_KEY for private npm package auth
- ✅ Installed `inngest@3.52.3` (workflow orchestration)
- ✅ Installed `openai@6.22.0` (OpenAI API client)
- ✅ Installed `exa-js@2.4.0` (Exa search API)
- ✅ Installed `nucleo-core-outline-24@1.1.3` (private icon package)
- ✅ `bun install` succeeded with no errors
- ✅ `bun run build` passes with all new dependencies

### Key Learnings
- Nucleo packages require `.npmrc` authentication with the license key from `.env.local`
- All four packages installed cleanly without conflicts
- Build output shows expected warnings (unused imports in dependencies, Tailwind syntax) - not related to new packages
- Package manager: bun (not npm/yarn)
- Framework: TanStack Start (Vite + Nitro SSR + TanStack Router)

### Dependencies Added
```json
"exa-js": "^2.4.0",
"inngest": "^3.52.3",
"nucleo-core-outline-24": "^1.1.3",
"openai": "^6.22.0"
```

### Next Steps
- These packages are ready for integration into the application
- Inngest for async job processing
- OpenAI for AI features
- Exa for search functionality
- Nucleo for icon system

## T5: Inngest Client Module and API Route (2026-02-23)

### Completed
- ✅ Created `src/lib/inngest.ts` with Inngest client instance and event type map
- ✅ Created `src/routes/api/inngest.ts` with API route serving Inngest handlers
- ✅ Added `"inngest:dev": "npx inngest-cli@latest dev"` script to package.json
- ✅ `bun run build` passes with exit code 0

### Key Implementation Details
- Inngest client initialized with `id: 'verifidia'` and `schemas: new EventSchemas().fromRecord<Events>()`
- Events type map defines 4 event types: document/generation.requested, document/verification.requested, document/translation.requested, refutation/submitted
- API route uses `createFileRoute` pattern (same as auth route) with `server.handlers` for GET, POST, PUT
- Serve function imported from `inngest/edge` (works as generic HTTP handler for TanStack Start)
- Handler signature: `({ request }) => handler(request)` matches TanStack Start pattern
- Functions array is empty (functions defined in T10-T14)

### Pattern Notes
- TanStack Start API routes use `createFileRoute` with `server.handlers`, NOT `createAPIFileRoute`
- Inngest serve function returns handler that accepts Request and returns Response
- EventSchemas.fromRecord<T>() provides type-safe event definitions
- Path alias `#/lib/inngest` resolves to `./src/lib/inngest`

### Build Status
- No TypeScript errors in new files
- Build output shows inngest.mjs (246.19 kB) bundled successfully
- All warnings are pre-existing (Tailwind syntax, unused imports in dependencies)

## Drizzle Schema Rewrite (2026-02-23)
- Replaced `src/db/schema.ts` todo stub with full Verifidia schema: Better Auth (`user`, `session`, `account`, `verification`) plus `documents`, `document_translations`, `document_revisions`, `refutations`, `generation_jobs`.
- Better Auth compatibility: all primary keys use `text` with `.$defaultFn(() => crypto.randomUUID())`, and all timestamps use `timestamp(..., { withTimezone: true })`.
- Implemented PostgreSQL full text search via `customType` for `tsvector` and `generatedAlwaysAs(sql\`to_tsvector(...)\`)` on `document_translations.search_vector`.
- Added required constraints and indexes: unique `documents.slug`, unique `(document_id, locale)` on `document_translations`, and GIN index on `document_translations.search_vector`.
- `drizzle-kit push` is interactive when existing tables are present; automation required confirming each create vs rename prompt.
- Verified tables in Postgres public schema after push: `account`, `document_revisions`, `document_translations`, `documents`, `generation_jobs`, `refutations`, `session`, `user`, `verification`.


## T3: AI Service Module (src/lib/ai.ts) (2026-02-23)

### Completed
 Created `src/lib/ai.ts` with 6 exports: `openai`, `exa`, `AI_MODEL`, `searchWeb()`, `generateStructured()`, `researchAndSynthesize()`
 Build passes cleanly, no @tanstack/ai imports

### API Details (openai v6.22.0)
 `zodResponseFormat` and `zodFunction` import from `'openai/helpers/zod'`
 `zodFunction` accepts `{ name, parameters, function?, description? }` - the `function` prop makes it usable with `runTools()`
 `chat.completions.parse()` returns `ParsedChatCompletion` with `message.parsed` and `message.refusal`
 `chat.completions.runTools()` returns a runner; use `runner.finalContent()` for the final string response
 openai helpers support both zod v3 (`zod/v3`) and zod v4 (`zod/v4`) via `InferZodType<T>` union

### API Details (exa-js v2.4.0)
 `searchAndContents()` is deprecated in favor of `search()` with `contents` option, but still works
 For `searchAndContents`: options are `RegularSearchOptions & ContentsOptions` (merged at top level)
 Text content: `text: { maxCharacters: N }` or `text: true`
 `livecrawl` is a top-level ContentsOptions property: 'never' | 'fallback' | 'always' | 'auto' | 'preferred'
 `type` accepts: 'keyword' | 'neural' | 'auto' | 'hybrid' | 'fast' | 'instant' | 'deep'
 `numResults` is from BaseSearchOptions

### Key Patterns
 OpenAI client auto-reads OPENAI_API_KEY from env (no explicit config needed)
 Exa client needs explicit `process.env.EXA_API_KEY` passed to constructor
 All AI calls are async/await (non-streaming) as required by project conventions