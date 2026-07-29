import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { alternateLanguages, localeUrl } from "@/lib/site";

// One entry per locale home page. The site is a single route, so the sitemap
// stays flat; each entry declares the full hreflang set so the three locales
// are read as translations of one page rather than as duplicates.
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = alternateLanguages();

  return routing.locales.map((locale) => ({
    url: localeUrl(locale),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: { languages },
  }));
}
