"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { EmailForm } from "@/components/auth/email-form";

export default function LoginPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("auth");

  return (
    <section className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in to Verifidia</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email to receive a sign-in code
        </p>
      </header>

      <EmailForm
        onSuccess={(email) => {
          const encodedEmail = encodeURIComponent(email);
          router.push(`/${locale}/auth/verify?email=${encodedEmail}&type=sign-in`);
        }}
        type="sign-in"
      />

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")} {" "}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/auth/sign-up">
          {t("signUp")}
        </Link>
      </p>
    </section>
  );
}
