"use client";

import type { ReactNode } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Ltr } from "./ui";
import type { BlogPost } from "@/lib/blog";
import type { Heading } from "@/lib/headings";
import { ENTRIES, type ArticleSection } from "./blog-index-page";
import { PageHero } from "./page-hero";
import { AWAY_ITEMS, SiteShell } from "./site-rail";

// A single blog post or tutorial. The section picks the rail entry, the
// back link, and the message namespace for the back link and the English
// notice.
//
// The body is the compiled MDX, passed in as children from the route so it
// stays a server component. Its elements pick up their classes from
// src/mdx-components.tsx.
//
// The measure is capped at 68ch. The rest of the site runs a 1240px content
// column, which is right for a grid of cards and much too wide for a
// 2,000-word article.
//
// Posts and tutorials are written in English only. A reader on /es/ or /ar/
// gets the English body and a translated notice that says so.
//
// The post's `##` sections nest under its rail entry, and a previous and next
// pair under the body links the neighboring entries in the same section.

interface BlogPostPageProps {
  post: BlogPost;
  section?: ArticleSection;
  /** The body's `##` headings, read from the MDX source by the route. */
  sections?: Heading[];
  children: ReactNode;
}

/** Points along the reading direction, so it flips in Arabic. */
function Arrow({ back = false }: { back?: boolean }) {
  return (
    <span aria-hidden className="inline-block rtl:-scale-x-100">
      {back ? "\u2190" : "\u2192"}
    </span>
  );
}

export function BlogPostPage({
  post,
  section = "blog",
  sections,
  children,
}: BlogPostPageProps) {
  const t = useTranslations(section);
  // The byline word is shared with the blog.
  const tBlog = useTranslations("blog");
  const format = useFormatter();
  const locale = useLocale();

  // Entries run newest first. Previous is the older neighbor, next the newer.
  const entries = ENTRIES[section];
  const index = entries.findIndex((entry) => entry.slug === post.slug);
  const older = entries[index + 1];
  const newer = index > 0 ? entries[index - 1] : undefined;

  return (
    <SiteShell navItems={AWAY_ITEMS} activeId={section} sections={sections}>
      {/* The headline runs the full 1240px band, like every other page header.
          Only the body below it takes the narrow reading measure. */}
      <PageHero
        title={post.title}
        subtitle={post.subtitle}
        eyebrow={
          <>
            <time dateTime={post.date}>
              {format.dateTime(new Date(post.date), "postDate")}
            </time>
            {/* A post by one person carries a byline. The separator is the
                middle dot the rest of the site uses for a mono run-on. The
                name is Latin, so it holds its order inside Arabic. */}
            {post.author && (
              <>
                {" · "}
                {tBlog("by")}{" "}
                <Ltr>
                  {post.authorUrl ? (
                    <a
                      href={post.authorUrl}
                      className="underline underline-offset-4 transition-colors hover:text-p-primary"
                    >
                      {post.author}
                    </a>
                  ) : (
                    post.author
                  )}
                </Ltr>
              </>
            )}
          </>
        }
      >
        <Link
          href={`/${section}`}
          className="mt-8 inline-flex items-center gap-2 font-mono text-eyebrow uppercase tracking-[0.08em] text-p-ink-3 transition-colors hover:text-p-primary"
        >
          <Arrow back />
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

            {(older || newer) && (
              <nav
                aria-label={tBlog("pagerLabel")}
                className="mt-16 grid grid-cols-1 gap-6 border-t border-p-line pt-6 sm:grid-cols-2"
              >
                {older && (
                  <Link href={`/${section}/${older.slug}`} className="group block">
                    <span className="font-mono text-eyebrow text-p-ink-3">
                      <Arrow back /> {tBlog("previous")}
                    </span>
                    <span className="mt-1 block text-body font-bold leading-snug text-pretty text-p-ink transition-colors group-hover:text-p-primary">
                      <Ltr>{older.title}</Ltr>
                    </span>
                  </Link>
                )}
                {newer && (
                  <Link
                    href={`/${section}/${newer.slug}`}
                    className="group block sm:col-start-2 sm:text-end"
                  >
                    <span className="font-mono text-eyebrow text-p-ink-3">
                      {tBlog("next")} <Arrow />
                    </span>
                    <span className="mt-1 block text-body font-bold leading-snug text-pretty text-p-ink transition-colors group-hover:text-p-primary">
                      <Ltr>{newer.title}</Ltr>
                    </span>
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
