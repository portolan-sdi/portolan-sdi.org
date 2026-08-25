import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { alternateLanguages, localeUrl } from "@/lib/site";

// Every route, crossed by every locale. Each entry declares the hreflang set
// for its own path, so the three copies of a page are read as translations of
// one another rather than as duplicates.
//
// `priority` ranks the home page above the rest, and the default locale above
// its translations.
const ROUTES = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/registry", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/talks", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return ROUTES.flatMap(({ path, priority, changeFrequency }) => {
    const languages = alternateLanguages(path);

    return routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified,
      changeFrequency,
      priority: locale === routing.defaultLocale ? priority : priority * 0.8,
      alternates: { languages },
    }));
  });
}
