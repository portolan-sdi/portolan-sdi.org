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

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

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
- **Type scale (single source of truth):** Use the named utilities generated from `--text-*` tokens in `globals.css`, never arbitrary sizes like `text-[13px]`. `text-eyebrow` (13px) now has one use, the license line in the footer. Labels and kickers take `text-small`. Eight steps, smallest first: `text-eyebrow`, `text-small`, `text-body`, `text-lead`, `text-card-title`, `text-feature`, `text-section`, `text-hero`. Headings and lead text are fluid via `clamp()`. The scale was cut from thirteen steps in August 2026. Do not add a step back: the removed ones (`micro`, `body-lg`, `card-title-lg`, `section-sm`, `hero-sm`) sat within 0.5px of a neighbor or inverted the heading hierarchy. `text-lead` caps at 19px so `text-card-title` outranks it at every width.
- **Corners are square, except code.** All `--p-r-*` radius tokens are `0px`, so buttons, inputs, and general content blocks have 90-degree corners. Code blocks and inline code use `--p-code-radius` for small rounded corners. Nothing is pill-shaped. The only circle allowed is a loading spinner, which has to spin. The registry map shows `MapLoading` (`src/components/registry/map-loading.tsx`) while it loads. It is the Portolan logo, which turns, above the label. It covers the frame until MapLibre draws the basemap, and it does not turn under `prefers-reduced-motion`.
- **Surfaces are flat, rules are black.** Shadow tokens render as `none` or a single rule, never a glassy drop shadow. Separate content with rules, not cards or soft background bands. Structural rules (`border-p-line`) are near-black ink. There is no `border-p-line-strong`: it carried the same hex as `border-p-line`, so it named a weight a color token cannot hold. Rules are 1px. The rule between two homepage sections is `border-t border-p-line`, the top bar closes with the same rule, and the footer opens with it on every page. These rules were 4px for part of November 2026. They went back to 1px when the homepage got its solid ink bands, which divide the page without a heavy rule. The soft tier (`border-p-line-soft`, `#d6d5ca`) is only for interior separators inside an already-bordered block. The heavy black line weight is deliberate, so do not lighten it back to pale hairlines. No section takes a `--p-bg-soft` band. The solid color bands the site does use are listed under **Color fields**.
- **Color fields:** The homepage has three full-bleed `--p-ink` bands with `--p-on-primary` text. The challenge section (`src/components/home/challenge-section.tsx`) is solid. It has no large heading, because the hero heading already names the servers, the databases, and the APIs. Its eyebrow is its `h2`, its first paragraph is the statement in `text-feature` bold, and its second paragraph is `text-lead`. "Why Portolan" (`why-section.tsx`) is `--p-ink` with a picture. A grayscale NASA photograph of Buenos Aires at night sits on the ink, and a `--p-primary` layer multiplies over it, so the city lights are blue and the dark stays ink. The registry section (`network-section.tsx`) is solid. The case study cards are `--p-ink` with `--p-bg` text, on the page ground. The shared footer is a blue field. It multiplies a grayscale NASA astronaut photograph over `--p-primary`, so it reads as one-color blue, with `--p-on-primary` text. Multiply can only darken, so text contrast never drops below white on `--p-primary`. Neither picture shows a credit on the page. The credits are in `README.md`. The `/talks` route has no band. Its cards follow the blog index: a grid of 1, 2, then 3 columns, each card with a whole screenshot in a 16:10 frame, the title with the `↗` arrow, the description, and a line with the speaker and the event. The staggered wall on a `--p-primary` band left in November 2026. The page header of every route except the homepage (`PageHero`) is the same Buenos Aires picture band. No other section takes a color band. `--p-bg-soft` alternating bands and gradients are banned.
- **Graph-paper wash:** The class `graph-wash` in `src/app/globals.css` draws the faint blue 24px grid by mixing `--p-primary` into transparent, so it adds no token. Use it inside annotated figures and, at full width, behind the homepage hero and the homepage solution section.
- **Annotated figures are the sanctioned illustration motif.** Technical diagrams drawn as inline SVG in `--p-primary` strokes with tiny mono labels, dashed leader lines, and the `graph-wash` grid. The reference implementation is the cost scale in `src/components/home/case-studies-section.tsx`. `HeroFigure` is not an annotated figure. It is a Canvas 2D figure, described under **Homepage hero**. A homepage figure has no `Fig. N` caption row. That row is the pattern for blog post figures (`PostFigure`). Figures never mirror in RTL (`dir="ltr"`), and format and tool names inside figures stay Latin. Compass roses and rhumb lines remain banned.
- **Section kickers:** the body face, `text-small`, `text-p-ink-3`, the label string only. No mono, no `NN ·` index prefixes (numbers are reserved for real sequences like the how-it-works steps), no `// EYEBROW` punctuation, no uppercase, no wide tracking. The homepage has two eyebrows and one label. "The challenge" is above the challenge statement and "The solution" is above the solution heading (`challenge.eyebrow`, `solution.eyebrow`). The challenge eyebrow takes `--p-on-primary` on the ink band. The about section had an "About" eyebrow, and it left in November 2026. The one label is `about.logosLabel`, above the logos in that section, in the same style. Put no small label above any other homepage heading, card title, or figure.
- **Mono is for code only.** JetBrains Mono (`font-mono`) sets code blocks, inline code, typeable identifiers in prose (the `<m>` tags), the text inside the two homepage figures, and arrows. Everything else is the body face, in sentence case: kickers, labels, dates, captions, tags, buttons, and controls. Mono labels in capitals with wide tracking left in November 2026, because they read as agent output. Do not put a label or a button back in mono.
- **Links and buttons:** A call to action is a text link over a rule, not a filled block. `Btn` (`src/components/ui/btn.tsx`) with `variant="link"` is the body face at `text-body`, weight 600, in sentence case, in `--p-ink` over a 2px `--p-line` rule. On hover the text and the rule turn `--p-primary` together. A link never changes only its rule or only its text. The homepage has no filled button. The filled variants of `Btn` remain for a call to action inside a blog post (`PostCta`). On an ink card, the same link is `--p-bg` over a `--p-bg` rule.
- **Arrows:** Every link arrow comes from `DirArrow` (`src/components/ui/dir-arrow.tsx`), which sets `→` or `↗` in the mono face, in any kind of link. The mono arrow has a body that is longer than its head. Do not type an arrow in the body face, whose arrow is short. The two arrows that scroll the case study row are drawn shapes with the same proportion, sized from the section heading. Arrow controls have no box around them.
- **No terminal mockups.** The fake-terminal blocks and their `--term-*` tokens were removed in July 2026. `PipelineFigure` had a Claude Code session beside its canvas, and that session left in November 2026. Do not reintroduce terminal or code-session mockups anywhere on the site.
- **Logo:** Two-pennant SVG in `PortolanLogo`, rendered in a **solid** `--p-primary` fill, no gradient. One exception: on the blue footer field the logo takes a solid `--p-on-primary` fill, because a `--p-primary` mark does not show on a `--p-primary` ground.

## Layout and responsiveness

- **Mobile-first, always.** Start from the single-column small-screen layout, then add `sm:` / `md:` / `lg:` breakpoints. Never write a desktop-only layout.
- **Section padding:** sections use `px-[var(--p-pad-section-x)]` and `py-[var(--p-pad-section-y)]` (fluid `clamp()` tokens). Do not use the fixed `--p-pad-xl` for section padding.
- **Grids collapse:** multi-column grids start at `grid-cols-1` and step up (for example `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
- **Homepage hero:** The hero section takes the `graph-wash` class. From `lg` up it has two columns. The headline and the description are on the inline-start side. The hero has no buttons. `HeroFigure` (`src/components/home/hero-figure.tsx`) is on the inline-end side. The figure has no frame. Below `lg` the hero is one column, and the figure is under the description. `HeroFigure` is a Canvas 2D figure with two states that never show together. The first state is a turning globe. Land shows as points on a sphere with a thin outline and a faint graticule. The points sit on a lattice of about 1 degree, and a point is land when land covers a tenth of its cell, so small islands show. Every landmass of 5,000 km² or more shows on the globe, on the outline map, and on the full resolution raster. The globe turns on through every loop and does not reset, so two loops show every longitude. The globe holds for 1.6 seconds, and the move back takes 3.2 seconds. The move between the two states is the interesting part, so do not lengthen the globe hold. The browser derives nothing from the land mask. `pnpm bake:hero-world` (`scripts/bake-hero-world.mts`, with the logic in `hero-bake.ts`) writes the points, the outlines, and the raster to `public/data/hero-world.json`, and `tests/hero-world.test.ts` fails when that file is stale. Everything on the globe is `--p-primary`, with no gray or ink lines. The second state is a Portolan catalog, drawn as a directory tree under `s3://your-bucket/`. The tree is illustrative. It shows each kind of file once and is not a complete valid catalog. A role note beside each light file says what it is, such as "STAC catalog", "for people", and "for agents". The GeoParquet file and the COG each have a drawing, and both drawings show the world map. The GeoParquet drawing is a map of land outlines beside a table of row groups. The COG drawing is a pyramid of the same map as rasters. The drawings have no header or footer parts. `geometry` is the one label inside them. The PMTiles file is a plain row with a role note and no drawing. One transition moves the points from the globe to their own places on the two maps, and the same transition runs backward, on a loop. The figure has no phase words, no request lines, and no read step. The figure picks its form from its own width. The wide form has the tree beside the drawings, and the stacked form has each drawing under its file name. CSS reserves the height of each form, so the page does not shift when the baked world loads. The figure has no WebGL path and no added dependency. Its colors and its mono font come from the palette tokens, which the figure reads at runtime. Under `prefers-reduced-motion` it shows the static catalog. The loop pauses while the figure is off screen or the tab is hidden. The figure is `dir="ltr"` and never mirrors. It has an `sr-only` caption and no visible caption. It is one of two moving elements on the site. The other is `PipelineFigure`. The homepage hero does not use the glyph relief map (`GlyphMap`) or `--hero-scrim`.
- **Homepage solution figure:** `PipelineFigure` (`src/components/home/pipeline-figure.tsx`) is in the solution section. From `lg` it sits beside the text of the section, on the inline-end side. Below `lg` it is under the text. It is one canvas, drawn by `pipeline-renderer.ts`, on plain `--p-bg` with no grid. The canvas is 560px tall from `lg` and 540px below it. The scene is one tall world with a camera that only moves down, so all motion runs one way. The story runs one way too, from the existing systems to cloud storage. The figure plays once, in 12.4 seconds, and stops on the finished portal. It never starts over by itself, because a return to the start reads as a move away from cloud storage. Do not reintroduce a loop. The figure tells three steps. Extract and convert: four existing systems sit at the top, each in its own lane, with the type of its endpoint as its label (Shapefile, GeoPackage, ArcGIS REST, WFS). The real thumbnail of each layer travels straight down its lane and crosses one `--p-primary` line. Above the line it is a faint copy with a dashed edge. Below the line it is solid, and it lands with two labels, GeoParquet and PMTiles. The source stays in its place, because the data is copied. Publish a catalog: the plates drop into a tree under `s3://your-bucket/` with `catalog.json`, `README.md`, and `AGENTS.md`. The tree is inside a frame with an ink head that says `S3 BUCKET`, so it reads as a bucket and not as a folder. Build on top: the tree becomes a sample data portal, served from `your-bucket.s3.amazonaws.com`. The figure shows no row counts, no file sizes, no request lines, and no local folder. Do not add them back. The portal has a head with the catalog title and one `OPEN IN QGIS` button with the QGIS icon, a featured layer above three smaller layers, and a chat panel named PhiLLM with one question and one answer. Each layer can open: the featured layer has an "Open map" link, and each smaller layer has a square with an arrow. The bars under the answer are not data. Their district codes are real, and their lengths are illustrative. The portal is the one place on the site with another look. It uses the colors and the two faces of the City of Philadelphia digital standards, with no logo and no name of a publisher. The colors are canvas constants in the renderer. The faces, Montserrat and Open Sans, load through `next/font/google` in `pipeline-fonts.ts` without preload. Do not use the portal colors or faces anywhere else on the site. The QGIS icon is `public/img/home/pipeline/qgis.svg`, and the robot in the chat head is the Lucide "bot" icon as a path in the renderer. Their credits are in `README.md`. The viewer steps through the figure. Under the canvas, after one rule, are the three numbered step names (`solution.figure.steps`) and two arrow buttons (`solution.figure.previous`, `solution.figure.next`). A step name plays its step from the start and stops on the finished frame. The arrows go one step back and one step on, and they do not wrap. The back arrow is how a viewer returns to the start. At the first step the back arrow, and at the last step the forward arrow, takes `aria-disabled` and the faint ink. The figure has no play button and no pause button. After the viewer uses a control, it stays on the chosen step. So each step must end on a frame that reads well when held. The current step takes `--p-primary-ink`. The thumbnails are 1024x683 WebP files in `public/img/home/pipeline/`, named for their collection ids. They load when the figure comes within 800px of the viewport, and the canvas waits for every face and image before its first frame. By the owner's choice the figure is a second moving element, next to `HeroFigure`. The control styles are the `pipe-` block in `globals.css`, with no hex. The canvas reads the site tokens at runtime. The `sr-only` caption is under `solution.figure` in `messages/`. The file names and the portal UI stay Latin English in every locale. The figure is `dir="ltr"`, and only its controls follow the page direction. Under `prefers-reduced-motion` the clock never runs. The figure shows the finished portal, and a control shows the finished frame of its step. The clock starts only when 70% of the figure is in view, so a reader who sees only its top edge does not miss the start. It pauses below 35%, and in a hidden tab. In development, `?pipe=<seconds>` holds it at one second for screenshots.
- **Homepage section order:** hero `#top`, `#challenge`, `#solution`, `#why`, `#cases`, `#network`, `#about`. "Why Portolan" (`src/components/home/why-section.tsx`) has the three short blocks that were in the solution section, on the night image band described under **Color fields**. The third block states the cost claim. The cost scale (`src/components/home/cost-scale.tsx`) left the homepage in November 2026, and the component stays in the codebase. The solution section has one text link, "Get started" (`solution.cta`), to the `/quickstart` route. The link is imperative, and the page it opens keeps the title "Getting started". Case studies (`src/components/home/case-studies-section.tsx`) is one row of cards that scrolls on the inline axis. The row has no card of its own. It shows one card for each case study in `src/lib/case-studies.ts`, newest first, so a study that merges adds its card with no edit here. While the site has no study, the section does not render, and the page goes from `#why` to `#network`. Do not add a fixed card to the row. The IDE Pergamino, TriMet, and NASA FIRMS cards left in November 2026, because they were not case studies. Every card is `--p-ink` and opens its study. Each card has the same anatomy, by the owner's choice: the whole picture of the study with a hard `--p-primary` block behind it, the mark of the publisher in one light color, a title, the summary, and the "Read the case study" link. The title is `cardTitle`, or the subtitle of the study. The card text is English in every locale, because a study is English only. The row runs past the content column to the inline-end edge of the window, so a cut card shows that the row scrolls. Two drawn arrows beside the heading step the row. They show only when the row has more cards than fit. The registry section (`NetworkSection` in `src/components/home/network-section.tsx`) is next. Its one job is to send the reader to `/registry`. It is an ink band with two columns from `lg`. The heading "Toward a federated network" and one paragraph are on the inline-start side, and the words "Portolan registry" in the paragraph are a link. The live registry map is on the inline-end side, in a plain frame with no block behind it, at 400px from `lg`. The map is `RegistryMapEmbed` (`src/components/registry/registry-map-embed.tsx`), the same `CatalogMap` as `/registry` without its search and its cards. It loads when the section comes near the viewport, it opens on the whole world at a zoom it takes from its own width, and it uses cooperative gestures, so the page scrolls over it. A click on a point opens the registry at that catalog. Two square icon buttons sit on the inline-start side of the map, in the style of its zoom buttons. The one at the top opens `/registry`. The one at the bottom shows the map on the full screen, and it shows only where the browser can do that. The section has no text button. "About" (`AboutSection` in `src/components/home/about-section.tsx`) is the last section. It is centered, with no eyebrow and no button. Its heading is two sentences, and the words "Join us on Slack" in it are the link to the Slack channel, which is the one call to action of the site. One row of logos under it shows the organizations that contribute. The logos are one-color masks in `--p-ink-3`. The marquee logo strip, "Portolan in practice", the ecosystem section, the demo section, and the registry card in the case studies left the homepage. The `/quickstart` route is the "Getting started" page (`quickstart-page.tsx`). It is short on purpose, because the guides are the long form. Do not copy the text of a guide into it. It has no lead paragraph. Two steps are one under the other: "Install the skills" with the install commands, and "Tell your agent to start" with an example prompt that names the data and a bucket. From `lg` each step is one row. The large `--p-primary` numeral, the title, and the text take two fifths of the width, and the code block takes three fifths, so no line of code breaks. The code blocks have the standard code color. The steps have no frame and no rule. The commands are the ones in the README of portolan-skills. Verify a command there before you change it. `HowSteps` is next: the recording of the Philadelphia catalog build beside the four steps (Convert, Catalog, Publish, Use). The page has no tool list. The skills, the CLI, rashid, the registry, and the browser are links in the sentences that name them, and the storage link and the browser link open the Philadelphia catalog. The page has no list of guides, because the Docs menu has them. The page has no "Portolan in practice" section and no "Get involved" section. It took the place of `/how-it-works` and `/ecosystem`, which redirect to it in `next.config.ts`. `GetInvolvedSection` remains in the codebase with no use. `DemoSection`, `VideoFigure`, `InvolvedSection`, and `CoverageFlat` remain in the codebase.
- **Full-bleed media:** no homepage section runs media edge to edge. The registry map is on `/registry` and, at a smaller size, in the registry section of the homepage.
- **Page header:** every route except the homepage opens with `PageHero` in `page-hero.tsx`. It is a picture band, with the treatment of the "Why Portolan" band. The grayscale night photograph of Buenos Aires sits on `--p-ink`, and a `--p-primary` layer multiplies over it. Everything in the band is `--p-on-primary`. The band sets the color of every descendant, so a page can pass a lead, a note, or a link as children with no color change. A link in the band is underlined on hover, because it cannot change color. One `border-b border-p-line` rule closes the band. The owner chose this in November 2026. A plain header on the page ground came before it, and a solid `--p-ink` band was rejected before that as too black. The header drew the glyph relief map (`GlyphMap`) under `--hero-scrim` until November 2026. `GlyphMap` and the scrim token remain in the codebase with no use. The header of a case study page is its own block, with the mark of the publisher, and it has no band. The header owns the page's `<h1>`, so the section below it sets no second one and opens with a tightened `pt-[clamp(28px,3.5vw,48px)]` instead of the full section padding. A two-part headline passes `subtitle`, which sets inside the `<h1>` so it inherits the heading font and differs only in weight and size.
- **Shared chrome:** `SiteShell` in `site-rail.tsx` wraps every page. It renders a sticky **top bar** for primary navigation and `SiteFooter` (`site-footer.tsx`) under the page content. The top bar is the one site header. `SiteHeader` was removed in July 2026 and the collapsible left side rail in November 2026. Do not reintroduce the rail or a second header component. A page never inlines its own `<header>` / `<footer>` markup, because both come from `SiteShell`. The bar shows the logo linking home on the inline-start side. The navigation and the locale control are together on the inline-end side. The navigation is the four groups of the site map in `src/lib/nav.ts`: Docs, Stories, Registry, and Community. The footer reads the same file, so the two never differ. Docs has Getting started, Guides & demos, FAQ, CLI docs, Specification, and GitHub. Stories has Case studies, Blog, and Talks. Community has Slack and the Google Group. Registry is one link, so it is a plain link with no menu. Each other group is a button with a small chevron, and it opens a menu under the bar. The menu opens when the pointer comes over the group, on a click, and on a key press. It fades in over 150ms. It is square, with one ink border and no shadow, and it starts at the rule of the bar. One menu is open at a time. The Escape key, a press outside, or a click on a link shuts it. A link that leaves the site shows the `↗` arrow from `DirArrow`. The locale control shows the translate mark (a character beside the letter A, the Lucide "languages" icon) and its chevron, with no locale code. The locale code left in November 2026, because the page text shows the current language. The globe icon left in November 2026. The bar has no other icon than the translate mark, the chevrons, and the menu button. It has no homepage section anchors, no scroll-spy, no tagline, no CTA, and no install button. The link for the current page takes `aria-current="page"` and `--p-primary`, and so does the button of its group. Below `md` the bar shows the logo and one button with three lines, which become a cross while the panel is open. The lines have square ends. The button opens a panel under the bar. The panel shows each group as a small head above its links, with the locale control at the end. The panel has no menus inside it. The roadmap and the ecosystem page left the navigation in November 2026, because both are in the GitHub organization. The bar is solid `--p-bg` over one black 1px bottom rule, with no frosted `backdrop-blur` and no shadow. Its height is the `--p-bar` token, and `html` sets `scroll-padding-top` to that token, so an anchor jump stops below the bar. `SiteFooter` shows the same groups in the same order, from the same file. It has three columns: Docs, Stories, and Community. The Registry link is in the Docs column, after the pages and before the outside links, because a column with one link looks empty. The license line is under the columns. In the footer, the logo is at the top on the inline-start side, at 30px. The three link columns are at the top on the inline-end side, with their text end-aligned from `sm`. Each column head is the body face in bold, with no rule, so it reads as a head and not as a link. The license line is at the bottom edge of the band, start-aligned, at `text-eyebrow`. It is short: "Site content CC BY 4.0 · Website source Apache-2.0". Use only real links, never dead spans. Do not mirror the logo.

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
- **The blog index is a grid of cards**, 1 column, then 2 from `sm`, then 3
  from `lg`. Each card has a picture from the post, the title, the subtitle,
  and one line with the author, the date, and the reading time. A card shows
  no summary. The cards have the same anatomy, by the owner's choice. The
  picture is the `image` field of the post in `src/lib/blog.ts`, and it must
  be a picture that the post body shows. A post with no author is by "The
  Portolan team" (`blog.team`). The blog route counts the reading time from
  the MDX source with `readingMinutes` in `src/lib/reading-time.ts`. The
  guides index stays as rows, because a guide has no author and can have no
  picture.
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
- **Case studies** use the same English-only MDX pipeline at `/case-studies`, separate from the blog feed. Each study is a set of files with one name, the slug: the body `src/content/case-studies/<slug>.mdx`, the metadata `<slug>.meta.ts` beside it, and the media credits `<slug>.credits.md`. `src/lib/case-studies.ts` builds the list from the `*.meta.ts` files with `import.meta.glob`, so a new study adds files and edits no shared file. Keep it that way: one study is one pull request, and two studies must not conflict. Do not add a study to a list by hand, and do not put a study-specific branch in a shared component. The layout, the index page (`case-studies-index-page.tsx`), and the route are shared, so every study looks the same. Change the look there, never in one study. Each study also gets a card in the homepage row, with no extra file. `cardTitle` sets the card title, and `cardLogo` replaces the mark on the dark card when the one-color filter gives a poor shape. The top bar and the footer show the "Case studies" link only when a study exists. A study page has no "In this article" list. Its heading is the mark of the publisher, in its own colors. A study sets `inkLogo` only when its mark exists in white alone, and the site then shows it in `--p-ink`. On the index page, the "Read the case study" link follows the summary on the same line, in the text link style of the homepage. The file names, the section order, and a template are in `src/content/case-studies/README.md`. Section chrome lives in all three `messages/` files. A test that runs outside the bundler reads the folder with `fs`, because `import.meta.glob` exists only in Turbopack.
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
- Don't add icons to the links in the top bar. The translate mark on the locale control, the menu chevrons, and the three-line menu button are the only icons there
- Don't introduce CSS-in-JS libraries
- Don't add filler content
- Don't use arbitrary font-size values (`text-[13px]`); use the type scale
- Don't inline header/footer markup in a page or reintroduce `SiteHeader` or the side rail. The top bar and `SiteFooter` both come from `SiteShell`
- Don't reintroduce the "AI-y" look: gradient text/fills, gradient or shadowed buttons, glassy drop shadows, rounded bento cards, pill-shaped tags, circular status dots, `// EYEBROW` labels, mono capital labels and buttons, filled call-to-action blocks on the homepage, or soft alternating background bands. The solid bands under **Color fields** are the only section color.
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
- Buttons (`Btn`) and labels take no letterspacing in any locale, so Arabic needs no override for them. Headings keep their negative tracking with `rtl:tracking-normal`, because letterspacing breaks Arabic's connected script.
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
