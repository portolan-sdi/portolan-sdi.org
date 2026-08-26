/**
 * The blog post registry.
 *
 * Post bodies are MDX in `src/content/blog/`. This file holds the metadata the
 * index, the sitemap, and `generateMetadata` need, so none of them has to
 * compile a post body to read its title.
 *
 * Post titles and summaries are English only, which is why they live here and
 * not in `messages/`. Every other user-facing string on the site is translated
 * and belongs in `messages/`. A post is served in English under `/es/` and
 * `/ar/` with a translated notice above the body.
 *
 * A new post needs an entry here and a file at
 * `src/content/blog/<slug>.mdx`. The route prerenders from this list and
 * returns 404 for any slug that is not in it.
 */
export interface BlogPost {
  /** URL segment, and the MDX file name without its extension. */
  slug: string;
  title: string;
  /**
   * The half of the headline that follows the colon. It sets on its own line
   * under the title, so a two-part headline never wraps as one long string.
   */
  subtitle?: string;
  /** ISO calendar date, such as "2026-08-26". */
  date: string;
  /** One or two sentences. Feeds the index card and the meta description. */
  summary: string;
}

/** Newest first. The index renders this order as written. */
export const POSTS: BlogPost[] = [
  {
    slug: "introducing-portolan",
    title: "Introducing Portolan",
    subtitle: "A Serverless Spatial Data Infrastructure",
    date: "2026-08-26",
    summary:
      "Cloud-optimized formats and STAC metadata make it possible to run a spatial data infrastructure as files in a bucket. Portolan is an open-source spec and toolkit for building one.",
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((post) => post.slug === slug);
}

/**
 * The headline as one string, for a document title, an OG title, or anywhere
 * else that cannot set two lines.
 */
export function fullTitle(post: BlogPost): string {
  return post.subtitle ? `${post.title}: ${post.subtitle}` : post.title;
}
