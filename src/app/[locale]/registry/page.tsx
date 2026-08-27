import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegistryPage } from "@/components";
import {
  getCatalogs,
  getCoverageBboxes,
  type Catalog,
  type CoverageBboxes,
} from "@/lib/catalogs";
import { parseExplorerParams } from "@/lib/explorer-url";
import { alternateLanguages, localeUrl } from "@/lib/site";

const ROUTE = "/registry";

interface PageProps {
  params: Promise<{ locale: string }>;
  // The explorer keeps its extent, query, and page in the URL. Reading them
  // here renders a shared link's results on the first paint, which also makes
  // this route render per request.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// The locale layout sets a canonical of the home page for the whole segment,
// so a route that does not override it declares itself a duplicate of `/`.
// Title and description come from this page's own namespace for the same
// reason.
export async function generateMetadata({
  params,
}: Pick<PageProps, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "registry.meta" });
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

export default async function Registry({ params, searchParams }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const initial = parseExplorerParams(await searchParams);

  const [catalogResult, coverageResult] = await Promise.allSettled([
    getCatalogs(),
    getCoverageBboxes(),
  ]);

  let catalogs: Catalog[] = [];
  let coverage: CoverageBboxes | null = null;

  if (catalogResult.status === "fulfilled") {
    catalogs = catalogResult.value.catalogs;
  } else {
    console.error("Failed to fetch catalogs:", catalogResult.reason);
  }

  if (coverageResult.status === "fulfilled") {
    coverage = coverageResult.value;
  } else {
    console.error("Failed to fetch collection coverage:", coverageResult.reason);
  }

  return <RegistryPage catalogs={catalogs} coverage={coverage} initial={initial} />;
}
