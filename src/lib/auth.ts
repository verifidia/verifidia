import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { db } from "@/db";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const subject =
          type === "sign-in"
            ? `${otp} is your Verifidia sign-in code`
            : `${otp} is your Verifidia verification code`;

        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Verifidia <this@is.verifidia.com>",
          to: email,
          subject,
          text: [
            `Your verification code is: ${otp}`,
            "",
            "This code expires in 5 minutes.",
            "If you didn't request this, you can safely ignore this email.",
          ].join("\n"),
        });
      },
      otpLength: 6,
      expiresIn: 300,
    }),
  ],
});
