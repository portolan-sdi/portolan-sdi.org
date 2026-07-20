# Homepage copy — Pass A (structure and section jobs)

No final wording in this pass. Each section gets: its kicker, the job its
headline must do, what the body must accomplish, and the proof elements it
uses. Headlines and topic sentences come in Pass B; full copy in Pass C.

Spine (from overall-structure.md): a government reader leaves understanding
why SDIs need a cloud-native upgrade, convinced the path exists.

---

## 1. Hero

- **Kicker:** none.
- **Headline job:** state the claim in one breath — the future-claim H1
  stays (per approved copy-overhaul-v2 decisions). Current "The future of
  spatial data / is just files." survives the adjective-strip test; carry
  it into Pass B as the incumbent to beat.
- **Body job (≤2 sentences):** unpack the claim for a government reader:
  what disappears (servers, databases, proprietary licenses) and what that
  makes possible (people and AI agents read the catalog directly). Must not
  read as a product pitch — Portolan is conventions + tooling, not a host.
- **CTAs:** Quickstart · Browse catalogs (unchanged).
- **Proof element:** the one-line mono stats log, live from the registry —
  its job is "this is running, not a proposal."

## 2. Why Portolan

- **Kicker:** `Why Portolan`
- **Headline job:** frame what follows as the *requirements of a modern
  SDI* — governments' requirements have changed; here is what meeting them
  looks like. This is the argument's core section.
- **Body job:** six cards, each re-anchored as **requirement → how files
  meet it** rather than product feature. Themes keep their territory:

  | Card | Requirement it argues | Proof element |
  |------|----------------------|---------------|
  | Open | No lock-in; data outlives any vendor or project | format tag (GeoParquet · COG · STAC) |
  | AI-ready | Agents must be able to use the SDI without a human intermediary | Finland.SDI demo link |
  | Implementation | An SDI a small agency can actually stand up | none (short card) |
  | Scale | Survives agent-scale crawling without capacity planning | none (short card) |
  | Cost | Publishing public data can't be a budget line that grows with popularity | cost calculator link + tag |
  | Sovereignty | Full stack inside your own jurisdiction | "bring your own bucket" tag |

- **Constraint (from headline-style):** current titles "Easy to
  implement", "Infinitely scalable", "Low cost" are banned value-adjective
  patterns. Pass B must retitle these to show the outcome, not assert the
  quality. "Open", "Fully sovereign" are borderline-fine; "AI-first" →
  reconsider against site vocabulary ("AI-ready" is the framing word).
- **Anatomy stays ragged** (tags/links on some cards only) — deliberate.

## 3. How it works

- **Kicker:** `How it works`
- **Headline job:** name the whole motion in one short phrase the reader
  can repeat in a meeting. Current "Point, convert, push." is a strong
  incumbent.
- **Body job:** subtitle carries the structural insight of the argument —
  community formats replace the server; storage does the scaling. Four
  numbered steps (a real sequence, numbers stay): Convert → Catalog →
  Publish → Browse. Each step description: one concrete sentence of what
  happens plus the named formats/tools, no benefit language (the benefits
  live in section 2).

## 4. Toolkit

- **Kicker:** `The toolkit`
- **Headline job:** these are real, inspectable projects. Current "Open by
  default." is vague about that job — Pass B candidate for replacement.
- **Body job:** three cards with honest maturity labels (alpha / in design
  / in development — unchanged; honesty is the credibility play for a
  government reader). CLI card keeps the works-with storage line. Link:
  All projects ↗.

## 5. Quickstart

- **Kicker:** `Quickstart`
- **Headline job:** mark the exit ramp for the convinced reader.
- **Body job:** intro sentence offering the three paths by reader posture:
  *just looking* (browse a live catalog), *hands-on* (CLI), *non-expert
  with an agent* (Claude). Terminal blocks carry the CLI/Claude proof; the
  copy around them stays minimal.

## 6. Talks & demos

- **Kicker:** `Talks & demos`
- **Headline job:** two independent, credentialed voices are making this
  same argument — the site delegates authority rather than claiming it.
- **Body job:** subtitle keeps the early-stage honesty ("developed in the
  open") and routes the reader into the talks for the demos and calculator.
  Verbatim quote lines stay verbatim (approved decision) — they are the
  section's proof elements. Attributions unchanged.

## 7. Registry (closing section)

- **Kicker:** `Catalog registry`
- **Headline job:** proof of momentum — others are already publishing.
  Live count stays interpolated in the headline.
- **Body job:** one line inviting browsing; the submit CTA stays for the
  reader who arrived already convinced.

---

## Pass B worklist (resolved below)

1. Retitle the three banned-pattern why-cards; re-check all six against
   the adjective-strip test. → done, see Pass B.
2. Decide "AI-first" vs "AI-ready" once, site-wide. → **AI-ready** (it is
   the identity framing word; "AI-first" implies AI outranks people).
3. Replace or defend "Open by default." (toolkit headline). → replaced.
4. Draft why-section headline as a requirements-frame claim. → done.
5. Hero body: split claim from consequence. → done.

---

# Pass B — headlines and topic sentences

Rules applied: topic sentences ≤20 words, single main clause, no
`; : — – ( )`. Headlines pass the adjective-strip and no-positioning
tests. Full paragraphs come in Pass C; a topic sentence here is the
first sentence of its eventual block, not the whole block.

## 1. Hero

- **H1 (incumbent kept):** "The future of spatial data" / "is just files."
- **Body topic sentences:**
  1. "Portolan publishes geospatial data as plain files on object storage."
  2. "Structured metadata lets people and AI agents read a catalog directly."
- **CTAs:** Quickstart · Browse catalogs

## 2. Why Portolan

- **Headline:** "The job of an SDI has changed."
- **Subtitle:** "Spatial data infrastructure matters more than ever. The
  architecture underneath it has not kept up."
- **Card titles + topic sentences:**

  | Old title | New title | Topic sentence |
  |-----------|-----------|----------------|
  | Open | Open | "Every format is open and every tool is Apache-2.0." |
  | AI-first | AI-ready | "An agent can read the catalog and answer questions against it." |
  | Easy to implement | Files in a bucket | "A Portolan node is files in a bucket." |
  | Infinitely scalable | Scales with storage | "Cloud storage absorbs the load, including agent-scale crawling." |
  | Low cost | Two line items | "The whole budget is storage plus egress." |
  | Fully sovereign | Sovereign | "The full stack can live inside your own jurisdiction." |

## 3. How it works

- **Headline (incumbent kept):** "Point, convert, push."
- **Subtitle:** "A shared set of open formats replaces the server. Cloud
  storage does the scaling."
- **Step topic sentences:**
  1. Convert — "Convert source data into cloud-native formats."
  2. Catalog — "Generate a STAC-based catalog describing every asset."
  3. Publish — "Push the files to any S3-compatible object storage."
  4. Browse — "Open the catalog in a browser, a query engine, or an agent."

## 4. Toolkit

- **Headline (replaces "Open by default."):** "What exists today."
- **Card topic sentences:**
  - portolan-cli — "One command takes a folder of shapefiles to a
    browsable catalog on S3."  *(incumbent line, kept)*
  - portolan-viewer — "A viewer that reads catalogs and cloud-native
    files with no server behind it."
  - portolan-skills — "Skills that let AI agents publish catalogs and
    query the data."

## 5. Quickstart

- **Headline (replaces bare "Quickstart"):** "Publish your first catalog."
- **Intro topic sentence:** "Start by browsing a live catalog. Then
  publish your own with the CLI or with an agent."
- **Path titles:** Browse a catalog · With the CLI · With Claude

## 6. Talks & demos

- **Headline (incumbent kept):** "Two talks that make the case."
- **Subtitle:** "Portolan is early-stage and developed in the open. The
  demos, the cost calculator, and the example catalogs are linked from
  inside the talks."
- Quotes and attributions: verbatim, unchanged.

## 7. Registry

- **Headline (incumbent kept):** "Browse {count} catalogs"
- **Description topic sentence:** "Catalogs published around the world,
  live in the registry."
- **CTA:** "Have a catalog to share?" → Submit your catalog

---

# Pass C — full copy (final strings for messages/en.json)

Prose rules applied: active voice, concrete nouns, emphatic word last,
no filler, em dashes rewritten out (which also pre-cleans the es/ar
punctuation contract). Incumbent lines that already pass are kept and
marked *(kept)*.

## meta

- **title** *(kept)*: Portolan — Cloud-native spatial data infrastructure
- **description**: Portolan publishes geospatial data as plain files on
  object storage. No servers, no databases, no proprietary licenses.
  Structured metadata lets people and AI agents read a catalog and query
  it directly.

## hero

- **title / titleAccent** *(kept)*: The future of spatial data / is just files.
- **description**: Portolan publishes geospatial data as plain files on
  object storage, with no servers, no databases, and no proprietary
  licenses. Structured metadata lets people and AI agents read a catalog,
  understand it, and query it directly.
- CTAs, stats labels *(kept)*.

## why

- **title**: The job of an SDI has changed.
- **subtitle**: Spatial data infrastructure matters more than ever. The
  architecture underneath it has not kept up.
- **open** — title: Open
  Every format is open and every tool is Apache-2.0. DuckDB, BigQuery,
  and desktop GIS read the same bytes. If Portolan disappeared tomorrow,
  your data would still work everywhere.
  tag *(kept)*: GeoParquet · COG · STAC
- **aiReady** — title: AI-ready
  An agent can read the catalog and answer questions against it. Plain
  text files explain how to reach the data, and structured metadata
  explains what it means. The <link>Finland.SDI demo</link> shows this
  working against a national SDI.
- **bucket** — title: Files in a bucket
  A traditional SDI needs databases, services, and specialist staff. A
  Portolan node is files in a bucket. Point the CLI at your data,
  convert, and push.
- **scale** — title: Scales with storage
  Cloud storage absorbs the load, including agent-scale crawling. There
  are no servers to size and no capacity to plan. Scaling falls to the
  most proven layer any cloud offers.
- **cost** — title: Two line items
  The whole budget is storage plus egress. Sharing public data should
  not take an operations team, and a popular dataset should not blow a
  budget. The <link>cost calculator</link> shows what your data would run.
  tag *(kept)*: storage + egress
- **sovereign** — title: Sovereign
  The full stack can live inside your own jurisdiction. Host on AWS,
  GCS, Azure, MinIO, Hetzner, Scaleway, or any S3-compatible storage.
  No foreign vendor sits between your agency and its data.
  tag *(kept)*: bring your own bucket

## howItWorks

- **title** *(kept)*: Point, convert, push.
- **subtitle**: A shared set of open formats replaces the server. Cloud
  storage does the scaling. Browsers, query engines, and AI agents read
  the files directly.
- **01 Convert**: Convert shapefiles, GeoTIFFs, WFS, GeoPackage, and
  ArcGIS Feature Services into cloud-native formats. Vectors become
  GeoParquet, rasters become COG, and map tiles become PMTiles.
- **02 Catalog**: Generate a STAC-based catalog that describes every
  asset with structured metadata. Any STAC tool can read it.
- **03 Publish**: Push the files to any S3-compatible object storage.
  That includes AWS, GCS, Azure, R2, MinIO, and Source Cooperative for
  free open data hosting.
- **04 Browse**: Open the catalog in the Portolan browser or any STAC
  viewer, query it with DuckDB, or point an agent at the URL. The data
  answers questions directly.

## toolkit

- **title**: What exists today.
- **cli** *(description kept)*: Convert, validate, and sync. One command
  takes a folder of shapefiles to a browsable catalog on S3.
- **viewer**: A viewer that reads Portolan catalogs and cloud-native
  files directly, with no server behind it.
- **skills** *(kept)*: Skills that let Claude, Gemini, and Codex agents
  publish catalogs and query cloud-native geospatial data.

## quickstart

- **title**: Publish your first catalog.
- **intro**: Start by browsing a live catalog. Then publish your own
  with the CLI or with an agent.
- **browse** *(kept)*: Portolan catalogs are live on the web. Open the
  browser to explore published datasets, or point DuckDB at any
  GeoParquet URL and query it in place.
- **cli** *(kept)*: Install portolan-cli, then init, add, check, and
  push. The CLI converts your files and generates the catalog.
- **claude**: Install the Portolan skill in Claude Code and point it at
  your data. It handles conversion, metadata, and publishing. Agents
  excel at CLIs and text files, so non-experts can publish too.

## resources (talks)

- **title** *(kept)*: Two talks that make the case.
- **subtitle**: Portolan is early-stage and developed in the open. The
  demos, the cost calculator, and the example catalogs are linked from
  inside the talks.
- **holmesTalk** *(kept verbatim)*: title, attribution, quote,
  description unchanged.
- **nextSdi**: description reshaped to drop the em dash: Why
  de-intermediation makes SDIs more important than ever, and the
  architecture they need. The live Finland.SDI agent demo closes the
  talk. *(title, attribution, quote unchanged.)*

## registry (homepage-facing strings)

- **title** *(kept)*: Browse {count} catalogs
- **description**: Catalogs published around the world, live in the
  registry.
- **cta** *(kept)*: Have a catalog to share? / Submit your Portolan
  catalog to the registry. / Submit your catalog

---

# New sections (added 2026-07-20) — Pass A + B

Modeled on geoparquet.org's "Who is involved" and "Software" sections.
Copy scaffolded here; component and logo-asset work is a separate
implementation step after the copy is approved.

## 4b. Ecosystem — after Toolkit

**Pass A**

- **Kicker:** `Ecosystem`
- **Job:** prove the formats are shared standards with tools Portolan
  does not own. Extends the Open card's no-lock-in claim with names the
  reader recognizes. Deliberately compact: grouped name-lists on
  hairlines, not GeoParquet's exhaustive catalog (that can live on a
  docs page later).
- **Proof elements:** the tool names themselves, grouped by what the
  reader would use them for.

**Pass B**

- **Headline:** "Tools that already read these files."
- **Subtitle:** "GeoParquet, COG, PMTiles, and STAC are community
  standards with ecosystems of their own. Nothing below depends on
  Portolan."
- **Groups (proposed, trim freely):**
  - Query engines — DuckDB · BigQuery · Snowflake · Apache Sedona
  - Desktop GIS — QGIS · ArcGIS Pro · Felt
  - Libraries — GDAL · GeoPandas · rasterio · loaders.gl
  - STAC tooling — STAC Browser · stac-geoparquet · pystac

## 6b. Who's involved — after Talks & demos

**Pass A**

- **Kicker:** `Who's involved`
- **Job:** institutional cover for the government reader. The talks
  delegate the argument to people; this strip extends it to
  organizations. Rendered as a flat logo row on hairlines (marquee or
  static is a design call, not a copy call).
- **Constraint:** logos assert affiliation. The label wording must
  match what is true for every org shown, and the org list needs your
  confirmation before anything ships.

**Pass B**

- **Headline:** none. Kicker plus one line, then logos.
- **Label line:** "Supported by" — user chose the strong claim
  (2026-07-20, "risk overclaiming; we'll edit down later").
- **Org list (placeholder, pending confirmation):** CARTO · Radiant
  Earth · Planet · WRI · Ayuntamiento de Madrid

**Status:** both sections implemented 2026-07-20 as placeholders —
`ecosystem-section.tsx` (grouped name rows) and `involved-section.tsx`
(text wordmarks until single-color logo SVGs are sourced). User will do
an editorial pass on org list, label, and tool groups on this branch.

