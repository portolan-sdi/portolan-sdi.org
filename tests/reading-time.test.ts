import assert from "node:assert/strict";
import { test } from "node:test";
import { countWords, readingMinutes } from "../src/lib/reading-time";

test("the count leaves out imports, component tags, and link targets", () => {
  const source = [
    'import { PostFigure } from "@/components/blog/post-figure";',
    "",
    "## A heading here",
    "",
    "Read the [spec site](https://example.com/a/b) now.",
    "",
    '<PostFigure n={1} src="/img/a.webp"',
    '  alt="An alt text of several words" />',
  ].join("\n");
  // "A heading here" (3) + "Read the spec site now." (5)
  assert.equal(countWords(source), 8);
});

test("the reading time rounds up and is never less than 1 minute", () => {
  assert.equal(readingMinutes(""), 1);
  assert.equal(readingMinutes("word ".repeat(230)), 1);
  assert.equal(readingMinutes("word ".repeat(231)), 2);
});
