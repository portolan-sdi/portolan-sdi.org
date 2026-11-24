# Case studies

Each case study is a set of files with one name, the slug. A new study
adds its own files and edits no shared file. So two studies never conflict,
and each study can be its own pull request.

The layout, the index page, the navigation, and the homepage card come from
the shared system. The homepage section and the navigation link show only
when at least one study exists. A study supplies content only.

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
  // Optional. The title of the homepage card. The default is `subtitle`.
  // cardTitle: "Example Agency: a state SDI in 2 GB of files",
  // Optional. A mark for the dark homepage card. See below.
  // cardLogo: "/img/case-studies/example-agency-logo-light.svg",
};

export default meta;
```

## The homepage card

Each study gets a card in the case study row of the homepage, with no extra
file. The card shows `image`, the mark, `cardTitle` or `subtitle`, and
`summary`.

The card is dark, so it shows `logo` in one light color. That works for a
mark with a transparent background. For a mark with a solid background, add
a light version of the mark and set `cardLogo`.

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
- A figure is as wide as the text, and its caption sits beside it. A
  study page ignores `wide`.
- Give `bare` to a screenshot of a window with rounded corners on a
  transparent ground. The figure then has no frame. Set `ratio` to the
  ratio of the picture. Otherwise the crop cuts the corners.
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
