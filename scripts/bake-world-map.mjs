/*
 * bake-world-map.mjs — bake the hero glyph map terrain.
 *
 * Reads the glyphcss whole-world tile and writes a compact elevation grid to
 * public/data/world-relief.json. The hero renderer reads that file.
 *
 * Source of the tile:
 *   https://github.com/apresmoi/glyphcss
 *     website/public/data/flatmap/0/0_0.json
 *   MIT License, Copyright (c) 2025 Layoutit.
 *
 * Source of the elevations:
 *   NOAA ETOPO1 Global Relief Model. Public domain.
 *   https://www.ncei.noaa.gov/products/etopo-global-relief-model
 *
 * The tile ships three surfaces. This script keeps the solid one and drops
 * `coast` and `wire`, which the hero never renders. It then rewrites that
 * surface as a grid, because the tile stores every vertex coordinate as a
 * float even though the vertices sit on a regular 97 x 97 lattice. Storing the
 * 97 x and 97 y coordinates once, plus a flat elevation array and a flat band
 * array, is lossless. It costs about 7 KB over the wire instead of 134 KB.
 *
 * The `x` axis carries latitude at Mercator spacing. The `y` axis carries
 * longitude at linear spacing. A land fraction histogram confirms this. The
 * `x` axis holds one solid band of land, which is Antarctica. The `y` axis
 * holds none.
 *
 * Usage: node scripts/bake-world-map.mjs
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const TILE_URL =
  "https://raw.githubusercontent.com/apresmoi/glyphcss/HEAD" +
  "/website/public/data/flatmap/0/0_0.json";

const OUT = path.join("public", "data", "world-relief.json");
const CACHE = path.join(".cache", "glyphcss-flatmap-0-0_0.json");

/** Grid resolution. The tile is 96 quads on each axis, so 97 vertices. */
const N = 96;
const W = N + 1;

/** Round to 6 places so lattice coordinates compare exactly. */
const key = (v) => Math.round(v * 1e6) / 1e6;

async function loadTile() {
  if (existsSync(CACHE)) {
    console.log(`cache hit: ${CACHE}`);
    return JSON.parse(await readFile(CACHE, "utf8"));
  }
  console.log(`fetch: ${TILE_URL}`);
  const res = await fetch(TILE_URL);
  if (!res.ok) {
    throw new Error(`tile fetch failed: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  await mkdir(path.dirname(CACHE), { recursive: true });
  await writeFile(CACHE, text);
  return JSON.parse(text);
}

function bake(tile) {
  const { vertices, faces } = tile;

  const xs = [...new Set(vertices.map((v) => key(v[0])))].sort((a, b) => a - b);
  const ys = [...new Set(vertices.map((v) => key(v[1])))].sort((a, b) => a - b);
  if (xs.length !== W || ys.length !== W) {
    throw new Error(
      `expected a ${W} x ${W} lattice, got ${xs.length} x ${ys.length}`
    );
  }

  const xi = new Map(xs.map((v, i) => [v, i]));
  const yi = new Map(ys.map((v, i) => [v, i]));

  // Elevations, row-major over y then x.
  const z = new Array(W * W).fill(null);
  for (const v of vertices) {
    z[yi.get(key(v[1])) * W + xi.get(key(v[0]))] = Math.round(v[2] * 1e5) / 1e5;
  }

  // Band indices, row-major over y then x. A face is a quad, so its cell sits
  // at the minimum corner on each axis.
  const b = new Array(N * N).fill(null);
  for (const f of faces) {
    let cx = Infinity;
    let cy = Infinity;
    for (const i of f.v) {
      cx = Math.min(cx, xi.get(key(vertices[i][0])));
      cy = Math.min(cy, yi.get(key(vertices[i][1])));
    }
    b[cy * N + cx] = f.b;
  }

  const holesZ = z.filter((v) => v === null).length;
  const holesB = b.filter((v) => v === null).length;
  if (holesZ || holesB) {
    throw new Error(`grid has holes: ${holesZ} elevations, ${holesB} bands`);
  }

  return {
    _source:
      "NOAA ETOPO1 (public domain), via glyphcss (MIT, (c) 2025 Layoutit)",
    _axes: "x = latitude, Mercator spacing. y = longitude, linear spacing.",
    n: N,
    x: xs,
    y: ys,
    z,
    b,
  };
}

const tile = await loadTile();
const grid = bake(tile);

await mkdir(path.dirname(OUT), { recursive: true });
const json = JSON.stringify(grid);
await writeFile(OUT, json + "\n");

console.log(
  `wrote ${OUT}: ${grid.z.length} elevations, ${grid.b.length} bands, ` +
    `${json.length} bytes raw, ` +
    `${gzipSync(json, { level: 9 }).length} bytes gzip`
);
