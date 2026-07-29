import { routing } from "@/i18n/routing";

/**
 * Canonical origin. The apex (portolan-sdi.org) 307-redirects to www, so every
 * canonical URL, sitemap entry, and OG image URL has to be built on www or it
 * points search engines at a redirect.
 */
export const SITE_ORIGIN = "https://www.portolan-sdi.org";

/**
 * Path for a locale under `localePrefix: "as-needed"`: the default locale is
 * served unprefixed, every other locale carries its prefix.
 */
export function localePath(locale: string): string {
  return locale === routing.defaultLocale ? "/" : `/${locale}`;
}

/** Absolute canonical URL for a locale's home page. */
export function localeUrl(locale: string): string {
  const path = localePath(locale);
  return path === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;
}

/**
 * hreflang map for every locale, plus x-default pointing at the unprefixed
 * default so crawlers have an explicit fallback for unmatched languages.
 */
export function alternateLanguages(): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = localeUrl(locale);
  }
  languages["x-default"] = localeUrl(routing.defaultLocale);
  return languages;
}
