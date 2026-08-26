/*
 * bake-a5-coverage.mjs — bake the flat Equal Earth coverage map.
 *
 * Run it by hand, after bake-coverage-bboxes.mjs and bake-land-mask.mjs:
 *   node scripts/bake-a5-coverage.mjs
 *
 * The script reads the collection bboxes, bins them into A5 pentagonal cells,
 * and counts the distinct catalogs that reach each cell. A catalog counts once
 * per cell, however many collections it holds there.
 *
 * The output carries one ready-drawn SVG path per cell, already projected
 * through Equal Earth. The browser loads no A5 code, no projection maths, and
 * no map library. It draws the paths.
 *
 * The projection is written out below rather than taken from a library. D3
 * projects on the sphere, where a ring wound the wrong way means the whole
 * world minus that ring, and A5 winds its rings that way. Projecting here on
 * the plane has no winding to get wrong.
 *
 * Why the script samples rather than fills:
 *   A5 polygonToCells places a cell when the polygon holds the cell's centre.
 *   A bbox smaller than a cell holds no centre and returns nothing, and a bbox
 *   wider than about 90 degrees returns almost nothing. Walking a grid over
 *   each bbox avoids both faults.
 *
 * A5 is Apache-2.0. https://github.com/felixpalmer/a5
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { lonLatToCell, cellToBoundary, cellArea } from "a5-js";

const HERE = dirname(fileURLToPath(import.meta.url));
const BBOX_PATH = resolve(HERE, "../public/data/coverage-bboxes.json");
const MASK_PATH = resolve(HERE, "../public/data/land-mask.json");
const outPath = (res) =>
  resolve(HERE, `../public/data/a5-coverage-r${res}.json`);

/**
 * A5 resolution. Change this to retune the grain.
 *
 *   3 -> 960 cells worldwide, about 730 km across
 *   4 -> 3840 cells, about 365 km
 *   5 -> 15360 cells, about 180 km
 *
 * The site ships 5. At 4 a cell is wider than the Mediterranean, so a cell of
 * open water touches Europe at one corner and Africa at another, and the land
 * test below keeps it. Europe, Africa, and Asia then read as one landmass. A
 * land-area threshold does not repair this, because 46 of the 48 cells the
 * Mediterranean touches at resolution 4 do hold land. Only a finer cell
 * separates the two coasts.
 */
const RESOLUTIONS = (process.argv[2] ?? "5")
  .split(",")
  .map((value) => Number(value.trim()));

/**
 * The largest share of the world one collection bbox may cover and still shade
 * the map. One counts every bbox, which is the setting the site ships.
 *
 * Five registered catalogs hold a bbox spanning 89 to 94 percent of the globe,
 * so most land cells carry those five. The map handles that in its colour
 * scale, which ranks the counts rather than spreading them linearly.
 */
const MAX_BBOX_WORLD_FRACTION = 1;

const EARTH_RADIUS_KM = 6371;
const EARTH_AREA_KM2 = 4 * Math.PI * EARTH_RADIUS_KM * EARTH_RADIUS_KM;

/** Share of the globe a bbox covers, by area on the sphere. */
function worldFraction([west, south, east, north]) {
  const lngSpan = ((east - west) * Math.PI) / 180;
  const area = Math.abs(
    EARTH_RADIUS_KM *
      EARTH_RADIUS_KM *
      lngSpan *
      (Math.sin((north * Math.PI) / 180) - Math.sin((south * Math.PI) / 180)),
  );
  return area / EARTH_AREA_KM2;
}

/** How many samples fall across one cell width. Three is enough to catch every
 * cell a bbox crosses without a cell being reported twice. */
const SAMPLES_PER_CELL = 3;

/** Width of the baked drawing. The height follows the projection's ratio. */
const VIEW_WIDTH = 1600;

/*
 * Equal Earth, an equal-area projection. A cell covering the same ground reads
 * the same size wherever it sits, which is what a density map needs. Mercator
 * would inflate the high latitudes that carry the least data.
 *
 * Bojan Savric, Tom Patterson, Bernhard Jenny, 2018.
 * https://doi.org/10.1080/13658816.2018.1504949
 */
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const SQRT3_2 = Math.sqrt(3) / 2;

function equalEarth(lngDeg, latDeg) {
  const lng = (lngDeg * Math.PI) / 180;
  const lat = (latDeg * Math.PI) / 180;
  const theta = Math.asin(Math.max(-1, Math.min(1, SQRT3_2 * Math.sin(lat))));
  const t2 = theta * theta;
  const x =
    (2 * Math.sqrt(3) * lng * Math.cos(theta)) /
    (3 *
      (9 * A4 * t2 * t2 * t2 * t2 + 7 * A3 * t2 * t2 * t2 + 3 * A2 * t2 + A1));
  const y = A4 * theta ** 9 + A3 * theta ** 7 + A2 * theta ** 3 + A1 * theta;
  return [x, y];
}

// The projection's own extent, so the drawing fits the width exactly.
const [MAX_X] = equalEarth(180, 0);
const [, MAX_Y] = equalEarth(0, 90);
const SCALE = VIEW_WIDTH / (2 * MAX_X);
const VIEW_HEIGHT = Math.round(2 * MAX_Y * SCALE);

/** Project to drawing coordinates, y down, rounded to whole units. */
function toCanvas(lngDeg, latDeg) {
  const [x, y] = equalEarth(lngDeg, latDeg);
  return [Math.round((x + MAX_X) * SCALE), Math.round((MAX_Y - y) * SCALE)];
}

/**
 * Build the path data for one cell ring.
 *
 * A cell that straddles the antimeridian holds longitudes near both edges of
 * the world. Drawn as given it stretches a band across the whole map, so the
 * ring is drawn twice, once carried each way. The drawing clips both.
 */
function ringToPath(ring) {
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const [lng] of ring) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  const draw = (points) =>
    `M${points.map(([x, y]) => `${x} ${y}`).join("L")}Z`;

  if (maxLng - minLng <= 180) {
    return draw(ring.map(([lng, lat]) => toCanvas(lng, lat)));
  }
  return (
    draw(ring.map(([lng, lat]) => toCanvas(lng < 0 ? lng + 360 : lng, lat))) +
    draw(ring.map(([lng, lat]) => toCanvas(lng > 0 ? lng - 360 : lng, lat)))
  );
}

function cellStepDegrees(resolution) {
  // cellArea returns square metres. A cell about `side` metres across spans
  // roughly side / 111320 degrees at the equator.
  const side = Math.sqrt(cellArea(resolution));
  return side / 111_320 / SAMPLES_PER_CELL;
}

function decodeMask({ step, width, height, rle }) {
  const bits = new Uint8Array(Math.ceil((width * height) / 8));
  for (let row = 0; row < height; row++) {
    let x = 0;
    let land = false;
    for (const length of rle[row]) {
      if (land) {
        for (let i = 0; i < length; i++) {
          const index = row * width + x + i;
          bits[index >> 3] |= 1 << (index & 7);
        }
      }
      x += length;
      land = !land;
    }
  }
  return { step, width, height, bits };
}

function isLand(mask, lat, lng) {
  const wrapped = ((((lng + 180) % 360) + 360) % 360) - 180;
  const col = Math.min(mask.width - 1, Math.max(0, Math.floor((wrapped + 180) / mask.step)));
  const row = Math.min(mask.height - 1, Math.max(0, Math.floor((90 - lat) / mask.step)));
  const index = row * mask.width + col;
  return (mask.bits[index >> 3] & (1 << (index & 7))) !== 0;
}

/** Every point to test for one bbox: a grid, plus the corners and the centre. */
function* samplePoints(bbox, step) {
  const [west, south, east, north] = bbox;
  for (let lng = west; lng <= east; lng += step) {
    for (let lat = south; lat <= north; lat += step) {
      yield [lng, lat];
    }
  }
  yield [west, south];
  yield [east, south];
  yield [west, north];
  yield [east, north];
  yield [(west + east) / 2, (south + north) / 2];
}

async function bakeResolution(index, mask, RESOLUTION) {
  const step = cellStepDegrees(RESOLUTION);

  console.log(
    `\nA5 resolution ${RESOLUTION}, ` +
      `${(Math.sqrt(cellArea(RESOLUTION)) / 1000).toFixed(0)} km across, ` +
      `sample step ${step.toFixed(3)} degrees.`,
  );

  const counts = new Map(); // cell id (bigint) -> catalogs reaching it
  const landVerdict = new Map();

  const holdsLand = (cell) => {
    let verdict = landVerdict.get(cell);
    if (verdict === undefined) {
      const ring = cellToBoundary(cell, { closedRing: false });
      verdict = ring.some(([lng, lat]) => isLand(mask, lat, lng));
      if (!verdict) {
        // The ring may straddle a narrow coast the corners miss.
        let sumLng = 0;
        let sumLat = 0;
        for (const [lng, lat] of ring) {
          sumLng += lng;
          sumLat += lat;
        }
        verdict = isLand(mask, sumLat / ring.length, sumLng / ring.length);
      }
      landVerdict.set(cell, verdict);
    }
    return verdict;
  };

  const worldwide = [];

  for (const catalog of index.catalogs) {
    const local = catalog.collections
      .map((collection) => collection.bbox)
      .filter((bbox) => worldFraction(bbox) <= MAX_BBOX_WORLD_FRACTION);
    if (local.length === 0) {
      worldwide.push(catalog.id);
      continue;
    }

    const own = new Set();
    for (const bbox of local) {
      for (const point of samplePoints(bbox, step)) {
        own.add(lonLatToCell(point, RESOLUTION));
      }
    }
    for (const cell of own) {
      if (!holdsLand(cell)) continue;
      counts.set(cell, (counts.get(cell) ?? 0) + 1);
    }
  }

  let max = 0;
  for (const count of counts.values()) if (count > max) max = count;

  // One path per cell. Merging cells of equal count into eight paths would be
  // smaller, but a person hovers a cell, not a shading band, so each cell needs
  // to be its own target.
  const cells = [...counts.entries()]
    .map(([cell, count]) => ({
      count,
      d: ringToPath(cellToBoundary(cell, { closedRing: true, segments: 1 })),
    }))
    .sort((a, b) => a.count - b.count); // Draw the busiest last.

  const payload = {
    resolution: RESOLUTION,
    max,
    width: VIEW_WIDTH,
    height: VIEW_HEIGHT,
    generated: index.generated,
    // Catalogs whose every bbox covers the world. They shade nothing, so the
    // page names them rather than letting them vanish.
    worldwide,
    cells,
  };
  const json = JSON.stringify(payload);

  const out = outPath(RESOLUTION);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, json, "utf8");

  console.log(
    `  cells       ${cells.length}` +
      `\n  counts      ${cells[0]?.count} to ${max}` +
      `\n  size        ${(json.length / 1024).toFixed(0)} KB` +
      `\n  gzipped     ${(gzipSync(json).length / 1024).toFixed(0)} KB` +
      `\n  wrote       ${out}`,
  );
}

async function main() {
  const index = JSON.parse(await readFile(BBOX_PATH, "utf8"));
  const mask = decodeMask(JSON.parse(await readFile(MASK_PATH, "utf8")));
  for (const resolution of RESOLUTIONS) {
    await bakeResolution(index, mask, resolution);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
