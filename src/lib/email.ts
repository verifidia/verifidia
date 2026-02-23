import { Resend } from 'resend'
import { env } from '#/env'

const resend = new Resend(env.RESEND_API_KEY)

export function sendEmail({
  to,
  subject,
  text,
}: {
  to: string
  subject: string
  text: string
}) {
  return resend.emails.send({
    from: 'Verifidia <this@is.verifidia.com>',
    to: [to],
    subject,
    text,
  })
}
