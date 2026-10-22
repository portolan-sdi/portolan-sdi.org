import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  CLI_TUTORIALS,
  mirrorFile,
  mirrorHeader,
  renderMirror,
  type CliTutorialMirror,
} from "../src/lib/cli-tutorials";
import { extractHeadings } from "../src/lib/headings";
import { getTutorial } from "../src/lib/tutorials";

const mirror: CliTutorialMirror = { slug: "example", dir: "examples/example" };
const sha = "0123456789abcdef0123456789abcdef01234567";

function body(readme: string): string {
  return renderMirror(readme, mirror, sha);
}

test("the README title is dropped and the body follows the source note", () => {
  const out = body("# Example Title\n\nFirst line.\n");
  assert.ok(!out.includes("Example Title"));
  assert.ok(out.includes(mirrorHeader(mirror, sha)));
  assert.match(out, /root\.\n\nFirst line\.\n\n<PostCta /);
});

test("a README without a title stops the sync", () => {
  assert.throws(() => body("Intro.\n\n## Step\n"), /must open with a # title/);
});

test("an invalid commit stops the sync", () => {
  assert.throws(() => renderMirror("# T\n", mirror, "main"), /Invalid/);
});

test("braces and angle brackets in prose are escaped for MDX", () => {
  const out = body("# T\n\nUse {id} and a < b.\n");
  assert.ok(out.includes("Use \\{id\\} and a \\< b."));
});

test("code spans and fenced code pass through unchanged", () => {
  const fence = "```sh\nexport A=${B:?set B}\n<tag> {x}\n```";
  const out = body(`# T\n\nSet \`\${CATALOG_DIR}\` first.\n\n${fence}\n`);
  assert.ok(out.includes("Set `${CATALOG_DIR}` first."));
  assert.ok(out.includes(fence));
});

test("a heading inside a fence does not end the fence early", () => {
  const out = body("# T\n\n````md\n```\n{x}\n````\n\n{y}\n");
  assert.ok(out.includes("```\n{x}\n````"));
  assert.ok(out.includes("\\{y\\}"));
});

test("an unclosed fence stops the sync", () => {
  assert.throws(() => body("# T\n\n```sh\nls\n"), /unclosed code fence/);
});

test("an HTML comment becomes an MDX comment", () => {
  const out = body("# T\n\n<!-- vale off -->\n");
  assert.ok(out.includes("{/* vale off */}"));
});

test("raw HTML stops the sync", () => {
  assert.throws(() => body("# T\n\n<details>\n"), /Raw HTML/);
});

test("an autolink becomes a Markdown link", () => {
  const out = body("# T\n\nSee <https://example.org/a>.\n");
  assert.ok(out.includes("See [https://example.org/a](https://example.org/a)."));
});

test("relative links resolve to GitHub at the pinned commit", () => {
  const out = body(
    "# T\n\n[run](run.sh), [dir](metadata/), [up](../../README.md#install), ![img](img/a.png).\n",
  );
  const blob = `https://github.com/portolan-sdi/portolan-cli/blob/${sha}`;
  const tree = `https://github.com/portolan-sdi/portolan-cli/tree/${sha}`;
  assert.ok(out.includes(`[run](${blob}/examples/example/run.sh)`));
  assert.ok(out.includes(`[dir](${tree}/examples/example/metadata)`));
  assert.ok(out.includes(`[up](${blob}/README.md#install)`));
  assert.ok(
    out.includes(
      `![img](https://raw.githubusercontent.com/portolan-sdi/portolan-cli/${sha}/examples/example/img/a.png)`,
    ),
  );
});

test("links into docs/ resolve to the CLI docs site", () => {
  const out = body(
    "# T\n\n[cli](../../docs/reference/cli.md#push) and [home](/docs/index.md).\n\n[ref]: ../../docs/guides/iceberg.md\n",
  );
  assert.ok(out.includes("[cli](https://cli.portolan-sdi.org/reference/cli/#push)"));
  assert.ok(out.includes("[home](https://cli.portolan-sdi.org/)"));
  assert.ok(out.includes("[ref]: https://cli.portolan-sdi.org/guides/iceberg/"));
});

test("absolute links, anchors, and links in code stay as written", () => {
  const out = body("# T\n\n[a](https://x.org/) [b](#step) `[c](d.md)`\n");
  assert.ok(out.includes("[a](https://x.org/) [b](#step) `[c](d.md)`"));
});

test("a link that leaves the repository stops the sync", () => {
  assert.throws(() => body("# T\n\n[x](../../../other.md)\n"), /leaves/);
});

test("every mirror has a tutorial entry and a committed body", async () => {
  for (const entry of CLI_TUTORIALS) {
    assert.ok(getTutorial(entry.slug), `${entry.slug} needs a TUTORIALS entry`);
    const source = await readFile(mirrorFile(entry), "utf8");
    const header = /^\{\/\* Mirrored from \S+ (\S+)\/README\.md at ([0-9a-f]{40})\./m.exec(
      source,
    );
    assert.ok(header, `${mirrorFile(entry)} lacks its mirror header`);
    assert.equal(header[1], entry.dir);
    assert.ok(extractHeadings(source).length > 0, `${entry.slug} has no sections`);
  }
});
