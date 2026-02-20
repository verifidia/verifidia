export const locales = ["en", "es", "fr", "de", "zh", "ja", "ko", "pt", "ar", "hi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
  pt: "Português",
  ar: "العربية",
  hi: "हिन्दी",
};

export const rtlLocales: Locale[] = ["ar"];
