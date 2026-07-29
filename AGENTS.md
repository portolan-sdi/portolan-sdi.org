<!-- ops-sync:begin — synced from portolan-sdi/portolan-ops. Edit there, not here. -->
# Portolan agent norms

Canonical rules for AI agents working in any portolan-sdi repo. Downstream repos carry this text verbatim as a synced block at the top of their own `AGENTS.md`, so the rules are in context rather than a link away. Repo-specific instructions live below that block. When a repo-specific rule conflicts with this file, the repo-specific rule wins for that repo.

Claude Code does not read `AGENTS.md`. Each repo therefore carries a one-line `CLAUDE.md` that imports it. Put repo-specific instructions in `AGENTS.md`, never in `CLAUDE.md`, which the sync overwrites.

## Voice and prose

- All collective public-facing copy (website, announcements, docs, presentations) follows [VOICE.md](https://github.com/portolan-sdi/portolan-ops/blob/main/VOICE.md). Read it before writing any of those.
- How Portolan is described comes from [copy/messaging.md](https://github.com/portolan-sdi/portolan-ops/blob/main/copy/messaging.md) alone. That file is provisional but authoritative: it distills the working messaging document and wins over any older copy anywhere in the org. Never describe Portolan from memory or from copy that predates it.
- All written artifacts (READMEs, PR and issue bodies, docs, commit message bodies, lasting code comments) follow [STYLE.md](https://github.com/portolan-sdi/portolan-ops/blob/main/STYLE.md). Apply it while drafting, not as a cleanup pass.
- Both are mandatory. "Agents MUST abide" is the operative phrase in each.

## Writing issues and pull requests

A reviewer should finish a pull request body in under a minute and know what changed, why, and that it works. Two rules make that possible, and CI checks both on every push and edit.

- **200 words outside code blocks, no section longer than six lines.** Fenced blocks are uncapped, so evidence never competes with the budget. Say the thing once. Do not restate the diff, do not summarize your own summary, and do not explain the approach at a level the code already shows.
- **Show that it works on real data.** Paste the command and the output you got, and name the data it read: a URL or a catalog path. Green tests are not verification. A change that alters no behavior waives this by ticking the waiver checkbox in the template.

Issues carry the same budget. A bug report needs the reproduction that triggered it, a feature request needs the transcript showing where current behavior falls short, and a task needs the command that will prove it done. Every repo runs these forms, and blank issues are off.

The check fails the pull request. On an issue it applies `needs-rewrite` and comments once.

## Documentation

Agents writing or restructuring documentation, READMEs above all, MUST follow the two guidance sources named in [norms/docs.md](https://github.com/portolan-sdi/portolan-ops/blob/main/norms/docs.md):

1. **[obstore](https://github.com/developmentseed/obstore)** is the exemplar. Before drafting, fetch and study its README and docs layout. Match its shape: what belongs on a landing page, how quick-start is separated from deep documentation and API reference, how much each layer says.
2. **[scaffold-docs-skill](https://github.com/dbreunig/scaffold-docs-skill)** is the method. Draft top-down in layers: section structure first, then headers, then topic sentences, then paragraphs, pausing for human review between layers rather than emitting finished pages in one pass.

Do not draft a README from a generic template or from memory of "what READMEs look like." Consult both sources first, every time.

## Org-wide facts

- License is Apache-2.0 in every repo. Never introduce code under another license without a human decision recorded in `norms/repos.md`.
- The canonical homepage is https://www.portolan-sdi.org/. Canonical URLs live in [copy/urls.md](https://github.com/portolan-sdi/portolan-ops/blob/main/copy/urls.md). Do not hardcode variants.
- Community discussion happens in the [Portolan Google Group](https://groups.google.com/g/portolan) and the [Portolan channel](https://cloudnativegeo.slack.com/archives/C0A1JBH9529) in the Cloud-Native Geo Slack. Planning lives in [org-level GitHub projects](https://github.com/orgs/portolan-sdi/projects/1).
- The [portolan-spec](https://github.com/portolan-sdi/portolan-spec) repo is the ground truth for the Portolan standard. The CLI, the validator, the registry, and every other tool implement the spec and are downstream of it. Never describe the CLI as the source of truth for the spec. Propose spec changes in portolan-spec.

## Contribution rules

- The [AI policy](https://github.com/portolan-sdi/portolan-ops/blob/main/policies/AI_POLICY.md) applies to every contribution. A human must have read, reviewed, and understood any change before review is requested. Agents never open PRs, post comments, or take action in shared spaces without human approval.
- Follow the [contributing guide](https://github.com/portolan-sdi/portolan-ops/blob/main/policies/CONTRIBUTING.md) and the [code of conduct](https://github.com/portolan-sdi/portolan-ops/blob/main/policies/CODE_OF_CONDUCT.md).
- Conventional commits. Squash-merge means the PR title is the commit message. Write it in conventional form.
- Never bypass pre-commit hooks or CI gates. Green means green.

## Ground truth discipline

- One canonical home per fact. Link, don't duplicate. If a value (a color, a URL, a policy line) exists in this repo, reference it rather than copying it.
- Shared files reach downstream repos through `sync/manifest.yml` and the sync workflow, never by hand-copying. To change a synced file in a downstream repo, change it here.
- Brand values come from `brand/brand.json`. Regenerate derived files (`brand/emit_css.py`) rather than editing them.
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

- **Color tokens:** Use CSS variables from `globals.css`. Never hardcode hex except in SVG and the map canvas.
- **Light mode only.** Dark mode was removed in July 2026. There is no `[data-theme]` switch, no `ThemeToggle`, and no dark token block. Do not reintroduce a dark theme or a theme toggle.
- **Type scale (single source of truth):** Use the named utilities generated from `--text-*` tokens in `globals.css`, never arbitrary sizes like `text-[13px]`. Available: `text-eyebrow`, `text-micro`, `text-small`, `text-body`, `text-body-lg`, `text-lead`, `text-card-title`, `text-card-title-lg`, `text-feature`, `text-section-sm`, `text-section`, `text-hero`, `text-hero-sm`. Headings and lead text are fluid via `clamp()`.
- **Corners are square.** All `--p-r-*` radius tokens are `0px`, so every button, input, and content block has 90-degree corners. Nothing is rounded or pill-shaped. The only circle allowed is a loading spinner, which has to spin.
- **Surfaces are flat, rules are black.** Shadow tokens render as `none` or a single rule, never a glassy drop shadow. Separate content with rules, not cards or soft background bands. Structural rules (`border-p-line`, `border-p-line-strong`) are near-black ink. The soft tier (`border-p-line-soft`, `#d6d5ca`) is only for interior separators inside an already-bordered block. The heavy black line weight is deliberate, so do not lighten it back to pale hairlines. **At most one** subtle `--p-bg-soft` band on the page, the talks section.
- **Annotated figures are the sanctioned illustration motif.** Technical diagrams drawn as inline SVG in `--p-primary` strokes with tiny mono labels, dashed leader lines, a faint blue graph-paper wash, and a `Fig. N` caption row (see `PipelineFigure` in the how-it-works section). Figures never mirror in RTL (`dir="ltr"`), and format and tool names inside figures stay Latin. Compass roses and rhumb lines remain banned.
- **Section kickers:** mono, `text-p-ink-3`, the label string only. No `NN ·` index prefixes (numbers are reserved for real sequences like the how-it-works steps), no `// EYEBROW` punctuation, no uppercase, no wide tracking.
- **No terminal mockups.** The fake-terminal blocks and their `--term-*` tokens were removed in July 2026. Do not reintroduce terminal or code-session mockups anywhere on the site.
- **Logo:** Two-pennant SVG in `PortolanLogo`, rendered in a **solid** `--p-primary` fill, no gradient.

## Layout and responsiveness

- **Mobile-first, always.** Start from the single-column small-screen layout, then add `sm:` / `md:` / `lg:` breakpoints. Never write a desktop-only layout.
- **Section padding:** sections use `px-[var(--p-pad-section-x)]` and `py-[var(--p-pad-section-y)]` (fluid `clamp()` tokens). Do not use the fixed `--p-pad-xl` for section padding.
- **Grids collapse:** multi-column grids start at `grid-cols-1` and step up (for example `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
- **Shared chrome:** primary navigation is a collapsible left **side rail**, `SiteShell` in `site-rail.tsx`, which wraps the page. It replaced the old minimal header and centered footer (both removed July 2026, `SiteHeader`/`SiteFooter` are gone, do not reintroduce them or inline `<header>` / `<footer>` markup). The rail is pinned from `md` up (content is inset by `--p-rail`). "Collapse" slides it off-canvas and a mono "» Index" handle restores it. Below `md` it is an off-canvas drawer opened from a mono "Index" button in a slim sticky top bar, the word, never a hamburger icon. The rail holds, top to bottom: the logo linking home, the in-page section anchors (labels reuse each section's eyebrow, active section highlighted in `--p-primary`), an "External" group (Docs↗, GitHub↗), then a pinned foot with the locale control and a compact "«" collapse button on one row (no tagline, no CTA, both removed July 2026). Navigation lives only in the rail. There is no separate footer nav, and only real links, never dead spans. On solid `--p-bg` with black rules, no frosted `backdrop-blur`. Rail transforms are direction-aware (the rail hides toward its own inline-start edge). Do not mirror the logo.

## Tech stack

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
- Buttons (`Btn`) are mono, uppercase, and letterspaced (`tracking-[0.08em]`), neutralized
  with `rtl:tracking-normal` because letterspacing breaks Arabic's connected script.
- `<html lang dir>` is set per locale in `src/app/[locale]/layout.tsx` via
  `getDirection(locale)`. Do not reintroduce `<html>` into the root layout.
