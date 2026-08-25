/*
 * bake-land-mask.mjs — bake the land mask the coverage map filters cells with.
 *
 * Run it by hand:
 *   node scripts/bake-land-mask.mjs
 *
 * The coverage map bins collection bboxes into H3 cells. Several catalogs are
 * worldwide, so their bboxes cover open ocean as readily as land. The map hides
 * a cell that holds no land, which leaves the shading on ground a reader can
 * name.
 *
 * The script rasterizes the Natural Earth land polygons to a 0.1 degree grid
 * and writes the rows run-length encoded to public/data/land-mask.json. The
 * grid costs about 100 KB, near 37 KB over the wire, and answers a lookup in
 * constant time. Polygons would answer more precisely and cost a point-in-
 * polygon test for every cell on every pan.
 *
 * Source of the polygons:
 *   https://github.com/nvkelso/natural-earth-vector
 *     geojson/ne_50m_land.geojson
 *   Natural Earth. Public domain. https://www.naturalearthdata.com/about/terms-of-use/
 */

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const LAND_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(HERE, "../public/data/land-mask.json");
const CACHE_PATH = resolve(HERE, "../.cache/ne_50m_land.geojson");

/**
 * Grid step in degrees. 0.1 degree spans about 11 km at the equator, which is
 * finer than an H3 cell at resolution 5. Raise it to shrink the file.
 */
const STEP = 0.1;

async function loadPolygons() {
  if (existsSync(CACHE_PATH)) {
    console.log(`Reading cached ${CACHE_PATH}`);
    return JSON.parse(await readFile(CACHE_PATH, "utf8"));
  }
  console.log(`Reading ${LAND_URL}`);
  const res = await fetch(LAND_URL, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, text, "utf8");
  return JSON.parse(text);
}

function collectRings(geojson) {
  const rings = [];
  for (const feature of geojson.features ?? []) {
    const geom = feature.geometry;
    if (!geom) continue;
    const polygons =
      geom.type === "Polygon"
        ? [geom.coordinates]
        : geom.type === "MultiPolygon"
          ? geom.coordinates
          : [];
    for (const polygon of polygons) {
      for (const ring of polygon) rings.push(ring);
    }
  }
  return rings;
}

/**
 * Fill one row of the grid.
 *
 * The scanline crosses every ring edge that spans this latitude. Sorting the
 * crossings and filling between alternate pairs marks land. The even-odd rule
 * clears a lake or an inland sea without any extra work, because a hole ring
 * adds two more crossings.
 */
function rowRuns(rings, lat, width, step) {
  const crossings = [];
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x1, y1] = ring[j];
      const [x2, y2] = ring[i];
      if (y1 === y2) continue;
      if (lat >= Math.min(y1, y2) && lat < Math.max(y1, y2)) {
        crossings.push(x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
  }
  crossings.sort((a, b) => a - b);

  const row = new Uint8Array(width);
  for (let k = 0; k + 1 < crossings.length; k += 2) {
    const from = Math.max(0, Math.floor((crossings[k] + 180) / step));
    const to = Math.min(width - 1, Math.ceil((crossings[k + 1] + 180) / step) - 1);
    for (let c = from; c <= to; c++) row[c] = 1;
  }
  return row;
}

/**
 * Encode a row as run lengths that alternate ocean, land, ocean, and so on.
 * The first run is always ocean, and is zero long when the row starts on land.
 */
function encodeRow(row) {
  const runs = [];
  let current = 0;
  let length = 0;
  for (const value of row) {
    if (value === current) {
      length++;
    } else {
      runs.push(length);
      current = value;
      length = 1;
    }
  }
  runs.push(length);
  return runs;
}

async function main() {
  const geojson = await loadPolygons();
  const rings = collectRings(geojson);
  const vertices = rings.reduce((sum, ring) => sum + ring.length, 0);
  console.log(`Read ${rings.length} rings, ${vertices} vertices.`);

  const width = Math.round(360 / STEP);
  const height = Math.round(180 / STEP);
  const rle = [];
  let landCells = 0;

  for (let r = 0; r < height; r++) {
    const lat = 90 - (r + 0.5) * STEP;
    const row = rowRuns(rings, lat, width, STEP);
    for (const value of row) if (value) landCells++;
    rle.push(encodeRow(row));
  }

  const payload = { step: STEP, width, height, rle };
  const json = JSON.stringify(payload);

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, json, "utf8");

  console.log(
    `\nWrote ${OUT_PATH}` +
      `\n  grid        ${width} x ${height} at ${STEP} degrees` +
      `\n  land        ${((landCells / (width * height)) * 100).toFixed(1)}%` +
      `\n  runs        ${rle.reduce((s, row) => s + row.length, 0)}` +
      `\n  size        ${(json.length / 1024).toFixed(0)} KB` +
      `\n  gzipped     ${(gzipSync(json).length / 1024).toFixed(0)} KB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
