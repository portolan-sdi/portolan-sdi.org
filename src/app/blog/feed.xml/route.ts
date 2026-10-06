import { POSTS } from "@/lib/blog";
import { buildFeed } from "@/lib/feed";

// The feed depends only on the post registry, so it prerenders at build time.
// Next.js 16 does not cache GET route handlers by default.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildFeed(POSTS), {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
