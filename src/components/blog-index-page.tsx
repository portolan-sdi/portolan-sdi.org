"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Ltr } from "./ui";
import { POSTS } from "@/lib/blog";
import { FEED_PATH } from "@/lib/feed";
import { TUTORIALS } from "@/lib/tutorials";
import { CASE_STUDIES } from "@/lib/case-studies";
import { PageHero } from "./page-hero";
import { SiteShell } from "./site-rail";

// The index for the blog and for tutorials.
//
// The blog is a grid of cards. Each card has a picture from the post, the
// title, the subtitle, and one line with the author, the date, and the
// reading time. The cards have the same anatomy, by the owner's choice, and
// a card shows no summary. A post with no author is by "The Portolan team".
//
// Tutorials are rows with rules between them. A tutorial has no author and
// can have no picture, so it does not fit the card.
//
// Titles and summaries come from src/lib/blog.ts and src/lib/tutorials.ts, not
// from messages/, because both are written in English only. Everything else on
// this page is translated.
//
// The section picks the list, the route prefix, and the
// message namespace for the page title and intro. Only the blog has a feed.

export type ArticleSection = "blog" | "tutorials" | "case-studies";

/** Each section's entries, newest first. The post page reads its neighbors here. */
export const ENTRIES = { blog: POSTS, tutorials: TUTORIALS, "case-studies": CASE_STUDIES };

interface BlogIndexPageProps {
  section?: ArticleSection;
  /** Reading time of each blog post in minutes, by slug. The route counts it. */
  readingMinutes?: Record<string, number>;
}

export function BlogIndexPage({
  section = "blog",
  readingMinutes = {},
}: BlogIndexPageProps) {
  const t = useTranslations(section);
  // The byline word and the feed label are shared with the blog.
  const tBlog = useTranslations("blog");
  const format = useFormatter();

  return (
    <SiteShell>
      <PageHero title={t("title")}>
        {/* The title says what the page is, so the header has no lead
            paragraph. */}
        {/* A plain anchor, not the locale Link. The feed is English only and
            lives at one unprefixed path in every locale. */}
        {section === "blog" && (
          <a
            href={FEED_PATH}
            type="application/rss+xml"
            className="mt-5 inline-flex items-center gap-2 text-small text-p-ink-3 transition-colors hover:text-p-primary"
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
            <span className="underline underline-offset-4">{tBlog("feed")}</span>
          </a>
        )}
      </PageHero>

      <section className="px-[var(--p-pad-section-x)] pb-[var(--p-pad-section-y)] pt-[clamp(28px,3.5vw,48px)]">
        <div className="mx-auto max-w-[1240px]">
          {section === "blog" ? (
            <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {POSTS.map((post) => (
                <li key={post.slug} className="group relative flex min-w-0 flex-col">
                  {/* The picture is decoration. The title under it names
                      the post, so the picture has no text of its own. A
                      post with no picture shows the grid wash. */}
                  <div className="graph-wash aspect-[3/2] overflow-hidden border border-p-line">
                    {post.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover object-top"
                        style={
                          post.imagePosition
                            ? { objectPosition: post.imagePosition }
                            : undefined
                        }
                      />
                    )}
                  </div>

                  {/* The link covers the whole card, so the picture and
                      the text are one hit target. */}
                  <h2 className="mt-5 text-card-title leading-[1.2] tracking-[-0.02em] text-pretty rtl:tracking-normal">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-p-ink transition-colors after:absolute after:inset-0 group-hover:text-p-primary"
                    >
                      <span className="block font-bold">{post.title}</span>
                      {post.subtitle && (
                        <span className="mt-1 block font-normal text-p-ink-2 transition-colors group-hover:text-p-primary">
                          {post.subtitle}
                        </span>
                      )}
                    </Link>
                  </h2>

                  {/* Author, date, reading time. The name is Latin, so it
                      holds its order inside Arabic. */}
                  <p className="mt-3 text-small text-p-ink-3">
                    {post.author ? <Ltr>{post.author}</Ltr> : tBlog("team")}
                    {" · "}
                    <time dateTime={post.date}>
                      {format.dateTime(new Date(post.date), "postDate")}
                    </time>
                    {readingMinutes[post.slug] !== undefined && (
                      <>
                        {" · "}
                        {tBlog("readingTime", {
                          minutes: readingMinutes[post.slug],
                        })}
                      </>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
          <div className="border-t border-p-line">
            {ENTRIES[section].map((post) => (
              <article
                key={post.slug}
                className="border-b border-p-line py-8 md:grid md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] md:gap-10"
              >
                <time
                  dateTime={post.date}
                  className="block text-small text-p-ink-3"
                >
                  {format.dateTime(new Date(post.date), "postDate")}
                </time>

                {/* The byline sits under the date, in the same mono column.
                    It carries no link here: the only hit target on a card is
                    the title. */}
                {post.author && (
                  <p className="mt-1 text-small text-p-ink-3 md:col-start-1">
                    {tBlog("by")} <Ltr>{post.author}</Ltr>
                  </p>
                )}

                <div className="mt-3 md:mt-0">
                  {/* The link spans both halves of the headline, so the whole
                      title is one hit target. */}
                  <h2 className="text-feature leading-[1.2] tracking-[-0.02em] text-pretty">
                    <Link
                      href={`/${section}/${post.slug}`}
                      className="text-p-ink transition-colors hover:text-p-primary"
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
          )}
        </div>
      </section>
    </SiteShell>
  );
}
