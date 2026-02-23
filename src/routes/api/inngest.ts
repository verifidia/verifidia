import { createFileRoute } from '@tanstack/react-router'
import { serve } from 'inngest/edge'
import { generateDocument } from '#/inngest/generate-document'
import { processRefutation } from '#/inngest/process-refutation'
import { checkStaleDocuments, refreshDocument } from '#/inngest/refresh-stale'
import { translateDocument } from '#/inngest/translate-document'
import { verifyDocument } from '#/inngest/verify-document'
import { inngest } from '#/lib/inngest'

const handler = serve({
  client: inngest,
  functions: [
    generateDocument,
    verifyDocument,
    translateDocument,
    checkStaleDocuments,
    refreshDocument,
    processRefutation,
  ],
})

export const Route = createFileRoute('/api/inngest')({
  server: {
    handlers: {
      GET: ({ request }) => handler(request),
      POST: ({ request }) => handler(request),
      PUT: ({ request }) => handler(request),
    },
  },
})
