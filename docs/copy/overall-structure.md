# Portolan site copy — overall structure

Scaffold for the copy rewrite on `feat/bespoke-pass`. Adapted from the
scaffold-docs workflow: structure → headlines/topic sentences → full copy,
with review between each pass. All approved copy lands in `messages/en.json`
(then `es`/`ar` sync).

## Audiences

The site serves three audiences at once. Instead of one primary, we use a
**layered-audience model**: each section of the page has a named lead
audience, and the arc hands off between them. When a copy choice conflicts
*within* a section, the tie-break order below decides.

**Tie-break order (approved 2026-07-20):**

1. **Government adopter** — national and subnational government readers, the
   current target. Spans the decision-maker (director/funder weighing SDI
   modernization; cares about the argument, risk, institutional fit) and the
   data manager (has data and a mandate, no cloud team; cares about cost,
   sovereignty, no specialist staff). The site's own voice must land the
   argument for them.
2. **Cloud-native geo developer** — the GeoParquet/DuckDB/STAC crowd. Already
   convinced of cloud-native; wants tools, formats, and proof of correctness.
   Reached mostly through the terminal blocks, quickstart, and repo links.

**Secondary (tie-breaker only):** AI-agent builder — wiring Claude/Gemini
agents to data; found Portolan through the AI-ready angle. Never restructures
a section, but AI-readiness proof points should stay concrete for them.

## Spine

The one outcome the homepage is built to produce (approved 2026-07-20):
**"A government reader leaves understanding why SDIs need a cloud-native
upgrade — and convinced the path exists."**

Portolan is early enough that the argument, not the action, is the product.
Every section either *makes* the argument (hero, why, talks) or *proves the
path is real* (how it works, toolkit, quickstart, registry). Publishing a
catalog is the follow-on action for the convinced, not the spine.

Rejected alternates:

- *"Publish your data"* as spine — too early; assumes a reader who is
  already convinced, which is exactly the reader we don't yet have.
- *"Browse catalogs"* as spine — consumption-first framing undersells the
  point that Portolan is something you adopt, not a portal you visit.

## Homepage arc (the "Getting Started" analog)

Section order is settled (from the copy-overhaul-v2 decisions); this pass
defines what each section must *accomplish* and for whom.

| # | Section | Lead audience | Job in the argument |
|---|---------|---------------|---------------------|
| 1 | Hero + live stats | Government adopter | State the claim in one breath; the stats log proves this is running, not a proposal |
| 2 | Why Portolan | Government adopter | The argument's core: six cards as the requirements of a modern SDI and how files meet them |
| 3 | How it works | Government adopter (developer second) | Prove the path is concrete: four steps, no institution-sized lift |
| 4 | Toolkit | Developer | Prove the software exists, with honest maturity labels |
| 5 | Quickstart | Government adopter + developer | The exit ramp for the convinced: browse, CLI, or Claude |
| 6 | Talks & demos | Government adopter | Independent authority: two respected voices making the same argument |
| 6b | Who's involved (logo strip) | Government adopter | Institutional cover: recognizable organizations stand near this work |
| 7 | Registry CTA | All | Proof of momentum: others are already doing this |

Restructured 2026-07-20 (second pass, user-directed):

- **Who's involved** moved to directly under the hero as a slim
  credibility strip ("Supported by" + wordmarks) — institutional cover
  arrives before the argument, not after.
- **Toolkit section removed** ("What exists today" judged useless).
  Its content dissolved: the six repos (portolan-spec, reis,
  portolan-cli, portolan-registry, portolan-browser, portolan-skills)
  became the first Ecosystem row; the CLI/skills links moved into the
  Quickstart cards. Maturity tags and project descriptions dropped.
- **Ecosystem headline** now "All of it is on GitHub." — it inherits
  the toolkit's real-and-inspectable job on top of the no-lock-in job.
- **All terminal mockups removed** (hero/toolkit/quickstart);
  `Terminal` component and `--term-*` tokens deleted.
- **Header minimal** (logo + controls); site nav moved to the footer.
  Footer colophon removed.

Current arc: hero → supported-by strip → why → how it works →
ecosystem → quickstart → talks → registry.

## Secondary surfaces (the "Diving Deeper" analog)

Written after the homepage, two passes each:

- **Registry page** — intent: discovery and submission; lead: all three.
- **Meta title/description** — intent: search/social first impression;
  must carry the claim without the page around it.

## Microcopy sweep (the "Reference" analog)

One consistency pass at the end, single review: nav, footer, aria labels,
registry form/map strings, filter labels, error states. Checks: same voice,
i18n punctuation contract (no em dashes/colons/semicolons destined for
es/ar), terminology matches `docs/i18n/glossary.md`.

## Out of scope

- Visual/layout changes (bespoke pass handles those separately)
- New sections (no mission/about; registry stays last; talks stay before registry)
- es/ar translation (syncs only after English is fully approved)
