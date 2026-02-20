import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { SearchBar } from "@/components/layout/search-bar";

const replaceMock = vi.fn();

vi.mock("next-intl", () => {
  const messages = {
    nav: {
      home: "Home",
      about: "About",
      signIn: "Sign in",
      changeLanguage: "Change language",
    },
    search: {
      placeholder: "Search any topic...",
    },
    footer: {
      openSource: "Open Source",
      poweredByAI: "Powered by AI",
      license: "MIT License",
    },
  } as const;

  return {
    useTranslations: (namespace: keyof typeof messages) =>
      (key: keyof (typeof messages)[typeof namespace]) => messages[namespace][key] ?? key,
    useLocale: () => "en",
  };
});

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  usePathname: () => "/",
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

describe("Layout shell components", () => {
  it("Header renders Verifidia text", () => {
    const markup = renderToStaticMarkup(<Header />);

    expect(markup).toContain("Verifidia");
  });

  it("Footer renders copyright text", () => {
    const markup = renderToStaticMarkup(<Footer locale="en" />);

    expect(markup).toContain("© 2026 Verifidia — MIT License");
  });

  it("SearchBar renders input element", () => {
    const markup = renderToStaticMarkup(<SearchBar />);

    expect(markup).toContain("<input");
  });
});
