import { locales, defaultLocale, localeNames, rtlLocales } from "@/i18n/config";
import type { Locale } from "@/i18n/config";
import { topicToSlug } from "@/lib/article-router";
import enMessages from "../../messages/en.json";
import esMessages from "../../messages/es.json";
import frMessages from "../../messages/fr.json";
import deMessages from "../../messages/de.json";
import zhMessages from "../../messages/zh.json";
import jaMessages from "../../messages/ja.json";
import koMessages from "../../messages/ko.json";
import ptMessages from "../../messages/pt.json";
import arMessages from "../../messages/ar.json";
import hiMessages from "../../messages/hi.json";

vi.mock("next-intl/routing", () => ({
  defineRouting: (config: Record<string, unknown>) => config,
}));

vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: {},
    redirect: vi.fn(),
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    getPathname: vi.fn(),
  }),
}));

const expectedLocales = ["en", "es", "fr", "de", "zh", "ja", "ko", "pt", "ar", "hi"] as const;

const allMessages: Record<string, Record<string, unknown>> = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  de: deMessages,
  zh: zhMessages,
  ja: jaMessages,
  ko: koMessages,
  pt: ptMessages,
  ar: arMessages,
  hi: hiMessages,
};

function getDeepKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return getDeepKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe("i18n Configuration", () => {
  describe("locales array", () => {
    it("contains exactly 10 locales", () => {
      expect(locales).toHaveLength(10);
    });

    it.each(expectedLocales)("includes locale '%s'", (locale) => {
      expect(locales).toContain(locale);
    });

    it("matches expected locales exactly", () => {
      expect([...locales].sort()).toEqual([...expectedLocales].sort());
    });
  });

  describe("defaultLocale", () => {
    it("is 'en'", () => {
      expect(defaultLocale).toBe("en");
    });

    it("is included in locales array", () => {
      expect(locales).toContain(defaultLocale);
    });
  });

  describe("RTL detection", () => {
    it("Arabic ('ar') is in rtlLocales", () => {
      expect(rtlLocales).toContain("ar");
    });

    it("rtlLocales only contains known RTL languages", () => {
      for (const locale of rtlLocales) {
        expect(locales).toContain(locale);
      }
    });

    it("non-RTL locales are not in rtlLocales", () => {
      const ltrLocales: Locale[] = ["en", "es", "fr", "de", "zh", "ja", "ko", "pt", "hi"];
      for (const locale of ltrLocales) {
        expect(rtlLocales).not.toContain(locale);
      }
    });
  });

  describe("localeNames", () => {
    it("has entries for all 10 locales", () => {
      for (const locale of locales) {
        expect(localeNames[locale]).toBeDefined();
        expect(typeof localeNames[locale]).toBe("string");
        expect(localeNames[locale].length).toBeGreaterThan(0);
      }
    });

    it("English name is 'English'", () => {
      expect(localeNames.en).toBe("English");
    });

    it("Arabic name is in Arabic script", () => {
      expect(localeNames.ar).toBe("العربية");
    });
  });
});

describe("Message files", () => {
  describe("all 10 locale files load successfully", () => {
    it.each(expectedLocales)("'%s' message file is a valid object", (locale) => {
      const messages = allMessages[locale];
      expect(messages).toBeDefined();
      expect(typeof messages).toBe("object");
      expect(Object.keys(messages).length).toBeGreaterThan(0);
    });
  });

  describe("structural parity with en.json", () => {
    const enTopLevelKeys = Object.keys(enMessages).sort();

    it("en.json has top-level keys", () => {
      expect(enTopLevelKeys.length).toBeGreaterThan(0);
    });

    it.each(expectedLocales.filter((l) => l !== "en"))(
      "'%s' has same top-level keys as en.json",
      (locale) => {
        const localeKeys = Object.keys(allMessages[locale]).sort();
        expect(localeKeys).toEqual(enTopLevelKeys);
      }
    );
  });

  describe("deep key parity with en.json", () => {
    const enDeepKeys = getDeepKeys(enMessages as Record<string, unknown>).sort();

    it.each(expectedLocales.filter((l) => l !== "en"))(
      "'%s' has all nested keys matching en.json",
      (locale) => {
        const localeDeepKeys = getDeepKeys(allMessages[locale]).sort();
        expect(localeDeepKeys).toEqual(enDeepKeys);
      }
    );
  });

  describe("message values are strings", () => {
    it.each(expectedLocales)("all leaf values in '%s' are strings", (locale) => {
      const deepKeys = getDeepKeys(allMessages[locale]);
      for (const key of deepKeys) {
        const parts = key.split(".");
        let current: unknown = allMessages[locale];
        for (const part of parts) {
          current = (current as Record<string, unknown>)[part];
        }
        expect(typeof current).toBe("string");
      }
    });
  });
});

describe("topicToSlug with non-Latin characters", () => {
  it("preserves Chinese characters", () => {
    expect(topicToSlug("人工智能")).toBe("人工智能");
  });

  it("preserves Japanese characters", () => {
    expect(topicToSlug("機械学習")).toBe("機械学習");
  });

  it("preserves Korean characters", () => {
    expect(topicToSlug("인공지능")).toBe("인공지능");
  });

  it("preserves Arabic characters with space-to-dash", () => {
    expect(topicToSlug("الذكاء الاصطناعي")).toBe("الذكاء-الاصطناعي");
  });

  it("preserves Hindi characters with space-to-dash", () => {
    expect(topicToSlug("कृत्रिम बुद्धिमत्ता")).toBe("कृत्रिम-बुद्धिमत्ता");
  });

  it("preserves mixed Latin and non-Latin characters", () => {
    const result = topicToSlug("AI 人工智能 Technology");
    expect(result).toBe("ai-人工智能-technology");
  });
  it("handles empty string", () => {
    expect(topicToSlug("")).toBe("");
  });
  it("produces valid slugs for Latin text", () => {
    expect(topicToSlug("Machine Learning")).toBe("machine-learning");
    expect(topicToSlug("  Quantum Computing  ")).toBe("quantum-computing");
    expect(topicToSlug("AI & ML")).toBe("ai-ml");
  });

  it("strips leading and trailing dashes", () => {
    expect(topicToSlug(" -test- ")).toBe("test");
  });
});

describe("i18n routing config", () => {
  it("routing module exports are available", async () => {
    const routing = await import("@/i18n/routing");
    expect(routing.routing).toBeDefined();
    expect(routing.routing.locales).toEqual(locales);
    expect(routing.routing.defaultLocale).toBe(defaultLocale);
  });

  it("routing locales match config locales", async () => {
    const routing = await import("@/i18n/routing");
    expect([...routing.routing.locales].sort()).toEqual([...locales].sort());
  });
});
