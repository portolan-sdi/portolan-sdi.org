import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { POSTS } from "../src/lib/blog";
import { extractHeadings, slugify } from "../src/lib/headings";
import { TUTORIALS } from "../src/lib/tutorials";

test("slugify keeps Latin letters and digits and joins words", () => {
  assert.equal(slugify("Getting Started"), "getting-started");
  assert.equal(slugify("Exploring 25 years of data"), "exploring-25-years-of-data");
  assert.equal(slugify("  What's next?  "), "what-s-next");
  assert.equal(slugify("Café résumé"), "cafe-resume");
});

test("extractHeadings reads h2 lines and strips inline markup", () => {
  const source = [
    "Intro paragraph.",
    "## Getting Started",
    "### A subsection is not a section",
    "## Using `portolan-cli`",
    "## Read [the docs](https://example.com) **now**",
  ].join("\n");
  assert.deepEqual(extractHeadings(source), [
    { id: "getting-started", text: "Getting Started" },
    { id: "using-portolan-cli", text: "Using portolan-cli" },
    { id: "read-the-docs-now", text: "Read the docs now" },
  ]);
});

test("extractHeadings skips lines inside fenced code", () => {
  const source = ["```sh", "## not a heading", "```", "## Real"].join("\n");
  assert.deepEqual(extractHeadings(source), [{ id: "real", text: "Real" }]);
});

test("every post and tutorial has unique section ids", () => {
  const bodies = [
    ...POSTS.map(({ slug }) => `src/content/blog/${slug}.mdx`),
    ...TUTORIALS.map(({ slug }) => `src/content/tutorials/${slug}.mdx`),
  ];
  for (const path of bodies) {
    const ids = extractHeadings(readFileSync(path, "utf8")).map((h) => h.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate section id in ${path}`);
    assert.ok(ids.every(Boolean), `empty section id in ${path}`);
  }
});
