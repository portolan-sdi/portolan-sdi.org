import { routing } from "@/i18n/routing";

/**
 * Canonical origin. The apex (portolan-sdi.org) 307-redirects to www, so every
 * canonical URL, sitemap entry, and OG image URL has to be built on www or it
 * points search engines at a redirect.
 */
export const SITE_ORIGIN = "https://www.portolan-sdi.org";

/**
 * Canonical community and license destinations used by the homepage close.
 * Keep these aligned with portolan-ops/copy/urls.md.
 */
export const COMMUNITY_LINKS = {
  github: "https://github.com/portolan-sdi",
  googleGroup: "https://groups.google.com/g/portolan",
  issues: "https://github.com/portolan-sdi",
  /**
   * The roadmap is a file in portolan-ops, not the org project board. That
   * board is private, so a public page cannot link it.
   */
  roadmap: "https://github.com/portolan-sdi/portolan-ops/blob/main/ROADMAP.md",
  slack: "https://cloudnativegeo.slack.com/archives/C0A1JBH9529",
} as const;

/** Canonical specification sites from portolan-ops/copy/urls.md. */
export const FORMAT_LINKS = {
  geoParquet: "https://geoparquet.org/",
  pmtiles: "https://docs.protomaps.com/pmtiles/",
  cog: "https://cogeo.org/",
  stac: "https://stacspec.org/en/",
} as const;

export const LICENSE_LINKS = {
  content: "https://creativecommons.org/licenses/by/4.0/",
  source:
    "https://github.com/portolan-sdi/portolan-sdi.org/blob/main/LICENSE",
} as const;

/**
 * Path for a locale under `localePrefix: "as-needed"`: the default locale is
 * served unprefixed, every other locale carries its prefix.
 *
 * `route` is a page path under the locale, such as `/faq`. It defaults to the
 * home page, so the original single-route call sites read the same.
 */
export function localePath(locale: string, route = "/"): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const suffix = route === "/" ? "" : route;
  return `${prefix}${suffix}` || "/";
}

/** Absolute canonical URL for a locale's copy of a route. */
export function localeUrl(locale: string, route = "/"): string {
  const path = localePath(locale, route);
  return path === "/" ? SITE_ORIGIN : `${SITE_ORIGIN}${path}`;
}

/**
 * hreflang map for every locale's copy of one route, plus x-default pointing
 * at the unprefixed default so crawlers have an explicit fallback for
 * unmatched languages.
 */
export function alternateLanguages(route = "/"): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = localeUrl(locale, route);
  }
  languages["x-default"] = localeUrl(routing.defaultLocale, route);
  return languages;
}
