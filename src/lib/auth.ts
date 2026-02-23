import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '#/db'
// biome-ignore lint/performance/noNamespaceImport: drizzle requires namespace import for schema inference
import * as schema from '#/db/schema'
import { sendEmail } from '#/lib/email'

const OTP_SUBJECTS: Record<string, (otp: string) => string> = {
  'sign-in': (otp) => `Your sign-in code: ${otp}`,
  'email-verification': (otp) => `Verify your email: ${otp}`,
  'forget-password': (otp) => `Reset your password: ${otp}`,
}

function getOtpSubject(type: string, otp: string): string {
  return (OTP_SUBJECTS[type] ?? OTP_SUBJECTS['email-verification'])(otp)
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    tanstackStartCookies(),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendEmail({
          to: email,
          subject: getOtpSubject(type, otp),
          text: `Your verification code is: ${otp}\n\nThis code expires in 5 minutes.`,
        })
      },
      otpLength: 6,
      expiresIn: 300,
      sendVerificationOnSignUp: true,
    }),
  ],
})
