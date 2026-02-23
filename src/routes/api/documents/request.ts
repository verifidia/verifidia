import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db'
import { documents } from '#/db/schema'
import { auth } from '#/lib/auth'
import { inngest } from '#/lib/inngest'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const bodySchema = z.object({
  topic: z.string().min(1),
  locale: z.string().min(1),
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const Route = createFileRoute('/api/documents/request')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          })
          if (!session) {
            return json({ error: 'Unauthorized' }, 401)
          }

          let rawBody: unknown
          try {
            rawBody = await request.json()
          } catch {
            return json({ error: 'Invalid JSON body' }, 400)
          }

          const parsed = bodySchema.safeParse(rawBody)
          if (!parsed.success) {
            return json(
              { error: 'Validation failed', details: parsed.error.flatten() },
              400
            )
          }

          const { topic, locale } = parsed.data
          const slug = slugify(topic)

          if (!slug) {
            return json({ error: 'Could not create slug from topic' }, 400)
          }

          const [existing] = await db
            .select({ id: documents.id, status: documents.status })
            .from(documents)
            .where(eq(documents.slug, slug))
            .limit(1)

          if (existing) {
            return json({
              documentId: existing.id,
              status: existing.status,
            })
          }

          const [newDoc] = await db
            .insert(documents)
            .values({
              slug,
              topic,
              canonicalLocale: locale,
              status: 'queued',
              requestedBy: session.user.id,
            })
            .returning({ id: documents.id })

          if (!newDoc) {
            return json({ error: 'Failed to create document' }, 500)
          }

          await inngest.send({
            name: 'document/generation.requested',
            data: { topic, locale, documentId: newDoc.id },
          })

          return json({ documentId: newDoc.id, status: 'queued' }, 201)
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Internal server error'
          return json({ error: message }, 500)
        }
      },
    },
  },
})
