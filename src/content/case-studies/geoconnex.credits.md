# Media credits

The logo is a lockup of two marks, placed side by side at the same height
with a gray rule between them. The marks are cropped to their visible edges
and scaled. They are not otherwise changed.

- The Lincoln Institute mark is the horizontal color PNG from its
  [official brand kit](https://www.lincolninst.edu/app/uploads/2024/09/lilp-brand-manual-and-logos.zip).
  The mark belongs to the Lincoln Institute of Land Policy.
- The Center for Geospatial Solutions mark is `CGS-Logo-Horizontal-Color.png`
  from the [CGS design skill](https://github.com/cgs-earth/cgs-design-skill/tree/main/cgs-design).
  The mark belongs to the Center for Geospatial Solutions.

The Explorer image is the [screenshot published by the Internet of Water Coalition](https://internetofwater.org/hubfs/Screenshot%202025-07-15%20173341.png)
on its [Geoconnex page](https://internetofwater.org/geoconnex/). It is cropped
slightly at the top to fit 16:9 and encoded as WebP. The Mapbox/OpenStreetMap
attribution remains visible. No separate image license is stated; Colton must
confirm permission for publication. The [Explorer source code](https://github.com/internetofwater/explorer.geoconnex.us)
is MIT-licensed; that does not assign a license to third-party basemap imagery.

The annotated Willamette River graphic uses the actual geometries from the
[reference-mainstems export](https://storage.googleapis.com/harvest-geoconnex-us/summoned/structured/ref:mainstems.parquet)
and [reference-gages export](https://storage.googleapis.com/harvest-geoconnex-us/summoned/structured/ref:gages.parquet),
both CC0-1.0. Gage records are selected by the exact `mainstem_uri` value
`https://geoconnex.us/ref/mainstems/1426120`. The three numbered records are
`ref/gages/1015575` (Portland), `ref/gages/1070546` (Salem), and
`ref/gages/1034045` (Eugene). Basemap © OpenStreetMap contributors © CARTO;
attribution appears in both graphic sizes.

## Measurements

Record counts were read with DuckDB from the published GeoParquet files on
2026-11-18. The snapshot and tested query are in
`public/img/case-studies/geoconnex-measurements.json`. The public-water-system
count comes from [this export](https://storage.googleapis.com/harvest-geoconnex-us/summoned/structured/ref:pws.parquet).
These count records in the exports, not currently operating stations, users,
or improvements caused by Portolan.

## Editorial sources

- [Geoconnex overview and Explorer](https://internetofwater.org/geoconnex/)
- [The community effort and naming problem](https://internetofwater.org/blog/uncategorized/geoconnex-community-system-for-water-data-management-usgs), published 2024-04-23
- [The Geoconnex advantage](https://internetofwater.org/blog/the-geoconnex-advantage-making-water-data-sharing-smarter-and-simpler), published 2024-11-05
- [USGS and the Internet of Water](https://internetofwater.org/blog/unlocking-the-full-potential-of-water-data-usgs-and-the-internet-of-water), published 2023-05-24
- [Access to reference features and the graph](https://docs.geoconnex.us/access/overview/)
- [Portolan catalog construction in the scheduler](https://github.com/internetofwater/scheduler/blob/main/userCode/lib/stac_catalog.py)
- [Live Portolan catalog](https://storage.googleapis.com/harvest-geoconnex-us/stac/catalog.json)

The older articles establish the background, not current Portolan outcomes or
future commitments. Colton must explain the selection rationale and provide a measured workflow
comparison. The quotation and future plans also need his confirmation.
