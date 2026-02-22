"use client";

import Image from "next/image";
import logoImg from "../../../public/logo.png";
import { IconMenuFill18, IconMoonFill18, IconSunFill18 } from "nucleo-ui-fill-18";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { localeFlagIcons, localeNames, locales, type Locale } from "@/i18n/config";
import { Link, usePathname, useRouter } from "@/i18n/routing";

const navItems = [{ href: "/", key: "home" as const }];

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  const CurrentFlagIcon = localeFlagIcons[locale];

  const switchLocale = (nextLocale: Locale) => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <header className="border-b border-border/80 bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
            <Image src={logoImg} alt="Verifidia" width={24} height={24} />
            <span>Verifidia</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link href={item.href}>{t(item.key)}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("changeLanguage")}>
                <CurrentFlagIcon className="size-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {locales.map((nextLocale) => {
                const FlagIcon = localeFlagIcons[nextLocale];
                return (
                  <DropdownMenuItem key={nextLocale} onSelect={() => switchLocale(nextLocale)}>
                    <FlagIcon className="size-4 shrink-0" />
                    {nextLocale.toUpperCase()} - {localeNames[nextLocale]}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(nextTheme)}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <IconSunFill18 className="size-4" /> : <IconMoonFill18 className="size-4" />}
          </Button>

          <Button asChild variant="default" size="sm">
            <Link href="/auth/sign-in">{t("signIn")}</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(nextTheme)}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <IconSunFill18 className="size-4" /> : <IconMoonFill18 className="size-4" />}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open navigation menu">
                <IconMenuFill18 className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-70 p-6">
              <SheetTitle className="mb-4">Verifidia</SheetTitle>

              <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                    >
                      {t(item.key)}
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-6 space-y-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" size="sm">
                      {t("changeLanguage")} ({locale.toUpperCase()})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {locales.map((nextLocale) => {
                      const FlagIcon = localeFlagIcons[nextLocale];
                      return (
                        <DropdownMenuItem key={nextLocale} onSelect={() => switchLocale(nextLocale)}>
                          <FlagIcon className="size-4 shrink-0" />
                          {nextLocale.toUpperCase()} - {localeNames[nextLocale]}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button asChild className="w-full" size="sm">
                  <Link href="/auth/sign-in">{t("signIn")}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
