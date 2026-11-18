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

The image behind the "Why Portolan" band on the homepage is a NASA Earth
Observatory image made with Landsat data from the U.S. Geological Survey.
The source is the NASA Earth Observatory article
[An Agricultural Mosaic in Taiwan](https://science.nasa.gov/earth/earth-observatory/an-agricultural-mosaic-in-taiwan/).

The figure in the solution section of the homepage uses three more items.
The QGIS icon in `public/img/home/pipeline/qgis.svg` is from the
[QGIS repository](https://github.com/qgis/QGIS/blob/master/images/icons/qgis_icon.svg).
QGIS is a trademark of QGIS.ORG. The robot icon is the "bot" icon of
[Lucide](https://lucide.dev/icons/bot), under the ISC license. The sample
portal uses the colors and the faces of the
[City of Philadelphia digital standards](https://standards.phila.gov/).
The City of Philadelphia did not make or approve the portal.
