# Sources and media credits

Research checked on 2026-11-18. This is an editorial draft for Giorgio Basile to complete before publication.

## Media

- `public/img/case-studies/vida-dre-atlas-logo.svg` is the real VIDA.place wordmark extracted from the home-link SVG in [VIDA's website](https://vida.place/). The paths and viewBox are unchanged. Site classes were removed and `currentColor` was resolved to black for the light page ground. Copyright and trademark belong to VIDA.place GmbH. No open license was found for the mark. Confirm VIDA's approval for this use before publication; the dataset license does not license the logo.
- `public/img/case-studies/vida-dre-atlas-map.png` is an unchanged copy of [VIDA's published map preview](https://data.source.coop/vida/dre-atlas/docs/map_preview.png), linked as the thumbnail in the [STAC collection](https://data.source.coop/vida/dre-atlas/collection.json). Settlement data produced by VIDA, commissioned and funded by ESMAP, the World Bank, and IFC; the collection identifies the World Bank Group as licensor and declares [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Basemap © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) © [CARTO](https://carto.com/attributions). The visible caption supplies the attribution absent from the source image. Confirm the preview's attribution with VIDA before publication.
- Figure 2 embeds the [PMTiles viewer](https://pmtiles.io/) from Protomaps, with the [combined DRE Atlas archive](https://data.source.coop/vida/dre-atlas/dre_atlas.pmtiles). The hosted viewer retains its own map attribution. No viewer code is vendored. The planning platform itself sends `X-Frame-Options: SAMEORIGIN`, so it is linked rather than embedded.

## Claims and sources

- Background and infrastructure work: [VIDA](https://vida.place/).
- Project roles, methodology, planning workflows, demand estimates, and limitations: [DRE Atlas technical documentation](https://dre.energydata.info/static/DRE-Atlas-Technical-Documentation.pdf), especially pages 4, 6–7, 11–12, and 14–18. VIDA created the atlas and analysis; Portolan describes the publication structure.
- Release scope: [dataset README](https://data.source.coop/vida/dre-atlas/README.md), over 1.9 million settlements and 58 countries. The README says 50+ attributes; the technical guide says over 60. The draft avoids treating the schema as uniform or picking an attribute count.
- Nigeria's 154,319 settlements: `properties["table:row_count"]` in the [Nigeria STAC item](https://data.source.coop/vida/dre-atlas/by_country/country_iso=NGA/NGA.json).
- Portolan alignment and access limitations: [agent guide](https://data.source.coop/vida/dre-atlas/AGENTS.md). No validator was run, so this draft makes no claim of conformance or of a CLI workflow. HTTPS country reads need no credentials; bulk S3 access requires credentials. Country schemas differ, and some countries have multiple Parquet parts. The draft contains no untested query or command.
- Publication structure and license: [collection metadata](https://data.source.coop/vida/dre-atlas/collection.json). GeoParquet supports analysis; PMTiles supports map display. This does not prove the original planning platform reads from this release.
- Wider reach and direct reuse: VIDA's DRE Atlas announcement, indexed on its [company page](https://www.linkedin.com/company/vida-place). Company feeds change. Ask Giorgio for the permanent announcement URL before publication.
- Portolan framing: [canonical messaging](https://github.com/portolan-sdi/portolan-ops/blob/main/copy/messaging.md). Specification claims should follow [portolan-spec](https://github.com/portolan-sdi/portolan-spec).

## Editorial handoff

- Confirm the specific publishing challenge and why the team chose Portolan. Identify the tools used, any alternatives considered, and the before/after workflow.
- Supply an approved first-person quote about that choice, with the speaker's exact name and role. Giorgio's role is described as Geospatial Data Engineer in VIDA's public announcement; confirm it with him. No personal testimonial is approved or rendered in this draft.
- A candidate organizational quote from VIDA's public announcement is "We built this to be used, not just browsed." It describes the open release, not a Portolan endorsement. Confirm permission, attribution, and the permanent URL before use, or replace it with the interview quote.
- Add one example of downstream use and dated, attributable measurements of time, cost, reuse, or planning impact. Do not present settlement coverage as people connected to electricity. Source Cooperative download counts include file requests and do not establish unique users.
- Confirm whether more datasets, refreshes, or Portolan publications are planned. No future commitment is established by the sources reviewed.
- Approve the mark, map credits, publication date, and final copy. Remove the visible draft notes after those gaps are filled.
