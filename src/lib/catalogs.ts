// What the registry checks about a catalog during a crawl.
//
// `stac_valid` comes from the crawl itself. The other two report the Markdown
// documents that Portolan v0.1.2 requires at a catalog root. PORTO-CORE-061
// asks for AGENTS.md under `rel: "agents"`. PORTO-CORE-062 asks for README.md
// under `rel: "describedby"`. Both are MUST.
//
// These two replaced three earlier flags in August 2026. The old flags read a
// spec draft that portolan-spec deleted before v0.1.0, so every catalog
// reported the same values. See portolan-registry#89.
export interface CatalogValidation {
  stac_valid: boolean;
  has_agents_md: boolean;
  has_readme: boolean;
}

// Read off the catalog's own `rel: "icon"` link. The registry resolves the
// href against the catalog and confirms it points at an image a browser can
// render, so the site can use it directly. Null for most catalogs.
export interface CatalogLogo {
  href: string;
  type: string;
  title?: string;
}

// Whether the publisher runs the authoritative copy or re-hosts someone
// else's. The registry does not export this yet, so it is null for every
// catalog today and the UI hides the control that filters on it. See
// https://github.com/portolan-sdi/portolan-registry/issues (kind field).
export type CatalogKind = "official" | "mirror";

export interface Catalog {
  id: string;
  url: string;
  title: string;
  kind: CatalogKind | null;
  /** Portolan spec version the catalog declares. Null for plain STAC. */
  spec_version: string | null;
  bbox: [number, number, number, number] | null;
  logo: CatalogLogo | null;
  collection_count: number;
  feature_count: number;
  item_count: number;
  asset_count: number;
  /** Sum over the catalog's assets. Null when the crawl could not total it. */
  total_size_bytes: number | null;
  // SPDX id -> how many collections declare it.
  licenses: Record<string, number>;
  /** When the data last changed, as the catalog itself reports it. */
  updated: string | null;
  /** When the registry last read the catalog. Same for every entry in a run. */
  last_crawled: string | null;
  /** Set once the registry stops being able to read the catalog. */
  stale_since: string | null;
  validation: CatalogValidation;
}

export interface CatalogsResponse {
  generated: string;
  count: number;
  catalogs: Catalog[];
}

export type Bbox = [number, number, number, number];

export interface CollectionRecord {
  id: string;
  title: string;
  bbox: Bbox;
}

export interface CatalogCoverage {
  id: string;
  collection_count: number;
  collections: CollectionRecord[];
}

export interface CoverageBboxes {
  generated: string;
  registry_generated: string | null;
  catalogs: CatalogCoverage[];
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
  "portolan_registry:kind"?: string | null;
  "portolan_registry:spec_version"?: string | null;
  "portolan_registry:logo"?: CatalogLogo | null;
  "portolan_registry:collection_count"?: number | null;
  "portolan_registry:feature_count"?: number | null;
  "portolan_registry:item_count"?: number | null;
  "portolan_registry:asset_count"?: number | null;
  "portolan_registry:total_size_bytes"?: number | null;
  "portolan_registry:licenses"?: Record<string, number> | null;
  "portolan_registry:updated"?: string | null;
  "portolan_registry:last_crawled"?: string | null;
  "portolan_registry:stale_since"?: string | null;
  "portolan_registry:stac_valid"?: boolean | null;
  "portolan_registry:has_agents_md"?: boolean | null;
  "portolan_registry:has_readme"?: boolean | null;
}

interface RegistryExport {
  generated: string;
  count: number;
  links: ChildLink[];
}

const CATALOGS_URL =
  "https://raw.githubusercontent.com/portolan-sdi/portolan-registry/main/exports/catalogs.json";
const COVERAGE_URL =
  "https://raw.githubusercontent.com/portolan-sdi/portolan-registry/main/exports/coverage-bboxes.json";

// Tag the registry fetch so the registry CI can invalidate it on demand
// (POST /api/revalidate) the moment a new export is published, instead of
// waiting out the hourly ISR window.
export const CATALOGS_CACHE_TAG = "catalogs";

function isBbox(value: unknown): value is [number, number, number, number] {
  return (
    Array.isArray(value) && value.length === 4 && value.every((n) => typeof n === "number")
  );
}

function toKind(value: unknown): CatalogKind | null {
  return value === "official" || value === "mirror" ? value : null;
}

function toCatalog(link: ChildLink): Catalog {
  const logo = link["portolan_registry:logo"];

  return {
    id: link["portolan_registry:id"],
    url: link.href,
    title: link.title ?? link["portolan_registry:id"],
    kind: toKind(link["portolan_registry:kind"]),
    spec_version: link["portolan_registry:spec_version"] ?? null,
    bbox: isBbox(link.bbox) ? link.bbox : null,
    logo: logo && logo.href ? logo : null,
    collection_count: link["portolan_registry:collection_count"] ?? 0,
    feature_count: link["portolan_registry:feature_count"] ?? 0,
    item_count: link["portolan_registry:item_count"] ?? 0,
    asset_count: link["portolan_registry:asset_count"] ?? 0,
    total_size_bytes: link["portolan_registry:total_size_bytes"] ?? null,
    licenses: link["portolan_registry:licenses"] ?? {},
    updated: link["portolan_registry:updated"] ?? null,
    last_crawled: link["portolan_registry:last_crawled"] ?? null,
    stale_since: link["portolan_registry:stale_since"] ?? null,
    validation: {
      stac_valid: link["portolan_registry:stac_valid"] ?? false,
      has_agents_md: link["portolan_registry:has_agents_md"] ?? false,
      has_readme: link["portolan_registry:has_readme"] ?? false,
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

export async function getCoverageBboxes(): Promise<CoverageBboxes> {
  const res = await fetch(COVERAGE_URL, {
    next: { revalidate: 3600, tags: [CATALOGS_CACHE_TAG] },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch collection coverage: ${res.status}`);
  }

  return (await res.json()) as CoverageBboxes;
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

// The card badges "unvalidated" only, so no tier reaches a pixel today. The
// registry also sets `stac_valid` to true for every catalog, which makes
// "unvalidated" unreachable. Both gaps need a decision. See
// portolan-registry#89.
export function getValidationTier(validation: CatalogValidation): "unvalidated" | "basic" | "full" {
  const { stac_valid, has_agents_md, has_readme } = validation;

  if (stac_valid && has_agents_md && has_readme) {
    return "full";
  }
  if (stac_valid) {
    return "basic";
  }
  return "unvalidated";
}

// How much of the world a catalog claims. Three catalogs in the registry today
// declare a bbox covering 75% or more of the globe, so drawing every bbox the
// same way buries the located ones under a full-canvas wash. The map spends
// each tier differently: `local` draws filled, `large` draws as an outline, and
// `global` leaves the map for a labelled group beneath it.
export type CoverageTier = "local" | "large" | "global";

const GLOBAL_AREA_FRACTION = 0.5;
const LARGE_AREA_FRACTION = 0.15;
const LARGE_LON_FRACTION = 0.8;

/** Degree spans of a bbox, treating west > east as an antimeridian crossing. */
export function getBboxSpans(bbox: [number, number, number, number]) {
  const [west, south, east, north] = bbox;
  const lonSpan = west > east ? east + 360 - west : east - west;
  const latSpan = north - south;
  return { lonSpan, latSpan, lonFraction: lonSpan / 360, latFraction: latSpan / 180 };
}

export function getCoverageTier(
  bbox: [number, number, number, number] | null
): CoverageTier | null {
  if (!bbox) return null;
  const { lonFraction, latFraction } = getBboxSpans(bbox);
  const areaFraction = lonFraction * latFraction;

  if (areaFraction >= GLOBAL_AREA_FRACTION) return "global";
  // A band spanning every longitude covers little area but still crosses the
  // whole map, so it earns the quieter treatment on longitude alone.
  if (areaFraction >= LARGE_AREA_FRACTION || lonFraction >= LARGE_LON_FRACTION) {
    return "large";
  }
  return "local";
}

// Object stores report sizes in decimal units, so 1 MB is 10^6 bytes here.
const BYTE_UNITS = ["B", "kB", "MB", "GB", "TB", "PB"] as const;

/** Latin digits in every locale, per the translation contract. */
function numberLocale(locale: string): string {
  return locale === "ar" ? "ar-u-nu-latn" : locale;
}

export function formatBytes(bytes: number | null, locale: string): string | null {
  if (bytes === null || !Number.isFinite(bytes) || bytes < 0) return null;

  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < BYTE_UNITS.length - 1) {
    value /= 1000;
    unit++;
  }

  // Whole bytes read oddly with a decimal, and so does a four-digit gigabyte.
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  const formatted = new Intl.NumberFormat(numberLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

  return `${formatted} ${BYTE_UNITS[unit]}`;
}

export function formatCount(value: number, locale: string): string {
  return new Intl.NumberFormat(numberLocale(locale), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

// Fixed to UTC so the server and the client agree on the day. Without it a
// timestamp near midnight formats differently in each and React reports a
// hydration mismatch.
export function formatDate(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(numberLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
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
