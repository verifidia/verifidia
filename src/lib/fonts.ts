import type { Locale } from "@/i18n/config";

const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/anaclumos/sunghyun-sans@v1.0.0/dist/web/css";

/**
 * Get CDN stylesheet URLs for Sunghyun Sans font variants based on locale.
 * Uses dynamic subsetting for CJK locales (recommended for performance).
 */
export function getFontStylesheets(locale: Locale): string[] {
  const stylesheets = [
    `${CDN_BASE}/sunghyun-sans-dynamic-subset.min.css`,
  ];

  if (locale === "ko") {
    stylesheets.push(`${CDN_BASE}/sunghyun-sans-kr-dynamic-subset.min.css`);
  } else if (locale === "ja") {
    stylesheets.push(`${CDN_BASE}/sunghyun-sans-jp-dynamic-subset.min.css`);
  }

  return stylesheets;
}

/**
 * Get the font-family CSS value for a given locale.
 * - ko: Sunghyun Sans KR (Korean + Latin)
 * - ja: Sunghyun Sans JP (Japanese + Latin)
 * - others: Sunghyun Sans (Latin), falls back to system-ui
 */
export function getFontFamily(locale: Locale): string {
  switch (locale) {
    case "ko":
      return "'Sunghyun Sans KR', 'Sunghyun Sans', system-ui, sans-serif";
    case "ja":
      return "'Sunghyun Sans JP', 'Sunghyun Sans', system-ui, sans-serif";
    default:
      return "'Sunghyun Sans', system-ui, sans-serif";
  }
}
