import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { db } from '#/db'
import { documents, documentTranslations } from '#/db/schema'
import { generateStructured } from '#/lib/ai'
import { inngest } from '#/lib/inngest'
import { SUPPORTED_LOCALES } from '#/lib/i18n-config'

const TranslationSchema = z.object({
  title: z.string(),
  content: z.string(),
})

export const translateDocument = inngest.createFunction(
  { id: 'translate-document', idempotency: 'event.data.documentId + "-" + event.data.locale', concurrency: { limit: 5 } },
  { event: 'document/translation.requested' },
  async ({ event, step }) => {
    const { documentId } = event.data

    const sourceDoc = await step.run('load-source', async () => {
      const doc = await db.query.documents.findFirst({
        where: eq(documents.id, documentId),
      })
      if (!doc) {
        throw new Error(`Document not found: ${documentId}`)
      }
      if (!doc.title || !doc.content) {
        throw new Error(`Document ${documentId} has no content to translate`)
      }
      return {
        title: doc.title,
        content: doc.content,
        canonicalLocale: doc.canonicalLocale,
      }
    })

    const targetLocales = await step.run('determine-targets', async () => {
      return SUPPORTED_LOCALES.filter(
        (locale) => locale !== sourceDoc.canonicalLocale,
      )
    })

    for (const targetLocale of targetLocales) {
      await step.run(`translate-${targetLocale}`, async () => {
        const translated = await generateStructured(
          TranslationSchema,
          'You are a professional translator specializing in encyclopedic content.',
          [
            `Translate the following encyclopedic document from ${sourceDoc.canonicalLocale} to ${targetLocale}.`,
            'Preserve all Markdown formatting, section headings, and source citations.',
            'Maintain neutral encyclopedic tone.',
            'Do not add or remove information.',
            'Do not use em-dashes.',
            '',
            `Title: ${sourceDoc.title}`,
            '',
            'Content:',
            sourceDoc.content,
          ].join('\n'),
          'translation',
        )

        await db
          .insert(documentTranslations)
          .values({
            documentId,
            locale: targetLocale,
            title: translated.title,
            content: translated.content,
            status: 'translated',
            translatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [documentTranslations.documentId, documentTranslations.locale],
            set: {
              title: translated.title,
              content: translated.content,
              status: 'translated',
              translatedAt: new Date(),
              updatedAt: new Date(),
            },
          })

        return { locale: targetLocale, title: translated.title }
      })
    }

    return {
      documentId,
      translatedLocales: targetLocales,
    }
  },
)
