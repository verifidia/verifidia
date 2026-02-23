# Verifidia: AI-Verified Knowledge Platform

## TL;DR

> **Quick Summary**: Build a Wikipedia-like platform where documents are AI-generated via GPT 5.2 + Exa Search, AI-verified through a 3-agent fact-checking pipeline, and managed via Inngest async queues. Translation model: one canonical doc per topic, AI-translated to ~23 languages. Users can refute content via text selection + categories, triggering re-evaluation.
>
> **Deliverables**:
> - Complete PostgreSQL schema (documents, translations, revisions, refutations, auth)
> - 5 Inngest pipelines (generation, fact-checking, translation, stale cron, refutation)
> - Full frontend: newspaper home, search, document viewer, refutation UI, auth
> - i18n: Paraglide expanded to 23 locales with AI-translated UI strings
> - All integrated locally with dev server
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES - 6 waves
> **Critical Path**: T1 -> T5 -> T6 -> T10 -> T15 -> T16/T18 -> T22 -> FINAL

---

## Context

### Original Request
Build "Verifidia" - a Wikipedia where all documents are AI-generated and AI-verified. Inngest for async queues. GPT 5.2 + Exa Search. Better Auth + Drizzle + Postgres. Nucleo Icons. Newspaper-style home. Native i18n for all major languages (50M+ speakers). Translation model for content. Structured markdown with Streamdown rendering. Dry, professional design. No em-dashes, no gradients, no badges.

### Interview Summary
**Key Discussions**:
- **Language model**: Translation model chosen. One canonical doc generated in the user's search language, then AI-translated to other locales on demand.
- **Document format**: Structured markdown rendered with Streamdown (already installed v1.6.5).
- **Refutation UX**: Text selection + category (factual_error, outdated, biased, missing_context) + optional note + optional source URL. Requires login.
- **Test strategy**: No automated tests. Agent-executed QA scenarios only.
- **Demo cleanup**: Strip all demo content from TanStack Start starter.

**Research Findings**:
- **TanStack Start** (NOT Next.js): Vite + Nitro SSR + TanStack Router. API routes via `createFileRoute` + `server.handlers`.
- **Inngest**: Works with TanStack Start via standard HTTP handlers. Use `step.run()` for durable execution, cron triggers for stale detection, `sendEvent` for fan-out.
- **Better Auth + Drizzle**: Must add `drizzleAdapter(db, { provider: 'pg', schema })`. Required tables use `text` primary keys.
- **OpenAI**: `gpt-5.2` model, `zodResponseFormat` for structured output, `runTools()` for agent loops with Exa.
- **Exa**: `exa-js` package, `searchAndContents()` for atomic search + content retrieval.
- **Nucleo**: Private npm packages (e.g., `nucleo-core-outline-24`), React components with `size`/`color` props.
- **Paraglide JS**: Already configured with URL strategy. Expand from 2 to 23 locales.
- **PostgreSQL FTS**: tsvector + GIN index. CJK languages use `'simple'` config as fallback.

### Metis Review
**Identified Gaps** (addressed):
- **Better Auth has no DB adapter**: Fixed in T6 (add drizzleAdapter).
- **OpenAI SDK not installed**: Fixed in T2 (install `openai`, `exa-js`).
- **Shadcn components exist but may need more**: Each task installs what it needs.
- **CJK search limitation**: Default to `'simple'` tsvector config for CJK. Full CJK search deferred.
 **Document status field needed**: Added `status` enum (queued, generating, generated, verified, flagged, failed) to schema.
- **Translation cascade rate limiting**: Inngest concurrency controls + batched translation.
- **Refutation text offset fragility**: Store `selected_text` string alongside offsets for resilience.
- **V1 scope locks**: No revision diff UI. No admin panel. No user roles beyond authenticated/anonymous.

---

## Work Objectives

### Core Objective
Build a fully functional, locally-running AI-verified knowledge platform where documents are generated on-demand, fact-checked by multiple AI agents, translated to 23 languages, and refutable by authenticated users.

### Concrete Deliverables
- PostgreSQL schema with 10+ tables (auth, documents, translations, revisions, refutations, jobs)
- 5 Inngest functions (generation, fact-check, translate, stale cron, refutation)
- 6+ API routes (search, documents, generation requests, refutations, status)
- 7 frontend pages/views (home, search, document, refutation, login, signup, status)
- 23 locale message files for UI strings
- Complete local dev environment (bun dev, Inngest dev server, PostgreSQL)

### Definition of Done
- [ ] `bun run dev` starts without errors
- [ ] `bun run build` succeeds with exit code 0
- [ ] All API routes return proper responses (not 500)
- [ ] Document generation pipeline works end-to-end (request -> generate -> fact-check -> publish)
- [ ] User can sign up, log in, and submit refutations
- [ ] Search returns documents via full-text search
- [ ] Home page shows recent articles in newspaper layout
- [ ] Locale switching works for all 23 languages

### Must Have
- Async-only AI generation (no streaming)
- Nucleo Icons throughout (no Lucide)
- i18n via Paraglide for all UI strings
- Inngest for all async pipelines
- Better Auth with Drizzle adapter for PostgreSQL
- tsvector + GIN index for document search
- Structured markdown content rendered with Streamdown
- Translation model (canonical doc + AI translations)
- 3-agent fact-checking pipeline
- Text selection refutation with categories
- Newspaper-style homepage

### Must NOT Have (Guardrails)
- No em-dashes in any text content, code, prompts, or UI copy. Use commas, periods, or semicolons.
- No gradients, decorative badges, or cheesy UI elements
- No streaming responses from AI
- No `@tanstack/ai-*` packages for AI calls (use direct `openai` SDK)
- No `lucide-react` icons (use Nucleo)
- No revision diff viewer in V1 (store revisions, list only)
- No admin panel or user roles beyond authenticated/anonymous
- No deployment configuration (local dev only)
- No `next-intl` or Next.js patterns (this is TanStack Start)
- No manual translation of UI strings (AI-translate them)
- No rich text editor (content is AI-generated markdown, users don't author)
- No em-dash character (U+2014) anywhere in the codebase

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Vitest configured)
- **Automated tests**: NONE (user chose no automated tests)
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) for navigation, interaction, screenshots
- **API/Backend**: Use Bash (curl) for request/response verification
- **Database**: Use Bash (psql via DATABASE_URL) for schema and data verification
- **Build**: Use Bash (bun run build) for compilation checks
- **Inngest**: Use curl to verify route registration + Inngest Dev Server UI

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - 4 parallel quick tasks):
+-- T1: Strip demo content + clean package.json [quick]
+-- T2: Install new dependencies [quick]
+-- T3: Extend env.ts validation [quick]
+-- T4: Expand Paraglide locale config [quick]

Wave 2 (Data + Infrastructure - 5 tasks, T6 depends on T5):
+-- T5: Complete database schema [deep]
+-- T6: Better Auth + Drizzle adapter + db:push (depends: T5) [quick]
+-- T7: Inngest client + serve route [quick]
+-- T8: OpenAI + Exa AI service module [unspecified-high]
+-- T9: App shell - root layout + header + nav [visual-engineering]

Wave 3 (Backend Pipelines + API - 6 parallel tasks):
+-- T10: Document generation Inngest function (depends: T7, T8) [deep]
+-- T11: Fact-checking pipeline - 3 agents (depends: T7, T8) [deep]
+-- T12: Translation fan-out pipeline (depends: T7, T8) [unspecified-high]
+-- T13: Stale content cron + keyword fan-out (depends: T7, T8) [unspecified-high]
+-- T14: Refutation processing pipeline (depends: T7, T8) [unspecified-high]
+-- T15: API routes - search, docs, generation, refutation (depends: T5, T6, T7) [unspecified-high]

Wave 4 (Frontend Pages - 5 parallel tasks):
+-- T16: Home page - newspaper layout (depends: T9, T15) [visual-engineering]
+-- T17: Search page + results (depends: T9, T15) [visual-engineering]
+-- T18: Document viewer + Streamdown rendering (depends: T9, T15) [visual-engineering]
+-- T19: Refutation UI - text selection + form (depends: T9, T15, T18) [visual-engineering]
+-- T20: Auth pages + route protection (depends: T6, T9) [quick]

Wave 5 (i18n + Polish - 2 tasks):
+-- T21: AI-translate UI strings to all 23 locales (depends: T16-T20) [unspecified-high]
+-- T22: Locale-aware document routing + fallbacks (depends: T15, T18) [deep]

Wave FINAL (Verification - 4 parallel tasks):
+-- F1: Plan compliance audit [oracle]
+-- F2: Code quality review [unspecified-high]
+-- F3: Real manual QA [unspecified-high + playwright]
+-- F4: Scope fidelity check [deep]

Critical Path: T1 -> T5 -> T6 -> T10 -> T15 -> T18 -> T22 -> FINAL
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 6 (Wave 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1-T4 | None | T5-T9 | 1 |
| T5 | T1,T2 | T6, T10-T15 | 2 |
| T6 | T5 | T15, T20 | 2 |
| T7 | T1,T2 | T10-T15 | 2 |
| T8 | T1,T2 | T10-T14 | 2 |
| T9 | T1,T2 | T16-T20 | 2 |
| T10 | T7,T8 | T13 | 3 |
| T11 | T7,T8 | T10(event),T14(event) | 3 |
| T12 | T7,T8 | - | 3 |
| T13 | T7,T8 | - | 3 |
| T14 | T7,T8 | - | 3 |
| T15 | T5,T6,T7 | T16-T19 | 3 |
| T16 | T9,T15 | T21 | 4 |
| T17 | T9,T15 | T21 | 4 |
| T18 | T9,T15 | T19,T22 | 4 |
| T19 | T9,T15,T18 | T21 | 4 |
| T20 | T6,T9 | T21 | 4 |
| T21 | T16-T20 | T22 | 5 |
| T22 | T15,T18 | FINAL | 5 |
| F1-F4 | ALL | - | FINAL |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks - T1-T4 all `quick`
- **Wave 2**: 5 tasks - T5 `deep`, T6 `quick`, T7 `quick`, T8 `unspecified-high`, T9 `visual-engineering`
- **Wave 3**: 6 tasks - T10 `deep`, T11 `deep`, T12 `unspecified-high`, T13 `unspecified-high`, T14 `unspecified-high`, T15 `unspecified-high`
- **Wave 4**: 5 tasks - T16-T19 `visual-engineering`, T20 `quick`
- **Wave 5**: 2 tasks - T21 `unspecified-high`, T22 `deep`
- **FINAL**: 4 tasks - F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

### Wave 1: Foundation

 [x] 1. Strip Demo Content and Clean Package

  **What to do**:
  - Delete all files in `src/routes/demo/` (21 files)
  - Delete all `src/components/demo-*` and `src/components/demo.*` files
  - Delete all `src/hooks/demo*` files
  - Delete all `src/data/demo-*` files
  - Delete all `src/lib/demo-*` files (demo-store, demo-guitar-tools, demo-ai-hook, demo-store-devtools)
  - Delete `src/mcp-todos.ts`, `src/utils/mcp-handler.ts`, `src/routes/mcp.ts`
  - Delete `src/db-collections/index.ts`
  - Delete demo assets from `public/` (example-guitar-*, tanstack-*)
  - Remove `@tanstack/ai`, `@tanstack/ai-anthropic`, `@tanstack/ai-client`, `@tanstack/ai-gemini`, `@tanstack/ai-ollama`, `@tanstack/ai-openai`, `@tanstack/ai-react` from package.json dependencies
  - Remove `@modelcontextprotocol/sdk`, `@faker-js/faker`, `highlight.js`, `lucide-react` from package.json dependencies
  - Remove `@tanstack/query-db-collection`, `@tanstack/react-db`, `@tanstack/react-store`, `@tanstack/store` from package.json
  - Keep: `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/api/auth/$.ts`, `src/router.tsx`
  - Keep: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/lib/utils.ts`
  - Keep: `src/db/`, `src/env.ts`, `src/styles.css`, `src/paraglide/`, `src/integrations/`
  - Keep: `#/components/ui/` (shadcn components)
  - Run `bun install` after cleanup to regenerate lockfile

  **Must NOT do**:
  - Do not delete auth routes, db config, paraglide config, or shadcn components
  - Do not modify vite.config.ts or tsconfig.json
  - Do not remove `streamdown` dependency

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T2, T3, T4)
  - **Blocks**: T5, T6, T7, T8, T9
  - **Blocked By**: None

  **References**:
  - `src/routes/demo/` - All 21 demo route files to delete
  - `src/components/demo-AIAssistant.tsx`, `src/components/demo-GuitarRecommendation.tsx`, `src/components/demo.FormComponents.tsx`, `src/components/demo.messages.tsx`, `src/components/demo.chat-area.tsx` - Demo components to delete
  - `src/hooks/demo.form.ts`, `src/hooks/demo.form-context.ts`, `src/hooks/demo.useChat.ts`, `src/hooks/demo-useTTS.ts`, `src/hooks/demo-useAudioRecorder.ts` - Demo hooks to delete
  - `src/data/demo-table-data.ts`, `src/data/demo-guitars.ts` - Demo data to delete
  - `src/lib/demo-store.ts`, `src/lib/demo-store-devtools.tsx`, `src/lib/demo-guitar-tools.ts`, `src/lib/demo-ai-hook.ts` - Demo libs to delete
  - `package.json:20-63` - Dependencies to audit and clean

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: Demo content fully removed
    Tool: Bash
    Steps:
      1. Run: find src/routes/demo -type f 2>/dev/null | wc -l
      2. Run: find src -name 'demo*' -type f 2>/dev/null | wc -l
      3. Run: grep -r 'lucide-react' src/ --include='*.tsx' --include='*.ts' | wc -l
      4. Run: grep -r '@tanstack/ai' package.json | wc -l
    Expected Result: All counts return 0
    Evidence: .sisyphus/evidence/task-1-demo-stripped.txt

  Scenario: Core files preserved
    Tool: Bash
    Steps:
      1. Run: test -f src/lib/auth.ts && echo 'exists'
      2. Run: test -f src/db/index.ts && echo 'exists'
      3. Run: test -f src/routes/api/auth/\$.ts && echo 'exists'
      4. Run: test -d src/paraglide && echo 'exists'
    Expected Result: All print 'exists'
    Evidence: .sisyphus/evidence/task-1-core-preserved.txt
  ```

  **Commit**: YES (group with T2, T3, T4)
  - Message: `chore: strip demo content and clean dependencies`
  - Pre-commit: `bun install`

 [x] 2. Install New Dependencies

  **What to do**:
  - Install production dependencies: `inngest`, `openai`, `exa-js`
  - Install Nucleo icon packages. First configure npm to use the license key:
    - Create or update `.npmrc` with `//registry.npmjs.org/:_authToken=${NUCLEO_LICENSE_KEY}` if required by Nucleo's registry
    - Install `nucleo-core-outline-24` (primary icon set for the app)
  - Verify all packages resolve and install correctly
  - Run `bun install` and confirm no peer dependency conflicts

  **Must NOT do**:
  - Do not install next-intl, @auth/*, or any Next.js-specific packages
  - Do not install any rich text editor packages

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T3, T4)
  - **Blocks**: T5, T6, T7, T8, T9
  - **Blocked By**: None

  **References**:
  - `package.json` - Current dependency list
  - `.env.local:5-6` - EXA_API_KEY and NUCLEO_LICENSE_KEY values exist
  - Nucleo docs: https://nucleoapp.com/react-packages - Package names and registry config
  - Inngest docs: https://www.inngest.com/docs/getting-started - npm install instructions

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: All new packages installed
    Tool: Bash
    Steps:
      1. Run: bun pm ls | grep -E 'inngest|openai|exa-js' | wc -l
      2. Run: bun pm ls | grep 'nucleo' | wc -l
    Expected Result: First returns 3 (inngest, openai, exa-js). Second returns >= 1 (nucleo package).
    Evidence: .sisyphus/evidence/task-2-deps-installed.txt

  Scenario: No dependency conflicts
    Tool: Bash
    Steps:
      1. Run: bun install 2>&1 | grep -i 'error\|conflict' | wc -l
    Expected Result: Returns 0
    Evidence: .sisyphus/evidence/task-2-no-conflicts.txt
  ```

  **Commit**: YES (group with T1, T3, T4)
  - Message: `chore: strip demo content and install verifidia dependencies`

 [x] 3. Extend Environment Validation

  **What to do**:
  - Update `src/env.ts` to validate all required environment variables:
    - `DATABASE_URL`: z.string().url()
    - `OPENAI_API_KEY`: z.string().min(1)
    - `EXA_API_KEY`: z.string().min(1)
    - `BETTER_AUTH_SECRET`: z.string().min(1)
    - `BETTER_AUTH_URL`: z.string().url()
    - `INNGEST_EVENT_KEY`: z.string().optional() (optional for local dev)
    - `INNGEST_SIGNING_KEY`: z.string().optional() (optional for local dev)
    - `RESEND_API_KEY`: z.string().min(1).optional()
  - Remove the existing `VITE_APP_TITLE` and `SERVER_URL` entries (demo leftovers)
  - Keep the `clientPrefix: 'VITE_'` pattern but add any needed client vars

  **Must NOT do**:
  - Do not expose secret keys to the client (no VITE_ prefix on API keys)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T4)
  - **Blocks**: T7, T8
  - **Blocked By**: None

  **References**:
  - `src/env.ts:1-39` - Current env validation using @t3-oss/env-core with Zod
  - `.env.local:1-7` - All current env var names and values

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: Env validation includes all required vars
    Tool: Bash
    Steps:
      1. Run: grep -c 'DATABASE_URL\|OPENAI_API_KEY\|EXA_API_KEY\|BETTER_AUTH_SECRET\|BETTER_AUTH_URL' src/env.ts
    Expected Result: Returns 5 (all five vars present)
    Evidence: .sisyphus/evidence/task-3-env-validated.txt

  Scenario: No secret keys exposed to client
    Tool: Bash
    Steps:
      1. Run: grep 'VITE_.*API_KEY\|VITE_.*SECRET' src/env.ts | wc -l
    Expected Result: Returns 0
    Evidence: .sisyphus/evidence/task-3-no-client-secrets.txt
  ```

  **Commit**: YES (group with T1, T2, T4)

 [x] 4. Expand Paraglide Locale Configuration

  **What to do**:
  - Update `project.inlang/settings.json` to add all major languages with 50M+ speakers:
    - Change `"locales": ["en", "de"]` to include: en, de, es, fr, pt, ru, ja, ko, zh, ar, hi, bn, id, ms, tr, vi, th, pl, uk, nl, it, fa, tl (23 total)
  - Update `messages/en.json` with the initial Verifidia UI message keys (replace demo messages):
    - `site_title`: "Verifidia"
    - `site_tagline`: "AI-verified knowledge"
    - `search_placeholder`: "Search for a topic..."
    - `search_button`: "Search"
    - `request_button`: "Request this article"
    - `request_generating`: "Generating article..."
    - `home_recent`: "Recent articles"
    - `home_updated`: "Recently updated"
    - `doc_last_updated`: "Last updated {date}"
    - `doc_refute_button`: "Refute this"
    - `doc_refute_category_factual`: "Factual error"
    - `doc_refute_category_outdated`: "Outdated information"
    - `doc_refute_category_biased`: "Biased content"
    - `doc_refute_category_missing`: "Missing context"
    - `auth_sign_in`: "Sign in"
    - `auth_sign_up`: "Create account"
    - `auth_sign_out`: "Sign out"
    - `locale_label`: "Language"
    - `locale_current`: "Current: {locale}"
    - `status_queued`: "Queued"
    - `status_generating`: "Generating"
    - `status_fact_checking`: "Fact-checking"
    - `status_published`: "Published"
    - `status_failed`: "Failed"
    - `refute_submit`: "Submit refutation"
    - `refute_note_placeholder`: "Explain what is incorrect (optional)"
    - `refute_source_placeholder`: "Source URL (optional)"
    - `login_required`: "Sign in to submit refutations"
  - Keep `messages/de.json` as a placeholder (will be AI-translated in T21)
  - Do NOT create the other 21 locale files yet (T21 handles that)
  - Create `src/lib/i18n-config.ts` that exports the canonical locale list:
    - `export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'bn', 'id', 'ms', 'tr', 'vi', 'th', 'pl', 'uk', 'nl', 'it', 'fa', 'tl'] as const`
    - `export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]`
    - `export const DEFAULT_LOCALE: SupportedLocale = 'en'`
    - This becomes the single source of truth for locale lists. All downstream tasks (T12, T21, T22) import from here instead of hardcoding.
    - Must exactly match the locales array in `project.inlang/settings.json`

  **Must NOT do**:
  - Do not manually translate any messages. Only define English keys.
  - Do not create message files for non-English locales (except keep existing de.json as placeholder)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with T1, T2, T3)
  - **Blocks**: T9 (needs locale list for switcher), T21 (needs message keys)
  - **Blocked By**: None

  **References**:
  - `project.inlang/settings.json:1-12` - Current locale config with only en/de
  - `messages/en.json:1-9` - Current demo messages to replace
  - `messages/de.json:1-9` - Existing German translations (will be regenerated in T21)
  - `src/paraglide/runtime.js` - Generated Paraglide runtime (auto-regenerates)

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: All 23 locales configured
    Tool: Bash
    Steps:
      1. Run: cat project.inlang/settings.json | python3 -c "import sys,json; print(len(json.load(sys.stdin)['locales']))"
    Expected Result: Returns 23
    Evidence: .sisyphus/evidence/task-4-locales-configured.txt

  Scenario: English messages contain all Verifidia keys
    Tool: Bash
    Steps:
      1. Run: cat messages/en.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(len([k for k in d if k!='\$schema']))"
    Expected Result: Returns >= 25 (at least 25 UI message keys)
    Evidence: .sisyphus/evidence/task-4-messages-defined.txt
  ```

  **Commit**: YES (group with T1, T2, T3)
  - Message: `chore: strip demo content and install verifidia dependencies`

### Wave 2: Data + Infrastructure

 [x] 5. Complete Database Schema

  **What to do**:
  - Rewrite `src/db/schema.ts` with the complete Verifidia schema. Remove the `todos` table.
  - **Better Auth tables** (all with `text()` primary keys per Better Auth requirements):
    - `user`: id, name, email (unique), emailVerified, image, createdAt, updatedAt
    - `session`: id, expiresAt, token (unique), createdAt, updatedAt, ipAddress, userAgent, userId (FK to user)
    - `account`: id, accountId, providerId, userId (FK to user), accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt
    - `verification`: id, identifier, value, expiresAt, createdAt, updatedAt
  - **Document tables**:
    - `documents`: id (text PK), slug (text, unique), topic (text), canonicalLocale (text), content (text, nullable, markdown body of canonical version), title (text, nullable), status (text, enum: queued/generating/generated/verified/flagged/failed), verificationScore (integer, nullable), verificationDetails (jsonb, nullable, stores flagged claims), sources (jsonb, nullable, array of {url, title, snippet}), requestedBy (text, FK to user, nullable), createdAt, updatedAt, staleAt (timestamp, default: now + 30 days)
    - `documentTranslations`: id (text PK), documentId (FK to documents), locale (text), title (text), content (text, markdown body), searchVector (tsvector, generated from title + content), status (text, enum: queued/translating/translated/failed), translatedAt (timestamp), createdAt, updatedAt. Unique constraint on (documentId, locale). GIN index on searchVector.
    - `documentRevisions`: id (text PK), documentId (FK to documents), locale (text), title (text), content (text), revisionNumber (integer), reason (text: initial_generation/refutation_update/stale_refresh/translation), createdAt, createdBy (text, nullable)
  - **Refutation tables**:
    - `refutations`: id (text PK), documentId (FK to documents), locale (text), userId (FK to user), category (text, enum: factual_error/outdated/biased/missing_context), selectedText (text), startOffset (integer), endOffset (integer), note (text, nullable), sourceUrl (text, nullable), verdict (text, nullable, enum: upheld/partially_upheld/rejected), confidence (integer, nullable), reasoning (text, nullable), suggestedCorrection (text, nullable), researchSources (jsonb, nullable), status (text, enum: pending/processing/reviewed/applied), createdAt, resolvedAt (nullable)
  - **Job tracking**:
    - `generationJobs`: id (text PK), documentId (FK to documents, nullable), type (text, enum: initial_generation/translation/fact_check/refutation_review/stale_refresh), status (text, enum: queued/running/completed/failed), locale (text), inputData (jsonb), outputData (jsonb, nullable), error (text, nullable), createdAt, completedAt (nullable)
  - Use `customType` for tsvector column or raw SQL via Drizzle's `sql` template
  - Create GIN index on `documentTranslations.searchVector`
  - Export all tables and types from schema.ts

  **Must NOT do**:
  - Do not use `serial()` or `uuid()` for primary keys (Better Auth requires `text`)
  - Do not create migration files manually (use db:push for development)
  - Do not add revision diff columns or diff-related fields

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T7, T8, T9, but T6 depends on this)
  - **Parallel Group**: Wave 2
  - **Blocks**: T6, T10-T15
  - **Blocked By**: T1, T2

  **References**:
  - `src/db/schema.ts:1-7` - Current schema (only todos table, to be replaced)
  - `src/db/index.ts:1-5` - Drizzle connection with `{ schema }` import pattern
  - Better Auth required tables: user, session, account, verification with text PKs (from research)
  - `drizzle-orm/pg-core` exports: pgTable, text, timestamp, boolean, integer, jsonb, index, uniqueIndex
  - Drizzle tsvector pattern: use `customType` or `sql\`tsvector\`` with `generatedAlwaysAs`

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: Schema compiles and tables are created
    Tool: Bash
    Steps:
      1. Run: bun run db:push 2>&1 | tail -5
      2. Run: psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
    Expected Result: db:push succeeds. psql returns tables: account, document_revisions, document_translations, documents, generation_jobs, refutations, session, user, verification (9+ tables)
    Evidence: .sisyphus/evidence/task-5-schema-created.txt

  Scenario: GIN index exists on search_vector
    Tool: Bash
    Steps:
      1. Run: psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename='document_translations' AND indexdef LIKE '%gin%';"
    Expected Result: Returns at least one GIN index row
    Evidence: .sisyphus/evidence/task-5-gin-index.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `feat(db): add complete schema, auth adapter, inngest route, ai service`

 [x] 6. Configure Better Auth with Drizzle Adapter

  **What to do**:
  - Update `src/lib/auth.ts` to add the Drizzle adapter:
    - Import `drizzleAdapter` from `better-auth/adapters/drizzle`
    - Import `db` from `#/db` and `* as schema` from `#/db/schema`
    - Add `database: drizzleAdapter(db, { provider: 'pg', schema })` to the betterAuth config
    - Keep `emailAndPassword: { enabled: true }` and `plugins: [tanstackStartCookies()]`
  - Run `bun run db:push` to apply the schema (if not already done in T5)
  - Verify auth works by checking the API route at `/api/auth` returns a response

  **Must NOT do**:
  - Do not change the auth client (`src/lib/auth-client.ts`)
  - Do not add OAuth providers (email/password only for V1)
  - Do not add admin roles or permission system

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T5)
  - **Parallel Group**: Wave 2 (sequential after T5)
  - **Blocks**: T15, T20
  - **Blocked By**: T5

  **References**:
  - `src/lib/auth.ts:1-9` - Current auth config without Drizzle adapter
  - `src/lib/auth-client.ts:1-3` - Auth client (keep unchanged)
  - `src/routes/api/auth/$.ts:1-11` - Auth API route handler (keep unchanged)
  - `src/db/index.ts:1-5` - db export pattern to import
  - Better Auth Drizzle adapter docs: `drizzleAdapter(db, { provider: 'pg', schema })`

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: Auth API responds
    Tool: Bash
    Steps:
      1. Start dev server: bun run dev &
      2. Wait 5 seconds
      3. Run: curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/get-session
    Expected Result: Returns 200 (not 500 or 404)
    Evidence: .sisyphus/evidence/task-6-auth-responds.txt

  Scenario: User table exists with correct columns
    Tool: Bash
    Steps:
      1. Run: psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='user' ORDER BY ordinal_position;"
    Expected Result: Shows columns: id (text), name (text), email (text), email_verified (boolean), image (text), created_at (timestamp), updated_at (timestamp)
    Evidence: .sisyphus/evidence/task-6-user-table.txt
  ```

  **Commit**: YES (group with Wave 2)

 [x] 7. Inngest Client and Serve Route

  **What to do**:
  - Create `src/lib/inngest.ts`:
    - Import `Inngest` from `inngest`
    - Export `inngest` client instance: `new Inngest({ id: 'verifidia' })`
    - Define and export event type map for TypeScript safety (document.requested, document.generated, factcheck.requested, translation.requested, refutation.submitted, stale.detected)
  - Create `src/routes/api/inngest.ts`:
    - Use `createFileRoute('/api/inngest')` with `server.handlers` for GET, POST, PUT
    - Import `serve` from `inngest/next` (or the appropriate adapter for the framework)
    - Wire up serve with the inngest client and an empty functions array initially (functions added in Wave 3)
    - Note: If `inngest/next` does not work with TanStack Start, try using the raw HTTP handler approach from the Inngest SDK
  - Add `"inngest:dev": "npx inngest-cli@latest dev"` script to package.json for local development

  **Must NOT do**:
  - Do not create any Inngest functions yet (those are T10-T14)
  - Do not use `inngest/express` or `inngest/fastify` adapters

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T5, T8, T9)
  - **Parallel Group**: Wave 2
  - **Blocks**: T10, T11, T12, T13, T14, T15
  - **Blocked By**: T1, T2

  **References**:
  - `src/routes/api/auth/$.ts:1-11` - Pattern for API route with server.handlers (GET, POST)
  - Inngest docs: serve function returns { GET, POST, PUT } handlers
  - `src/lib/auth.ts` - Similar pattern: export a configured client instance

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: Inngest route responds to PUT (registration)
    Tool: Bash
    Steps:
      1. Start dev server: bun run dev &
      2. Wait 5 seconds
      3. Run: curl -s http://localhost:3000/api/inngest -X PUT | head -20
    Expected Result: Returns JSON with Inngest registration data (not 404 or 500)
    Evidence: .sisyphus/evidence/task-7-inngest-route.txt

  Scenario: Inngest client module exports correctly
    Tool: Bash
    Steps:
      1. Run: grep -c 'export.*inngest\|export.*Inngest' src/lib/inngest.ts
    Expected Result: Returns >= 1
    Evidence: .sisyphus/evidence/task-7-inngest-client.txt
  ```

  **Commit**: YES (group with Wave 2)

 [x] 8. OpenAI + Exa AI Service Module

  **What to do**:
  - Create `src/lib/ai.ts` with the following exports:
    - `openai`: Configured OpenAI client instance (`new OpenAI()`)
    - `exa`: Configured Exa client instance (`new Exa(process.env.EXA_API_KEY)`)
    - `AI_MODEL`: Constant string for the model name, default `'gpt-5.2'` (read from env var `OPENAI_MODEL` with fallback)
    - `searchWeb(query: string, options?)`: Wrapper around `exa.searchAndContents()` with defaults (numResults: 5, type: 'auto', livecrawl: 'always', contents: { text: true, maxCharacters: 5000 })
    - `generateStructured<T>(schema: ZodType<T>, systemPrompt: string, userPrompt: string)`: Wrapper around `openai.chat.completions.parse()` with zodResponseFormat. Returns parsed result. Handles refusal check.
    - `researchAndSynthesize(query: string, systemPrompt: string)`: Uses `openai.chat.completions.runTools()` with Exa as a zodFunction tool. Returns final text content. Non-streaming.
  - All functions must be server-only (no 'use client' or browser imports)
  - Import Zod for schema definitions, use zodResponseFormat and zodFunction from openai/helpers/zod

  **Must NOT do**:
  - Do not use `@tanstack/ai-openai` or any TanStack AI wrappers
  - Do not implement streaming (all calls are async/await, non-streaming)
  - Do not hardcode API keys (use process.env)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T5, T7, T9)
  - **Parallel Group**: Wave 2
  - **Blocks**: T10, T11, T12, T13, T14
  - **Blocked By**: T1, T2, T3

  **References**:
  - `.env.local:4-5` - OPENAI_API_KEY and EXA_API_KEY values
  - OpenAI SDK: `import OpenAI from 'openai'`, `import { zodResponseFormat, zodFunction } from 'openai/helpers/zod'`
  - Exa SDK: `import Exa from 'exa-js'`
  - Research findings: `openai.chat.completions.parse()` for structured, `runTools()` for agent loops
  - Research findings: `exa.searchAndContents(query, { numResults, type, livecrawl, contents })` pattern

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: AI module exports all required functions
    Tool: Bash
    Steps:
      1. Run: grep -c 'export' src/lib/ai.ts
    Expected Result: Returns >= 5 (openai, exa, AI_MODEL, searchWeb, generateStructured, researchAndSynthesize)
    Evidence: .sisyphus/evidence/task-8-ai-exports.txt

  Scenario: No TanStack AI imports in ai.ts
    Tool: Bash
    Steps:
      1. Run: grep '@tanstack/ai' src/lib/ai.ts | wc -l
    Expected Result: Returns 0
    Evidence: .sisyphus/evidence/task-8-no-tanstack-ai.txt
  ```

  **Commit**: YES (group with Wave 2)

 [x] 9. App Shell: Root Layout, Header, Navigation

  **What to do**:
  - Rewrite `src/routes/__root.tsx`:
    - Remove TanStack devtools panel, store devtools, demo-specific imports
    - Keep TanStack Query provider, HeadContent, Scripts, Paraglide locale setup
    - Update page title to "Verifidia"
    - Add clean, professional body structure: header bar + main content area
    - Use Nucleo icons (not Lucide) for any icons in the shell
  - Rewrite `src/components/Header.tsx`:
    - Remove all demo navigation links and sidebar
    - Create a clean top header bar with:
      - Verifidia logo/wordmark (text, not image) on the left
      - Search input in the center (just the input, functional search comes in T17)
      - Locale switcher + auth status on the right
    - Use Nucleo icons for menu/search icons
    - Mobile-responsive: stack search below on small screens
    - Design: clean, light background, no gradients, subtle border-bottom, professional
  - Rewrite `src/routes/index.tsx`:
    - Replace TanStack Start landing page with a placeholder for the newspaper layout
    - Simple centered content: "Verifidia" heading, tagline, and a note that articles will appear here
    - Use Paraglide `m.site_title()`, `m.site_tagline()` for i18n text
  - Redesign `src/components/LocaleSwitcher.tsx`:
    - Use a dropdown/select instead of inline buttons (23 locales won't fit inline)
    - Use Nucleo globe icon
    - Clean, minimal style matching the header
  - Install any additional shadcn components needed: `bunx shadcn@latest add dropdown-menu`

  **Must NOT do**:
  - Do not use Lucide icons (use Nucleo)
  - Do not add gradients, badges, or decorative elements
  - Do not add em-dashes in any text
  - Do not build the full newspaper layout yet (T16 handles that)
  - Do not build the full search functionality yet (T17 handles that)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T5, T7, T8)
  - **Parallel Group**: Wave 2
  - **Blocks**: T16, T17, T18, T19, T20
  - **Blocked By**: T1, T2, T4

  **References**:
  - `src/routes/__root.tsx:1-87` - Current root layout to rewrite
  - `src/components/Header.tsx:1-265` - Current demo header/sidebar to rewrite
  - `src/routes/index.tsx:1-118` - Current TanStack landing page to rewrite
  - `src/components/LocaleSwitcher.tsx:1-46` - Current locale switcher to redesign
  - `src/integrations/tanstack-query/root-provider.tsx` - Query provider to keep
  - `src/paraglide/runtime.js` - getLocale(), setLocale() APIs
  - `src/paraglide/messages.js` - m.site_title(), m.site_tagline() etc.
  - `#/components/ui/button.tsx` - Existing shadcn button component
  - `#/components/ui/input.tsx` - Existing shadcn input component
  - `src/styles.css:1-139` - Current theme (zinc base color, oklch vars)
  - Nucleo: `import { IconSearch, IconGlobe, IconUser } from 'nucleo-core-outline-24'`

  **Acceptance Criteria**:

  **QA Scenarios:**

  ```
  Scenario: App shell renders without errors
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000/
      2. Wait for page load (timeout: 10s)
      3. Assert: Element with text "Verifidia" is visible
      4. Assert: A search input element exists on the page
      5. Assert: No console errors in browser
    Expected Result: Page loads with Verifidia header, search input visible, no errors
    Evidence: .sisyphus/evidence/task-9-app-shell.png

  Scenario: No Lucide icons in shell
    Tool: Bash
    Steps:
      1. Run: grep -r 'lucide-react' src/routes/__root.tsx src/components/Header.tsx src/components/LocaleSwitcher.tsx src/routes/index.tsx 2>/dev/null | wc -l
    Expected Result: Returns 0
    Evidence: .sisyphus/evidence/task-9-no-lucide.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `feat(db): add complete schema, auth adapter, inngest route, ai service`
---


### Wave 3: AI Pipelines (T10-T14) + API Routes (T15)

 [x] 10. Document Generation Inngest Function

  **What to do**:
  - Create `src/inngest/generate-document.ts` with an Inngest function triggered by `document/generation.requested` event
  - Function receives `{ topic: string, locale: string, documentId: string }`
  - Step 1 (`research`): Call `src/lib/ai.ts` Exa search with 3-5 queries derived from the topic. Collect top sources with URLs, titles, snippets
  - Step 2 (`outline`): Send research results to GPT 5.2 with a structured output schema (Zod) requesting: `{ title: string, sections: Array<{ heading: string, keyPoints: string[] }>, estimatedLength: number }`. Prompt must instruct neutral, encyclopedic tone. No em-dashes.
  - Step 3 (`draft`): Send outline + research to GPT 5.2 with structured output requesting full Markdown body per section. Prompt: "Write in neutral encyclopedic style. Use short sentences. Cite sources inline as [1], [2]. No em-dashes. No marketing language. No superlatives unless sourced."
  - Step 4 (`assemble`): Combine sections into a single Markdown document. Insert source list at bottom as `## Sources` with numbered URLs
  - Step 5 (`save`): Update the document row in DB: set `content` to the Markdown, `status` to `generated`, `sources` to the JSON array of source objects `{ url, title, snippet }`
  - Step 6 (`fan-out-verification`): Send `document/verification.requested` event with `{ documentId }` to trigger fact-checking (T11)
  - All GPT calls use `chat.completions.parse()` (non-streaming) with `zodResponseFormat`
  - Use `step.run()` for each step to get Inngest durability

  **Must NOT do**:
  - No streaming responses
  - No em-dashes in any prompt text or template
  - No `@tanstack/ai-*` imports
  - No hardcoded model names; import from `src/lib/ai.ts` constants
  - No revision history tracking in V1

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Multi-step AI pipeline with structured output, prompt engineering, and Inngest durable execution patterns
  - **Skills**: []
    - No specialized skills needed; agent needs general TS + API knowledge
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction
    - `frontend-ui-ux`: Backend pipeline, no UI

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T11, T12, T13, T14)
  - **Blocks**: T15 (API routes need to trigger this function)
  - **Blocked By**: T5 (schema), T7 (Inngest client), T8 (AI service)

  **References**:

  **Pattern References**:
  - `src/lib/ai.ts` (T8 output) - OpenAI client, Exa client, model constants, `zodResponseFormat` usage
  - `src/lib/inngest.ts` (T7 output) - Inngest client instance

  **API/Type References**:
  - `src/db/schema.ts` (T5 output) - `documents` table: `id`, `topic`, `locale`, `content`, `status`, `sources`, `createdAt`, `updatedAt`
  - OpenAI `chat.completions.parse()` with `zodResponseFormat` - returns typed structured output

  **External References**:
  - Inngest `step.run()` pattern: Each step is individually retryable. Return value from `step.run('name', async () => { ... })` is memoized
  - Exa `searchAndContents()`: Pass `{ query, numResults: 5, livecrawl: 'always' }` to get fresh results with full page content

  **Acceptance Criteria**:
  - [ ] File exists: `src/inngest/generate-document.ts`
  - [ ] Exports a single Inngest function triggered by `document/generation.requested`
  - [ ] Uses 6 `step.run()` calls for durability
  - [ ] All GPT calls use `chat.completions.parse()` (not `.create()`)
  - [ ] No em-dashes in any string literal or template
  - [ ] Function is registered in `src/routes/api/inngest.ts` serve call

  **QA Scenarios:**

  ```
  Scenario: Function registers with Inngest dev server
    Tool: Bash (curl)
    Preconditions: Dev server running (`bun run dev`), Inngest dev server running (`npx inngest-cli@latest dev`)
    Steps:
      1. curl http://localhost:8288/v1/functions | jq '.[] | select(.name | contains("generate"))'
      2. Verify function appears in list with correct trigger event
    Expected Result: Function listed with trigger `document/generation.requested`
    Failure Indicators: Function not in list, wrong trigger event name
    Evidence: .sisyphus/evidence/task-10-inngest-register.txt

  Scenario: No em-dashes in prompts
    Tool: Bash (grep)
    Preconditions: File exists
    Steps:
      1. Run: grep -P '\x{2014}' src/inngest/generate-document.ts | wc -l
    Expected Result: Returns 0
    Failure Indicators: Any match found
    Evidence: .sisyphus/evidence/task-10-no-emdash.txt

  Scenario: Structured output schema validates
    Tool: Bash (bun)
    Preconditions: File exists
    Steps:
      1. Run: bun -e "import './src/inngest/generate-document.ts'; console.log('imports ok')"
    Expected Result: No import errors, no type errors
    Failure Indicators: Module resolution failure, type error
    Evidence: .sisyphus/evidence/task-10-import-check.txt
  ```

  **Commit**: YES (group with Wave 3)
  - Message: `feat(pipeline): add generation, fact-check, translation, stale, refutation pipelines`

 [x] 11. Fact-Checking Pipeline (3-Agent Verification)

  **What to do**:
  - Create `src/inngest/verify-document.ts` with an Inngest function triggered by `document/verification.requested`
  - Function receives `{ documentId: string }`
  - Step 1 (`load-document`): Fetch document from DB by ID. Extract content sections and source URLs
  - Step 2 (`claim-extraction`): Send document content to GPT 5.2 with structured output. Schema: `{ claims: Array<{ text: string, sectionIndex: number, confidence: 'high' | 'medium' | 'low' }> }`. Prompt: "Extract all factual claims from this document. Each claim should be a single verifiable statement."
  - Step 3 (`source-verification`): For each claim (batch of 5), call Exa search to find corroborating or contradicting sources. Use `step.run()` per batch for durability. Return `{ claimIndex: number, verified: boolean, sources: string[], notes: string }[]`
  - Step 4 (`cross-reference`): Send claims + verification results to GPT 5.2 with structured output. Schema: `{ overallScore: number, flaggedClaims: Array<{ claimIndex: number, issue: string, severity: 'critical' | 'warning' | 'info' }>, summary: string }`. Prompt: "Evaluate verification results. Flag claims that lack source support or have contradicting evidence."
  - Step 5 (`update-status`): Update document in DB: set `verificationScore` to `overallScore`, set `status` to `verified` if score >= 70 or `flagged` if below. Store `flaggedClaims` in `verificationDetails` JSON column
  - Use `step.run()` for each step. Batch claim verification to avoid rate limits

  **Must NOT do**:
  - No streaming
  - No em-dashes in prompts
  - No automatic content modification (flag only, do not rewrite)
  - No blocking the generation pipeline (runs async after generation)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex multi-agent AI pipeline with claim extraction, search verification, and cross-referencing logic
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T10, T12, T13, T14)
  - **Blocks**: None directly (runs after generation)
  - **Blocked By**: T5 (schema), T7 (Inngest client), T8 (AI service)

  **References**:

  **Pattern References**:
  - `src/inngest/generate-document.ts` (T10) - Same Inngest function pattern with `step.run()` chains
  - `src/lib/ai.ts` (T8 output) - Exa search and GPT structured output helpers

  **API/Type References**:
  - `src/db/schema.ts` (T5) - `documents.verificationScore` (integer), `documents.verificationDetails` (jsonb), `documents.status` enum

  **External References**:
  - Inngest concurrency: `{ concurrency: { limit: 3 } }` on function config to avoid rate-limiting OpenAI

  **Acceptance Criteria**:
  - [ ] File exists: `src/inngest/verify-document.ts`
  - [ ] Exports Inngest function triggered by `document/verification.requested`
  - [ ] 5 `step.run()` calls for durability
  - [ ] Claim extraction uses structured output with Zod schema
  - [ ] Source verification batches claims (max 5 per batch)
  - [ ] Document status updated to `verified` or `flagged` based on score threshold
  - [ ] No em-dashes in any string

  **QA Scenarios:**

  ```
  Scenario: Function registers with Inngest
    Tool: Bash (curl)
    Preconditions: Dev server + Inngest dev server running
    Steps:
      1. curl http://localhost:8288/v1/functions | jq '.[] | select(.name | contains("verify"))'
    Expected Result: Function listed with trigger `document/verification.requested`
    Evidence: .sisyphus/evidence/task-11-inngest-register.txt

  Scenario: No em-dashes in prompts
    Tool: Bash (grep)
    Steps:
      1. grep -P '\x{2014}' src/inngest/verify-document.ts | wc -l
    Expected Result: Returns 0
    Evidence: .sisyphus/evidence/task-11-no-emdash.txt
  ```

  **Commit**: YES (group with Wave 3)
  - Message: `feat(pipeline): add generation, fact-check, translation, stale, refutation pipelines`

 [x] 12. Translation Fan-Out Pipeline

  **What to do**:
  - Create `src/inngest/translate-document.ts` with an Inngest function triggered by `document/translation.requested`
  - Function receives `{ documentId: string, sourceLocale: string }`
  - Step 1 (`load-source`): Fetch the canonical (source locale) document from DB
  - Step 2 (`determine-targets`): Get all 23 supported locales from `src/lib/i18n-config.ts` (T4 output), filter out sourceLocale. Result: array of target locale codes
  - Step 3 (`translate-batch`): For each target locale, use `step.run('translate-{locale}', ...)` to:
    - Send document title + content to GPT 5.2 with structured output: `{ title: string, content: string }`
    - Prompt: "Translate the following encyclopedic document from {sourceLocale} to {targetLocale}. Preserve all Markdown formatting, section headings, and source citations. Maintain neutral encyclopedic tone. Do not add or remove information. Do not use em-dashes."
    - Upsert a `document_translations` row: `{ documentId, locale: targetLocale, title, content, status: 'translated' }`
  - Use concurrency limit of 5 to avoid rate-limiting (22 locales = ~5 batches)
  - If a translation step fails, Inngest retries that specific step (not the whole function)

  **Must NOT do**:
  - No streaming
  - No em-dashes in prompts or translated output validation
  - No translating back to source locale
  - No manual translation of any string

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Straightforward but high-volume pipeline with concurrency management and DB upserts
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser interaction

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T10, T11, T13, T14)
  - **Blocks**: T22 (locale-aware routing needs translations to exist)
  - **Blocked By**: T5 (schema for `document_translations`), T7 (Inngest), T8 (AI service)

  **References**:

  **Pattern References**:
  - `src/inngest/generate-document.ts` (T10) - Inngest function pattern
  - `src/lib/i18n-config.ts` (T4 output) - List of 23 supported locale codes

  **API/Type References**:
  - `src/db/schema.ts` (T5) - `documentTranslations` table: `documentId`, `locale`, `title`, `content`, `status`, `translatedAt`

  **External References**:
  - Inngest concurrency config: `{ concurrency: { limit: 5 } }` to throttle parallel translation calls
  - Inngest step fan-out: Each `step.run('translate-fr', ...)` is independently retryable

  **Acceptance Criteria**:
  - [ ] File exists: `src/inngest/translate-document.ts`
  - [ ] Exports Inngest function triggered by `document/translation.requested`
  - [ ] Iterates over all target locales (22, excluding source)
  - [ ] Each locale translation is a separate `step.run()` call
  - [ ] Concurrency limited to 5
  - [ ] Upserts `document_translations` rows
  - [ ] No em-dashes in prompts

  **QA Scenarios:**

  ```
  Scenario: Function registers with correct trigger
    Tool: Bash (curl)
    Preconditions: Dev server + Inngest dev server running
    Steps:
      1. curl http://localhost:8288/v1/functions | jq '.[] | select(.name | contains("translate"))'
    Expected Result: Function listed with trigger `document/translation.requested`
    Evidence: .sisyphus/evidence/task-12-inngest-register.txt

  Scenario: Concurrency limit is configured
    Tool: Bash (grep)
    Steps:
      1. grep -A2 'concurrency' src/inngest/translate-document.ts
    Expected Result: Shows `limit: 5` or similar concurrency config
    Evidence: .sisyphus/evidence/task-12-concurrency.txt
  ```

  **Commit**: YES (group with Wave 3)
  - Message: `feat(pipeline): add generation, fact-check, translation, stale, refutation pipelines`

 [x] 13. Stale Content Cron + Keyword Fan-Out

  **What to do**:
  - Create `src/inngest/refresh-stale.ts` with TWO Inngest functions:
  - **Function A**: `refresh-stale/check` - Cron-triggered (e.g., `0 0 * * 0` = weekly on Sunday)
    - Step 1: Query DB for documents where `updatedAt < NOW() - INTERVAL '30 days'` and `status = 'verified'`
    - Step 2: For each stale document, send `document/refresh.requested` event with `{ documentId }`. Use `step.sendEvent()` for fan-out
  - **Function B**: `refresh-stale/process` - Triggered by `document/refresh.requested`
    - Step 1 (`research`): Re-run Exa search on the document's topic to find new information
    - Step 2 (`compare`): Send old content + new research to GPT 5.2. Structured output: `{ hasSignificantUpdates: boolean, updatedSections: Array<{ sectionIndex: number, newContent: string, reason: string }> }`
    - Step 3 (`update`): If `hasSignificantUpdates`, merge updated sections into document. Update `content`, `updatedAt`, set `status` back to `generated` to re-trigger verification
    - Step 4 (`re-verify`): If updated, send `document/verification.requested` event
    - Step 5 (`re-translate`): If updated, send `document/translation.requested` event to cascade translations

  **Must NOT do**:
  - No streaming
  - No em-dashes in prompts
  - No full document regeneration (only update changed sections)
  - No refreshing documents that are currently being processed (check status != 'generating')

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Two functions with cron scheduling, fan-out events, and conditional logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T10, T11, T12, T14)
  - **Blocks**: None (background maintenance pipeline)
  - **Blocked By**: T5 (schema), T7 (Inngest), T8 (AI service), T10 (generation pattern)

  **References**:

  **Pattern References**:
  - `src/inngest/generate-document.ts` (T10) - Research + GPT pattern
  - `src/inngest/verify-document.ts` (T11) - Event fan-out pattern

  **API/Type References**:
  - `src/db/schema.ts` (T5) - `documents.updatedAt`, `documents.status`

  **External References**:
  - Inngest cron: `{ cron: '0 0 * * 0' }` in function config
  - Inngest `step.sendEvent()`: Fan-out to multiple function invocations

  **Acceptance Criteria**:
  - [ ] File exists: `src/inngest/refresh-stale.ts`
  - [ ] Exports 2 Inngest functions: cron checker + per-document refresher
  - [ ] Cron function uses `step.sendEvent()` for fan-out
  - [ ] Refresh function only updates changed sections, not full rewrite
  - [ ] Triggers re-verification and re-translation on update
  - [ ] Skips documents with status `generating`
  - [ ] No em-dashes

  **QA Scenarios:**

  ```
  Scenario: Both functions register with Inngest
    Tool: Bash (curl)
    Preconditions: Dev server + Inngest dev server running
    Steps:
      1. curl http://localhost:8288/v1/functions | jq '[.[] | select(.name | contains("refresh"))] | length'
    Expected Result: Returns 2
    Evidence: .sisyphus/evidence/task-13-inngest-register.txt

  Scenario: Cron function has correct schedule
    Tool: Bash (grep)
    Steps:
      1. grep -A2 'cron' src/inngest/refresh-stale.ts
    Expected Result: Contains weekly cron expression
    Evidence: .sisyphus/evidence/task-13-cron-config.txt
  ```

  **Commit**: YES (group with Wave 3)
  - Message: `feat(pipeline): add generation, fact-check, translation, stale, refutation pipelines`

 [x] 14. Refutation Processing Pipeline

  **What to do**:
  - Create `src/inngest/process-refutation.ts` with an Inngest function triggered by `refutation/submitted`
  - Function receives `{ refutationId: string, documentId: string, selectedText: string, category: string, userExplanation: string, userId: string }`
  - Step 1 (`load-context`): Fetch the document content and the surrounding section containing `selectedText`
  - Step 2 (`research`): Use Exa to search for evidence related to the refutation claim. Query: combine selectedText + category context
  - Step 3 (`evaluate`): Send to GPT 5.2 with structured output:
    - Schema: `{ verdict: 'upheld' | 'partially_upheld' | 'rejected', confidence: number, reasoning: string, suggestedCorrection: string | null, sources: Array<{ url: string, relevance: string }> }`
    - Prompt: "Evaluate this refutation of an encyclopedic document. Category: {category}. The user claims the following text is problematic: '{selectedText}'. Their explanation: '{userExplanation}'. Original section context: '{sectionContent}'. Research findings: {researchResults}. Determine if the refutation has merit. Be rigorous and evidence-based."
  - Step 4 (`update`): Update `refutations` row: set `verdict`, `confidence`, `reasoning`, `suggestedCorrection`, `researchSources`, `status` to `reviewed`
  - Step 5 (`apply-if-upheld`): If verdict is `upheld` and confidence > 80:
    - Update document section with `suggestedCorrection`
    - Set document `status` to `generated` to re-trigger verification
    - Send `document/verification.requested` event
    - Send `document/translation.requested` event to propagate fix

  **Must NOT do**:
  - No streaming
  - No em-dashes in prompts
  - No automatic application of `partially_upheld` refutations (manual review needed in V2)
  - No notifying users (no email/notification system in V1)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-step pipeline with research, evaluation, and conditional document updates
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T10, T11, T12, T13)
  - **Blocks**: T15 (API routes reference this pipeline)
  - **Blocked By**: T5 (schema for `refutations` table), T7 (Inngest), T8 (AI service)

  **References**:

  **Pattern References**:
  - `src/inngest/verify-document.ts` (T11) - Same research + evaluate pattern
  - `src/inngest/generate-document.ts` (T10) - Inngest function structure

  **API/Type References**:
  - `src/db/schema.ts` (T5) - `refutations` table: `id`, `documentId`, `userId`, `selectedText`, `category`, `explanation`, `verdict`, `confidence`, `reasoning`, `suggestedCorrection`, `status`

  **External References**:
  - Refutation categories: `factual_error`, `outdated`, `biased`, `missing_context`

  **Acceptance Criteria**:
  - [ ] File exists: `src/inngest/process-refutation.ts`
  - [ ] Exports Inngest function triggered by `refutation/submitted`
  - [ ] 5 `step.run()` calls for durability
  - [ ] Evaluation uses structured output with verdict enum
  - [ ] Auto-applies only `upheld` refutations with confidence > 80
  - [ ] Triggers re-verification and re-translation on document update
  - [ ] No em-dashes

  **QA Scenarios:**

  ```
  Scenario: Function registers with Inngest
    Tool: Bash (curl)
    Preconditions: Dev server + Inngest dev server running
    Steps:
      1. curl http://localhost:8288/v1/functions | jq '.[] | select(.name | contains("refutation"))'
    Expected Result: Function listed with trigger `refutation/submitted`
    Evidence: .sisyphus/evidence/task-14-inngest-register.txt

  Scenario: Verdict enum is correctly typed
    Tool: Bash (grep)
    Steps:
      1. grep -E "upheld|partially_upheld|rejected" src/inngest/process-refutation.ts | head -5
    Expected Result: All three verdict values present in Zod schema or type definition
    Evidence: .sisyphus/evidence/task-14-verdict-enum.txt
  ```

  **Commit**: YES (group with Wave 3)
  - Message: `feat(pipeline): add generation, fact-check, translation, stale, refutation pipelines`

 [x] 15. API Routes: Search, Documents, Generation, Refutation

  **What to do**:
  - Create TanStack Start server handler routes for all API endpoints:
  - **`src/routes/api/search.ts`**: GET handler
    - Query param: `q` (search term), `locale` (default: current locale)
    - Use PostgreSQL full-text search: `to_tsvector(config, content) @@ plainto_tsquery(config, q)`
    - CJK locales (zh, ja, ko) use `'simple'` config; others use locale-specific config or `'english'` fallback
    - Return: `{ results: Array<{ id, title, snippet, locale, verificationScore, updatedAt }> }`
    - Paginate: `limit` (default 20) + `offset` params
  - **`src/routes/api/documents/$documentId.ts`**: GET handler
    - Return full document with translation fallback: try `document_translations` for requested locale, fall back to canonical document
    - Response: `{ id, title, content, locale, status, verificationScore, sources, translations: string[], refutations: Array<{ selectedText, category, verdict }> }`
  - **`src/routes/api/documents/request.ts`**: POST handler
    - Body: `{ topic: string, locale: string }`
    - Auth required (use Better Auth session check)
    - Check if document already exists for this topic+locale; if yes, return existing
    - Create document row with `status: 'generating'`
    - Send `document/generation.requested` Inngest event
    - Return: `{ documentId, status: 'generating' }` with 201 status
  - **`src/routes/api/documents/$documentId/refute.ts`**: POST handler
    - Auth required
    - Body: `{ selectedText: string, category: 'factual_error' | 'outdated' | 'biased' | 'missing_context', explanation: string }`
    - Validate with Zod
    - Create `refutations` row with `status: 'pending'`
    - Send `refutation/submitted` Inngest event
    - Return: `{ refutationId, status: 'pending' }` with 201 status
  - All routes use `createFileRoute` with `server.handlers` pattern from TanStack Start
  - Zod validation on all inputs
  - Proper HTTP status codes (200, 201, 400, 401, 404)

  **Must NOT do**:
  - No em-dashes in error messages
  - No `@tanstack/ai-*` imports
  - No streaming responses
  - No admin-only routes
  - No rate limiting in V1 (Inngest handles queue management)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple route files with DB queries, auth checks, Zod validation, and Inngest event dispatch
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential after Wave 3 pipelines
  - **Blocks**: T16-T19 (UI pages consume these routes)
  - **Blocked By**: T5 (schema), T6 (auth), T7 (Inngest), T10-T14 (pipeline functions to trigger)

  **References**:

  **Pattern References**:
  - `src/routes/api/auth/$.ts` - Existing TanStack Start API route pattern (use `createFileRoute` with `server: { handlers: { ... } }`)
  - `src/db/index.ts` - Drizzle query patterns with `db.select()`, `db.insert()`

  **API/Type References**:
  - `src/db/schema.ts` (T5) - All tables: `documents`, `documentTranslations`, `refutations`
  - `src/lib/auth.ts` (T6) - Session verification for protected routes
  - `src/lib/inngest.ts` (T7) - `inngest.send()` for dispatching events

  **External References**:
  - TanStack Start API routes: `export const Route = createFileRoute('/api/path')({ server: { handlers: { GET: async ({ request }) => { ... }, POST: async ({ request }) => { ... } } } })`
  - PostgreSQL FTS: `WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)`
  - Drizzle `sql` template for raw FTS queries: `import { sql } from 'drizzle-orm'`

  **Acceptance Criteria**:
  - [ ] Files exist: `src/routes/api/search.ts`, `src/routes/api/documents/$documentId.ts`, `src/routes/api/documents/request.ts`, `src/routes/api/documents/$documentId/refute.ts`
  - [ ] Search route returns paginated results with FTS
  - [ ] Document route returns translation-aware content with fallback
  - [ ] Request route requires auth and creates document + dispatches Inngest event
  - [ ] Refute route requires auth, validates with Zod, creates refutation + dispatches event
  - [ ] All routes use proper HTTP status codes
  - [ ] No em-dashes in error messages

  **QA Scenarios:**

  ```
  Scenario: Search API returns results
    Tool: Bash (curl)
    Preconditions: Dev server running, at least one document in DB (seed or manually inserted)
    Steps:
      1. curl -s http://localhost:3000/api/search?q=test&locale=en | jq '.results | length'
    Expected Result: Returns a number >= 0 (valid JSON response with results array)
    Failure Indicators: 500 error, malformed JSON, missing results key
    Evidence: .sisyphus/evidence/task-15-search-api.txt

  Scenario: Document request requires auth
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/documents/request -H 'Content-Type: application/json' -d '{"topic":"test","locale":"en"}'
    Expected Result: Returns 401 (unauthorized)
    Failure Indicators: Returns 200 or 500
    Evidence: .sisyphus/evidence/task-15-auth-required.txt

  Scenario: Refute route validates input
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:3000/api/documents/fake-id/refute -H 'Content-Type: application/json' -d '{"bad":"data"}'
    Expected Result: Returns 400 (bad request) or 401 (unauthorized)
    Failure Indicators: Returns 200 or 500
    Evidence: .sisyphus/evidence/task-15-refute-validation.txt
  ```

  **Commit**: YES
  - Message: `feat(api): add search, document, generation, and refutation API routes`

### Wave 4: Frontend Pages (T16-T20)

- [ ] 16. Home Page: Newspaper Layout

  **What to do**:
  - Replace `src/routes/index.tsx` with the Verifidia home page
  - Layout: newspaper-style grid with recent and featured documents
    - Top section: hero area with site title, tagline, and search bar (links to /search)
    - Main grid: 2-column layout on desktop. Lead article (large card, left) + 3-4 smaller article cards (right)
    - Below fold: "Recently Updated" and "Recently Verified" sections in 3-column grids
  - Each article card shows: title, first ~150 chars of content as excerpt, verification score badge (just a number/icon, no cheesy badge), locale, updated date
  - Cards link to `/documents/{id}` route
  - Data fetching: Use TanStack Router `loader` to call `GET /api/search` with no query (returns recent) or a dedicated `/api/documents/recent` endpoint if needed
  - Use Nucleo icons: magnifying glass for search, checkmark for verified, clock for recent
  - Use `@streamdown/react` or raw Streamdown for rendering excerpts (just first paragraph, no full render)
  - Responsive: single column on mobile, 2-column on tablet, full newspaper on desktop
  - All text must use Paraglide `m.*()` messages for i18n
  - Style: Tailwind utility classes. Clean, dry, professional. No gradients. No decorative elements.

  **Must NOT do**:
  - No gradients or decorative badges
  - No em-dashes in any text or template
  - No lucide-react icons
  - No placeholder/lorem ipsum content (use actual data or empty state)
  - No infinite scroll (simple pagination or "load more" button)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI-heavy layout with responsive grid, article cards, and design system integration
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Needed for newspaper layout design decisions, responsive grid, card design
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for implementation (only for QA, handled by scenario)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T17, T18, T19, T20)
  - **Blocks**: T21 (needs all pages for i18n string collection)
  - **Blocked By**: T9 (app shell), T15 (API routes for data)

  **References**:

  **Pattern References**:
  - `src/routes/__root.tsx` (T9 output) - Root layout with header, nav, locale switcher
  - `src/routes/index.tsx` (current) - TanStack Router `createFileRoute` pattern

  **API/Type References**:
  - `GET /api/search` (T15) - Returns `{ results: Array<{ id, title, snippet, locale, verificationScore, updatedAt }> }`
  - `src/db/schema.ts` (T5) - Document type for type-safe data handling

  **External References**:
  - TanStack Router loader: `createFileRoute('/')({ loader: async () => { ... }, component: HomePage })`
  - Streamdown React: `import { Markdown } from '@streamdown/react'` for rendering excerpts
  - Nucleo icons: Import from installed nucleo packages

  **Acceptance Criteria**:
  - [ ] `src/routes/index.tsx` renders newspaper-style layout
  - [ ] Shows recent documents fetched from API
  - [ ] Each card links to `/documents/{id}`
  - [ ] Search bar present and links to `/search?q=...`
  - [ ] Uses Nucleo icons (no lucide)
  - [ ] All visible text uses Paraglide `m.*()` for i18n
  - [ ] Responsive: works on mobile, tablet, desktop
  - [ ] No gradients, no decorative badges, no em-dashes

  **QA Scenarios:**

  ```
  Scenario: Home page renders with article cards
    Tool: Playwright
    Preconditions: Dev server running, at least 1 document in DB
    Steps:
      1. Navigate to http://localhost:3000/
      2. Wait for page load (network idle)
      3. Assert: h1 or site title element exists
      4. Assert: at least 1 article card element visible (look for link elements with /documents/ href)
      5. Assert: search input or search link visible
      6. Screenshot full page
    Expected Result: Newspaper layout with article cards, search bar, professional design
    Failure Indicators: Blank page, 500 error, no article cards rendered
    Evidence: .sisyphus/evidence/task-16-home-page.png

  Scenario: No lucide icons on home page
    Tool: Bash (grep)
    Steps:
      1. grep -r 'lucide-react' src/routes/index.tsx | wc -l
    Expected Result: Returns 0
    Evidence: .sisyphus/evidence/task-16-no-lucide.txt

  Scenario: All text uses i18n
    Tool: Bash (grep)
    Steps:
      1. grep -c 'hardcoded English' src/routes/index.tsx || true
      2. grep -c "m\." src/routes/index.tsx
    Expected Result: No hardcoded English strings (only Paraglide message calls)
    Evidence: .sisyphus/evidence/task-16-i18n-check.txt
  ```

  **Commit**: YES (group with Wave 4)
  - Message: `feat(ui): add home, search, document viewer, refutation, and auth pages`

- [ ] 17. Search Page + Results

  **What to do**:
  - Create `src/routes/search.tsx` with search functionality
  - URL: `/search?q={query}&locale={locale}&page={page}`
  - Components:
    - Search input (pre-filled from `q` param) with search button
    - Results list: each result shows title, excerpt (highlighted matches if feasible), verification score, locale badge, last updated
    - Pagination: previous/next buttons with page numbers
    - Empty state: "No results found for '{query}'." with suggestion to request generation
    - Loading state: skeleton cards while search is in progress
  - Data fetching: TanStack Router loader calls `GET /api/search?q=...&locale=...&offset=...&limit=20`
  - Link each result to `/documents/{id}`
  - Use Nucleo icons for search, verified status, pagination arrows
  - All text via Paraglide `m.*()`

  **Must NOT do**:
  - No em-dashes
  - No lucide-react
  - No gradients or decorative elements
  - No client-side search (all search is server-side FTS)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Search UI with results list, pagination, loading/empty states
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Clean search results layout and empty state design

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T16, T18, T19, T20)
  - **Blocks**: T21
  - **Blocked By**: T9 (app shell), T15 (search API route)

  **References**:

  **Pattern References**:
  - `src/routes/index.tsx` (T16) - TanStack Router `createFileRoute` + loader pattern
  - `GET /api/search` (T15) - Search API returning paginated results

  **API/Type References**:
  - Search response: `{ results: Array<{ id, title, snippet, locale, verificationScore, updatedAt }>, total: number }`

  **Acceptance Criteria**:
  - [ ] `src/routes/search.tsx` renders search page
  - [ ] Search input pre-fills from URL `q` param
  - [ ] Results display with title, excerpt, score, date
  - [ ] Pagination works (previous/next)
  - [ ] Empty state shows when no results
  - [ ] All text uses Paraglide `m.*()`
  - [ ] No em-dashes, no lucide, no gradients

  **QA Scenarios:**

  ```
  Scenario: Search page renders and accepts input
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/search
      2. Assert: search input element visible
      3. Type 'quantum' into search input
      4. Click search button or press Enter
      5. Wait for results or empty state
      6. Assert: URL contains ?q=quantum
      7. Screenshot page
    Expected Result: Search page with input and results/empty state
    Evidence: .sisyphus/evidence/task-17-search-page.png

  Scenario: Empty state shows for nonsense query
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/search?q=xyznonexistent12345
      2. Wait for results
      3. Assert: empty state message visible
    Expected Result: Shows 'no results' message, not an error
    Evidence: .sisyphus/evidence/task-17-empty-state.png
  ```

  **Commit**: YES (group with Wave 4)
  - Message: `feat(ui): add home, search, document viewer, refutation, and auth pages`

- [ ] 18. Document Viewer + Streamdown Rendering

  **What to do**:
  - Create `src/routes/documents/$documentId.tsx` for viewing a single document
  - Layout:
    - Title (h1) + metadata bar: verification score, locale, last updated, status
    - Sources section: collapsible list of source URLs with titles
    - Main content: rendered via `@streamdown/react` `<Markdown>` component from the document's Markdown body
    - Sidebar or footer: list of available translations (links to same doc in other locales)
    - Refutations section: list of reviewed refutations on this document showing selected text, category, verdict
    - "Request Generation" button if document does not exist (topic from URL or search)
  - Data fetching: TanStack Router loader calls `GET /api/documents/{documentId}?locale={locale}`
  - Status handling:
    - `generating`: Show "Document is being generated..." with polling or manual refresh
    - `verified`: Show full document with green verification indicator
    - `flagged`: Show document with yellow warning indicator + flagged claims
  - Use Nucleo icons for verification status, locale flags, source links
  - All text via Paraglide `m.*()`

  **Must NOT do**:
  - No em-dashes
  - No lucide-react
  - No rich text editor (read-only document view)
  - No revision diff viewer (just show current version)
  - No gradients

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex document layout with Streamdown rendering, metadata, sources, refutations list
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Document reading experience, typography, content layout

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T16, T17, T19, T20)
  - **Blocks**: T19 (refutation UI overlays on document viewer), T22 (locale routing)
  - **Blocked By**: T9 (app shell), T15 (document API route)

  **References**:

  **Pattern References**:
  - `src/routes/index.tsx` (T16) - TanStack Router route pattern
  - Streamdown: Already installed (`@nicepkg/streamdown` v1.6.5 in package.json). Import `<Markdown>` from `@streamdown/react`

  **API/Type References**:
  - `GET /api/documents/{id}` (T15) - Returns full document with content, sources, translations list, refutations
  - `src/db/schema.ts` (T5) - Document and refutation types

  **External References**:
  - Streamdown React: `<Markdown content={document.content} />` for rendering structured Markdown
  - TanStack Router params: `createFileRoute('/documents/$documentId')({ loader: ({ params }) => { ... } })`

  **Acceptance Criteria**:
  - [ ] `src/routes/documents/$documentId.tsx` renders document view
  - [ ] Document content rendered via Streamdown
  - [ ] Metadata bar shows verification score, locale, date, status
  - [ ] Sources section shows source URLs
  - [ ] Translation links show available locales
  - [ ] Refutation list shows reviewed refutations
  - [ ] Generating state shows appropriate message
  - [ ] All text uses Paraglide `m.*()`
  - [ ] No em-dashes, no lucide, no gradients

  **QA Scenarios:**

  ```
  Scenario: Document page renders with Streamdown content
    Tool: Playwright
    Preconditions: Dev server running, at least 1 document in DB with content
    Steps:
      1. Get a document ID from the search API: curl -s http://localhost:3000/api/search?q=&locale=en | jq -r '.results[0].id'
      2. Navigate to http://localhost:3000/documents/{id}
      3. Assert: h1 element with document title visible
      4. Assert: rendered Markdown content visible (look for <p>, <h2>, <h3> elements within content area)
      5. Assert: verification score displayed
      6. Screenshot full page
    Expected Result: Full document with rendered Markdown, metadata, sources
    Evidence: .sisyphus/evidence/task-18-document-viewer.png

  Scenario: 404 for nonexistent document
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/documents/nonexistent-id-12345
      2. Assert: error state or 404 message visible (not a crash)
    Expected Result: Graceful 404 handling, not a white screen
    Evidence: .sisyphus/evidence/task-18-not-found.png
  ```

  **Commit**: YES (group with Wave 4)
  - Message: `feat(ui): add home, search, document viewer, refutation, and auth pages`

- [ ] 19. Refutation UI: Text Selection + Form

  **What to do**:
  - Add refutation functionality to the document viewer (`src/routes/documents/$documentId.tsx` or a co-located component)
  - Create `src/components/RefutationForm.tsx`:
    - Appears when user selects text in the document content area
    - Shows the selected text in a quote block
    - Category selector (radio or select): Factual Error, Outdated, Biased, Missing Context
    - Explanation textarea (required, min 20 chars)
    - Optional source URL input
    - Submit button (disabled when not authenticated)
    - If not authenticated: show "Sign in to submit refutation" link
  - Text selection detection:
    - Use `window.getSelection()` API on the document content container
    - On `mouseup` or `selectionchange`, check if selection is within the document content area
    - Extract selected text, show floating "Refute this" button near selection
    - Clicking "Refute this" opens the refutation form with selected text pre-filled
  - Form submission: POST to `/api/documents/{documentId}/refute` with `{ selectedText, category, explanation }`
  - On success: show success message, clear form, optionally show the pending refutation in the list
  - On error: show error message from API response
  - Use Nucleo icons for category indicators, submit, close
  - All text via Paraglide `m.*()`

  **Must NOT do**:
  - No em-dashes
  - No lucide-react
  - No rich text in explanation (plain textarea only)
  - No file uploads for evidence (URL only in V1)
  - No inline annotations on the document (refutations shown in list below)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex interaction pattern (text selection detection, floating UI, form submission, auth state)
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Text selection UX, floating button positioning, form design

  **Parallelization**:
  - **Can Run In Parallel**: YES (but loosely depends on T18 for document content area)
  - **Parallel Group**: Wave 4 (with T16, T17, T18, T20)
  - **Blocks**: T21
  - **Blocked By**: T9 (app shell), T15 (refute API route), T18 (document viewer for content area)

  **References**:

  **Pattern References**:
  - `src/routes/documents/$documentId.tsx` (T18) - Document viewer where refutation UI is integrated
  - `src/components/ui/` - Existing shadcn components: button, input, select, textarea, label

  **API/Type References**:
  - `POST /api/documents/{id}/refute` (T15) - `{ selectedText, category, explanation }` -> `{ refutationId, status: 'pending' }`
  - `src/lib/auth-client.ts` - Auth client for checking session state

  **External References**:
  - `window.getSelection()` API for text selection detection
  - Refutation categories: `factual_error`, `outdated`, `biased`, `missing_context`

  **Acceptance Criteria**:
  - [ ] `src/components/RefutationForm.tsx` exists
  - [ ] Text selection in document content shows "Refute this" button
  - [ ] Form shows selected text, category selector, explanation textarea
  - [ ] Category options: Factual Error, Outdated, Biased, Missing Context
  - [ ] Submit calls POST /api/documents/{id}/refute
  - [ ] Unauthenticated users see sign-in prompt instead of form
  - [ ] Success/error feedback after submission
  - [ ] All text uses Paraglide `m.*()`
  - [ ] No em-dashes, no lucide

  **QA Scenarios:**

  ```
  Scenario: Text selection triggers refutation button
    Tool: Playwright
    Preconditions: Dev server running, document with content in DB, user logged in
    Steps:
      1. Navigate to a document page with content
      2. Select text within the document content area (simulate text selection)
      3. Assert: "Refute this" button appears near selection
      4. Click "Refute this"
      5. Assert: refutation form opens with selected text displayed
      6. Assert: category selector visible with 4 options
      7. Assert: explanation textarea visible
      8. Screenshot form
    Expected Result: Form appears with selected text, category options, textarea
    Evidence: .sisyphus/evidence/task-19-refutation-form.png

  Scenario: Unauthenticated user sees sign-in prompt
    Tool: Playwright
    Preconditions: Dev server running, user NOT logged in
    Steps:
      1. Navigate to a document page
      2. Select text and trigger refutation UI
      3. Assert: sign-in prompt visible instead of/alongside form
    Expected Result: Clear prompt to sign in, form disabled or hidden
    Evidence: .sisyphus/evidence/task-19-auth-required.png
  ```

  **Commit**: YES (group with Wave 4)
  - Message: `feat(ui): add home, search, document viewer, refutation, and auth pages`

- [ ] 20. Auth Pages + Route Protection

  **What to do**:
  - Create `src/routes/login.tsx`: Email + password login form
    - Fields: email input, password input, submit button
    - Link to signup page
    - Error display for invalid credentials
    - On success: redirect to previous page or home
    - Use Better Auth client `signIn.email()` method
  - Create `src/routes/signup.tsx`: Registration form
    - Fields: name (optional), email, password, confirm password
    - Password validation: minimum 8 chars
    - Link to login page
    - On success: auto-login and redirect to home
    - Use Better Auth client `signUp.email()` method
  - Route protection middleware/pattern:
    - Create a reusable `requireAuth` helper for route loaders
    - Protected routes: document generation request, refutation submission (handled at API level in T15)
    - Client-side: check auth state to show/hide UI elements (sign in/out buttons, refutation form)
  - Use existing shadcn components: input, button, label
  - Use Nucleo icons for form elements
  - All text via Paraglide `m.*()`
  - Style: clean, centered forms. No decorative elements.

  **Must NOT do**:
  - No em-dashes
  - No lucide-react
  - No OAuth providers (email/password only in V1)
  - No forgot password flow (V1 scope limitation)
  - No email verification flow (V1 scope limitation)
  - No gradients on auth pages

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard auth forms with existing Better Auth client. Straightforward form implementation
  - **Skills**: []
    - No specialized skills needed; standard form implementation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T16, T17, T18, T19)
  - **Blocks**: T21 (needs all pages for i18n)
  - **Blocked By**: T6 (Better Auth adapter), T9 (app shell)

  **References**:

  **Pattern References**:
  - `src/lib/auth-client.ts` - Better Auth client with `signIn.email()`, `signUp.email()`, `useSession()`
  - `src/components/ui/` - Existing shadcn: button, input, label

  **API/Type References**:
  - Better Auth client methods: `authClient.signIn.email({ email, password })`, `authClient.signUp.email({ email, password, name })`
  - `authClient.useSession()` - React hook for session state

  **External References**:
  - Better Auth client docs: `signIn.email()` returns `{ data, error }`. Check `error` for invalid credentials.

  **Acceptance Criteria**:
  - [ ] `src/routes/login.tsx` renders login form
  - [ ] `src/routes/signup.tsx` renders signup form
  - [ ] Login form submits via Better Auth client
  - [ ] Signup form submits via Better Auth client
  - [ ] Error messages display for invalid credentials
  - [ ] Successful login redirects to home or previous page
  - [ ] All text uses Paraglide `m.*()`
  - [ ] No em-dashes, no lucide, no gradients

  **QA Scenarios:**

  ```
  Scenario: Signup and login flow works
    Tool: Playwright
    Preconditions: Dev server running, PostgreSQL running with auth tables
    Steps:
      1. Navigate to http://localhost:3000/signup
      2. Fill email: test-e2e@example.com
      3. Fill password: TestPassword123
      4. Fill confirm password: TestPassword123
      5. Click submit/signup button
      6. Wait for redirect (should go to home page)
      7. Assert: user is logged in (check for user name or logout button in header)
      8. Screenshot
    Expected Result: User created and logged in, redirected to home
    Evidence: .sisyphus/evidence/task-20-signup-flow.png

  Scenario: Login with wrong password shows error
    Tool: Playwright
    Preconditions: Dev server running
    Steps:
      1. Navigate to http://localhost:3000/login
      2. Fill email: wrong@example.com
      3. Fill password: wrongpassword
      4. Click submit/login button
      5. Assert: error message visible on page
    Expected Result: Error message displayed, no redirect
    Evidence: .sisyphus/evidence/task-20-login-error.png
  ```

  **Commit**: YES (group with Wave 4)
  - Message: `feat(ui): add home, search, document viewer, refutation, and auth pages`

### Wave 5: i18n + Locale Routing (T21-T22)

- [ ] 21. AI-Translate UI Strings to All 23 Locales

  **What to do**:
  - After all UI pages are built (T16-T20), collect all Paraglide message keys from `messages/en.json`
  - For each of the 22 non-English locales:
    - Use GPT 5.2 with structured output to translate all message strings
    - Schema: `{ translations: Record<string, string> }` where keys match en.json keys
    - Prompt: "Translate the following UI strings from English to {targetLanguage}. These are for a Wikipedia-like knowledge platform called Verifidia. Maintain formal, professional tone. Keep placeholders like {name} intact. Do not use em-dashes. Do not add or remove keys."
    - Write output to `messages/{locale}.json`
  - 23 locales list (from T4 config): en, de, fr, es, pt, it, nl, pl, uk, ru, tr, ar, fa, hi, bn, th, vi, zh, ja, ko, id, ms, tl
  - Validate: all locale files have identical keys to en.json
  - This task can be executed as a script/one-off or manually via the AI service module
  - DO NOT manually translate any string

  **Must NOT do**:
  - No manual translation
  - No em-dashes in any translation
  - No removing or adding keys (1:1 match with en.json)
  - No locale files with missing keys

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Bulk AI translation with structured output, file I/O for 23 locale files, validation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (needs all UI pages complete to know final message keys)
  - **Blocks**: T22, FINAL
  - **Blocked By**: T16-T20 (all UI pages must be built so all message keys exist)

  **References**:

  **Pattern References**:
  - `messages/en.json` - Source English messages (created/updated by T16-T20)
  - `messages/de.json` - Example of existing translation file format
  - `src/lib/ai.ts` (T8) - GPT 5.2 structured output for translation

  **API/Type References**:
  - Paraglide message format: flat JSON `{ "key": "value" }` or nested as configured
  - `project.inlang/settings.json` (T4) - Lists all configured locales

  **Acceptance Criteria**:
  - [ ] 23 message files exist in `messages/` directory (one per locale)
  - [ ] All files have identical keys to `messages/en.json`
  - [ ] No em-dashes in any translation
  - [ ] Placeholders preserved correctly in all translations
  - [ ] RTL locales (ar, fa) have correct text direction in translations

  **QA Scenarios:**

  ```
  Scenario: All 23 locale files exist with correct keys
    Tool: Bash
    Steps:
      1. ls messages/ | wc -l
      2. For a sample locale (fr): jq 'keys' messages/en.json > /tmp/en-keys.json && jq 'keys' messages/fr.json > /tmp/fr-keys.json && diff /tmp/en-keys.json /tmp/fr-keys.json
    Expected Result: 23 files, identical keys between en and fr (and all others)
    Evidence: .sisyphus/evidence/task-21-locale-files.txt

  Scenario: No em-dashes in translations
    Tool: Bash (grep)
    Steps:
      1. grep -rl $'\xe2\x80\x94' messages/ | wc -l
    Expected Result: Returns 0
    Evidence: .sisyphus/evidence/task-21-no-emdash.txt
  ```

  **Commit**: YES
  - Message: `feat(i18n): expand to 23 locales with AI-translated strings`

- [ ] 22. Locale-Aware Document Routing + Fallbacks

  **What to do**:
  - Modify document viewer (`src/routes/documents/$documentId.tsx`) to be locale-aware:
    - Detect current locale from Paraglide's `languageTag()`
    - Fetch document with `?locale={currentLocale}` parameter
    - API already handles translation fallback (T15): returns translated content if available, canonical if not
  - Add locale indicator in document metadata showing which locale the content is in
  - If content is in a different locale than requested (fallback occurred), show a notice: "This document is shown in {originalLocale}. Translation to {requestedLocale} is in progress."
  - Add "Available in" section showing all locales with translations as clickable links
  - Clicking a locale link navigates to the same document but switches the Paraglide locale (URL-based locale switching)
  - Handle edge cases:
    - Document exists but no translation for current locale: show canonical with fallback notice
    - Document does not exist at all: show 404 with option to request generation
    - Translation is in progress (status = 'translating'): show canonical with "translating..." notice
  - All notices and labels via Paraglide `m.*()`

  **Must NOT do**:
  - No em-dashes
  - No automatic locale detection from browser (use Paraglide URL strategy only)
  - No locale-specific URLs like `/en/documents/...` (Paraglide handles URL prefixing)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex locale routing logic, fallback handling, integration with Paraglide URL strategy
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (depends on T18 document viewer + T21 translations)
  - **Blocks**: FINAL
  - **Blocked By**: T15 (API with locale support), T18 (document viewer), T21 (translations must exist)

  **References**:

  **Pattern References**:
  - `src/routes/documents/$documentId.tsx` (T18) - Document viewer to modify
  - `src/components/LocaleSwitcher.tsx` (T9) - Existing locale switching pattern

  **API/Type References**:
  - `GET /api/documents/{id}?locale={locale}` (T15) - Returns translated or fallback content
  - Paraglide `languageTag()` - Returns current locale string
  - `src/db/schema.ts` (T5) - `documentTranslations` table with locale + status

  **External References**:
  - Paraglide URL strategy: locale is encoded in URL path, `setLanguageTag()` for switching
  - Paraglide `languageTag()`: Import from generated runtime `$paraglide/runtime.js`

  **Acceptance Criteria**:
  - [ ] Document viewer fetches content based on current Paraglide locale
  - [ ] Fallback notice shown when translation unavailable
  - [ ] "Available in" section shows translated locale links
  - [ ] Locale switching navigates and re-fetches document in new locale
  - [ ] Edge cases handled: no translation, no document, translation in progress
  - [ ] All notices via Paraglide `m.*()`
  - [ ] No em-dashes

  **QA Scenarios:**

  ```
  Scenario: Document shows in current locale
    Tool: Playwright
    Preconditions: Dev server running, document with at least 1 translation
    Steps:
      1. Navigate to http://localhost:3000/documents/{id} (English locale)
      2. Assert: content is in English
      3. Switch locale to one with a translation (e.g., /fr/documents/{id})
      4. Assert: content changes to French translation
      5. Screenshot both states
    Expected Result: Content switches language when locale changes
    Evidence: .sisyphus/evidence/task-22-locale-switch.png

  Scenario: Fallback notice when no translation
    Tool: Playwright
    Preconditions: Dev server running, document with NO translation for a specific locale
    Steps:
      1. Navigate to document in a locale without translation
      2. Assert: fallback notice visible ("shown in {originalLocale}")
      3. Assert: content still displays (canonical version)
    Expected Result: Shows canonical content with fallback notice
    Evidence: .sisyphus/evidence/task-22-fallback-notice.png
  ```

  **Commit**: YES
  - Message: `feat(i18n): add locale-aware document routing with translation fallbacks`

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** - `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns (em-dashes, lucide-react imports, @tanstack/ai imports, gradients). Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** - `unspecified-high`
  Run `tsc --noEmit` + `bun run build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check for em-dashes (U+2014) in all files. Check all AI prompts are neutral and non-slop. Verify no lucide-react imports remain. Verify no @tanstack/ai-* imports remain.
  Output: `Build [PASS/FAIL] | TypeCheck [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** - `unspecified-high` (+ `playwright` skill)
  Start from clean state. Full user journey: visit home -> search for topic -> request generation -> wait for completion -> view document -> switch locale -> refute a passage -> sign up -> submit refutation -> verify refutation appears. Test edge cases: search for nonexistent doc, submit refutation while logged out, switch to CJK locale. Save screenshots to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** - `deep`
  For each task: read "What to do", read actual implementation. Verify 1:1 match. Check "Must NOT do" compliance. Detect unaccounted files. Verify no revision diff UI was built. Verify no admin panel was built. Verify no streaming was implemented. Flag any scope creep.
  Output: `Tasks [N/N compliant] | Creep [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

- **After Wave 1**: `chore: strip demo content and install verifidia dependencies`
- **After Wave 2**: `feat(db): add complete schema, auth adapter, inngest route, ai service`
- **After Wave 3**: `feat(pipeline): add generation, fact-check, translation, stale, refutation pipelines`
- **After T15**: `feat(api): add search, document, generation, and refutation API routes`
- **After Wave 4**: `feat(ui): add home, search, document viewer, refutation, and auth pages`
- **After Wave 5**: `feat(i18n): expand to 23 locales with AI-translated strings`
- **After FINAL**: `chore: final verification and cleanup`

---

## Success Criteria

### Verification Commands
```bash
bun run dev             # Expected: Dev server starts on port 3000
bun run build           # Expected: Exit code 0, .output/ directory created
curl http://localhost:3000/ # Expected: 200, newspaper home page HTML
curl http://localhost:3000/search?q=test # Expected: 200, search results JSON or page
curl -X POST http://localhost:3000/api/documents/request -d '{"topic":"quantum computing","locale":"en"}' # Expected: 200/201, job created
curl http://localhost:3000/api/inngest -X PUT # Expected: Inngest function list
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';" # Expected: 10+ tables
```

### Final Checklist
- [ ] All "Must Have" features present and functional
- [ ] All "Must NOT Have" patterns absent from codebase
- [ ] No em-dashes (U+2014) anywhere in codebase
- [ ] No lucide-react imports
- [ ] No @tanstack/ai-* imports for AI calls
- [ ] All 23 locale message files exist
- [ ] Inngest dev server connects and shows registered functions
- [ ] Document generation works end-to-end
- [ ] Build succeeds without errors
