import { Inngest, EventSchemas } from 'inngest'

export type Events = {
  'document/generation.requested': {
    data: { topic: string; locale: string; documentId: string }
  }
  'document/verification.requested': {
    data: { documentId: string }
  }
  'document/translation.requested': {
    data: { documentId: string; targetLocale: string }
  }
  'refutation/submitted': {
    data: { refutationId: string; documentId: string }
  }
  'document/refresh.requested': {
    data: { documentId: string }
  }
}

export const inngest = new Inngest({
  id: 'verifidia',
  schemas: new EventSchemas().fromRecord<Events>(),
})
