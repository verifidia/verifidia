import { sql } from 'drizzle-orm'
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector'
  },
})

const idColumn = (name: string) =>
  text(name)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

export const user = pgTable('user', {
  id: idColumn('id'),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: idColumn('id'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: idColumn('id'),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: idColumn('id'),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const documents = pgTable('documents', {
  id: idColumn('id'),
  slug: text('slug').notNull().unique(),
  topic: text('topic').notNull(),
  canonicalLocale: text('canonical_locale').notNull(),
  content: text('content'),
  title: text('title'),
  status: text('status')
    .$type<'queued' | 'generating' | 'generated' | 'verified' | 'flagged' | 'failed'>()
    .notNull()
    .default('queued'),
  verificationScore: integer('verification_score'),
  verificationDetails: jsonb('verification_details'),
  sources: jsonb('sources'),
  requestedBy: text('requested_by').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  staleAt: timestamp('stale_at', { withTimezone: true })
    .notNull()
    .default(sql`now() + interval '30 days'`),
})

export const documentTranslations = pgTable(
  'document_translations',
  {
    id: idColumn('id'),
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    searchVector: tsvector('search_vector')
      .notNull()
      .generatedAlwaysAs(
        () =>
          sql`to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, ''))`,
      ),
    status: text('status').$type<'queued' | 'translating' | 'translated' | 'failed'>().notNull().default('queued'),
    translatedAt: timestamp('translated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('document_translations_document_id_locale_idx').on(table.documentId, table.locale),
    index('document_translations_search_vector_gin_idx').using('gin', table.searchVector),
  ],
)

export const documentRevisions = pgTable('document_revisions', {
  id: idColumn('id'),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  revisionNumber: integer('revision_number').notNull(),
  reason: text('reason')
    .$type<'initial_generation' | 'refutation_update' | 'stale_refresh' | 'translation'>()
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: text('created_by'),
})

export const refutations = pgTable('refutations', {
  id: idColumn('id'),
  documentId: text('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  locale: text('locale').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  category: text('category').$type<'factual_error' | 'outdated' | 'biased' | 'missing_context'>().notNull(),
  selectedText: text('selected_text').notNull(),
  startOffset: integer('start_offset').notNull(),
  endOffset: integer('end_offset').notNull(),
  note: text('note'),
  sourceUrl: text('source_url'),
  verdict: text('verdict').$type<'upheld' | 'partially_upheld' | 'rejected'>(),
  confidence: integer('confidence'),
  reasoning: text('reasoning'),
  suggestedCorrection: text('suggested_correction'),
  researchSources: jsonb('research_sources'),
  status: text('status').$type<'pending' | 'processing' | 'reviewed' | 'applied'>().notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
})

export const generationJobs = pgTable('generation_jobs', {
  id: idColumn('id'),
  documentId: text('document_id').references(() => documents.id, { onDelete: 'set null' }),
  type: text('type')
    .$type<'initial_generation' | 'translation' | 'fact_check' | 'refutation_review' | 'stale_refresh'>()
    .notNull(),
  status: text('status').$type<'queued' | 'running' | 'completed' | 'failed'>().notNull().default('queued'),
  locale: text('locale').notNull(),
  inputData: jsonb('input_data').notNull(),
  outputData: jsonb('output_data'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert

export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert

export type Verification = typeof verification.$inferSelect
export type NewVerification = typeof verification.$inferInsert

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert

export type DocumentTranslation = typeof documentTranslations.$inferSelect
export type NewDocumentTranslation = typeof documentTranslations.$inferInsert

export type DocumentRevision = typeof documentRevisions.$inferSelect
export type NewDocumentRevision = typeof documentRevisions.$inferInsert

export type Refutation = typeof refutations.$inferSelect
export type NewRefutation = typeof refutations.$inferInsert

export type GenerationJob = typeof generationJobs.$inferSelect
export type NewGenerationJob = typeof generationJobs.$inferInsert
