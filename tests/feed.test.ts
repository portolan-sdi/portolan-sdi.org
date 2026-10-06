import assert from "node:assert/strict";
import test from "node:test";
import type { BlogPost } from "../src/lib/blog";
import { POSTS } from "../src/lib/blog";
import { FEED_URL, buildFeed, escapeXml, rfc822 } from "../src/lib/feed";

const post: BlogPost = {
  slug: "example",
  title: "Tags & <markup>",
  subtitle: "A subtitle",
  date: "2026-09-16",
  author: "A. Writer",
  summary: 'Quotes "here" and an apostrophe\'s mark.',
};

test("the feed has one item per registered post", () => {
  const xml = buildFeed(POSTS);
  assert.equal(xml.match(/<item>/g)?.length, POSTS.length);
  for (const { slug } of POSTS) {
    assert.ok(
      xml.includes(`<link>https://www.portolan-sdi.org/blog/${slug}</link>`),
      `the feed links ${slug}`,
    );
  }
});

test("the feed escapes XML special characters", () => {
  const xml = buildFeed([post]);
  assert.ok(xml.includes("<title>Tags &amp; &lt;markup&gt;: A subtitle</title>"));
  assert.ok(
    xml.includes(
      "<description>Quotes &quot;here&quot; and an apostrophe&apos;s mark.</description>",
    ),
  );
  assert.equal(escapeXml("a&b"), "a&amp;b");
});

test("the feed dates are RFC 822 and do not depend on the build time", () => {
  assert.equal(rfc822("2026-09-16"), "Wed, 16 Sep 2026 00:00:00 GMT");
  const xml = buildFeed([post]);
  assert.ok(xml.includes("<pubDate>Wed, 16 Sep 2026 00:00:00 GMT</pubDate>"));
  assert.ok(
    xml.includes("<lastBuildDate>Wed, 16 Sep 2026 00:00:00 GMT</lastBuildDate>"),
  );
  assert.equal(buildFeed([post]), xml);
});

test("the feed names the author in dc:creator and links itself", () => {
  const xml = buildFeed([post, { ...post, slug: "anon", author: undefined }]);
  assert.equal(xml.match(/<dc:creator>/g)?.length, 1);
  assert.ok(xml.includes(`<atom:link href="${FEED_URL}" rel="self"`));
});
