import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BlogPostPage } from "@/components";
import { fullTitle } from "@/lib/blog";
import { CASE_STUDIES, getCaseStudy } from "@/lib/case-studies";
import { alternateLanguages, localeUrl } from "@/lib/site";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Every study prerenders. An unknown slug is a 404 rather than a runtime
// import of a file that does not exist.
export const dynamicParams = false;

export function generateStaticParams() {
  return CASE_STUDIES.map(({ slug }) => ({ slug }));
}

// Title and description come from the case study registry, not from
// `messages/`, because case studies are written in English only. The canonical
// override is needed because the locale layout canonicalizes the whole
// segment to `/`.
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const study = getCaseStudy(slug);
  if (!study) return {};

  const route = `/case-studies/${study.slug}`;
  const url = localeUrl(locale, route);
  // A document title cannot set two lines, so it carries both halves.
  const title = fullTitle(study);

  return {
    title,
    description: study.summary,
    alternates: {
      canonical: url,
      languages: alternateLanguages(route),
    },
    openGraph: {
      type: "article",
      siteName: "Portolan",
      title,
      description: study.summary,
      url,
      locale,
      publishedTime: study.date,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: study.summary,
    },
  };
}

export default async function CaseStudy({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const study = getCaseStudy(slug);
  if (!study) notFound();

  const { default: Body } = await import(`@/content/case-studies/${slug}.mdx`);
  return (
    <BlogPostPage
      post={study}
      section="case-studies"
      heading={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={study.logo}
          alt={study.title}
          width={2500}
          height={600}
          className="h-16 w-auto max-w-full object-contain brightness-0 sm:h-20"
        />
      }
    >
      <Body />
    </BlogPostPage>
  );
}
