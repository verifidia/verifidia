export const SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'bn', 'id', 'ms', 'tr', 'vi', 'th', 'pl', 'uk', 'nl', 'it', 'fa', 'tl'] as const

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: SupportedLocale = 'en'
