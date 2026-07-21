export interface CatalogValidation {
  stac_valid: boolean;
  has_versions_json: boolean;
  has_portolan_dir: boolean;
  has_llms_txt?: boolean;
}

export interface Catalog {
  id: string;
  url: string;
  title: string;
  description: string;
  stac_version: string;
  providers: unknown;
  keywords: string[] | null;
  bbox: [number, number, number, number] | null;
  license: string;
  collection_count: number;
  feature_count: number;
  last_crawled: string;
  validation: CatalogValidation;
}

export interface CatalogsResponse {
  generated: string;
  count: number;
  catalogs: Catalog[];
}

// Pinned to the last registry commit whose export still carried per-catalog
// `bbox` (and the flat `catalogs` array this file parses). On 2026-06-30 the
// registry reshaped the export into a STAC super-catalog and dropped spatial
// extent entirely, which leaves the map with nothing to plot. Tracking the
// restore in portolan-registry; unpin back to `main` once bboxes return.
// https://github.com/portolan-sdi/portolan-registry/issues/36
const CATALOGS_URL =
  "https://raw.githubusercontent.com/portolan-sdi/portolan-registry/6f55bba64afe/exports/catalogs.json";

// Tag the registry fetch so the registry CI can invalidate it on demand
// (POST /api/revalidate) the moment a new export is published, instead of
// waiting out the hourly ISR window.
export const CATALOGS_CACHE_TAG = "catalogs";

export async function getCatalogs(): Promise<CatalogsResponse> {
  const res = await fetch(CATALOGS_URL, {
    next: { revalidate: 3600, tags: [CATALOGS_CACHE_TAG] },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch catalogs: ${res.status}`);
  }

  return res.json();
}

export function getValidationTier(validation: CatalogValidation): "unvalidated" | "basic" | "full" {
  const { stac_valid, has_versions_json, has_portolan_dir } = validation;

  if (stac_valid && has_versions_json && has_portolan_dir) {
    return "full";
  }
  if (stac_valid) {
    return "basic";
  }
  return "unvalidated";
}
