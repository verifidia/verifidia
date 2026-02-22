import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Geist_Mono } from "next/font/google";

import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getFontStylesheets, getFontFamily } from "@/lib/fonts";
import { routing } from "@/i18n/routing";
import { rtlLocales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import "../globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await connection();
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const isRtl = rtlLocales.includes(locale as Locale);

  const fontStylesheets = getFontStylesheets(locale as Locale);
  const fontFamily = getFontFamily(locale as Locale);
  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <head>
        {fontStylesheets.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body
        className={`${geistMono.variable} antialiased`}
        style={{ "--font-sans": fontFamily } as React.CSSProperties}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <div className="bg-background text-foreground flex min-h-screen flex-col">
                <Header />
                <main className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 py-10">
                  {children}
                </main>

              </div>
            </TooltipProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
