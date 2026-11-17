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
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.04em"
  small:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  body:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  lead:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(16px, 0.4vw + 14.5px, 18px)"
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
  rail: "264px"
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

The split between sans and mono is a register split. Sans sets prose and
headlines. Mono sets code, labels, eyebrows, kickers, data, statuses, paths,
numbers, and controls. Never set a headline or a body paragraph in mono.

### Hierarchy

The scale has eight steps. Use the named utility, never an arbitrary size
such as `text-[13px]`.

| Step | Size | Line height | Use |
|---|---|---|---|
| `text-eyebrow` | 11px | 1.4 | Mono kickers, tags, and labels |
| `text-small` | 13px | 1.5 | Secondary text and button labels |
| `text-body` | 15px | 1.6 | Body prose |
| `text-lead` | clamp(16px, 0.4vw + 14.5px, 18px) | 1.6 | Supporting copy under a heading |
| `text-card-title` | 20px | 1.3 | Card and list-item titles |
| `text-feature` | clamp(22px, 2vw + 15px, 26px) | 1.2 | Sub-section headings |
| `text-section` | clamp(30px, 4vw + 8px, 46px) | 1.05 | Section headings |
| `text-hero` | clamp(32px, 6vw, 64px) | 1.02 | The page `h1` |

The scale was cut from thirteen steps in August 2026. Do not add a step back.
The removed steps (`micro`, `body-lg`, `card-title-lg`, `section-sm`,
`hero-sm`) each sat within 0.5px of a neighbor or inverted the heading
hierarchy. `text-lead` caps at 18px so `text-card-title` outranks it at every
width.

Headings take negative tracking, from `-0.015em` at card title to `-0.03em`
at section and hero. Mono labels take positive tracking, `0.04em` on kickers
and `0.08em` on buttons.

Arabic never takes letterspacing. The script is connected, and tracking
breaks it. Buttons neutralize their tracking with `rtl:tracking-normal`.
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

`SiteShell` in `site-rail.tsx` wraps every page. It renders the left side
rail, which is the primary navigation, and `SiteFooter` under the page
content. From `md` up the rail is pinned and content is inset by `--p-rail` (264px). Below
`md` it is an off-canvas drawer, opened from a mono "Index" button in a slim
sticky top bar. The word "Index" is the control, never a hamburger icon.
Rail transforms are direction-aware: the rail hides toward its own
inline-start edge.

The rail indexes the site in three top-level rows. Overview nests the
homepage section anchors, Resources lists Blog, Tutorials, Talks, and FAQ,
and Registry links to `/registry`. Links that leave the site are in `SiteFooter`. Every
item is a real link, never a dead span.

The homepage hero section takes the `graph-wash` class. The headline is
beside the description and its two buttons in a two-column head from `lg`,
and the head stacks below `lg`. `HeroFigure` in
`src/components/home/hero-figure.tsx` runs under the head at the full width
of the section, with no frame.

`HeroFigure` is a canvas point cloud and the one moving element on the
homepage. Tens of thousands of points draw a world map, then every point
moves into a file listing under `s3://your-bucket/`, then moves back, on a
loop. The listing shows the catalog, the docs, and GeoParquet, PMTiles, and
COG files as blocks of points with mono labels. The map and the file listing
never show together. The figure renders with raw WebGL and falls back
to Canvas 2D, with no added dependency. Point tones mix the palette tokens,
which the figure reads at runtime. Under `prefers-reduced-motion` it shows
one static frame of the file listing. The loop pauses while the figure is off
screen or the tab is hidden. The figure is `dir="ltr"` and never mirrors. It
has an `sr-only` caption and no visible caption. The homepage hero does not
use `GlyphMap` or `--hero-scrim`.

The homepage sections run in this order: hero `#top`, the users and
supporters strip, `#challenge`, `#solution`, `#who`, `#use`, `#coverage`,
`#how`, `#ecosystem`, `#involved`. The rail labels follow the same order. The
homepage plays no terminal recording.

Every route except the homepage opens with `PageHero` in `page-hero.tsx`,
which draws the still glyph relief map under `--hero-scrim`. That band owns
the page `h1`, so the section below it sets no second `h1` and opens with
`pt-[clamp(28px,3.5vw,48px)]` instead of full section padding.

Content keeps a 1240px column, with one exception. In "Toward a federated
network" (`#coverage`) the coverage map and the IDE Pergamino feature block
run edge to edge of the content area.

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

The permitted full-bleed color fields are solid, and there are four.

- **Challenge section** (homepage): `#4163cc` with `#ffffff` text.
- **"Portolan in practice"** (homepage): `#16170f` with `#fcfcfa` text.
- **Footer** (every page): a grayscale NASA Earth Observatory photograph
  multiplied over `#4163cc`, so it reads as one-color blue, with `#ffffff`
  text and an image credit. Multiply can only darken, so text contrast never
  drops below white on `#4163cc`.
- **Talks band** (`/talks` route): a `#4163cc` band behind the talk cards.

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
figure. It is the canvas point map described under Layout. A
homepage figure has no `Fig. N` caption row. That row is the pattern for blog post
figures. Figures never mirror in RTL, so they carry `dir="ltr"`,
and format and tool names inside them stay in Latin.

## Components

### Buttons

`Btn` in `src/components/ui/btn.tsx`. Three variants and three sizes.

- **Shape:** square (`rounded-[var(--p-r-md)]`, which is `0px`).
- **Type:** mono, uppercase, `tracking-[0.08em]`, weight 500, neutralized
  with `rtl:tracking-normal`.
- **Sizes:** `sm` is `px-4 py-2` at `text-eyebrow`; `md` is `px-5 py-2.5` at
  `text-small`; `lg` is `px-6 py-3` at `text-small`.
- **Primary:** `#4163cc` fill, `#ffffff` text. Hover fills `#2d4aa8`.
- **Secondary:** `#ffffff` fill, `#16170f` text, 1px `#16170f` border. Hover
  fills `#f5f5f1`.
- **Ghost:** no fill, no horizontal padding, a 2px bottom border in
  `#16170f`. Hover thickens that border to 4px and removes 2px of bottom
  padding, so the label does not move.
- **Transition:** 150ms on background, border, and text color only.

Never pull a filled button with a negative margin to align its label. The
block edge is the alignment signal.

### Tags

`Tag` in `src/components/ui/tag.tsx`. Mono, uppercase, `text-eyebrow`,
`tracking-[0.02em]`, `px-2.5 py-1`, 1px border, square corners.

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

The kicker is mono, `text-eyebrow`, `#74766a`, `tracking-[0.04em]`, and holds
the label string only. It carries no `NN ·` index prefix, no `//` punctuation,
no uppercase, and no wide tracking. Omit the kicker where the title below
already names the section. The homepage has no kickers or eyebrows. Put no
small label above a homepage heading, card title, or figure.

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
  `SiteHeader`. The rail and `SiteFooter` both come from `SiteShell`.
- **Don't** use a compass rose or a rhumb line. The motif was tried
  repeatedly and rejected.
- **Don't** add a terminal or code-session mockup.
- **Don't** add an emoji. The permitted Unicode marks are ↗, →, and ·.
- **Don't** give every card in a grid the same anatomy. Ragged is deliberate.
- **Don't** number a card grid that is not a real sequence.
- **Don't** letterspace Arabic.
- **Don't** mirror the logo, the map canvas, or a code block in RTL.
