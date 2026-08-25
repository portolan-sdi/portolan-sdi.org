/*
 * probe-land-cells.mjs — measure how much land the cells over a sea hold.
 *
 * Run it by hand, after bake-land-mask.mjs:
 *   node scripts/probe-land-cells.mjs 5
 *   node scripts/probe-land-cells.mjs 4 --box 31,-5,45,36
 *
 * bake-a5-coverage.mjs keeps a cell when any of its five vertices touches
 * land. That rule decides whether a sea reads as water on the map or fills in
 * and joins two coasts. This script reports, for every cell a sea touches, the
 * share of its area that holds land. Use it to choose a resolution, or to test
 * whether a land-area threshold would part two coasts.
 *
 * The default box is the Mediterranean, which set the resolution the site
 * ships. At resolution 4 a cell spans 364 km, wider than most of that sea, and
 * 46 of the 48 cells it touches do hold land. No threshold parts Europe from
 * Africa there. At resolution 5 a cell spans 182 km and the basin holds a core
 * of cells at zero.
 *
 * The script reads the land mask only. It does not read the baked cells, so it
 * runs at any resolution whether or not that resolution has been baked.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lonLatToCell, cellToBoundary, cellArea } from "a5-js";

const HERE = dirname(fileURLToPath(import.meta.url));
const MASK_PATH = resolve(HERE, "../public/data/land-mask.json");

/** south,west,north,east. The Mediterranean, plus its coasts. */
const DEFAULT_BOX = [31, -5, 45, 36];

/** How far apart the probe walks the box, in degrees. */
const WALK_STEP = 0.25;

/** Land-area shares to report a survivor count for. */
const THRESHOLDS = [0.1, 0.15, 0.2, 0.25, 0.3];

function parseArgs(argv) {
  const resolution = Number(argv[0] ?? 5);
  const boxFlag = argv.indexOf("--box");
  const box =
    boxFlag === -1
      ? DEFAULT_BOX
      : argv[boxFlag + 1].split(",").map((value) => Number(value.trim()));
  return { resolution, box };
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
  const col = Math.min(
    mask.width - 1,
    Math.max(0, Math.floor((wrapped + 180) / mask.step)),
  );
  const row = Math.min(
    mask.height - 1,
    Math.max(0, Math.floor((90 - lat) / mask.step)),
  );
  const index = row * mask.width + col;
  return (mask.bits[index >> 3] & (1 << (index & 7))) !== 0;
}

/**
 * Sample points across one cell: the centre, the ring, the edge midpoints, and
 * two rings of interior points. Twenty-one points for a pentagon, which is
 * enough to tell a coastal cell from a cell of open water.
 */
function samplePoints(cell) {
  const ring = cellToBoundary(cell, { closedRing: false });
  const count = ring.length;
  let cx = 0;
  let cy = 0;
  for (const [lng, lat] of ring) {
    cx += lng;
    cy += lat;
  }
  cx /= count;
  cy /= count;

  const points = [[cx, cy], ...ring];
  for (let i = 0; i < count; i++) {
    const [ax, ay] = ring[i];
    const [bx, by] = ring[(i + 1) % count];
    points.push([(ax + bx) / 2, (ay + by) / 2]);
    for (const t of [0.45, 0.75]) {
      points.push([cx + (ax - cx) * t, cy + (ay - cy) * t]);
    }
  }
  return points;
}

function landFraction(mask, cell) {
  const points = samplePoints(cell);
  let hits = 0;
  for (const [lng, lat] of points) {
    if (isLand(mask, lat, lng)) hits++;
  }
  return hits / points.length;
}

async function main() {
  const { resolution, box } = parseArgs(process.argv.slice(2));
  const [south, west, north, east] = box;
  const mask = decodeMask(JSON.parse(await readFile(MASK_PATH, "utf8")));

  // Every cell that any water point in the box falls into.
  const fractions = new Map();
  for (let lat = south; lat <= north; lat += WALK_STEP) {
    for (let lng = west; lng <= east; lng += WALK_STEP) {
      if (isLand(mask, lat, lng)) continue;
      const cell = lonLatToCell([lng, lat], resolution);
      if (!fractions.has(cell)) {
        fractions.set(cell, landFraction(mask, cell));
      }
    }
  }

  const shares = [...fractions.values()].sort((a, b) => a - b);
  const dry = shares.filter((share) => share === 0).length;

  console.log(
    `A5 resolution ${resolution}, ` +
      `${(Math.sqrt(cellArea(resolution)) / 1000).toFixed(0)} km across.`,
  );
  console.log(`  box          ${south},${west},${north},${east}`);
  console.log(`  cells        ${shares.length} touched by water`);
  console.log(`  open water   ${dry} hold no land at all`);
  for (const threshold of THRESHOLDS) {
    const kept = shares.filter((share) => share >= threshold).length;
    console.log(`  land >= ${threshold.toFixed(2)}  ${kept} survive`);
  }
}

await main();
