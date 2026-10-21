import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BlogPostPage } from "@/components";
import { fullTitle } from "@/lib/blog";
import { TUTORIALS, getTutorial } from "@/lib/tutorials";
import { extractHeadings } from "@/lib/headings";
import { alternateLanguages, localeUrl } from "@/lib/site";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Every tutorial prerenders. An unknown slug is a 404 rather than a runtime
// import of a file that does not exist.
export const dynamicParams = false;

export function generateStaticParams() {
  return TUTORIALS.map(({ slug }) => ({ slug }));
}

// Title and description come from the tutorial registry, not from
// `messages/`, because tutorials are written in English only. The canonical
// override is needed because the locale layout canonicalizes the whole
// segment to `/`.
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const tutorial = getTutorial(slug);
  if (!tutorial) return {};

  const route = `/tutorials/${tutorial.slug}`;
  const url = localeUrl(locale, route);
  // A document title cannot set two lines, so it carries both halves.
  const title = fullTitle(tutorial);

  return {
    title,
    description: tutorial.summary,
    alternates: {
      canonical: url,
      languages: alternateLanguages(route),
    },
    openGraph: {
      type: "article",
      siteName: "Portolan",
      title,
      description: tutorial.summary,
      url,
      locale,
      publishedTime: tutorial.date,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: tutorial.summary,
    },
  };
}

export default async function Tutorial({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const tutorial = getTutorial(slug);
  if (!tutorial) notFound();

  const { default: Body } = await import(`@/content/tutorials/${slug}.mdx`);
  // The rail lists the body's sections. The page prerenders, so this read
  // runs at build time.
  const sections = extractHeadings(
    await readFile(
      path.join(process.cwd(), "src/content/tutorials", `${slug}.mdx`),
      "utf8",
    ),
  );

  return (
    <BlogPostPage post={tutorial} section="tutorials" sections={sections}>
      <Body />
    </BlogPostPage>
  );
}
