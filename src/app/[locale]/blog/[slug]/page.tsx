import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { BlogPostPage } from "@/components";
import { POSTS, fullTitle, getPost } from "@/lib/blog";
import { alternateLanguages, localeUrl } from "@/lib/site";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Every post prerenders. An unknown slug is a 404 rather than a runtime import
// of a file that does not exist.
export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map(({ slug }) => ({ slug }));
}

// Title and description come from the post registry, not from `messages/`,
// because posts are written in English only. The canonical override is needed
// for the same reason as on every other route: the locale layout canonicalizes
// the whole segment to `/`.
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const route = `/blog/${post.slug}`;
  const url = localeUrl(locale, route);
  // A document title cannot set two lines, so it carries both halves.
  const title = fullTitle(post);

  return {
    title,
    description: post.summary,
    alternates: {
      canonical: url,
      languages: alternateLanguages(route),
    },
    openGraph: {
      type: "article",
      siteName: "Portolan",
      title,
      description: post.summary,
      url,
      locale,
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.summary,
    },
  };
}

export default async function Post({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getPost(slug);
  if (!post) notFound();

  const { default: Body } = await import(`@/content/blog/${slug}.mdx`);

  return (
    <BlogPostPage post={post}>
      <Body />
    </BlogPostPage>
  );
}
