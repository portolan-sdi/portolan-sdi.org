---
name: Portolan
description: Serverless geospatial data catalogs published as files in the publisher's own storage.
colors:
  primary: "#4163cc"
  primary-ink: "#2d4aa8"
  on-primary: "#ffffff"
  bg: "#fcfcfa"
  bg-soft: "#f5f5f1"
  paper: "#ffffff"
  ink: "#16170f"
  ink-2: "#3d3f33"
  ink-3: "#74766a"
  line: "#16170f"
  line-soft: "#d6d5ca"
  success: "#2f7d63"
  warn: "#b06e2a"
  warn-ink: "#8a5418"
  danger: "#a3271f"
typography:
  eyebrow:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  small:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  lead:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(17px, 0.4vw + 15.5px, 19px)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  card-title:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  feature:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(22px, 2vw + 15px, 26px)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  section:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(30px, 4vw + 8px, 46px)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  hero:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(32px, 6vw, 64px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
rounded:
  xs: "0px"
  sm: "0px"
  md: "0px"
  lg: "0px"
  xl: "0px"
spacing:
  pad-lg: "32px"
  pad-section-x: "clamp(20px, 5vw, 64px)"
  pad-section-y: "clamp(56px, 8vw, 104px)"
  bar: "68px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-ink}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.bg-soft}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 0"
  tag-default:
    backgroundColor: "{colors.bg-soft}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  tag-primary:
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  tag-warn:
    textColor: "{colors.warn-ink}"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
---

# Design System: Portolan

## Overview

This file describes the Portolan website. The brand kit in
[portolan-ops](https://github.com/portolan-sdi/portolan-ops/blob/main/brand/)
owns the palette, the three type families, and the logo files. `brand.json`
there is the canonical source. This file records the tokens the site adds on
top, and the constraints the site holds itself to.

Six constraints govern every screen. Each one is testable.

1. The site renders in light mode only. There is no `[data-theme]` switch and
   no dark token block.
2. Every radius token is `0px`. Corners are square.
3. Shadow tokens resolve to `none` or to a single 1px rule.
4. The page carries one accent color, `#4163cc`. There is no second accent.
5. Structural rules use `#16170f`, the same value as body text.
6. No element uses a gradient.

**Values in this file are normative in the frontmatter.** The prose states
where a value applies. It does not restate a value with a different number.

## Colors

The palette holds one accent, one warm ground, three ink tiers, two rule
tiers, and four state colors.

### Primary

- **Portolan blue** (`#4163cc`): the only accent. Links, the logo fill,
  figure strokes, controls, and the color fields listed under Elevation &
  Depth. Nothing else is blue.
- **Portolan blue ink** (`#2d4aa8`): the hover and active state of anything
  filled or colored with `#4163cc`. Also the text tier for blue-tinted tags,
  where it clears 4.5:1 on paper.
- **On primary** (`#ffffff`): text and marks sitting on a `#4163cc` fill.

### Neutral

- **Cream paper** (`#fcfcfa`): the page ground. Warmer than `#ffffff`.
- **Soft ground** (`#f5f5f1`): the hover fill on secondary buttons and the
  ground of default tags. It is not a section band.
- **Paper** (`#ffffff`): the resting fill of secondary buttons only.
- **Near-black ink** (`#16170f`): body text, headings, and structural rules.
- **Ink 2** (`#3d3f33`): secondary text and default tag text.
- **Ink 3** (`#74766a`): section kickers and de-emphasized labels.
- **Line** (`#16170f`): every structural rule. It carries the same value as
  body ink, which is deliberate.
- **Line soft** (`#d6d5ca`): interior separators inside a block that already
  has a border. It is not a structural rule.

### State

- **Success** (`#2f7d63`), **Warn** (`#b06e2a`), **Danger** (`#a3271f`): the
  fill and rule tier for each state. **Warn ink** (`#8a5418`) is the text tier
  for warn, because `#b06e2a` does not clear 4.5:1 on paper.

Two rules constrain color use. The accent appears on links, the logo, figure
strokes, controls, and the color fields, and nowhere else. There is no third
rule tier: a rule
that needs more weight takes a thicker border, not a lighter color.

## Typography

**Sans:** Hanken Grotesk, loaded at 400, 500, 600, 700, and 800.
**Mono:** JetBrains Mono, loaded at 400, 500, and 600.
**Arabic:** Cairo, loaded at 400, 500, 600, 700, and 800.

Mono is for code only. It sets code blocks, inline code, typeable
identifiers in prose, repository names, the text inside the two homepage
figures, and arrows. Sans sets everything else, in sentence case: prose,
headlines, kickers, labels, dates, captions, tags, buttons, and controls.
Mono labels in capitals with wide tracking left in November 2026, because
they read as agent output. Do not put a label or a button back in mono.

Every link arrow comes from `DirArrow` in `src/components/ui/dir-arrow.tsx`,
which sets `→` or `↗` in the mono face. The mono arrow has a body that is
longer than its head. Do not type an arrow in the sans face.

### Hierarchy

The scale has eight steps. Use the named utility, never an arbitrary size
such as `text-[13px]`.

| Step | Size | Line height | Use |
|---|---|---|---|
| `text-eyebrow` | 13px | 1.4 | The license line in the footer |
| `text-small` | 14px | 1.5 | Secondary text, kickers, tags, and labels |
| `text-body` | 16px | 1.6 | Body prose |
| `text-lead` | clamp(17px, 0.4vw + 15.5px, 19px) | 1.6 | Supporting copy under a heading |
| `text-card-title` | 20px | 1.3 | Card and list-item titles |
| `text-feature` | clamp(22px, 2vw + 15px, 26px) | 1.2 | Sub-section headings |
| `text-section` | clamp(30px, 4vw + 8px, 46px) | 1.05 | Section headings |
| `text-hero` | clamp(32px, 6vw, 64px) | 1.02 | The page `h1` |

The scale was cut from thirteen steps in August 2026. Do not add a step back.
The removed steps (`micro`, `body-lg`, `card-title-lg`, `section-sm`,
`hero-sm`) each sat within 0.5px of a neighbor or inverted the heading
hierarchy. `text-lead` caps at 19px so `text-card-title` outranks it at every
width.

Headings take negative tracking, from `-0.015em` at card title to `-0.03em`
at section and hero. Labels and buttons take no tracking.

Arabic never takes letterspacing. The script is connected, and tracking
breaks it. Headings neutralize their tracking with `rtl:tracking-normal`.
Arabic always renders in Cairo, because Hanken Grotesk carries no Arabic
glyphs. On RTL pages `--p-sans` re-points to Cairo, so body, headings, and
the `font-sans` utility all resolve to Cairo.

## Layout

The site is mobile-first. Every layout starts at the single-column small-screen
case, then adds `sm:`, `md:`, and `lg:` breakpoints. Multi-column grids start
at `grid-cols-1` and step up.

Sections take `px-[var(--p-pad-section-x)]` and `py-[var(--p-pad-section-y)]`.
Both are fluid `clamp()` values. Do not use the fixed `--p-pad-lg` for section
padding.

`SiteShell` in `site-rail.tsx` wraps every page. It renders a sticky top
bar, which is the primary navigation and the one site header, and
`SiteFooter` under the page content. The bar is solid `--p-bg` over one
`#16170f` bottom rule. It has no blur or shadow. Its height is `--p-bar`
(68px), and `html` sets `scroll-padding-top` to that token, so an anchor jump
stops below the bar.

The bar shows the logo linking home on the inline-start side. The navigation and the locale control are together on the inline-end side. The navigation is the four groups of the site map in `src/lib/nav.ts`: Docs, Stories, Registry, and Community. The footer reads the same file, so the two never differ. Docs has Getting started, Guides & demos, FAQ, CLI docs, Specification, and GitHub. Stories has Case studies, Blog, and Talks. Community has Slack and the Google Group. Registry is one link, so it is a plain link with no menu. Each other group is a button with a small chevron, and it opens a menu under the bar. The menu opens when the pointer comes over the group, on a click, and on a key press. It fades in over 150ms. It is square, with one ink border and no shadow, and it starts at the rule of the bar. One menu is open at a time. The Escape key, a press outside, or a click on a link shuts it. A link that leaves the site shows the `↗` arrow from `DirArrow`. The locale control shows the translate mark (a character beside the letter A, the Lucide "languages" icon) beside the locale code. The globe icon left in November 2026. The bar has no other icon than the translate mark, the chevrons, and the menu button. It has no homepage section anchors, no scroll-spy, no tagline, no CTA, and no install button. The link for the current page takes `aria-current="page"` and `#4163cc`, and so does the button of its group. Below `md` the bar shows the logo and one button with three lines, which become a cross while the panel is open. The lines have square ends. The button opens a panel under the bar. The panel shows each group as a small head above its links, with the locale control at the end. The panel has no menus inside it. The roadmap and the ecosystem page left the navigation in November 2026, because both are in the GitHub organization. Every item is a real link, never a dead span.

`SiteHeader` was removed in July 2026 and the collapsible left side rail in
November 2026. Do not reintroduce the rail or a second header component.

In the footer, the logo is at the top on the inline-start side, at 30px.
The three link columns (Docs, Stories, Community) are at the top on the
inline-end side, with their text end-aligned from `sm`. They come from
`src/lib/nav.ts`, as the top bar does. The Registry link is in the Docs column. Each column head is sans in bold, with no rule,
so it reads as a head and not as a link. The license line is at the bottom
edge of the band, start-aligned, at `text-eyebrow`. It is short: "Site
content CC BY 4.0 · Website source Apache-2.0".

The homepage hero section takes the `graph-wash` class. From `lg` up it has
two columns. The headline and the description are on the inline-start side.
The hero has no buttons. `HeroFigure` in `src/components/home/hero-figure.tsx`
is on the inline-end side. The figure has no frame. Below `lg` the hero is
one column, and the figure is under the description.

`HeroFigure` is a Canvas 2D figure. It is one of two moving elements on the
site. The other is `PipelineFigure` in the solution section.
It has two states that never show together. The first state is a turning
globe. Land shows as points on a sphere with a thin outline and a faint graticule. Everything on the globe is `--p-primary`, with no gray or ink lines. The second state is a Portolan catalog, drawn as a directory tree under `s3://your-bucket/`. The tree is illustrative. It shows each kind of file once and is not a complete valid catalog. A role note beside each light file says what it
is, such as "STAC catalog", "for people", and "for agents". The GeoParquet
file and the COG each have a drawing, and both drawings show the world map.
The GeoParquet drawing is a map of land outlines beside a table of row groups. The COG drawing is a pyramid of the same map as rasters. The drawings have no header or footer parts. `geometry` is the one label inside them. The PMTiles file is a plain row with a role note and no
drawing. One transition moves the points from the globe to their own places
on the two maps, and the same transition runs backward, on a loop. The
figure has no phase words, no request lines, and no read step.

The figure picks its form from its own width. The wide form has the tree
beside the drawings, and the stacked form has each drawing under its file
name. CSS reserves the height of each form, so the page does not shift when
the land mask loads. The figure has no WebGL path and no added dependency.
Its colors and its mono font come from the palette tokens, which the figure
reads at runtime. Under `prefers-reduced-motion` it shows the static
catalog. The loop pauses while the figure is off screen or the tab is
hidden. The figure is `dir="ltr"` and never mirrors. It has an `sr-only`
caption and no visible caption. The homepage hero does not use `GlyphMap` or
`--hero-scrim`.

The homepage sections run in this order: hero `#top`, `#challenge`,
`#solution`, `#why`, `#cases`, `#network`, `#about`. A 1px `#16170f` rule
opens each section. `#why` is an ink band with a night photograph of Buenos
Aires, whose lights show in `#4163cc`. Case studies is one row of ink cards, one for each case study, that scrolls
on the inline axis and runs to the inline-end edge of the window. The
section does not render while the site has no study. Two drawn arrows beside its heading step the row. They have no box,
and their size comes from the heading. `#network` is an ink band for the
registry. Its text is on the inline-start side, and the words "Portolan
registry" in it are a link. The live registry map is on the inline-end
side, in a plain frame, 400px tall from `lg`. The map opens on the whole
world. Two square icon buttons sit on its inline-start side: the one at the
top opens `/registry`, and the one at the bottom shows the map on the full
screen. `#about` has the about text with the "Join us on Slack" link, and
the logos of the organizations that the text names. It has no eyebrow. The
"Getting started" page at `/quickstart` has the install commands, an
example prompt, and the four steps beside the recorded catalog build. It
has no tool list. Each tool is a link in the text. The homepage plays no terminal
recording.

The solution section has `PipelineFigure` in
`src/components/home/pipeline-figure.tsx`. From `lg` it sits beside the
text of the section. Below `lg` it is under the text. The figure is one
canvas, drawn by `pipeline-renderer.ts`, with a camera that only moves
down and a 17.6 second loop. It tells three steps. In the first step,
four sources sit at the top with the types of their endpoints as labels:
Shapefile, GeoPackage, ArcGIS REST, and WFS. Each layer travels down its
lane, crosses one `#4163cc` line, and lands with two labels, GeoParquet
and PMTiles. In the second step, the plates drop into a catalog tree
under `s3://your-bucket/`, inside a frame with a `#16170f` head that says
`S3 BUCKET`. In the third step, the tree becomes a sample data portal.
The camera then carries on down to a fresh start, so the loop never runs
backward. The figure shows no row counts, no file sizes, and no request
lines.

The viewer steps through the figure. Under the canvas, after one rule,
are three numbered step names and two arrow buttons. A step name plays
its step and stops on the finished frame. The figure has no play button.
It loops until the viewer uses a control. The current step is `#2d4aa8`.

The portal is the one place on the site with another look. It uses the
colors and the faces of the City of Philadelphia digital standards, with
no logo and no name of a publisher: `#0f4d90` for the head, `#f0f0f0`
cards with a `#2176d2` rule, a `#f3c613` button for QGIS, `#25cef7` for
the send button, and `#444444` text, in Montserrat and Open Sans. The
colors are canvas constants in the renderer, and only the figure loads
the two faces. The portal has a featured layer, three smaller layers, and
a chat panel named PhiLLM. By the owner's choice the figure is a second
moving element, next to `HeroFigure`. The control styles are the `pipe-`
block in `globals.css`, with no hex of their own. The figure is
`dir="ltr"`, has fixed heights, shows the finished portal under reduced
motion, and pauses off screen and in a hidden tab.

Every route except the homepage opens with `PageHero` in `page-hero.tsx`.
It is a picture band, with the treatment of the "Why Portolan" band: the
grayscale night photograph of Buenos Aires on ink, with the brand blue
multiplied over it. All text in the band is white, and one `#16170f` rule
closes the band. That header owns
the page `h1`, so the section below it sets no second `h1` and opens with
`pt-[clamp(28px,3.5vw,48px)]` instead of full section padding.

Content keeps a 1240px column. No homepage section runs media edge to edge.
The case study row is the one exception: it runs past the column to the
inline-end edge of the window.

Shared UI uses logical properties (`ps`/`pe`, `ms`/`me`, `text-start`/`end`,
`border-s`/`e`, `inset-s`/`e`), never physical ones. Prefer `gap-*` over
`space-x-*`.

## Elevation & Depth

The system has no elevation. `--p-shadow-sm` is `none` and `--p-shadow-md` is
`0 1px 0 var(--p-line)`, which is a rule drawn in the shadow slot rather than
a shadow.

Depth is carried by rules and by fill, not by raising a surface. Separate
content with a `#16170f` rule. Do not introduce a card with a soft shadow, a
glassy blur, or an alternating background band. There is no `--p-bg-soft`
section band on the page.

The permitted full-bleed color fields are these.

- **Challenge section** (homepage): `#16170f` with `#ffffff` text. It has no
  large heading. Its eyebrow is its `h2`, its first paragraph is the
  statement in bold, and its second paragraph supports it.
- **Why Portolan** (homepage): `#16170f` with `#ffffff` text. A grayscale
  NASA photograph of Buenos Aires at night sits on the ink, and a `#4163cc`
  layer multiplies over it. The city lights are blue and the dark stays ink.
- **Registry section** (homepage): `#16170f` with `#ffffff` text.
- **Footer** (every page): a grayscale NASA astronaut photograph
  multiplied over `#4163cc`, so it reads as one-color blue, with `#ffffff`
  text. Multiply can only darken, so text contrast never drops below white
  on `#4163cc`.
- **Talks band** (`/talks` route): a `#4163cc` band behind the talk cards.

The case study cards are `#16170f` with `#fcfcfa` text, on the page ground.
Neither photograph shows a credit on the page. The credits are in
`README.md`.

No other section takes a color band.

The class `graph-wash` in `src/app/globals.css` draws a faint blue 24px grid
by mixing `--p-primary` into transparent, so it adds no token. It is used
inside annotated figures and, at full width, behind the homepage hero and the
homepage solution section.

## Shapes

Every radius token is `0px`, so `rounded-[var(--p-r-*)]` resolves to zero.
Buttons, inputs, tags, images, code blocks, and content blocks all carry
90-degree corners. Nothing is rounded or pill-shaped.

The one permitted circle is a loading spinner, which has to spin.

Borders carry the form language. A structural border is 1px of `#16170f`.
Where a rule needs more weight, increase the border width. Do not lighten it
to a pale hairline, and do not add a third color tier.

Annotated figures are the sanctioned illustration motif: inline SVG in
`#4163cc` strokes, tiny mono labels, dashed leader lines, and the
`graph-wash` grid. See the two panels in
`src/components/home/solution-section.tsx`. `HeroFigure` is not an annotated
figure. It is the Canvas 2D figure described under Layout. A
homepage figure has no `Fig. N` caption row. That row is the pattern for blog post
figures. Figures never mirror in RTL, so they carry `dir="ltr"`,
and format and tool names inside them stay in Latin.

## Components

### Buttons

`Btn` in `src/components/ui/btn.tsx`. A call to action is a text link over a
rule, not a filled block.

- **Type:** sans, sentence case, weight 600, no tracking, in every variant.
- **Link:** `text-body`, `#16170f` text, no fill, no horizontal padding, a
  2px bottom rule in `#16170f`. On hover the text and the rule turn `#4163cc`
  together. A link never changes only its rule or only its text. The
  homepage and `/quickstart` use this variant only.
- **On an ink card:** the same link in `#fcfcfa` over a `#fcfcfa` rule, with
  the same hover.
- **Arrow:** a link ends with `DirArrow`, `→` for a page of the site and `↗`
  for a link that leaves it.
- **Primary, secondary, ghost:** the filled and bordered variants remain for
  a call to action inside a blog post (`PostCta`). Primary is a `#4163cc`
  fill with `#ffffff` text. Do not use them on the homepage.
- **Transition:** 150ms on background, border, and text color only.

The homepage had filled mono buttons in capitals. They left in November
2026, because they read as agent output.

### Tags

`Tag` in `src/components/ui/tag.tsx`. Sans, sentence case, `text-small`,
`px-2.5 py-1`, 1px border, square corners.

- **Default:** `#f5f5f1` fill, `#3d3f33` text, `#16170f` border.
- **Primary:** 12% `#4163cc` fill, `#2d4aa8` text, 25% `#4163cc` border.
- **Warn:** 18% `#b06e2a` fill, `#8a5418` text, 35% `#b06e2a` border.

The warn tone replaced an earlier `accent` tone. `--p-accent` held the same
hex as `--p-primary`, so a stale catalog badged in the same blue as a neutral
kind badge. Keep the two tones distinct.

### Section headers

`SectionHead` in `src/components/ui/section-head.tsx`. A title block on the
inline-start side and supporting copy or a call to action on the inline-end
side, bottom-aligned from `md` up. The grid is
`minmax(0,1fr) minmax(0,46ch)` unless `wide` is set.

The kicker is sans, `text-small`, `#74766a`, and holds the label string
only. It carries no `NN ·` index prefix, no `//` punctuation, no uppercase,
no mono, and no wide tracking. Omit the kicker where the title below already
names the section.

The homepage has exactly two eyebrows, and neither uses `SectionHead`. "The
challenge" is above the challenge statement and "The solution" is above the
solution heading (`challenge.eyebrow`, `solution.eyebrow`). Both are sans
`text-small`, in sentence case. The challenge eyebrow is `#ffffff` on the
ink band, and the solution eyebrow is `#74766a`. The about section has no
eyebrow. Put no small label above any other homepage heading, card title, or
figure.

The title is `text-section`, weight 800, `tracking-[-0.03em]`,
`leading-[1.05]`, and balanced.

### Logo

`PortolanLogo` in `src/components/portolan-logo.tsx`. Two pennant paths on a
32x32 viewBox, filled `var(--p-primary)`, with an optional wordmark set at
0.85 of the mark size, weight 600, `-0.015em` tracking.

On the blue footer field the logo takes a solid `var(--p-on-primary)` fill
instead, because a `#4163cc` mark does not show on a
`#4163cc` ground.

The mark never mirrors in RTL. It never takes a gradient.

## Do's and Don'ts

### Do

- **Do** use the named type utilities. Every size comes from the eight-step
  scale.
- **Do** separate content with a 1px `#16170f` rule.
- **Do** start every layout at `grid-cols-1` and step up.
- **Do** use logical properties in shared UI, so RTL works without a second
  rule.
- **Do** put every user-facing string in `messages/`, under the same key in
  `en.json`, `es.json`, and `ar.json`.
- **Do** wrap typeable identifiers in prose (`GeoParquet`, `COG`, file names,
  CLI commands, `Apache-2.0`) in `<m>` tags and render them with `t.rich`.
- **Do** keep digits Latin (0-9) in every locale, including Arabic.

### Don't

- **Don't** add a dark theme, a `[data-theme]` switch, or a theme toggle.
- **Don't** use a gradient anywhere, in text, a fill, or a border.
- **Don't** round a corner. Every radius is `0px`.
- **Don't** add a drop shadow, a glassy blur, or a soft alternating
  background band.
- **Don't** use an arbitrary font size such as `text-[13px]`.
- **Don't** add a step back to the type scale.
- **Don't** add a `border-p-line-strong` tier. Thicken the border instead.
- **Don't** inline `<header>` or `<footer>` markup in a page, or reintroduce
  `SiteHeader` or the side rail. The top bar and `SiteFooter` both come from
  `SiteShell`.
- **Don't** use a compass rose or a rhumb line. The motif was tried
  repeatedly and rejected.
- **Don't** add a terminal or code-session mockup.
- **Don't** set a label, a kicker, or a button in mono, in capitals, or with
  wide tracking.
- **Don't** put a filled call-to-action block on the homepage. Use a text
  link over a rule.
- **Don't** add an emoji. The permitted Unicode marks are ↗, →, and ·.
- **Don't** give every card in a grid the same anatomy. Ragged is deliberate.
- **Don't** number a card grid that is not a real sequence.
- **Don't** letterspace Arabic.
- **Don't** mirror the logo, the map canvas, or a code block in RTL.
