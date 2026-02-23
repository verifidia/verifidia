import { EventSchemas, Inngest } from 'inngest'

type Events = {
  'document/generation.requested': {
    data: { topic: string; locale: string; documentId: string }
  }
  'document/refresh.requested': {
    data: { documentId: string; locale: string }
  }
  'document/translation.requested': {
    data: { documentId: string; locale: string; targetLocale: string }
  }
  'document/verification.requested': {
    data: { documentId: string; locale: string }
  }
  'refutation/submitted': {
    data: { refutationId: string; documentId: string; locale: string }
  }
}

export const inngest = new Inngest({
  id: 'verifidia',
  schemas: new EventSchemas().fromRecord<Events>(),
})
