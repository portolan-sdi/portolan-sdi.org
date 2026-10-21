/**
 * Section headings for a post or tutorial body.
 *
 * The rail lists a post's `##` sections. The route reads them from the MDX
 * source at build time with `extractHeadings`, and the `h2` in
 * `src/mdx-components.tsx` sets its id with `slugify` on its rendered text.
 * Both sides strip the same inline markup, so the rail link and the heading
 * id agree.
 */
export interface Heading {
  /** Element id on the page, and the anchor in the rail link. */
  id: string;
  /** The heading text with inline markup removed. */
  text: string;
}

/** Lowercase, Latin letters and digits only, words joined by hyphens. */
export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Remove inline code ticks, link targets, and emphasis marks. */
function plainText(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__|\*|_)(.+?)\1/g, "$2")
    .trim();
}

/**
 * Every `##` heading in an MDX source, in order. Lines inside fenced code
 * blocks are skipped, so a shell comment such as `## install` is not a
 * section.
 */
export function extractHeadings(source: string): Heading[] {
  const headings: Heading[] = [];
  let fenced = false;
  for (const line of source.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const match = /^## (.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = plainText(match[1]);
    headings.push({ id: slugify(text), text });
  }
  return headings;
}
