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
