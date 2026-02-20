import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/i18n/config";
import { useTranslations } from "next-intl";

type FooterProps = {
  locale: Locale;
};

export function Footer({ locale }: FooterProps) {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://github.com/verifidia/verifidia"
            target="_blank"
            rel="noreferrer"
            className="inline-flex"
          >
            <Badge variant="outline">{t("openSource")}</Badge>
          </a>
          <span className="text-muted-foreground">{t("poweredByAI")}</span>
          <span className="text-muted-foreground">Locale: {locale.toUpperCase()}</span>
        </div>

        <p className="text-muted-foreground">© 2026 Verifidia — {t("license")}</p>
      </div>
    </footer>
  );
}
