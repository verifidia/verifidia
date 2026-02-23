import { createFileRoute } from '@tanstack/react-router'
import { serve } from 'inngest/edge'
import { inngest } from '#/lib/inngest'
import { generateDocument } from '#/inngest/generate-document'
import { verifyDocument } from '#/inngest/verify-document'
import { translateDocument } from '#/inngest/translate-document'
import { checkStaleDocuments, refreshDocument } from '#/inngest/refresh-stale'
import { processRefutation } from '#/inngest/process-refutation'

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
