@AGENTS.md

# Portolan Website

## Identity

**Portolan** is **an opinionated standard** for publishing geospatial data as cloud-native files on object storage, **plus the tools that make it real** (the validator, CLI, browser, and registry). It is **not** a hosting service — Portolan does not host data. It is open source, openly governed, and free.

The governing noun is **standard**. Portolan is a standard, plus the tools that make it real — "ecosystem" describes the result, not the thing, so keep it a supporting word. Key framing words: **open · sovereign · AI-ready · cheap · cloud-native**.

Avoid framing Portolan as a SaaS, a portal, a product, or a company. Conformance is not a claim you make — it is passing the validator.

## Visual System (non-negotiable)

The system is **editorial / utility**: warm near-monochrome paper, a single
disciplined blue accent, distinctive grotesque type, generous whitespace, and
**near-black rules instead of cards**. No gradients, no drop shadows, no soft bands.

- **Type:** Hanken Grotesk (sans, Latin text) + JetBrains Mono (code, labels, eyebrows, kickers) + Cairo (all Arabic text). No other fonts in production.
- **Two type registers.** Mono is the machine register — data, labels, statuses, paths, numbers, annotations, and controls. Sans is the human register — headlines and prose. Keep the split: never set headlines or body paragraphs in mono.
  - Buttons (`Btn`) are mono, uppercase, letterspaced (`tracking-[0.08em]`, neutralized with `rtl:tracking-normal` — letterspacing breaks Arabic's connected script).
  - Typeable identifiers inside prose (formats like GeoParquet/COG/STAC/PMTiles, file names, CLI commands, `Apache-2.0`) are wrapped in `<m>…</m>` tags in `messages/*.json` and rendered mono via `t.rich(key, { m: monoChunk })` (`monoChunk` from `./ui`). Product names (Portolan, DuckDB, …) stay sans. Tags must stay identical across all three locales, and any key carrying `<m>` tags must be rendered with `t.rich`, never plain `t()`.
- **Color tokens:** Use CSS variables from `globals.css`. Never hardcode hex except in SVG and the map canvas.
- **Palette:** warm cream paper (`--p-bg: #fcfcfa`) and near-black ink (`--p-ink: #16170f`) with a **single blue accent** — `--p-primary: #4163cc` (== `--p-accent`; the old gold is retired).
- **Light mode only.** Dark mode was removed in July 2026 — there is no `[data-theme]` switch, no `ThemeToggle`, and no dark token block. Do not reintroduce a dark theme or a theme toggle.
- **Type scale (single source of truth):** Use the named utilities generated from `--text-*` tokens in `globals.css`, never arbitrary sizes like `text-[13px]`. Available: `text-eyebrow`, `text-micro`, `text-small`, `text-body`, `text-body-lg`, `text-lead`, `text-card-title`, `text-card-title-lg`, `text-feature`, `text-section-sm`, `text-section`, `text-hero`, `text-hero-sm`. Headings and lead text are fluid via `clamp()`.
- **Corners are square.** All `--p-r-*` radius tokens are `0px` — every button, input, and content block has 90-degree corners. Nothing is rounded or pill-shaped. The only circle allowed is a loading spinner (it has to spin).
- **Surfaces are flat, rules are black.** Shadow tokens render as `none` / a single rule — never a glassy drop shadow. Separate content with rules, not cards or soft background bands. Structural rules (`border-p-line`, `border-p-line-strong`) are near-black ink; the soft tier (`border-p-line-soft`, `#d6d5ca`) is only for interior separators inside an already-bordered block. The heavy black line weight is deliberate — do not lighten it back to pale hairlines. **At most one** subtle `--p-bg-soft` band on the page (the talks section).
- **Annotated figures are the sanctioned illustration motif.** Technical diagrams drawn as inline SVG in `--p-primary` strokes with tiny mono labels, dashed leader lines, a faint blue graph-paper wash, and a `Fig. N` caption row (see `PipelineFigure` in the how-it-works section). Figures never mirror in RTL (`dir="ltr"`); format and tool names inside figures stay Latin. Compass roses and rhumb lines remain banned.
- **Section kickers:** mono, `text-p-ink-3`, the label string only. No `NN ·` index prefixes (numbers are reserved for real sequences like the how-it-works steps), no `// EYEBROW` punctuation, no uppercase, no wide tracking.
- **No terminal mockups.** The fake-terminal blocks (and their `--term-*` tokens) were removed in July 2026 — do not reintroduce terminal/code-session mockups anywhere on the site.
- **Logo:** Two-pennant SVG in `PortolanLogo`, rendered in a **solid** `--p-primary` fill — no gradient.

## Layout & Responsiveness

- **Mobile-first, always.** Start from the single-column small-screen layout, then add `sm:` / `md:` / `lg:` breakpoints. Never write a desktop-only layout.
- **Section padding:** sections use `px-[var(--p-pad-section-x)]` and `py-[var(--p-pad-section-y)]` (fluid `clamp()` tokens). Do not use the fixed `--p-pad-xl` for section padding.
- **Grids collapse:** multi-column grids start at `grid-cols-1` and step up (for example `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
- **Shared chrome:** primary navigation is a collapsible left **side rail** — `SiteShell` in `site-rail.tsx`, which wraps the page. It replaced the old minimal header and centered footer (both removed July 2026; `SiteHeader`/`SiteFooter` are gone — do not reintroduce them or inline `<header>` / `<footer>` markup). The rail is pinned from `md` up (content is inset by `--p-rail`); "Collapse" slides it off-canvas and a mono "» Index" handle restores it. Below `md` it is an off-canvas drawer opened from a mono "Index" button in a slim sticky top bar (the word, never a hamburger icon). The rail holds, top to bottom: the logo linking home, the in-page section anchors (labels reuse each section's eyebrow, active section highlighted in `--p-primary`), an "External" group (Docs↗, GitHub↗), then a pinned foot with just the locale control and a compact "«" collapse button on one row (no tagline, no CTA — both removed July 2026). Navigation lives only in the rail — there is no separate footer nav — and only real links, never dead spans. On solid `--p-bg` with black rules, no frosted `backdrop-blur`. Rail transforms are direction-aware (it hides toward its own inline-start edge); do not mirror the logo.

## Tech Stack

- Next.js 16+ App Router with TypeScript
- Tailwind CSS (pure utilities, no `@apply`)
- next-intl for i18n (English default, Spanish at `/es/`)
- pnpm for package management
- Deploying to Vercel at portolan-sdi.org

## What NOT to do

- Don't add a "mission" or "about" section to the homepage
- Don't reintroduce the install button in the header
- Don't add emoji (except Unicode marks: ↗, →, ·)
- Don't add icons to nav items
- Don't introduce CSS-in-JS libraries
- Don't add filler content
- Don't use arbitrary font-size values (`text-[13px]`); use the type scale
- Don't inline header/footer markup or reintroduce `SiteHeader`/`SiteFooter`; navigation is the `SiteShell` side rail
- Don't reintroduce the "AI-y" look: gradient text/fills, gradient or shadowed buttons, glassy drop shadows, rounded bento cards, pill-shaped tags, circular status dots, `// EYEBROW` labels, or soft alternating background bands.
- Don't reintroduce the second-wave "AI-y" tells removed in the bespoke pass: typewriter/rotating hero headlines, `NN ·` numbered section kickers, numbers on non-sequence card grids, macOS traffic-light dots on terminals, stacked big-number hero stat blocks (live stats render as one mono log-line), or a frosted translucent header.
- Don't propose or reintroduce the rhumb-line / compass-rose motif in any form — tried repeatedly, explicitly rejected.
- Don't give every card in a grid identical anatomy (number + title + body + tag); ragged is deliberate.

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

### RTL rules (Arabic)

- Use Tailwind **logical** utilities in shared UI (`ps/pe`, `ms/me`, `text-start/end`,
  `border-s/e`, `rounded-s/e`, `inset-s/e`), never physical `pl/pr/ml/mr/left/right`.
  Prefer `gap-*` over `space-x-*`.
- Reserve `rtl:` variants for mirroring directional icons (use `<DirArrow>`).
- Never mirror the logo, the map/dither canvas, or terminal/code blocks. Terminal and
  code blocks stay `dir="ltr"`.
- Wrap pure-Latin standalone values (names, versions, license, repo) in `<Ltr>` so they
  stay correctly ordered inside Arabic text.
- Arabic always renders in Cairo (Archivo has no Arabic glyphs). On RTL pages the
  `--p-sans` token re-points to Cairo in `globals.css`, so body, headings, and the
  `font-sans` utility all resolve to Cairo. Cairo is also the Arabic-glyph fallback in
  the base sans stack, so stray Arabic on an LTR page (for example the language switcher)
  still renders Cairo. Never hardcode `font-family`, rely on the tokens.
- `<html lang dir>` is set per locale in `src/app/[locale]/layout.tsx` via
  `getDirection(locale)`. Do not reintroduce `<html>` into the root layout.
