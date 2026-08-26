import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BlogIndexPage } from "@/components";
import { alternateLanguages, localeUrl } from "@/lib/site";

const ROUTE = "/blog";

interface PageProps {
  params: Promise<{ locale: string }>;
}

// The locale layout sets a canonical of the home page for the whole segment,
// so a route that does not override it declares itself a duplicate of `/`.
// Title and description come from this page's own namespace for the same
// reason.
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog.meta" });
  const title = t("title");
  const description = t("description");
  const url = localeUrl(locale, ROUTE);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: alternateLanguages(ROUTE),
    },
    openGraph: {
      type: "website",
      siteName: "Portolan",
      title,
      description,
      url,
      locale,
      // The segment inherits the site OG card from [locale]/opengraph-image,
      // which is the correct image for this page. File-based metadata outranks
      // anything set here, so it is not repeated.
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function Blog({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <BlogIndexPage />;
}
