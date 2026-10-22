import path from "node:path";

/**
 * Tutorials mirrored from the portolan-cli repository.
 *
 * Each mirror copies one example README from portolan-cli into
 * `src/content/tutorials/<slug>.mdx`. The CLI docs site renders the same
 * README at cli.portolan-sdi.org, so the two pages carry the same text.
 *
 * `scripts/sync-cli-tutorials.ts` writes the MDX file, and the Sync CLI
 * Tutorials workflow runs it and opens a pull request when the output
 * changes. Do not edit a mirrored MDX file by hand. Edit the README in
 * portolan-cli instead.
 *
 * A mirror also needs an entry in `TUTORIALS` (src/lib/tutorials.ts). The
 * title, subtitle, date, and summary there belong to this site and do not
 * sync.
 */

export const CLI_REPO = "portolan-sdi/portolan-cli";

/** The CLI docs site. A link into `docs/` resolves to a page here. */
export const CLI_DOCS_URL = "https://cli.portolan-sdi.org/";

export interface CliTutorialMirror {
  /** Tutorial slug. It needs a matching entry in `TUTORIALS`. */
  slug: string;
  /** Example directory in portolan-cli. Its `README.md` is the source. */
  dir: string;
}

export const CLI_TUTORIALS: CliTutorialMirror[] = [
  { slug: "philadelphia-housing", dir: "examples/philadelphia-housing" },
];

/** Repository path of the MDX file that a mirror writes. */
export function mirrorFile(mirror: CliTutorialMirror): string {
  return `src/content/tutorials/${mirror.slug}.mdx`;
}

/** The first line of every mirrored file. The contract test reads it. */
export function mirrorHeader(mirror: CliTutorialMirror, sha: string): string {
  return `{/* Mirrored from ${CLI_REPO} ${mirror.dir}/README.md at ${sha}. Do not edit. Run pnpm sync:cli-tutorials. */}`;
}

/**
 * Where a repository-relative link in the README points on the web.
 *
 * A page under `docs/` goes to the CLI docs site. Any other file goes to
 * GitHub at the pinned commit, so the link shows the text the mirror copied.
 */
function resolveLink(
  target: string,
  mirror: CliTutorialMirror,
  sha: string,
  image: boolean,
): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) {
    return target;
  }

  const hashAt = target.indexOf("#");
  const file = hashAt === -1 ? target : target.slice(0, hashAt);
  const hash = hashAt === -1 ? "" : target.slice(hashAt);
  const resolved = (
    file.startsWith("/")
      ? path.posix.normalize(file.slice(1))
      : path.posix.join(mirror.dir, file)
  ).replace(/\/$/, "");
  if (resolved.startsWith("..")) {
    throw new Error(`Link leaves the ${CLI_REPO} repository: ${target}`);
  }

  if (image) {
    return `https://raw.githubusercontent.com/${CLI_REPO}/${sha}/${resolved}`;
  }
  if (/^docs\/.+\.md$/.test(resolved)) {
    const page = resolved.slice("docs/".length, -".md".length);
    const route = page === "index" ? "" : page.replace(/\/index$/, "");
    return `${CLI_DOCS_URL}${route ? `${route}/` : ""}${hash}`;
  }
  const kind = file.endsWith("/") || file === "" ? "tree" : "blob";
  return `https://github.com/${CLI_REPO}/${kind}/${sha}/${resolved}${hash}`;
}

/**
 * Prepare a run of Markdown text, outside code, for the MDX compiler.
 *
 * MDX reads `{` as an expression and `<` as JSX. Plain Markdown means
 * neither, so both are escaped. An HTML comment becomes an MDX comment,
 * which keeps a Vale toggle working. Any other raw HTML stops the sync,
 * because it needs a person to decide how the site renders it.
 */
function escapeText(
  text: string,
  mirror: CliTutorialMirror,
  sha: string,
): string {
  return text
    .replace(/<!--(.*?)-->/g, (_, body: string) => `\u0000${body.replace(/\*\//g, "* /")}\u0001`)
    .replace(/<(https?:\/\/[^>\s]+)>/g, "[$1]($1)")
    .replace(
      /(!?)\[([^\]]*)\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g,
      (_, bang: string, label: string, target: string, title: string) =>
        `${bang}[${label}](${resolveLink(target, mirror, sha, bang === "!")}${title})`,
    )
    .replace(/<(?=[a-zA-Z/!?])/g, () => {
      throw new Error(`Raw HTML in ${mirror.dir}/README.md: ${text.trim()}`);
    })
    .replace(/[{}<]/g, "\\$&")
    .replace(/\u0000/g, "{/*")
    .replace(/\u0001/g, "*/}");
}

/** Split a line on inline code spans, and escape only the text between them. */
function escapeLine(
  line: string,
  mirror: CliTutorialMirror,
  sha: string,
): string {
  // A reference definition, such as `[docs]: ../../docs/index.md`.
  const definition = /^(\s{0,3}\[[^\]]+\]:\s+)(\S+)(.*)$/.exec(line);
  if (definition) {
    const [, start, target, rest] = definition;
    return `${start}${resolveLink(target, mirror, sha, false)}${rest}`;
  }

  let out = "";
  let at = 0;
  while (at < line.length) {
    const open = line.indexOf("`", at);
    if (open === -1) break;
    const run = /^`+/.exec(line.slice(open))![0];
    const close = line.indexOf(run, open + run.length);
    // An unmatched run of backticks is literal text.
    if (close === -1 || line[close + run.length] === "`") {
      out += escapeText(line.slice(at, open + run.length), mirror, sha);
      at = open + run.length;
      continue;
    }
    out += escapeText(line.slice(at, open), mirror, sha);
    out += line.slice(open, close + run.length);
    at = close + run.length;
  }
  return out + escapeText(line.slice(at), mirror, sha);
}

/**
 * Turn a portolan-cli example README into a tutorial body.
 *
 * The README's `#` title is removed, because the page band sets the `<h1>`
 * from `TUTORIALS`. Fenced code passes through unchanged. A short note at the
 * top names the source, and a call to action at the end links to it.
 */
export function renderMirror(
  readme: string,
  mirror: CliTutorialMirror,
  sha: string,
): string {
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new Error(`Invalid ${CLI_REPO} commit: ${sha}`);
  }

  const lines = readme.replace(/\r\n?/g, "\n").split("\n");
  const first = lines.findIndex((line) => line.trim() !== "");
  if (first === -1 || !/^# \S/.test(lines[first])) {
    throw new Error(`${mirror.dir}/README.md must open with a # title`);
  }
  let start = first + 1;
  while (start < lines.length && lines[start].trim() === "") start += 1;

  const body: string[] = [];
  let fence: string | null = null;
  for (const line of lines.slice(start)) {
    const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null;
      }
      body.push(line);
      continue;
    }
    if (marker) {
      fence = marker;
      body.push(line);
      continue;
    }
    body.push(escapeLine(line, mirror, sha));
  }
  if (fence) {
    throw new Error(`${mirror.dir}/README.md has an unclosed code fence`);
  }
  while (body.length && body[body.length - 1].trim() === "") body.pop();

  const source = `https://github.com/${CLI_REPO}/tree/${sha}/${mirror.dir}`;
  return [
    'import { PostCta } from "@/components/blog/post-cta";',
    "",
    mirrorHeader(mirror, sha),
    "",
    `This tutorial mirrors an [example from the portolan-cli repository](${source}). CI in that repository runs the same scripts, and this page updates when the example changes. To follow along, clone [portolan-cli](https://github.com/${CLI_REPO}) and run each command from the repository root.`,
    "",
    ...body,
    "",
    `<PostCta href="${source}" label="View the example source" track="cli-tutorial-${mirror.slug}" />`,
    "",
  ].join("\n");
}
