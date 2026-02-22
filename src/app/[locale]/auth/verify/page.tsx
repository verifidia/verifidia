"use client";

import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { OtpInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";

const RESEND_INTERVAL = 60;

export default function VerifyPage() {
  return (
    <Suspense
      fallback={<p className="text-center text-sm text-muted-foreground">Loading verification...</p>}
    >
      <VerifyPageContent />
    </Suspense>
  );
}

function VerifyPageContent() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const commonT = useTranslations("common");

  const email = searchParams.get("email") ?? "";
  const otpType =
    searchParams.get("type") === "sign-up" ? "email-verification" : "sign-in";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_INTERVAL);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [secondsLeft]);

  const canSubmit = useMemo(() => otp.length === 6 && !!email, [email, otp.length]);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authClient.emailOtp.verifyEmail({ email, otp });

      if (response.error) {
        throw new Error(response.error.message ?? commonT("error"));
      }

      router.push(`/${locale}`);
    } catch (verifyError) {
      setError(
        verifyError instanceof Error ? verifyError.message : commonT("error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Missing email. Please sign in again.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: otpType,
      });

      if (response.error) {
        throw new Error(response.error.message ?? commonT("error"));
      }

      setSecondsLeft(RESEND_INTERVAL);
    } catch (resendError) {
      setError(
        resendError instanceof Error ? resendError.message : commonT("error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <section className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Enter your code</h1>
        <p className="text-sm text-muted-foreground">Missing email. Please restart the sign-in flow.</p>
        <Button asChild className="w-full">
          <Link href="/auth/sign-in">{t("signIn")}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Enter your code</h1>
        <p className="text-sm text-muted-foreground">We sent a 6-digit code to {email}</p>
      </header>

      <form className="space-y-4" onSubmit={handleVerify}>
        <div className="space-y-2">
          <p className="block text-center text-sm font-medium">
            {t("codeLabel")}
          </p>
          <div className="flex justify-center">
            <OtpInput onChange={setOtp} value={otp} />
          </div>
        </div>

        {error ? (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button className="w-full" disabled={isLoading || !canSubmit} type="submit">
          {isLoading ? commonT("loading") : t("verify")}
        </Button>
      </form>

      <Button
        className="w-full"
        disabled={isLoading || secondsLeft > 0}
        onClick={() => {
          void handleResend();
        }}
        type="button"
        variant="outline"
      >
        {secondsLeft > 0 ? t("resendIn", { seconds: secondsLeft }) : t("resendCode")}
      </Button>
    </section>
  );
}
