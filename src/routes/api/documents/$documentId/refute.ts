import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { db } from '#/db'
import { refutations } from '#/db/schema'
import { auth } from '#/lib/auth'
import { inngest } from '#/lib/inngest'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const bodySchema = z.object({
  selectedText: z.string().min(1),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  category: z.enum(['factual_error', 'outdated', 'biased', 'missing_context']),
  note: z.string().optional(),
  sourceUrl: z.string().optional(),
  locale: z.string().min(1),
})

export const Route = createFileRoute('/api/documents/$documentId/refute')({
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

          const documentId = new URL(request.url).pathname.split('/')[3]
          if (!documentId) {
            return json({ error: 'Missing document ID' }, 400)
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

          const body = parsed.data

          const [newRefutation] = await db
            .insert(refutations)
            .values({
              documentId,
              locale: body.locale,
              userId: session.user.id,
              category: body.category,
              selectedText: body.selectedText,
              startOffset: body.startOffset,
              endOffset: body.endOffset,
              note: body.note,
              sourceUrl: body.sourceUrl,
            })
            .returning({ id: refutations.id })

          if (!newRefutation) {
            return json({ error: 'Failed to create refutation' }, 500)
          }

          await inngest.send({
            name: 'refutation/submitted',
            data: {
              refutationId: newRefutation.id,
              documentId,
              locale: body.locale,
            },
          })

          return json(
            { refutationId: newRefutation.id, status: 'pending' },
            201
          )
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Internal server error'
          return json({ error: message }, 500)
        }
      },
    },
  },
})
