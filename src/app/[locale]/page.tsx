import { setRequestLocale } from "next-intl/server";
import { HomePage } from "@/components";
import { getCatalogs } from "@/lib/catalogs";
import { toCounted, type CountedCatalog } from "@/lib/registry-view";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The count line under the registry map reads the listing. The registry
  // fetch is cached for an hour, as on `/registry`. A failed fetch leaves no
  // catalogs, and the page renders without the line.
  let catalogs: CountedCatalog[] = [];
  try {
    catalogs = (await getCatalogs()).catalogs.map(toCounted);
  } catch (err) {
    console.error("Failed to fetch catalogs:", err);
  }

  return <HomePage catalogs={catalogs} />;
}
