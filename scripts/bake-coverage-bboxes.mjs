/*
 * bake-coverage-bboxes.mjs — bake the collection bboxes behind the coverage map.
 *
 * Run it by hand:
 *   node scripts/bake-coverage-bboxes.mjs
 *
 * The script reads the registry export, walks every registered catalog, and
 * writes each collection's spatial bbox to public/data/coverage-bboxes.json.
 * The coverage map reads that file and bins the bboxes into H3 cells in the
 * browser.
 *
 * Source of the catalog list:
 *   https://github.com/portolan-sdi/portolan-registry
 *     exports/catalogs.json
 *   The same URL src/lib/catalogs.ts reads at request time.
 *
 * The script bakes bboxes, not cells. The map counts global catalogs, so every
 * cell on Earth holds a count. A baked cell table costs 288,122 rows at
 * resolution 4 and 2 million at resolution 5. The bbox table costs about 618
 * rows at every resolution, because the browser bins them for the current
 * viewport only.
 *
 * This is prototype code. The registry repo is the right home for the crawl
 * once the map proves out.
 */

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REGISTRY_URL =
  "https://raw.githubusercontent.com/portolan-sdi/portolan-registry/main/exports/catalogs.json";

const OUT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../public/data/coverage-bboxes.json",
);

// How deep the walk follows `rel: "child"` before it gives up. Registered
// catalogs nest two levels today. The cap stops a cycle the visited set misses.
const MAX_DEPTH = 8;

// How many documents the script fetches at once. Source Cooperative serves most
// catalogs, so this is one host under load.
const CONCURRENCY = 8;

const TIMEOUT_MS = 20_000;
const RETRIES = 1;

// Coordinates keep 4 decimal places, near 11 m at the equator. H3 resolution 6
// spans 3.2 km, so the rounding never moves a bbox into another cell.
const COORD_PRECISION = 4;

async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`${url}: ${lastError.message}`);
}

// How far past the world edge a coordinate may sit and still get clamped.
// Several registered catalogs report a value a fraction past the limit, such as
// a south of -90.00000001 on Argentina's national layers and an east of
// 180.00005 on the fields-of-the-world predictions. A reprojection rounds those
// out. The data is sound, so the script pulls the value back to the edge.
// A larger overshoot means a real error and the script drops the bbox.
const EDGE_TOLERANCE = 1e-3;

function clampCoord(value, limit) {
  if (!Number.isFinite(value)) return null;
  if (value > limit) return value <= limit + EDGE_TOLERANCE ? limit : null;
  if (value < -limit) return value >= -limit - EDGE_TOLERANCE ? -limit : null;
  return value;
}

/**
 * Check a bbox and pull any small overshoot back to the world edge.
 *
 * The rules match src/components/registry/catalog-map.tsx, which drops a bbox
 * it cannot draw. A west greater than an east is legal here. It crosses the
 * antimeridian and splitBbox handles it.
 *
 * Returns the corrected bbox, or null when the script must drop it. One
 * collection reports -1.7976931348623157e+308, the negative float limit, as a
 * stand-in for an unknown extent. That value fails the tolerance and drops.
 */
function normalizeBbox(bbox) {
  if (!Array.isArray(bbox) || bbox.length < 4) return null;
  const west = clampCoord(bbox[0], 180);
  const south = clampCoord(bbox[1], 90);
  const east = clampCoord(bbox[2], 180);
  const north = clampCoord(bbox[3], 90);
  if (west === null || south === null || east === null || north === null) {
    return null;
  }
  if (south > north) return null;
  return [west, south, east, north];
}

function round(value) {
  return Number(value.toFixed(COORD_PRECISION));
}

// Cut an antimeridian bbox into two. The browser then treats every baked bbox
// as a plain rectangle where west is less than east.
function splitBbox(bbox) {
  const [west, south, east, north] = bbox.slice(0, 4).map(round);
  if (west <= east) return [[west, south, east, north]];
  return [
    [west, south, 180, north],
    [-180, south, east, north],
  ];
}

/**
 * Walk one catalog tree and collect every collection bbox it holds.
 *
 * A child link points at a sub-catalog or at a collection. The script reads the
 * fetched document's `type` field to tell them apart, because the href alone
 * does not say.
 */
async function walkCatalog(rootUrl, stats) {
  const visited = new Set();
  const bboxes = [];
  let collections = 0;
  let skipped = 0;

  async function visit(url, depth) {
    if (depth > MAX_DEPTH || visited.has(url)) return;
    visited.add(url);

    let doc;
    try {
      doc = await fetchJson(url);
    } catch (err) {
      stats.errors.push(err.message);
      return;
    }

    if (doc.type === "Collection") {
      collections++;
      // STAC puts the overall extent first. Later entries refine it.
      const bbox = normalizeBbox(doc.extent?.spatial?.bbox?.[0]);
      if (bbox) {
        bboxes.push(...splitBbox(bbox));
      } else {
        skipped++;
      }
      return;
    }

    const children = (doc.links ?? [])
      .filter((link) => link.rel === "child" && link.href)
      .map((link) => new URL(link.href, url).toString());

    // Fetch the children of one node in batches. Depth stays serial, which
    // keeps the load on one host bounded.
    for (let i = 0; i < children.length; i += CONCURRENCY) {
      const batch = children.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map((child) => visit(child, depth + 1)));
    }
  }

  await visit(rootUrl, 0);
  return { bboxes, collections, skipped };
}

// Two collections often share one bbox, and a mirror repeats its source's
// extents. The map counts catalogs, not collections, so a duplicate adds work
// and changes nothing.
function dedupe(bboxes) {
  const seen = new Set();
  const out = [];
  for (const bbox of bboxes) {
    const key = bbox.join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(bbox);
  }
  return out;
}

async function main() {
  const stats = { errors: [] };

  console.log(`Reading ${REGISTRY_URL}`);
  const registry = await fetchJson(REGISTRY_URL);
  const children = (registry.links ?? []).filter(
    (link) => link.rel === "child" && link["portolan_registry:id"],
  );
  console.log(`Registry lists ${children.length} catalogs.\n`);

  const catalogs = [];
  let totalCollections = 0;
  let totalSkipped = 0;

  for (const link of children) {
    const id = link["portolan_registry:id"];
    const rootUrl = new URL(link.href, REGISTRY_URL).toString();
    const { bboxes, collections, skipped } = await walkCatalog(rootUrl, stats);
    const unique = dedupe(bboxes);

    totalCollections += collections;
    totalSkipped += skipped;

    console.log(
      `  ${id.padEnd(32)} ${String(collections).padStart(4)} collections` +
        ` -> ${String(unique.length).padStart(4)} bboxes` +
        (skipped ? `  (${skipped} skipped)` : ""),
    );

    if (unique.length > 0) {
      catalogs.push({ id, collections, bboxes: unique });
    }
  }

  const payload = {
    generated: new Date().toISOString(),
    source: "portolan-registry exports/catalogs.json",
    registry_generated: registry.generated ?? null,
    catalogs,
  };

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(payload), "utf8");

  const bytes = JSON.stringify(payload).length;
  const totalBboxes = catalogs.reduce((sum, c) => sum + c.bboxes.length, 0);

  console.log(
    `\nWrote ${OUT_PATH}` +
      `\n  catalogs      ${catalogs.length}` +
      `\n  collections   ${totalCollections}` +
      `\n  bboxes kept   ${totalBboxes}` +
      `\n  bboxes skipped ${totalSkipped}` +
      `\n  size          ${(bytes / 1024).toFixed(1)} KB`,
  );

  if (stats.errors.length > 0) {
    console.log(`\n${stats.errors.length} documents failed to read:`);
    for (const err of stats.errors.slice(0, 20)) console.log(`  ${err}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
