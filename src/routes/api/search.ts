import { createFileRoute } from '@tanstack/react-router'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '#/db'
import { documents, documentTranslations } from '#/db/schema'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const Route = createFileRoute('/api/search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const q = url.searchParams.get('q') ?? ''
          const locale = url.searchParams.get('locale') ?? 'en'
          const limitRaw = Number.parseInt(
            url.searchParams.get('limit') ?? '20',
            10
          )
          const limit = Math.min(
            Math.max(Number.isNaN(limitRaw) ? 20 : limitRaw, 1),
            100
          )
          const offsetRaw = Number.parseInt(
            url.searchParams.get('offset') ?? '0',
            10
          )
          const offset = Math.max(Number.isNaN(offsetRaw) ? 0 : offsetRaw, 0)

          if (!q.trim()) {
            const results = await db
              .select({
                id: documents.id,
                title: documents.title,
                content: documents.content,
                locale: documents.canonicalLocale,
                verificationScore: documents.verificationScore,
                updatedAt: documents.updatedAt,
              })
              .from(documents)
              .orderBy(desc(documents.updatedAt))
              .limit(limit)
              .offset(offset)

            return json({
              results: results.map((r) => ({
                id: r.id,
                title: r.title ?? '',
                snippet: (r.content ?? '').slice(0, 200),
                locale: r.locale,
                verificationScore: r.verificationScore,
                updatedAt: r.updatedAt,
              })),
            })
          }

          const results = await db
            .select({
              id: documents.id,
              title: documentTranslations.title,
              content: documentTranslations.content,
              locale: documentTranslations.locale,
              verificationScore: documents.verificationScore,
              updatedAt: documents.updatedAt,
            })
            .from(documentTranslations)
            .innerJoin(
              documents,
              eq(documentTranslations.documentId, documents.id)
            )
            .where(
              sql`${documentTranslations.searchVector} @@ plainto_tsquery('simple', ${q}) AND ${documentTranslations.locale} = ${locale}`
            )
            .orderBy(
              sql`ts_rank(${documentTranslations.searchVector}, plainto_tsquery('simple', ${q})) desc`
            )
            .limit(limit)
            .offset(offset)

          return json({
            results: results.map((r) => ({
              id: r.id,
              title: r.title ?? '',
              snippet: (r.content ?? '').slice(0, 200),
              locale: r.locale,
              verificationScore: r.verificationScore,
              updatedAt: r.updatedAt,
            })),
          })
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Internal server error'
          return json({ error: message }, 500)
        }
      },
    },
  },
})
