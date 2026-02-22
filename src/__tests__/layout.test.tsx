import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Header } from "@/components/layout/header";
import { SearchBar } from "@/components/layout/search-bar";

const replaceMock = vi.fn();

vi.mock("next-intl", () => {
  const messages = {
    nav: {
      home: "Home",
      signIn: "Sign in",
      changeLanguage: "Change language",
    },
    search: {
      placeholder: "Search any topic...",
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



  it("SearchBar renders input element", () => {
    const markup = renderToStaticMarkup(<SearchBar />);

    expect(markup).toContain("<input");
  });
});
