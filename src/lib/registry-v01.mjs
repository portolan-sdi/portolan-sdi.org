/**
 * Read the Portolan registry from its published 0.1 release line.
 *
 * The registry publishes versioned metadata at registry.portolan-sdi.org. A
 * compatible release adds fields to a line. A breaking release starts a new
 * directory, and the old directory then returns HTTP 404. See
 * https://github.com/portolan-sdi/portolan-registry#consuming-catalog-metadata
 *
 * This file is plain JavaScript so that the site and the Node bake script
 * read the registry with the same code. Each function takes a `fetchJson`
 * function, so each caller keeps its own cache and timeout rules.
 */

export const REGISTRY_ORIGIN = "https://registry.portolan-sdi.org";
export const REGISTRY_LINE = `${REGISTRY_ORIGIN}/v0.1`;
export const CATALOGS_URL = `${REGISTRY_LINE}/catalogs.json`;
export const COVERAGE_INDEX_URL = `${REGISTRY_LINE}/coverage/index.json`;

/** Each release of the 0.1 line. A 0.2 schema URL does not match. */
const SCHEMA_RE =
  /^https:\/\/registry\.portolan-sdi\.org\/schemas\/v0\.1\.\d+\/(extension|coverage)\.json$/;

/** How many coverage files one load requests at the same time. */
const COVERAGE_CONCURRENCY = 8;

/**
 * @typedef {[number, number, number, number]} Bbox
 * @typedef {{ id: string, title: string, bbox: Bbox }} CollectionRecord
 * @typedef {{ id: string, collection_count: number, collections: CollectionRecord[] }} CatalogCoverage
 * @typedef {{ generated: string, catalogs: CatalogCoverage[] }} CoverageBboxes
 * @typedef {CoverageBboxes & { mixed: string[] }} CoverageLoad
 * @typedef {(url: string) => Promise<unknown>} FetchJson
 */

/**
 * Return the schema kind ("extension" or "coverage") of a 0.1 schema URL.
 * Return null for any other URL.
 *
 * @param {unknown} url
 * @returns {"extension" | "coverage" | null}
 */
export function schemaKind(url) {
  if (typeof url !== "string") return null;
  const match = SCHEMA_RE.exec(url);
  return match ? /** @type {"extension" | "coverage"} */ (match[1]) : null;
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Check that catalogs.json declares the 0.1 registry extension.
 *
 * @param {unknown} doc
 * @returns {Record<string, unknown> & { links: Record<string, unknown>[] }}
 */
export function checkCatalogs(doc) {
  if (!isObject(doc)) throw new Error("The registry catalogs.json is not an object");
  const extensions = Array.isArray(doc.stac_extensions) ? doc.stac_extensions : [];
  if (!extensions.some((url) => schemaKind(url) === "extension")) {
    throw new Error(
      `The registry catalogs.json does not declare a 0.1 extension schema: ${JSON.stringify(extensions)}`
    );
  }
  if (!Array.isArray(doc.links)) throw new Error("The registry catalogs.json has no links");
  return /** @type {Record<string, unknown> & { links: Record<string, unknown>[] }} */ (doc);
}

/**
 * Check that a coverage document names the 0.1 coverage schema.
 *
 * @param {unknown} doc
 * @param {string} url
 * @returns {Record<string, unknown>}
 */
function checkCoverageDoc(doc, url) {
  if (!isObject(doc)) throw new Error(`${url} is not an object`);
  if (schemaKind(doc.$schema) !== "coverage") {
    throw new Error(`${url} names schema ${JSON.stringify(doc.$schema)}, not 0.1 coverage`);
  }
  return doc;
}

/**
 * Accept only coverage file URLs under the 0.1 line. The index is data from
 * the network, so the loader does not follow a link to another host.
 *
 * @param {unknown} href
 * @returns {string}
 */
function coverageHref(href) {
  if (typeof href !== "string") throw new Error(`Bad coverage href: ${JSON.stringify(href)}`);
  const url = new URL(href, COVERAGE_INDEX_URL);
  if (url.origin !== REGISTRY_ORIGIN || !url.pathname.startsWith("/v0.1/coverage/")) {
    throw new Error(`Coverage href leaves the 0.1 line: ${href}`);
  }
  return url.href;
}

/**
 * Run `task` on each item, with at most `limit` tasks at the same time.
 * Keep the input order in the result.
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} task
 * @returns {Promise<R[]>}
 */
async function mapLimit(items, limit, task) {
  /** @type {R[]} */
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Load the coverage of every registered catalog.
 *
 * The 0.1 line splits coverage into an index and one file for each catalog.
 * This function reads all of them and returns one combined document. A
 * missing or wrong file fails the whole load. A partial result would drop
 * catalogs from the map with no error.
 *
 * The CDN caches each file for up to 10 minutes. Directly after a registry
 * deploy, one load can mix new and old files. Each file carries the
 * `generated` time of its export. `mixed` lists the catalogs whose time
 * differs from the index, so the caller can retry or accept the mix.
 *
 * @param {FetchJson} fetchJson
 * @returns {Promise<CoverageLoad>}
 */
export async function loadCoverage(fetchJson) {
  const index = checkCoverageDoc(await fetchJson(COVERAGE_INDEX_URL), COVERAGE_INDEX_URL);
  if (!Array.isArray(index.catalogs)) throw new Error("The coverage index has no catalogs");
  const generated = String(index.generated);

  /** @type {string[]} */
  const mixed = [];
  const entries = /** @type {Record<string, unknown>[]} */ (index.catalogs);
  const catalogs = await mapLimit(entries, COVERAGE_CONCURRENCY, async (entry) => {
    const href = coverageHref(entry.href);
    const doc = checkCoverageDoc(await fetchJson(href), href);
    if (doc.id !== entry.id) {
      throw new Error(`${href} holds catalog ${JSON.stringify(doc.id)}, not ${JSON.stringify(entry.id)}`);
    }
    if (!Array.isArray(doc.collections)) throw new Error(`${href} has no collections`);
    if (String(doc.generated) !== generated) mixed.push(/** @type {string} */ (doc.id));
    return {
      id: /** @type {string} */ (doc.id),
      collection_count: Number(doc.collection_count ?? 0),
      collections: /** @type {CollectionRecord[]} */ (doc.collections),
    };
  });

  return { generated, catalogs, mixed };
}
