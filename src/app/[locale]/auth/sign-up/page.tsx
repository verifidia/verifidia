"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("auth");
  const commonT = useTranslations("common");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email: trimmedEmail,
        type: "email-verification",
      });

      if (response.error) {
        throw new Error(response.error.message ?? commonT("error"));
      }

      const encodedEmail = encodeURIComponent(trimmedEmail);
      const encodedName = encodeURIComponent(name.trim());
      router.push(
        `/${locale}/auth/verify?email=${encodedEmail}&type=sign-up&name=${encodedName}`
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : commonT("error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="signup-name">
            {t("name")}
          </label>
          <Input
            autoComplete="name"
            id="signup-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Ada Lovelace"
            required
            type="text"
            value={name}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="signup-email">
            {t("email")}
          </label>
          <Input
            autoComplete="email"
            id="signup-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button className="w-full" disabled={isLoading} type="submit">
          {isLoading ? commonT("loading") : t("sendCode")}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")} {" "}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/auth/sign-in">
          {t("signIn")}
        </Link>
      </p>
    </section>
  );
}
