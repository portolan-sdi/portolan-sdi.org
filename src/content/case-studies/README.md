# Case studies

Each case study is a set of files with one name, the slug. A new study
adds its own files and edits no shared file. So two studies never conflict,
and each study can be its own pull request.

The layout, the index page, the navigation, and the homepage card come from
the shared system. A study supplies content only.

## The files of one study

| File | Required | Purpose |
|---|---|---|
| `src/content/case-studies/<slug>.mdx` | Yes | The body |
| `src/content/case-studies/<slug>.meta.ts` | Yes | The title, the summary, and the pictures |
| `src/content/case-studies/<slug>.credits.md` | When the study uses media | The source and the license of each asset |
| `public/img/case-studies/<slug>-*` | When the study has its own media | The logo and the pictures |
| `tests/<slug>.spec.ts` | No | Checks for this study only |

The slug is the last part of the URL: `/case-studies/<slug>`. Use lowercase
letters, digits, and hyphens.

## The metadata file

```ts
import type { CaseStudyMeta } from "@/lib/case-studies";

const meta: CaseStudyMeta = {
  // The name of the publisher. It is the alt text of the logo.
  title: "Example Agency",
  // One line under the logo.
  subtitle: "What the publisher did, in a few words",
  // The date of publication, as YYYY-MM-DD.
  date: "2026-11-18",
  // One or two sentences for the index page and for search engines.
  summary: "Example Agency publishes its data as a Portolan catalog.",
  // The picture on the index page. A 16:9 crop shows whole.
  image: "/img/case-studies/example-agency-map.webp",
  imageAlt: "What the picture shows, for a reader who cannot see it.",
  // The mark of the publisher, in color, for a light background.
  logo: "/img/case-studies/example-agency-logo.svg",
  // Optional. Only for a mark that exists in white alone.
  // inkLogo: true,
  // Optional. The key of a homepage card that opens this study.
  // homeCard: "example",
};

export default meta;
```

## The body

Write the body in English. Start with one or two paragraphs that say who
the publisher is and what they publish. Do not repeat the title, because
the page shows the logo and the subtitle above the body.

Use these sections, in this order. Leave out a section that has no content.

```mdx
import { PostFigure } from "@/components/blog/post-figure";

Who the publisher is, and what data they publish.

<PostFigure n={1} src="/img/case-studies/example-agency-map.webp" alt="..." caption="..." />

## The challenge

What was difficult before.

## The approach

What the publisher built, and with which tools.

## The catalog

- [Name of the catalog](https://example.com/catalog.json)

## The result

What changed. Give numbers that have a source.

## What comes next

Optional.
```

Rules for the body:

- Each `##` heading must be different from the others in the same study.
- Use `PostFigure` for each picture and each embedded viewer. Number the
  figures from 1.
- Give `wide` to a figure that must run the full content column.
- Each number needs a source that a reader can open.
- A quote needs the name and the role of the person, and their approval.

## The credits file

List each asset that the site does not own: where it comes from, who owns
it, and its license. Plain Markdown, one paragraph or one list.

## Checks

```sh
pnpm exec tsc --noEmit
pnpm lint
pnpm test:unit
```
