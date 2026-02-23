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

## T10: Inngest Document Generation Pipeline (2026-02-23)
- Added `src/inngest/generate-document.ts` with `generateDocument` exported via `inngest.createFunction({ id: 'generate-document' }, { event: 'document/generation.requested' }, ...)`.
- Implemented a 6-step durable flow using Inngest steps: `research`, `outline`, `draft`, `assemble`, `save`, and `fan-out-verification`.
- Research step uses Exa wrapper `searchWeb()` with five topic-derived queries, dedupes by URL, and normalizes sources into `{ url, title, snippet }`.
- Outline and draft steps use `generateStructured()` with inline Zod schemas for typed model output and deterministic parsing.
- Assemble step composes a single Markdown document and appends `## Sources` with numbered URLs.
- Save step updates `documents` via Drizzle with `content`, `title`, `status: 'generated'`, and JSON `sources` using `eq(documents.id, documentId)`.
- Verification fan-out uses `step.sendEvent('fan-out-verification', { name: 'document/verification.requested', data: { documentId } })`.
- Validation completed: `lsp_diagnostics` clean on changed TypeScript file, em-dash scan clean, and `bun run build` passed.


## T11: Translate Document Inngest Function (2026-02-23)

### Completed
 Created `src/inngest/translate-document.ts` with Inngest function triggered by `document/translation.requested`
 Three-step pipeline: load-source -> determine-targets -> translate-{locale} fan-out
 Concurrency limited to 5 (`{ concurrency: { limit: 5 } }`)
 Each locale gets its own `step.run('translate-{locale}')` for independent retryability
 Uses `generateStructured()` with zod schema `{ title: string, content: string }`
 Upserts into `document_translations` with `onConflictDoUpdate` on `(documentId, locale)` unique index
 Build passes cleanly, zero LSP diagnostics

### Key Patterns
 Inngest step fan-out: `for (const locale of targetLocales) { await step.run(`translate-${locale}`, ...) }` - each step is independently retryable by Inngest
 Drizzle upsert: `db.insert(table).values({...}).onConflictDoUpdate({ target: [table.col1, table.col2], set: {...} })`
 `SUPPORTED_LOCALES.filter()` converts readonly tuple to mutable array - works fine for iteration
 Do NOT set `searchVector` on documentTranslations - it's `generatedAlwaysAs` (Postgres computed column)
 Event data has `targetLocale` (singular) but function translates to ALL locales minus canonicalLocale
 `db.query.documents.findFirst({ where: eq(documents.id, id) })` for relational query style

## T10: Document Verification Inngest Function (2026-02-23)
- Created `src/inngest/verify-document.ts` with named export `verifyDocument` using `inngest.createFunction` and trigger `document/verification.requested`.
- Configured function concurrency as `{ limit: 3 }` to reduce OpenAI request pressure.
- Implemented durable flow with `step.run()` checkpoints: `load-document`, `claim-extraction`, batched `source-verification-batch-*`, `cross-reference`, and `update-status`.
- Claim extraction uses `generateStructured()` with strict Zod schema for factual claims: `{ text, sectionIndex, confidence }`.
- Source verification batches claims in groups of 5 and calls `searchWeb()` per claim, returning `{ claimIndex, verified, sources, notes }`.
- Cross-reference uses `generateStructured()` with Zod schema for `{ overallScore, flaggedClaims, summary }` and evidence-focused scoring guidance.
- Status update writes `verificationScore`, sets `status` to `verified` when score >= 70 else `flagged`, and stores `flaggedClaims` in `verificationDetails` JSON.
- Parsed `documents.sources` defensively to support both string URL arrays and object entries with `url` keys.


## T13: Stale Document Refresh Functions (2026-02-23)

### Completed
 Created `src/inngest/refresh-stale.ts` with two Inngest functions
 Updated `src/lib/inngest.ts` to add `document/refresh.requested` event type
 LSP diagnostics clean, build passes

### Implementation Details
 **checkStaleDocuments**: Cron `0 0 * * 0` (weekly Sunday midnight), queries `staleAt < now() AND status = 'verified'`, fans out via `step.sendEvent` array
 **refreshDocument**: Event-triggered, 5-step workflow: research -> compare -> update -> re-verify -> re-translate
 `step.sendEvent(stepId, events[])` supports array of events for fan-out (no need to wrap in `step.run`)
 Section splitting: `/^(?=## )/m` lookahead regex preserves content boundaries for markdown sections
 Only changed sections are updated (partial merge), not full document regeneration
 After update: status reset to `generated`, staleAt reset to `now() + interval '30 days'`
 If no significant updates found, only staleAt timer is reset (no status change)
 Re-translation fans out to all existing locales in `documentTranslations` table
 `UpdateComparisonSchema` uses `z.number().int().nonnegative()` for sectionIndex validation


## T14: Process Refutation Inngest Function (2026-02-23)

### Completed
 Created `src/inngest/process-refutation.ts` with 5-step durable pipeline
 Triggered by `refutation/submitted` event with `{ refutationId, documentId }` data
 LSP diagnostics clean, `bun run build` passes

### Step Pipeline
1. `load-context`: Fetch refutation + document from DB, extract 500-char radius around selectedText, set status to `processing`
2. `research`: Search Exa combining selectedText + category context hint
3. `evaluate`: GPT structured output with VerdictSchema (verdict, confidence, reasoning, suggestedCorrection, sources)
4. `update-refutation`: Persist verdict/confidence/reasoning/sources, set status `reviewed`, set resolvedAt
5. `apply-if-upheld`: Only if verdict=upheld AND confidence>80; replaces selectedText in document content, resets document status to `generated`, sends verification + translation events

### Key Patterns
 `step.sendEvent` can be called directly at the step level (not nested in `step.run`)
 Zod schema for structured AI output: `z.enum()` for verdict, `z.number().int().min(0).max(100)` for confidence
 `CATEGORY_CONTEXT` map provides human-readable hints per refutation category for research queries and evaluation prompts
 Only `upheld` with confidence > 80 triggers auto-apply; `partially_upheld` stays at `reviewed` status
 After applying correction: document status reset to `generated` triggers re-verification pipeline
 `String.replace()` used for single-occurrence text replacement in document content


## T15: API Routes and Inngest Registration (2026-02-23)

### Completed
 Created 4 new API routes and updated inngest serve route
 All LSP diagnostics clean, `bun run build` passes

### Files Created/Modified
- `src/routes/api/search.ts` - GET with FTS on documentTranslations.searchVector
- `src/routes/api/documents/$documentId.ts` - GET with translation fallback
- `src/routes/api/documents/request.ts` - POST with auth, slug dedup, Inngest event
- `src/routes/api/documents/$documentId/refute.ts` - POST with auth, Zod validation, Inngest event
- `src/routes/api/inngest.ts` - Updated to register 6 Inngest functions

### Key Patterns
 TanStack Start server handlers use `({ request }) => Response` pattern
 For parameterized routes ($documentId), extract ID from URL: `new URL(request.url).pathname.split('/')[3]`
 TanStack Router route tree auto-regenerates at build time - `FileRoutesByPath` errors resolve after build
 Better Auth session: `auth.api.getSession({ headers: request.headers })` returns session or null
 Drizzle FTS: `sql\`\${col.searchVector} @@ plainto_tsquery('simple', \${q})\`` with raw SQL template
 Drizzle FTS ranking: `sql\`ts_rank(\${col.searchVector}, plainto_tsquery('simple', \${q})) desc\``
 Drizzle innerJoin with eq: `.innerJoin(table, eq(fk, pk))`
 Drizzle insert returning: `.insert(table).values({...}).returning({ id: table.id })` returns array
 JSON response helper pattern: `const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers })`
 Static routes (e.g. `/documents/request`) take priority over dynamic (`/documents/$documentId`) in TanStack Router
 Having `$documentId.ts` and `$documentId/refute.ts` coexist is valid - parent route file + child directory

### Inngest Functions Registered
1. generateDocument (generate-document)
2. verifyDocument (verify-document)
3. translateDocument (translate-document)
4. checkStaleDocuments (check-stale-documents)
5. refreshDocument (refresh-document)
6. processRefutation (process-refutation)
