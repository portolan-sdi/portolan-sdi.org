export interface CatalogValidation {
  stac_valid: boolean;
  has_versions_json: boolean;
  has_portolan_dir: boolean;
  has_llms_txt?: boolean;
}

// Read off the catalog's own `rel: "icon"` link. The registry resolves the
// href against the catalog and confirms it points at an image a browser can
// render, so the site can use it directly. Null for most catalogs.
export interface CatalogLogo {
  href: string;
  type: string;
  title?: string;
}

export interface Catalog {
  id: string;
  url: string;
  title: string;
  stac_version: string | null;
  bbox: [number, number, number, number] | null;
  logo: CatalogLogo | null;
  collection_count: number;
  feature_count: number;
  // SPDX id -> how many collections declare it.
  licenses: Record<string, number>;
  last_crawled: string | null;
  validation: CatalogValidation;
}

export interface CatalogsResponse {
  generated: string;
  count: number;
  catalogs: Catalog[];
}

// The registry publishes its export as a STAC Catalog: one `rel="child"` link
// per registered catalog, carrying the crawl's findings under a
// `portolan_registry:` prefix. Schema:
// https://github.com/portolan-sdi/portolan-registry/blob/main/schema/export.schema.json
interface ChildLink {
  rel: string;
  href: string;
  type?: string;
  title?: string;
  bbox?: [number, number, number, number] | null;
  "portolan_registry:id": string;
  "portolan_registry:stac_version"?: string | null;
  "portolan_registry:logo"?: CatalogLogo | null;
  "portolan_registry:collection_count"?: number | null;
  "portolan_registry:feature_count"?: number | null;
  "portolan_registry:licenses"?: Record<string, number> | null;
  "portolan_registry:last_crawled"?: string | null;
  "portolan_registry:stac_valid"?: boolean | null;
  "portolan_registry:has_versions_json"?: boolean | null;
  "portolan_registry:has_portolan_dir"?: boolean | null;
  "portolan_registry:has_llms_txt"?: boolean | null;
}

interface RegistryExport {
  generated: string;
  count: number;
  links: ChildLink[];
}

const CATALOGS_URL =
  "https://raw.githubusercontent.com/portolan-sdi/portolan-registry/main/exports/catalogs.json";

// Tag the registry fetch so the registry CI can invalidate it on demand
// (POST /api/revalidate) the moment a new export is published, instead of
// waiting out the hourly ISR window.
export const CATALOGS_CACHE_TAG = "catalogs";

function isBbox(value: unknown): value is [number, number, number, number] {
  return (
    Array.isArray(value) && value.length === 4 && value.every((n) => typeof n === "number")
  );
}

function toCatalog(link: ChildLink): Catalog {
  const logo = link["portolan_registry:logo"];

  return {
    id: link["portolan_registry:id"],
    url: link.href,
    title: link.title ?? link["portolan_registry:id"],
    stac_version: link["portolan_registry:stac_version"] ?? null,
    bbox: isBbox(link.bbox) ? link.bbox : null,
    logo: logo && logo.href ? logo : null,
    collection_count: link["portolan_registry:collection_count"] ?? 0,
    feature_count: link["portolan_registry:feature_count"] ?? 0,
    licenses: link["portolan_registry:licenses"] ?? {},
    last_crawled: link["portolan_registry:last_crawled"] ?? null,
    validation: {
      stac_valid: link["portolan_registry:stac_valid"] ?? false,
      has_versions_json: link["portolan_registry:has_versions_json"] ?? false,
      has_portolan_dir: link["portolan_registry:has_portolan_dir"] ?? false,
      has_llms_txt: link["portolan_registry:has_llms_txt"] ?? false,
    },
  };
}

export async function getCatalogs(): Promise<CatalogsResponse> {
  const res = await fetch(CATALOGS_URL, {
    next: { revalidate: 3600, tags: [CATALOGS_CACHE_TAG] },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch catalogs: ${res.status}`);
  }

  const data: RegistryExport = await res.json();
  const catalogs = (data.links ?? [])
    .filter((link) => link.rel === "child" && link["portolan_registry:id"])
    .map(toCatalog);

  return {
    generated: data.generated,
    count: catalogs.length,
    catalogs,
  };
}

// The Portolan browser opens any catalog.json via a hash route that carries the
// host and path with the scheme stripped, e.g.
//   https://data.source.coop/cholmes/portolan-nl/catalog.json
//   -> https://browser.portolan-sdi.org/#/external/data.source.coop/cholmes/portolan-nl/catalog.json
// Linking the raw JSON instead just dumps the document in the user's browser.
const BROWSER_BASE = "https://browser.portolan-sdi.org/#/external/";

export function getBrowserUrl(catalogUrl: string): string {
  const withoutScheme = catalogUrl.replace(/^https?:\/\//, "");
  return `${BROWSER_BASE}${withoutScheme}`;
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

// The export reports licenses as an SPDX id -> collection count map. One id is
// worth naming; several only warrant a count.
export function getLicenseSummary(
  licenses: Record<string, number>
): { kind: "single"; id: string } | { kind: "many"; count: number } | null {
  const ids = Object.keys(licenses);
  if (ids.length === 0) return null;
  if (ids.length === 1) return { kind: "single", id: ids[0] };
  return { kind: "many", count: ids.length };
}
