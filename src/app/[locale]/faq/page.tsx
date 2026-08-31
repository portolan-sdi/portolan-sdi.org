import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FaqPage } from "@/components";
import { alternateLanguages, localeUrl } from "@/lib/site";
import { FAQ_ITEMS } from "@/lib/faq";
import { faqJsonLd, plainText } from "@/lib/structured-data";
import { JsonLd } from "@/components/json-ld";

const ROUTE = "/faq";

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
  const t = await getTranslations({ locale, namespace: "faq.meta" });
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
      type: "article",
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

export default async function Faq({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "faq" });
  const questions = FAQ_ITEMS.map(({ key, paras }) => ({
    question: plainText(t(`items.${key}.q`)),
    answer: Array.from({ length: paras }, (_, i) =>
      plainText(t(`items.${key}.p${i + 1}`)),
    ).join(" "),
  }));

  return (
    <>
      <JsonLd data={faqJsonLd({ locale, route: ROUTE, questions })} />
      <FaqPage />
    </>
  );
}
