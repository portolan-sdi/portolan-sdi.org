<!-- ops-sync:begin — synced from portolan-sdi/portolan-ops. Edit there, not here. -->
# Portolan agent norms

All agents MUST read this document before starting work, with no exceptions, ever. (Claude Code does not read `AGENTS.md` but imports this file via a one-line `CLAUDE.md`.) Most of this content is synced downstream from `portolan-ops`. Put repo-specific instructions in `AGENTS.md`, never in `CLAUDE.md`, which the sync overwrites.

## Ground rules

Agents MUST read the complete contents of [norms](https://github.com/portolan-sdi/portolan-ops/blob/main/norms) and [policies](https://github.com/portolan-sdi/portolan-ops/blob/main/policies/) before starting work, with no exceptions, ever.

The [portolan-spec](https://github.com/portolan-sdi/portolan-spec) repo is the absolute ground truth for the Portolan spec. All other tools are downstream of it.

Before documenting any command, flag, or API, verify that it exists.

Use conventional commits always.

All tickets and PRs MUST follow the [templates](https://github.com/portolan-sdi/portolan-ops/blob/main/templates/).

GitHub applies issue forms only in the web UI. With `gh issue create`, write each form field as a `### <field label>` heading, in the form's order. Include `### Priority` with one of `P0` to `P3` from the [priority rubric](https://github.com/portolan-sdi/portolan-ops/blob/main/norms/repos.md#priority). Pass the form's type label with `--label`, and pass the body with `--body-file`. The writing hook denies a body that skips its form, and issue governance flags one.

## Org-wide facts

The canonical homepage is <https://www.portolan-sdi.org/>. Canonical URLs live in [copy/urls.md](https://github.com/portolan-sdi/portolan-ops/blob/main/copy/urls.md). Do not hardcode variants.

Community discussion happens in the [Portolan Google Group](https://groups.google.com/g/portolan) and the [Portolan channel](https://cloudnativegeo.slack.com/archives/C0A1JBH9529) in Cloud-Native Geo Slack. Planning happens in [org-level GitHub projects](https://github.com/orgs/portolan-sdi/projects/1).

Files between `ops-sync` markers are synced from [portolan-ops](https://github.com/portolan-sdi/portolan-ops). They are overwritten on every sync run. To change one, edit it in portolan-ops.

One canonical home per fact. If a value like a color, URL, or policy line exists in portolan-ops, link to it rather than copying it.
<!-- ops-sync:end -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Portolan website

Rules for this site. The org norms above apply here too.

## How Portolan is described

Identity, framing, and the words used for Portolan come from
[copy/messaging.md](https://github.com/portolan-sdi/portolan-ops/blob/main/copy/messaging.md)
in portolan-ops. Read it before writing site copy.

## Visual system

Brand values (palette, type, logos) come from
[brand/](https://github.com/portolan-sdi/portolan-ops/blob/main/brand/) in
portolan-ops. The rules below cover how this site spends them.

- **Color tokens:** Use CSS variables from the shared styles in `globals.css` and `code.css`. Never hardcode hex except in SVG and the map canvas.
- **Light mode only.** Dark mode was removed in July 2026. There is no `[data-theme]` switch, no `ThemeToggle`, and no dark token block. Do not reintroduce a dark theme or a theme toggle.
- **Type scale (single source of truth):** Use the named utilities generated from `--text-*` tokens in `globals.css`, never arbitrary sizes like `text-[13px]`. Eight steps, smallest first: `text-eyebrow`, `text-small`, `text-body`, `text-lead`, `text-card-title`, `text-feature`, `text-section`, `text-hero`. Headings and lead text are fluid via `clamp()`. The scale was cut from thirteen steps in August 2026. Do not add a step back: the removed ones (`micro`, `body-lg`, `card-title-lg`, `section-sm`, `hero-sm`) sat within 0.5px of a neighbor or inverted the heading hierarchy. `text-lead` caps at 19px so `text-card-title` outranks it at every width.
- **Corners are square, except code.** All `--p-r-*` radius tokens are `0px`, so buttons, inputs, and general content blocks have 90-degree corners. Code blocks and inline code use `--p-code-radius` for small rounded corners. Nothing is pill-shaped. The only circle allowed is a loading spinner, which has to spin.
- **Surfaces are flat, rules are black.** Shadow tokens render as `none` or a single rule, never a glassy drop shadow. Separate content with rules, not cards or soft background bands. Structural rules (`border-p-line`) are near-black ink. There is no `border-p-line-strong`: it carried the same hex as `border-p-line`, so it named a weight a color token cannot hold. Where a rule needs more weight, thicken the border. The rule between two homepage sections is 4px (`border-t-4 border-p-line`), and the footer opens with the same rule on every page. The soft tier (`border-p-line-soft`, `#d6d5ca`) is only for interior separators inside an already-bordered block. The heavy black line weight is deliberate, so do not lighten it back to pale hairlines. No section takes a `--p-bg-soft` band. The solid color bands the site does use are listed under **Color fields**.
- **Color fields:** The homepage has two solid full-bleed bands. The challenge section (`src/components/home/challenge-section.tsx`) is `--p-ink` with `--p-on-primary` text. It has no large heading, because the hero heading already names the servers, the databases, and the APIs. Its eyebrow is its `h2`, its first paragraph is the statement in `text-feature` bold, and its second paragraph is `text-lead`. The case study cards are `--p-ink` with `--p-bg` text, and the registry card is `--p-primary`. The shared footer is a third field. It multiplies a grayscale NASA astronaut photograph over `--p-primary`, so it reads as one-color blue, with `--p-on-primary` text. The footer shows no image credit. The credit for the photograph is in `README.md`. Multiply can only darken, so text contrast never drops below white on `--p-primary`. "Why Portolan" on the homepage is a second image field with the same treatment as the footer. The `/talks` route has its own solid `--p-primary` band behind the talk cards. No other section takes a color band. `--p-bg-soft` alternating bands and gradients are banned.
- **Graph-paper wash:** The class `graph-wash` in `src/app/globals.css` draws the faint blue 24px grid by mixing `--p-primary` into transparent, so it adds no token. Use it inside annotated figures and, at full width, behind the homepage hero and the homepage solution section.
- **Annotated figures are the sanctioned illustration motif.** Technical diagrams drawn as inline SVG in `--p-primary` strokes with tiny mono labels, dashed leader lines, and the `graph-wash` grid. The reference implementation is the cost scale in `src/components/home/case-studies-section.tsx`. `HeroFigure` is not an annotated figure. It is a Canvas 2D figure, described under **Homepage hero**. A homepage figure has no `Fig. N` caption row. That row is the pattern for blog post figures (`PostFigure`). Figures never mirror in RTL (`dir="ltr"`), and format and tool names inside figures stay Latin. Compass roses and rhumb lines remain banned.
- **Section kickers:** mono, `text-p-ink-3`, the label string only. No `NN ·` index prefixes (numbers are reserved for real sequences like the how-it-works steps), no `// EYEBROW` punctuation, no uppercase, no wide tracking. The homepage has three eyebrows and one label. "The challenge" is above the challenge statement and "The solution" is above the solution heading (`challenge.eyebrow`, `solution.eyebrow`). Both are mono `text-eyebrow`, in sentence case at default tracking. The challenge eyebrow takes `--p-on-primary` on the ink band. The third eyebrow is "About" (`about.title`), above the one sentence of the about section. The one label is `about.logosLabel`, above the logos in that section, in the same style. Put no small label above any other homepage heading, card title, or figure.
- **No terminal mockups, with one exception.** The fake-terminal blocks and their `--term-*` tokens were removed in July 2026. Do not reintroduce terminal or code-session mockups anywhere on the site. The one sanctioned terminal mock-up is the Claude Code session in `PipelineFigure`, described under **Homepage solution figure**.
- **Logo:** Two-pennant SVG in `PortolanLogo`, rendered in a **solid** `--p-primary` fill, no gradient. One exception: on the blue footer field the logo takes a solid `--p-on-primary` fill, because a `--p-primary` mark does not show on a `--p-primary` ground.

## Layout and responsiveness

- **Mobile-first, always.** Start from the single-column small-screen layout, then add `sm:` / `md:` / `lg:` breakpoints. Never write a desktop-only layout.
- **Section padding:** sections use `px-[var(--p-pad-section-x)]` and `py-[var(--p-pad-section-y)]` (fluid `clamp()` tokens). Do not use the fixed `--p-pad-xl` for section padding.
- **Grids collapse:** multi-column grids start at `grid-cols-1` and step up (for example `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
- **Homepage hero:** The hero section takes the `graph-wash` class. From `lg` up it has two columns. The headline and the description are on the inline-start side. The hero has no buttons. `HeroFigure` (`src/components/home/hero-figure.tsx`) is on the inline-end side. The figure has no frame. Below `lg` the hero is one column, and the figure is under the description. `HeroFigure` is a Canvas 2D figure with two states that never show together. The first state is a turning globe. Land shows as points on a sphere with a thin outline and a faint graticule. Everything on the globe is `--p-primary`, with no gray or ink lines. The second state is a Portolan catalog, drawn as a directory tree under `s3://your-bucket/`. The tree is illustrative. It shows each kind of file once and is not a complete valid catalog. A role note beside each light file says what it is, such as "STAC catalog", "for people", and "for agents". The GeoParquet file and the COG each have a drawing, and both drawings show the world map. The GeoParquet drawing is a map of land outlines beside a table of row groups. The COG drawing is a pyramid of the same map as rasters. The drawings have no header or footer parts. `geometry` is the one label inside them. The PMTiles file is a plain row with a role note and no drawing. One transition moves the points from the globe to their own places on the two maps, and the same transition runs backward, on a loop. The figure has no phase words, no request lines, and no read step. The figure picks its form from its own width. The wide form has the tree beside the drawings, and the stacked form has each drawing under its file name. CSS reserves the height of each form, so the page does not shift when the land mask loads. The figure has no WebGL path and no added dependency. Its colors and its mono font come from the palette tokens, which the figure reads at runtime. Under `prefers-reduced-motion` it shows the static catalog. The loop pauses while the figure is off screen or the tab is hidden. The figure is `dir="ltr"` and never mirrors. It has an `sr-only` caption and no visible caption. It is one of two moving elements on the site. The other is `PipelineFigure`. The homepage hero does not use the glyph relief map (`GlyphMap`) or `--hero-scrim`.
- **Homepage solution figure:** `PipelineFigure` (`src/components/home/pipeline-figure.tsx`) is under the head of the solution section. It has two halves on one clock, and the loop runs 23.2 seconds. From `lg` they sit side by side at one height (560px). Below `lg` they stack, the session first, at 420px and 540px. The left half is a Claude Code session in DOM. It types the prompt, which stays pinned at the top once the transcript scrolls past it. It fetches four Philadelphia layers in parallel: `cp` for the Shapefile and the GeoPackage, and `portolan extract arcgis --raw` and `portolan extract wfs --raw` for the two services. Then it runs `portolan init`, `portolan add . --pmtiles`, `portolan check`, and `portolan push`, and says it is done. A finished `portolan` result line is the summary line that the command prints. Check every command and result line against portolan-cli before you change one. The right half is one canvas, drawn by `pipeline-renderer.ts`, on plain `--p-bg` with no grid and no frame. The scene is one tall world with a camera that only moves down, so all motion runs one way. There are four stages. Ingest: four existing systems sit at the top, each in its own lane, and the real thumbnail of each layer travels straight down its lane into `~/phl-housing`. Files copy whole. A service answers request pulses with page strips. Convert: one scan line per plate leaves one clean form, labeled GeoParquet and PMTiles. Catalog: the plates drop into a tree under `s3://your-bucket/` with `catalog.json`, `README.md`, and `AGENTS.md`. Publish: the tree becomes the portal of Rowhouse Atlas, a fictional publisher, served from `your-bucket.s3.amazonaws.com`. The camera then carries on down to a copy of the first stage, so the loop never runs backward. The thumbnails are 1024x683 WebP files in `public/img/home/pipeline/`, named for their collection ids. They load when the figure comes within 800px of the viewport. Four mono step labels sit under the canvas (`solution.figure.steps`), and the current step takes `--p-primary-ink`. The session is the one sanctioned terminal mock-up on the site. It is `--p-ink` with `--p-primary` as its accent, and it keeps the glyphs of Claude Code (●, ❯, ⎿, ✻). By the owner's choice the figure is a second moving element, next to `HeroFigure`. The session and step styles are the `pipe-` block in `globals.css`, with no hex. The canvas reads the site tokens at runtime. The portal is the one place with another brand. Its paper, ink, and brick colors are canvas constants in the renderer. Its faces, Fraunces and Instrument Sans, are subset WOFF2 files in `src/components/home/fonts/` with their OFL texts, loaded by `next/font/local` in `pipeline-fonts.ts` without preload. The canvas waits for every face and image before its first frame. Do not use the portal brand anywhere else on the site. The `sr-only` caption is under `solution.figure` in `messages/`. The session text, file names, commands, and portal UI stay Latin English in every locale. The figure is `dir="ltr"`, and only its step labels follow the page direction. It has fixed heights, holds the finished portal under `prefers-reduced-motion`, and pauses off screen and in a hidden tab. In development, `?pipe=<seconds>` holds it at one second for screenshots.
- **Homepage section order:** hero `#top`, `#challenge`, `#solution`, `#why`, `#cases`, `#about`. "Why Portolan" (`src/components/home/why-section.tsx`) has the three short blocks that were in the solution section. It is a satellite image band with the footer treatment: a grayscale NASA image multiplies over `--p-primary`, with `--p-on-primary` text. Its credit is in `README.md`. The third block states the cost claim. The cost scale (`src/components/home/cost-scale.tsx`) left the homepage in November 2026, and the component stays in the codebase. The solution section has two buttons, one to the East Hampton guide as the quickstart and one to the `/how-it-works` route. Case studies (`src/components/home/case-studies-section.tsx`) is one row of six cards that scrolls on the inline axis. The cards are IDE Pergamino, TriMet, Fields of the World, NASA FIRMS, CARTO SDI, and the registry. Five cards are `--p-ink`, and the registry card is `--p-primary`. Each card has the same anatomy, by the owner's choice: the mark of the publisher in one color, a whole screenshot, a title, a body, and a button. The row runs past the content column to the inline-end edge of the window, so a cut card shows that the row scrolls. Two square arrow buttons beside the heading step the row. "About" (`AboutSection` in `src/components/home/about-section.tsx`) is the last section. It is centered and has no button. Its heading is two sentences, and the words "Join us on Slack" in it are the link to the Slack channel, which is the one call to action of the site. One row of logos under it shows the organizations that contribute. The logos are one-color masks in `--p-ink-3`. The marquee logo strip, "Portolan in practice", the network section, the ecosystem section, the demo section, and the "why" section left the homepage. The tool list is the `/ecosystem` route. The recorded catalog build, the four steps, the QGIS recording, and the full "Get involved" text are the `/how-it-works` route. `DemoSection`, `VideoFigure`, and `InvolvedSection` remain in the codebase.
- **Full-bleed media:** no homepage section runs media edge to edge. The registry map is on `/registry` only, and the homepage shows a still of it in the registry card of the case studies.
- **Page header band:** every route except the homepage opens with `PageHero` in `page-hero.tsx`. It draws the glyph relief map (`GlyphMap`) under `--hero-scrim`. The map takes `still` so it does not drift, because the only moving elements on the site are `HeroFigure` and `PipelineFigure` on the homepage. The band owns the page's `<h1>`, so the section below it sets no second one and opens with a tightened `pt-[clamp(28px,3.5vw,48px)]` instead of the full section padding. A two-part headline passes `subtitle`, which sets inside the `<h1>` so it inherits the heading font and differs only in weight and size.
- **Shared chrome:** `SiteShell` in `site-rail.tsx` wraps every page. It renders a sticky **top bar** for primary navigation and `SiteFooter` (`site-footer.tsx`) under the page content. The top bar is the one site header. `SiteHeader` was removed in July 2026 and the collapsible left side rail in November 2026. Do not reintroduce the rail or a second header component. A page never inlines its own `<header>` / `<footer>` markup, because both come from `SiteShell`. The bar shows the logo linking home on the inline-start side, then the page links Blog, Guides & demos, Talks, Ecosystem, FAQ, and Registry, then the locale control on the inline-end side. The locale control shows a globe icon beside the locale code. The globe is the only icon in the bar, and the page links take none. It lists pages only. It has no homepage section anchors, no scroll-spy, no collapse control, no tagline, no CTA, and no install button. The link for the current page takes `aria-current="page"` and `--p-primary`. Below `md` the bar shows the logo and a mono "Index" button, the word, never a hamburger icon. The button opens a panel under the bar with the same links and the locale control. The bar is solid `--p-bg` over one black 4px bottom rule, with no frosted `backdrop-blur` and no shadow. Its height is the `--p-bar` token, and `html` sets `scroll-padding-top` to that token, so an anchor jump stops below the bar. Links that leave the site (roadmap, GitHub, the Google Group, Slack) are in `SiteFooter`, next to the How it works link and a repeat of the Blog, Guides & demos, Talks, Ecosystem, and FAQ links and the license line. Footer content starts at the top of the band and aligns to the inline-start edge. The license line is at the bottom edge of the band, start-aligned. Use only real links, never dead spans. Do not mirror the logo.

## Blog

Blog posts are MDX. The pipeline is `@next/mdx` with no remark or rehype
plugins, because Turbopack compiles MDX in Rust and cannot receive a
JavaScript plugin function.

- **Post bodies** live at `src/content/blog/<slug>.mdx`. The route
  `src/app/[locale]/blog/[slug]/page.tsx` imports them by slug and sets
  `dynamicParams = false`, so an unknown slug is a 404.
- **Post metadata** lives in `src/lib/blog.ts`. A new post needs an entry in
  `POSTS` and a matching MDX file. The index, the sitemap, and
  `generateMetadata` all read that list.
- **Posts are English only.** Post titles and summaries live in
  `src/lib/blog.ts`, not in `messages/`. This is the one exception to the rule
  that every user-facing string lives in `messages/`. A reader on `/es/` or
  `/ar/` gets the English body under a translated notice. All page chrome
  around the post stays translated in all three locales.
- **Body styling** comes from `src/mdx-components.tsx`, the element map. There
  is no `prose` class and no typography plugin. Do not add one. Style a new
  element by adding it to that map.
- **Media** uses `PostFigure` in `src/components/blog/post-figure.tsx`. Omit
  its `src` while an asset is missing and it draws a framed placeholder that
  names the pending file.
- **Calls to action** use `PostCta` in `src/components/blog/post-cta.tsx`:
  one primary button centered in the text column, with no text around it.
  Use a few per piece, not one per section.
- **Navigation:** the route reads the body's `##` headings with
  `extractHeadings` in `src/lib/headings.ts`, and the `h2` in
  `src/mdx-components.tsx` sets the matching id. `PostToc` pins them as an
  "In this article" list in the margin from `xl` up, above the figure
  captions on a 90% page-color backing. The top bar does not list post
  sections. Under the body, a previous and next pair links the neighboring
  entries in the same list.
- **Measure:** a post body runs `max-w-[68ch]`, narrower than the 1240px
  content column the rest of the site uses. A lead or intro paragraph under a
  page title takes no measure cap and runs the full column.
- **Tutorials** use the same pipeline under Resources. Bodies live at
  `src/content/tutorials/<slug>.mdx` and metadata in `src/lib/tutorials.ts`.
  The routes under `src/app/[locale]/tutorials/` render through the blog
  components with `section="tutorials"`. Tutorials are not in the RSS feed.
  Tutorials carry no author byline, and the `Tutorial` type forbids `author`.
- **Mirrored tutorials** copy an example README from portolan-cli, the same
  text the CLI docs site renders. `CLI_TUTORIALS` in `src/lib/cli-tutorials.ts`
  lists them. `pnpm sync:cli-tutorials` rewrites each body, and the Sync CLI
  Tutorials workflow runs it daily and on a `cli-docs-updated` dispatch, then
  opens a bot pull request that auto-merges after the checks pass. Never edit
  a mirrored body by hand. Fix the README in portolan-cli. The title,
  subtitle, and summary in `TUTORIALS` stay site-owned and do not sync.

## Tech stack

- Next.js 16+ App Router with TypeScript
- Tailwind CSS (pure utilities, no `@apply`)
- MDX via `@next/mdx` for blog post bodies
- next-intl for i18n (English default, Spanish at `/es/`)
- pnpm for package management
- Deploying to Vercel at portolan-sdi.org

## What NOT to do

- Don't add a "mission" or "about" section to the homepage
- Don't reintroduce the install button in the header
- Don't add emoji (except Unicode marks: ↗, →, ·)
- Don't add icons to the page links in the top bar. The globe on the locale control is the only icon there
- Don't introduce CSS-in-JS libraries
- Don't add filler content
- Don't use arbitrary font-size values (`text-[13px]`); use the type scale
- Don't inline header/footer markup in a page or reintroduce `SiteHeader` or the side rail. The top bar and `SiteFooter` both come from `SiteShell`
- Don't reintroduce the "AI-y" look: gradient text/fills, gradient or shadowed buttons, glassy drop shadows, rounded bento cards, pill-shaped tags, circular status dots, `// EYEBROW` labels, or soft alternating background bands. The Claude Code glyphs in `PipelineFigure` are text, not status dots. The solid bands under **Color fields** are the only section color.
- Don't reintroduce the second-wave "AI-y" tells removed in the bespoke pass: typewriter/rotating hero headlines, `NN ·` numbered section kickers, numbers on non-sequence card grids, macOS traffic-light dots on terminals, stacked big-number hero stat blocks (live stats render as one mono log-line), or a frosted translucent header.
- Don't propose or reintroduce the rhumb-line / compass-rose motif in any form. It was tried repeatedly and explicitly rejected.
- Don't give every card in a grid identical anatomy (number + title + body + tag). Ragged is deliberate.

## i18n

- Default locale: English (no URL prefix)
- Spanish: `/es/` prefix · Arabic: `/ar/` prefix (RTL)
- Translation files in `messages/` (`en.json`, `es.json`, `ar.json`)
- Use `useTranslations` hook in client components

### Translation contract (required)

- Every user-facing string lives in `messages/`. Never hardcode copy in components.
- When you add or change a string, update **all three** files (`en`, `es`, `ar`) under
  the **same key**. Key sets must stay identical across locales.
- Follow `docs/i18n/glossary.md`. Keep product and format names (Portolan, STAC,
  GeoParquet, COG, S3, ...) in Latin in every locale.
- Digits are always Latin (0-9), including in Arabic.
- No em dashes, colons, or semicolons in Spanish or Arabic copy.
- Typeable identifiers inside prose (formats like GeoParquet/COG/STAC/PMTiles, file
  names, CLI commands, `Apache-2.0`) are wrapped in `<m>…</m>` tags in `messages/*.json`
  and rendered mono via `t.rich(key, { m: monoChunk })` (`monoChunk` from `./ui`).
  Product names (Portolan, DuckDB, ...) stay sans. Tags must stay identical across all
  three locales, and any key carrying `<m>` tags must be rendered with `t.rich`, never
  plain `t()`.
- A name that links somewhere renders as a plain link, never as linked mono. On the
  homepage, format and storage names (GeoParquet, PMTiles, COG, STAC, S3) link to their
  spec sites through the `FORMAT_TAGS` tags in `home-page.tsx`, not `<m>`. The
  footer licenses are plain links too. The Slack link reads "Portolan channel",
  not `#portolan`.

### RTL rules (Arabic)

- Use Tailwind **logical** utilities in shared UI (`ps/pe`, `ms/me`, `text-start/end`,
  `border-s/e`, `rounded-s/e`, `inset-s/e`), never physical `pl/pr/ml/mr/left/right`.
  Prefer `gap-*` over `space-x-*`.
- Reserve `rtl:` variants for mirroring directional icons (use `<DirArrow>`).
- Never mirror the logo, the map/dither canvas, or terminal/code blocks. Terminal and
  code blocks stay `dir="ltr"`.
- Wrap pure-Latin standalone values (names, versions, license, repo) in `<Ltr>` so they
  stay correctly ordered inside Arabic text.
- Arabic always renders in Cairo (Hanken Grotesk has no Arabic glyphs). On RTL pages the
  `--p-sans` token re-points to Cairo in `globals.css`, so body, headings, and the
  `font-sans` utility all resolve to Cairo. Cairo is also the Arabic-glyph fallback in
  the base sans stack, so stray Arabic on an LTR page (for example the language switcher)
  still renders Cairo. Never hardcode `font-family`, rely on the tokens.
- Buttons (`Btn`) are mono, uppercase, and letterspaced (`tracking-[0.08em]`), neutralized
  with `rtl:tracking-normal` because letterspacing breaks Arabic's connected script.
- `<html lang dir>` is set per locale in `src/app/[locale]/layout.tsx` via
  `getDirection(locale)`. Do not reintroduce `<html>` into the root layout.


<claude-mem-context>
# Memory Context

# [portolan] recent context, 2026-08-27 5:45pm GMT+2

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 10 obs (3,019t read) | 24,238t work | 88% savings

### Aug 27, 2026
S9970 Fix style picker sparse-column handling; finalize Overture defect documentation strategy; re-pick all collections (Aug 27, 3:36 PM)
S9971 Update ETA and risk assessment for completing style picker fixes and catalog validation (Aug 27, 3:39 PM)
S9972 Monitor style re-pick progress; assess fix effectiveness and identify visual edge cases (Aug 27, 3:42 PM)
S9974 Complete style picker workflow; prepare for Gate 2 visual review with thumbnail re-render (Aug 27, 3:50 PM)
S9975 Validate Portolan Overture catalog with styles and thumbnails in place; review Gate 2 thumbnail cards for rendering issues (Aug 27, 3:56 PM)
S9973 Complete style picker workflow; prepare for Gate 2 visual review with thumbnail re-render (Aug 27, 3:56 PM)
S9976 Improve thumbnails in nlebovits/overture-portolan Portolan catalog (feat/all-collections branch) — 15 collections with generated styles and rendered tiles need visual refinement. (Aug 27, 3:57 PM)
S9977 Complete and submit Codex's thumbnail art direction work; polish and finalize the full Overture catalog for merge and deployment (Aug 27, 4:01 PM)
S9978 Complete Codex's thumbnail art direction work and finalize the full Overture catalog for merge and deployment (Aug 27, 5:29 PM)
25657 5:34p ✅ Live Gate Fixed: Switched from portolan-cli to rashid; CORS Headers Now Present
25658 " 🔵 Discrepancy: PTL-LIV-004/005 Present Locally, Absent in Deployed Version
25659 " 🔵 JSON Structure Mismatch: Gate Expects report.data.findings, Rashid Provides report.findings
25656 " 🔵 Registry coverage endpoint missing cache in production
25661 5:36p 🔵 Workflow Out of Sync: Pages Workflow Still Installs portolan-cli, Test Expects rashid
25662 " ✅ GitHub Pages Workflow Updated to Install Rashid from requirements-ci.txt
25663 " ✅ Commit: Fix Live Gate Validator; Switch from portolan-cli to rashid
25665 " ✅ PR Body Revision: Writing Issues Reduced from 3 to 1 Blocking
25666 " ✅ Pull Request #6 Opened: Fix for Live Gate Validator
S9979 Fix live hosting gate failures and verify deployment; diagnose and resolve two bugs preventing live validation from passing in CI environment (Aug 27, 5:36 PM)
25667 5:38p 🔴 Registry coverage endpoint cache regression fixed with force-static

Access 24k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
