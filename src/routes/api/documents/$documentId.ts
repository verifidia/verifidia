import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '#/db'
import { documents, documentTranslations, refutations } from '#/db/schema'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const Route = createFileRoute('/api/documents/$documentId')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const locale = url.searchParams.get('locale') ?? 'en'
          const documentId = url.pathname.split('/')[3]

          if (!documentId) {
            return json({ error: 'Missing document ID' }, 400)
          }

          const [doc] = await db
            .select()
            .from(documents)
            .where(eq(documents.id, documentId))
            .limit(1)

          if (!doc) {
            return json({ error: 'Document not found' }, 404)
          }

          const translations = await db
            .select({
              locale: documentTranslations.locale,
              title: documentTranslations.title,
              content: documentTranslations.content,
              status: documentTranslations.status,
            })
            .from(documentTranslations)
            .where(eq(documentTranslations.documentId, documentId))

          const requestedTranslation = translations.find(
            (t) => t.locale === locale
          )

          const title = requestedTranslation
            ? requestedTranslation.title
            : doc.title
          const content = requestedTranslation
            ? requestedTranslation.content
            : doc.content
          const activeLocale = requestedTranslation
            ? requestedTranslation.locale
            : doc.canonicalLocale

          const docRefutations = await db
            .select({
              id: refutations.id,
              category: refutations.category,
              selectedText: refutations.selectedText,
              status: refutations.status,
              verdict: refutations.verdict,
              createdAt: refutations.createdAt,
            })
            .from(refutations)
            .where(eq(refutations.documentId, documentId))

          return json({
            id: doc.id,
            slug: doc.slug,
            topic: doc.topic,
            title,
            content,
            locale: activeLocale,
            requestedLocale: locale,
            canonicalLocale: doc.canonicalLocale,
            status: doc.status,
            verificationScore: doc.verificationScore,
            verificationDetails: doc.verificationDetails,
            sources: doc.sources,
            translations: translations.map((t) => ({
              locale: t.locale,
              status: t.status,
            })),
            refutations: docRefutations,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
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
