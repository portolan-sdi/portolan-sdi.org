"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Ltr } from "./ui";
import { POSTS } from "@/lib/blog";
import { FEED_PATH } from "@/lib/feed";
import { PageHero } from "./page-hero";
import { AWAY_ITEMS, SiteShell } from "./site-rail";

// The blog index.
//
// Rules-separated rows rather than a card grid, for the same reason the FAQ is
// rows: a list of headlines reads faster than a wall of boxes, and the site
// does not give every item in a list identical anatomy.
//
// Post titles and summaries come from src/lib/blog.ts, not from messages/,
// because posts are written in English only. Everything else on this page is
// translated.

export function BlogIndexPage() {
  const t = useTranslations("blog");
  const format = useFormatter();

  return (
    <SiteShell navItems={AWAY_ITEMS} activeId="blog">
      <PageHero title={t("title")}>
        {/* No measure cap. A lead paragraph that stops at 60ch leaves a
            ragged edge mid-page while the rules below it run full width. */}
        <p className="mt-6 text-lead leading-relaxed text-p-ink-2">
          {t("intro")}
        </p>
        {/* A plain anchor, not the locale Link. The feed is English only and
            lives at one unprefixed path in every locale. */}
        <a
          href={FEED_PATH}
          type="application/rss+xml"
          className="mt-4 inline-flex items-center gap-2 font-mono text-eyebrow uppercase tracking-[0.08em] text-p-ink-3 transition-colors hover:text-p-primary rtl:tracking-normal"
        >
          {/* The feed mark, drawn square to match the site's corners: a
              square source and two arcs with butt caps. It takes the link
              color and is decorative, so the label carries the meaning. */}
          <svg
            viewBox="0 0 16 16"
            className="h-[1em] w-[1em] shrink-0"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="butt"
          >
            <rect x="1" y="12" width="3" height="3" fill="currentColor" stroke="none" />
            <path d="M2.25 7.25a6.5 6.5 0 0 1 6.5 6.5" />
            <path d="M2.25 2.25a11.5 11.5 0 0 1 11.5 11.5" />
          </svg>
          <span className="underline underline-offset-4">{t("feed")}</span>
        </a>
      </PageHero>

      <section className="px-[var(--p-pad-section-x)] pb-[var(--p-pad-section-y)] pt-[clamp(28px,3.5vw,48px)]">
        <div className="mx-auto max-w-[1240px]">
          <div className="border-t border-p-line">
            {POSTS.map((post) => (
              <article
                key={post.slug}
                className="border-b border-p-line py-8 md:grid md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] md:gap-10"
              >
                <time
                  dateTime={post.date}
                  className="block font-mono text-eyebrow uppercase tracking-[0.06em] text-p-ink-3"
                >
                  {format.dateTime(new Date(post.date), "postDate")}
                </time>

                {/* The byline sits under the date, in the same mono column.
                    It carries no link here: the only hit target on a card is
                    the title. */}
                {post.author && (
                  <p className="mt-1 font-mono text-eyebrow uppercase tracking-[0.06em] text-p-ink-3 md:col-start-1">
                    {t("by")} <Ltr>{post.author}</Ltr>
                  </p>
                )}

                <div className="mt-3 md:mt-0">
                  {/* The link spans both halves of the headline, so the whole
                      title is one hit target. */}
                  <h2 className="text-feature leading-[1.2] tracking-[-0.02em] text-pretty">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="transition-colors hover:text-p-primary"
                    >
                      <span className="block font-bold">{post.title}</span>
                      {post.subtitle && (
                        <span className="mt-1 block font-normal text-p-ink-2">
                          {post.subtitle}
                        </span>
                      )}
                    </Link>
                  </h2>

                  <p className="mt-3 text-body leading-[1.7] text-p-ink-2 text-pretty">
                    {post.summary}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
