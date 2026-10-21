import type { BlogPost } from "./blog";

/**
 * The tutorial registry.
 *
 * Tutorials share the blog's pipeline. Bodies are MDX in
 * `src/content/tutorials/`, metadata lives here, and both render through the
 * blog's index and post components. A tutorial has the same fields as a post
 * except the author. Tutorials carry no byline, so the type forbids `author`
 * and `authorUrl`.
 *
 * Tutorial titles and summaries are English only, for the same reason post
 * titles are. A new tutorial needs an entry here and a file at
 * `src/content/tutorials/<slug>.mdx`. The route prerenders from this list and
 * returns 404 for any slug that is not in it.
 *
 * Tutorials are not in the blog feed.
 */
export type Tutorial = BlogPost & { author?: never; authorUrl?: never };

/** Newest first. The index renders this order as written. */
export const TUTORIALS: Tutorial[] = [
  {
    slug: "mirroring-east-hampton",
    title: "Mirroring East Hampton's open data",
    subtitle: "Publishing a municipal government's open data as a Portolan catalog",
    date: "2026-10-21",
    summary:
      "Use the Portolan bootstrap agent skill to convert East Hampton, New York's Esri server into a complete Portolan catalog, published on Source Cooperative.",
  },
];

export function getTutorial(slug: string): Tutorial | undefined {
  return TUTORIALS.find((tutorial) => tutorial.slug === slug);
}
