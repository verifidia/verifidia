"use client";

import { Suspense, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { localeNames, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="text-center text-sm text-muted-foreground">Loading profile...</p>}>
      <ProfilePageContent />
    </Suspense>
  );
}

function ProfilePageContent() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("auth");
  const navT = useTranslations("nav");
  const commonT = useTranslations("common");
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace(`/${locale}/auth/sign-in`);
    }
  }, [isPending, locale, router, session?.user]);

  if (isPending || !session?.user) {
    return <p className="text-center text-sm text-muted-foreground">{commonT("loading")}</p>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("profile")}</h1>
        <p className="text-sm text-muted-foreground">Manage your Verifidia account</p>
      </header>

      <dl className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
        <div className="space-y-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("name")}</dt>
          <dd className="text-sm font-medium">{session.user.name || "-"}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("email")}</dt>
          <dd className="text-sm font-medium">{session.user.email}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("language")}</dt>
          <dd className="text-sm font-medium">{localeNames[locale] ?? locale}</dd>
        </div>
      </dl>

      <Button
        className="w-full"
        onClick={() => {
          void (async () => {
            await authClient.signOut();
            router.replace(`/${locale}/auth/sign-in`);
          })();
        }}
        variant="outline"
      >
        {navT("signOut")}
      </Button>
    </section>
  );
}
