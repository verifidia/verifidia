import type { ComponentType, SVGProps } from "react";
import {
  IconUnitedStates,
  IconSpain,
  IconFrance,
  IconGermany,
  IconChina,
  IconJapan,
  IconSouthKorea,
  IconBrazil,
  IconSaudiArabia,
  IconIndia,
} from "nucleo-flags";

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

export const localeFlagIcons: Record<Locale, ComponentType<SVGProps<SVGSVGElement>>> = {
  en: IconUnitedStates,
  es: IconSpain,
  fr: IconFrance,
  de: IconGermany,
  zh: IconChina,
  ja: IconJapan,
  ko: IconSouthKorea,
  pt: IconBrazil,
  ar: IconSaudiArabia,
  hi: IconIndia,
};

export const rtlLocales: Locale[] = ["ar"];
