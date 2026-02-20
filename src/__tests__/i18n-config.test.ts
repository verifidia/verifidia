import { describe, it, expect } from "vitest";
import { locales, defaultLocale, rtlLocales } from "@/i18n/config";

describe("i18n Config", () => {
  it("exports 10 locales", () => {
    expect(locales).toHaveLength(10);
  });

  it("includes required locales", () => {
    expect(locales).toContain("en");
    expect(locales).toContain("es");
    expect(locales).toContain("fr");
    expect(locales).toContain("ar");
    expect(locales).toContain("zh");
  });

  it("default locale is English", () => {
    expect(defaultLocale).toBe("en");
  });

  it("Arabic is RTL", () => {
    expect(rtlLocales).toContain("ar");
  });

  it("English is not RTL", () => {
    expect(rtlLocales).not.toContain("en");
  });
});
