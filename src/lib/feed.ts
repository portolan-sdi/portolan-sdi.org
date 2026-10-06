import type { BlogPost } from "./blog";
import { fullTitle } from "./blog";
import { SITE_ORIGIN, localeUrl } from "./site";

/**
 * The blog feed path. The feed is RSS 2.0 and lists every post in `POSTS`.
 *
 * Posts are English only, so there is one feed, not one per locale. Every
 * item links the unprefixed English URL.
 */
export const FEED_PATH = "/blog/feed.xml";

export const FEED_URL = `${SITE_ORIGIN}${FEED_PATH}`;

/** Channel text. English only, for the same reason post titles are. */
const CHANNEL = {
  title: "Portolan blog",
  description:
    "Notes from the Portolan project on the specification, the tooling, and what we learn from publishing real catalogs.",
} as const;

/** Escape the five XML special characters for text and attribute values. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * RFC 822 date for an ISO calendar date. RSS 2.0 requires this form. A post
 * date has no time, so the item publishes at midnight UTC.
 */
export function rfc822(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toUTCString();
}

function item(post: BlogPost): string {
  const url = localeUrl("en", `/blog/${post.slug}`);
  const lines = [
    "<item>",
    `<title>${escapeXml(fullTitle(post))}</title>`,
    `<link>${url}</link>`,
    `<guid isPermaLink="true">${url}</guid>`,
    `<pubDate>${rfc822(post.date)}</pubDate>`,
  ];
  // RSS 2.0 `<author>` takes an email address. A bare name goes in
  // `dc:creator` instead.
  if (post.author) {
    lines.push(`<dc:creator>${escapeXml(post.author)}</dc:creator>`);
  }
  lines.push(`<description>${escapeXml(post.summary)}</description>`, "</item>");
  return lines.join("\n");
}

/**
 * The RSS 2.0 document for a list of posts, newest first.
 *
 * `lastBuildDate` is the date of the newest post, not the build time. The
 * output then depends only on the posts, so a rebuild with no new post does
 * not change the feed.
 */
export function buildFeed(posts: readonly BlogPost[]): string {
  const blogUrl = localeUrl("en", "/blog");
  const channel = [
    `<title>${escapeXml(CHANNEL.title)}</title>`,
    `<link>${blogUrl}</link>`,
    `<description>${escapeXml(CHANNEL.description)}</description>`,
    "<language>en</language>",
    `<atom:link href="${FEED_URL}" rel="self" type="application/rss+xml"/>`,
  ];
  if (posts.length > 0) {
    channel.push(`<lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>`);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "<channel>",
    ...channel,
    ...posts.map(item),
    "</channel>",
    "</rss>",
    "",
  ].join("\n");
}
