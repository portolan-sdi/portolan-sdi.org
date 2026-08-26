"use client";

import type { ReactNode } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BlogPost } from "@/lib/blog";
import { PageHero } from "./page-hero";
import { AWAY_ITEMS, SiteShell } from "./site-rail";

// A single blog post.
//
// The body is the compiled MDX, passed in as children from the route so it
// stays a server component. Its elements pick up their classes from
// src/mdx-components.tsx.
//
// The measure is capped at 68ch. The rest of the site runs a 1240px content
// column, which is right for a grid of cards and much too wide for a
// 2,000-word article.
//
// Posts are written in English only. A reader on /es/ or /ar/ gets the English
// body and a translated notice that says so.

interface BlogPostPageProps {
  post: BlogPost;
  children: ReactNode;
}

export function BlogPostPage({ post, children }: BlogPostPageProps) {
  const t = useTranslations("blog");
  const format = useFormatter();
  const locale = useLocale();

  return (
    <SiteShell navItems={AWAY_ITEMS} activeId="blog">
      {/* The headline runs the full 1240px band, like every other page header.
          Only the body below it takes the narrow reading measure. */}
      <PageHero
        title={post.title}
        subtitle={post.subtitle}
        eyebrow={
          <time dateTime={post.date}>
            {format.dateTime(new Date(post.date), "postDate")}
          </time>
        }
      >
        <Link
          href="/blog"
          className="mt-8 inline-flex items-center gap-2 font-mono text-eyebrow uppercase tracking-[0.08em] text-p-ink-3 transition-colors hover:text-p-primary"
        >
          {/* Points back along the reading direction, so it flips in
              Arabic. */}
          <span aria-hidden className="inline-block rtl:-scale-x-100">
            &#8592;
          </span>
          {t("backToIndex")}
        </Link>
      </PageHero>

      <section className="px-[var(--p-pad-section-x)] pb-[var(--p-pad-section-y)] pt-[clamp(28px,3.5vw,48px)]">
        {/* The measure sits on the content column's inline-start edge, the
            same edge the headline above it uses. Centring it instead left the
            body indented from its own title. */}
        <div className="mx-auto max-w-[1240px]">
          <div className="max-w-[68ch]">
            {locale !== "en" && (
              <p className="mb-10 border border-p-line bg-p-bg-soft p-4 text-small leading-[1.6] text-p-ink-2">
                {t("englishNotice")}
              </p>
            )}

            {/* The body renders left to right in every locale, because it is
                written in English. The page header band already draws the rule
                above it. */}
            <div dir="ltr">{children}</div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
