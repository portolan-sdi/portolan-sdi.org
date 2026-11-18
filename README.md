# Portolan

Portolan is an opinionated standard for publishing geospatial data as
cloud-native files on object storage, plus the tools that make it real: the
validator, CLI, browser, and registry. It is not a hosting service. It is open
source, openly governed, and free.

A Portolan catalog is a directory of open-format data described by structured
STAC metadata, hosted on any S3-compatible bucket with no servers or databases
to run. The only cost is storage plus egress. The stack can live inside your
own jurisdiction, and the plain-text metadata is readable by people, scripts,
and agents.

This repository is the Portolan website, published at
[portolan-sdi.org](https://portolan-sdi.org). It is a Next.js app with content
in English, Spanish, and Arabic.

## Develop

```bash
pnpm install
pnpm dev      # start the dev server
pnpm build    # production build
pnpm lint     # eslint
```

## Links

- Website: [portolan-sdi.org](https://portolan-sdi.org)
- Source: [github.com/portolan-sdi](https://github.com/portolan-sdi)

## Image credit

The footer image is astronaut photograph ISS075-E-70481. It is courtesy of
the Earth Science and Remote Sensing Unit, NASA Johnson Space Center. The
source is the NASA Earth Observatory article
[Monterrey Amid Mountains](https://science.nasa.gov/earth/earth-observatory/monterrey-amid-mountains/).

The image behind the "Why Portolan" band on the homepage is astronaut
photograph ISS073-E-176299, Buenos Aires at night. It is courtesy of the
Earth Science and Remote Sensing Unit, NASA Johnson Space Center. The file
is from the
[NASA Earth Observatory image library](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/154000/154789/iss073e0176299_lrg.jpg).
The site shows it in grayscale, cropped.

The figure in the solution section of the homepage uses three more items.
The QGIS icon in `public/img/home/pipeline/qgis.svg` is from the
[QGIS repository](https://github.com/qgis/QGIS/blob/master/images/icons/qgis_icon.svg).
QGIS is a trademark of QGIS.ORG. The robot icon is the "bot" icon of
[Lucide](https://lucide.dev/icons/bot), under the ISC license. The sample
portal uses the colors and the faces of the
[City of Philadelphia digital standards](https://standards.phila.gov/).
The City of Philadelphia did not make or approve the portal.

The Epoch case study uses the original [Epoch logo](https://epoch.blue/static/img/brands/epoch-logo-text-white.svg).
The case study list shows a screenshot of the
[Epoch open data explorer](https://jakenotjay.github.io/me/explorer/),
by Jake Wilkins, built with deck.gl-raster by Kyle Barron. The article embeds
that viewer directly.

The GeoConnex case study uses the unmodified color horizontal logo from
[Lincoln Institute's official brand kit](https://www.lincolninst.edu/app/uploads/2024/09/lilp-brand-manual-and-logos.zip)
and embeds the [GeoConnex catalog](https://storage.googleapis.com/harvest-geoconnex-us/stac/catalog.json).
Its thumbnail maps [Colorado stream gages](https://storage.googleapis.com/harvest-geoconnex-us/exports/pmtiles/iow:state_gages:cdss.pmtiles)
and [HUC08 river basins](https://storage.googleapis.com/harvest-geoconnex-us/exports/pmtiles/ref:hu08.pmtiles)
around Denver and Boulder. Both layers are CC0-1.0. The labeled basemap is
© OpenStreetMap contributors © CARTO, with attribution in the image.
