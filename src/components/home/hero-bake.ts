/**
 * Bake the world of the homepage hero figure from the land mask.
 *
 * The land does not change, so this runs before the build and not in the
 * browser. `scripts/bake-hero-world.mts` calls `bakeWorld` and writes the
 * result to `public/data/hero-world.json`. `hero-points.ts` reads that file.
 * A unit test bakes the world again and fails when the file is stale.
 */

import {
  LAT_SPAN,
  LAT_TOP,
  RING_UNIT,
  forEachLatticePoint,
  uOf,
  vOf,
  type BakedWorld,
  type RasterLevel,
} from "./hero-points";

const RAD = Math.PI / 180;

/** The run-length land mask written by scripts/bake-land-mask.mjs. */
export interface LandMaskFile {
  step: number;
  width: number;
  height: number;
  rle: number[][];
}

/** The decoded land mask, one byte per cell. */
export interface Land {
  mask: Uint8Array;
  w: number;
  h: number;
}

/* --- Land ---------------------------------------------------------------- */

/**
 * Decode the land mask at half resolution, one byte per cell.
 *
 * Each row holds run lengths that alternate ocean, land, ocean. The first
 * run is ocean and may be zero long. Half resolution is 0.2 degrees, which
 * is finer than anything the figure draws.
 */
export function decodeLand(file: LandMaskFile): Land {
  const w = file.width >> 1;
  const h = file.height >> 1;
  const mask = new Uint8Array(w * h);
  const row = new Uint8Array(file.width);
  for (let r = 0; r < h; r++) {
    let c = 0;
    let land = 0;
    for (const run of file.rle[r * 2]) {
      row.fill(land, c, c + run);
      c += run;
      land ^= 1;
    }
    const base = r * w;
    for (let x = 0; x < w; x++) mask[base + x] = row[x * 2];
  }
  return { mask, w, h };
}

function isLand(land: Land, lon: number, lat: number): boolean {
  const r = Math.floor(((90 - lat) / 180) * land.h);
  if (r < 0 || r >= land.h) return false;
  let c = Math.floor(((lon + 180) / 360) * land.w);
  c = ((c % land.w) + land.w) % land.w;
  return land.mask[r * land.w + c] === 1;
}

/**
 * The share of land in a box, from 0 to 1. The box runs east from `lonW` to
 * `lonE` and south from `latN` to `latS`, in degrees. It can cross the
 * antimeridian.
 */
type ShareFn = (lonW: number, lonE: number, latN: number, latS: number) => number;

/**
 * Build a summed-area table of the mask. A box query then reads at most
 * eight entries, whatever the size of the box. A mask cell that the box
 * touches counts in full.
 */
function shareTable(land: Land): ShareFn {
  const { mask, w, h } = land;
  const stride = w + 1;
  const sum = new Int32Array(stride * (h + 1));
  for (let r = 0; r < h; r++) {
    let row = 0;
    for (let c = 0; c < w; c++) {
      row += mask[r * w + c];
      sum[(r + 1) * stride + c + 1] = sum[r * stride + c + 1] + row;
    }
  }
  /** Land cells in rows `r0` to `r1` and columns `c0` to `c1`, ends excluded. */
  const rect = (r0: number, r1: number, c0: number, c1: number) =>
    sum[r1 * stride + c1] -
    sum[r0 * stride + c1] -
    sum[r1 * stride + c0] +
    sum[r0 * stride + c0];
  return (lonW, lonE, latN, latS) => {
    const r0 = Math.max(0, Math.floor(((90 - latN) / 180) * h));
    const r1 = Math.min(h, Math.ceil(((90 - latS) / 180) * h));
    if (r1 <= r0) return 0;
    let c0 = Math.floor(((lonW + 180) / 360) * w);
    let c1 = Math.max(c0 + 1, Math.ceil(((lonE + 180) / 360) * w));
    const shift = Math.floor(c0 / w) * w;
    c0 -= shift;
    c1 -= shift;
    if (c1 - c0 >= w) return rect(r0, r1, 0, w) / ((r1 - r0) * w);
    const hits =
      c1 <= w
        ? rect(r0, r1, c0, c1)
        : rect(r0, r1, c0, w) + rect(r0, r1, 0, c1 - w);
    return hits / ((r1 - r0) * (c1 - c0));
  };
}

/** The grid step of the outline contour, in degrees. */
const OUTLINE_STEP = 1.5;

/** A raster cell is land when land covers this share of it. */
const RASTER_SHARE = 0.44;

type Edge = "T" | "R" | "B" | "L";

/** The edges each marching squares case joins. Bits are TL, TR, BR, BL. */
const CASES: Array<Array<[Edge, Edge]>> = [
  [],
  [["L", "B"]],
  [["B", "R"]],
  [["L", "R"]],
  [["T", "R"]],
  [
    ["T", "L"],
    ["B", "R"],
  ],
  [["T", "B"]],
  [["T", "L"]],
  [["T", "L"]],
  [["T", "B"]],
  [
    ["T", "R"],
    ["L", "B"],
  ],
  [["T", "R"]],
  [["L", "R"]],
  [["B", "R"]],
  [["L", "B"]],
  [],
];

interface Segment {
  keys: [number, number];
  ends: [[number, number], [number, number]];
  used: boolean;
}

/**
 * Trace the land outlines.
 *
 * The land share on an OUTLINE_STEP grid is smoothed a little, then
 * contoured at one half with marching squares. The segments chain into
 * closed rings. The border of the grid is ocean, so every ring closes.
 */
function buildRings(share: ShareFn): Float32Array[] {
  const step = OUTLINE_STEP;
  const half = step / 2;
  const nx = 360 / step;
  const ny = LAT_SPAN / step;
  const w = nx + 1;
  const raw = new Float32Array(w * (ny + 1));
  for (let j = 1; j < ny; j++) {
    for (let i = 1; i < nx; i++) {
      const lon = -180 + i * step;
      const lat = LAT_TOP - j * step;
      raw[j * w + i] = share(lon - half, lon + half, lat + half, lat - half);
    }
  }
  const f = new Float32Array(raw.length);
  for (let j = 1; j < ny; j++) {
    for (let i = 1; i < nx; i++) {
      const k = j * w + i;
      f[k] = (raw[k] * 6 + raw[k - 1] + raw[k + 1] + raw[k - w] + raw[k + w]) / 10;
    }
  }

  const cross = (a: number, b: number) => (0.5 - a) / (b - a);
  const segments: Segment[] = [];
  const byKey = new Map<number, Segment[]>();
  // An edge key is unique per grid edge. Horizontal edges are even.
  const hKey = (i: number, j: number) => (j * w + i) * 2;
  const vKey = (i: number, j: number) => (j * w + i) * 2 + 1;

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const tl = f[j * w + i];
      const tr = f[j * w + i + 1];
      const bl = f[(j + 1) * w + i];
      const br = f[(j + 1) * w + i + 1];
      const index =
        (tl >= 0.5 ? 8 : 0) |
        (tr >= 0.5 ? 4 : 0) |
        (br >= 0.5 ? 2 : 0) |
        (bl >= 0.5 ? 1 : 0);
      // Most cells are all ocean or all land and have no edge.
      if (index === 0 || index === 15) continue;
      const edge = (e: Edge): [number, [number, number]] => {
        if (e === "T") return [hKey(i, j), [i + cross(tl, tr), j]];
        if (e === "B") return [hKey(i, j + 1), [i + cross(bl, br), j + 1]];
        if (e === "L") return [vKey(i, j), [i, j + cross(tl, bl)]];
        return [vKey(i + 1, j), [i + 1, j + cross(tr, br)]];
      };
      for (const [from, to] of CASES[index]) {
        const a = edge(from);
        const b = edge(to);
        const segment: Segment = {
          keys: [a[0], b[0]],
          ends: [a[1], b[1]],
          used: false,
        };
        segments.push(segment);
        for (const key of segment.keys) {
          const list = byKey.get(key);
          if (list) list.push(segment);
          else byKey.set(key, [segment]);
        }
      }
    }
  }

  const rings: Float32Array[] = [];
  for (const first of segments) {
    if (first.used) continue;
    first.used = true;
    const ring: number[] = [...first.ends[0], ...first.ends[1]];
    let key = first.keys[1];
    for (;;) {
      const next = byKey.get(key)?.find((s) => !s.used);
      if (!next) break;
      next.used = true;
      const far = next.keys[0] === key ? 1 : 0;
      ring.push(...next.ends[far]);
      key = next.keys[far];
    }
    // Drop specks of a cell or two.
    if (ring.length <= 10) continue;
    const out = new Float32Array(ring.length);
    for (let k = 0; k < ring.length; k += 2) {
      out[k] = ring[k] / nx;
      out[k + 1] = ring[k + 1] / ny;
    }
    rings.push(out);
  }
  return rings;
}

/** A landmass of this area or more shows on the full resolution raster. */
export const MIN_LANDMASS_KM2 = 5000;

/** The area of one mask cell at the equator, in square kilometers. */
function cellKm2(land: Land): number {
  const side = (180 / land.h) * 111.32;
  return side * side;
}

/** The landmasses of the mask, as one label per mask cell. */
export interface Landmasses {
  /** The landmass of each mask cell, or -1 for ocean. */
  label: Int32Array;
  /** 1 for each landmass of MIN_LANDMASS_KM2 or more. */
  large: Uint8Array;
}

/**
 * Label each landmass of the mask. Cells that touch at a side or a corner
 * are one landmass. The mask wraps at the antimeridian.
 */
export function landmasses(land: Land): Landmasses {
  const { mask, w, h } = land;
  const label = new Int32Array(w * h).fill(-1);
  const stack = new Int32Array(w * h);
  const equatorKm2 = cellKm2(land);
  const rowKm2 = new Float64Array(h);
  for (let r = 0; r < h; r++) {
    rowKm2[r] = equatorKm2 * Math.cos((90 - ((r + 0.5) * 180) / h) * RAD);
  }
  const large: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || label[start] >= 0) continue;
    const id = large.length;
    label[start] = id;
    stack[0] = start;
    let top = 1;
    let km2 = 0;
    while (top > 0) {
      const k = stack[--top];
      const r = (k / w) | 0;
      const c = k - r * w;
      km2 += rowKm2[r];
      for (let dr = -1; dr <= 1; dr++) {
        const nr = r + dr;
        if (nr < 0 || nr >= h) continue;
        for (let dc = -1; dc <= 1; dc++) {
          const n = nr * w + ((c + dc + w) % w);
          if (mask[n] && label[n] < 0) {
            label[n] = id;
            stack[top++] = n;
          }
        }
      }
    }
    large.push(km2 >= MIN_LANDMASS_KM2 ? 1 : 0);
  }
  return { label, large: Uint8Array.from(large) };
}

/**
 * Give each large landmass in the map window at least one land cell.
 *
 * The first pass finds the landmasses that touch a land cell already. The
 * second pass counts the mask cells of each other landmass per raster cell.
 * Each of those landmasses then gets the raster cell that holds the most of
 * it.
 */
function placeLandmasses(
  land: Land,
  masses: Landmasses,
  grid: Uint8Array,
  nx: number,
  ny: number,
): void {
  const { label, large } = masses;
  const { w, h } = land;
  const [r0, r1] = windowRows(land);
  const column = new Int32Array(w);
  for (let c = 0; c < w; c++) {
    column[c] = Math.min(nx - 1, Math.floor(((c + 0.5) / w) * nx));
  }
  const rowOf = (r: number) =>
    Math.min(ny - 1, Math.floor(vOf(90 - ((r + 0.5) * 180) / h) * ny)) * nx;
  const covered = new Uint8Array(large.length);
  for (let r = r0; r < r1; r++) {
    const row = rowOf(r);
    for (let c = 0; c < w; c++) {
      const id = label[r * w + c];
      if (id >= 0 && large[id] && grid[row + column[c]]) covered[id] = 1;
    }
  }
  const counts = new Map<number, Map<number, number>>();
  for (let r = r0; r < r1; r++) {
    const row = rowOf(r);
    for (let c = 0; c < w; c++) {
      const id = label[r * w + c];
      if (id < 0 || !large[id] || covered[id]) continue;
      let byCell = counts.get(id);
      if (!byCell) {
        byCell = new Map();
        counts.set(id, byCell);
      }
      const cell = row + column[c];
      byCell.set(cell, (byCell.get(cell) ?? 0) + 1);
    }
  }
  for (const byCell of counts.values()) {
    let best = -1;
    let most = 0;
    for (const [cell, count] of byCell) {
      if (count > most) {
        most = count;
        best = cell;
      }
    }
    grid[best] = 1;
  }
}

/**
 * Sample the land into a raster of `nx` columns over the map window.
 *
 * A cell is land when land covers RASTER_SHARE of it. A cell spans several
 * degrees, so that rule drops islands such as New Zealand and Java. When
 * `masses` is given, each large landmass that has no land cell yet gets the
 * cell that holds the most of it.
 */
function buildLevel(
  share: ShareFn,
  nx: number,
  masses?: { land: Land; found: Landmasses },
): RasterLevel {
  const ny = (nx * LAT_SPAN) / 360;
  const grid = new Uint8Array(nx * ny);
  const cellLon = 360 / nx;
  const cellLat = LAT_SPAN / ny;
  for (let r = 0; r < ny; r++) {
    const latN = LAT_TOP - r * cellLat;
    for (let c = 0; c < nx; c++) {
      const lonW = -180 + c * cellLon;
      const cell = share(lonW, lonW + cellLon, latN, latN - cellLat);
      grid[r * nx + c] = cell >= RASTER_SHARE ? 1 : 0;
    }
  }

  if (masses) placeLandmasses(masses.land, masses.found, grid, nx, ny);

  const runs: Array<[number, number, number]> = [];
  for (let r = 0; r < ny; r++) {
    let start = -1;
    for (let c = 0; c <= nx; c++) {
      const cell = c < nx && grid[r * nx + c] === 1;
      if (cell && start < 0) start = c;
      if (!cell && start >= 0) {
        runs.push([start, r, c - start]);
        start = -1;
      }
    }
  }
  return { nx, ny, runs };
}

/** The mask rows inside the map window, from `LAT_TOP` to `LAT_TOP - LAT_SPAN`. */
function windowRows(land: Land): [number, number] {
  return [
    Math.max(0, Math.ceil(((90 - LAT_TOP) / 180) * land.h)),
    Math.min(land.h, Math.floor(((90 - LAT_TOP + LAT_SPAN) / 180) * land.h)),
  ];
}

/**
 * Test a place in the map window against all rings with the even-odd rule,
 * so a lake ring inside a land ring counts as water.
 */
export function insideRings(rings: Float32Array[], u: number, v: number): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let a = 0, b = ring.length - 2; a < ring.length; b = a, a += 2) {
      const ua = ring[a];
      const va = ring[a + 1];
      const ub = ring[b];
      const vb = ring[b + 1];
      if (va > v !== vb > v && u < ((ub - ua) * (v - va)) / (vb - va) + ua) {
        inside = !inside;
      }
    }
  }
  return inside;
}

/**
 * Add a marker ring for each large landmass that the contour drops.
 *
 * The contour drops an island that never fills half of an outline cell, such
 * as Isabela in the Galapagos. The marker is a diamond at the center of the
 * landmass, with the width of a square of the same area, and at least a third
 * of an outline cell. A landmass on the antimeridian, such as Wrangel Island,
 * is skipped, because the flat map cuts it into two slivers. A landmass that
 * stays inside the border cells of the outline grid is skipped too.
 */
function addMarkers(rings: Float32Array[], land: Land, found: Landmasses): void {
  const { label, large } = found;
  const { w, h } = land;
  const [r0, r1] = windowRows(land);
  const edge = Math.ceil((OUTLINE_STEP / 360) * w);
  const equatorKm2 = cellKm2(land);
  type Sum = {
    n: number;
    km2: number;
    u: number;
    v: number;
    west: boolean;
    east: boolean;
    /** Up to SAMPLES places of the landmass, as `u, v` pairs. */
    sample: number[];
    stride: number;
  };
  const SAMPLES = 256;
  const sums = new Map<number, Sum>();
  for (let r = r0; r < r1; r++) {
    const lat = 90 - ((r + 0.5) * 180) / h;
    const inner = Math.abs(lat - LAT_TOP) > OUTLINE_STEP &&
      Math.abs(lat - (LAT_TOP - LAT_SPAN)) > OUTLINE_STEP;
    const km2 = equatorKm2 * Math.cos(lat * RAD);
    for (let c = 0; c < w; c++) {
      const id = label[r * w + c];
      if (id < 0 || !large[id]) continue;
      let sum = sums.get(id);
      if (!sum) {
        sum = {
          n: 0,
          km2: 0,
          u: 0,
          v: 0,
          west: false,
          east: false,
          sample: [],
          stride: 1,
        };
        sums.set(id, sum);
      }
      if (c < edge) sum.west = true;
      if (c >= w - edge) sum.east = true;
      if (!inner || c < edge || c >= w - edge) continue;
      const u = uOf(((c + 0.5) * 360) / w - 180);
      const v = vOf(lat);
      sum.km2 += km2;
      sum.u += u;
      sum.v += v;
      // Keep every `stride`th place. When the sample is full, keep every
      // second place and double the stride.
      if (sum.n % sum.stride === 0) {
        if (sum.sample.length === SAMPLES * 2) {
          sum.sample = sum.sample.filter((_, i) => i % 4 < 2);
          sum.stride *= 2;
        }
        if (sum.n % sum.stride === 0) sum.sample.push(u, v);
      }
      sum.n++;
    }
  }
  const markers: Float32Array[] = [];
  for (const sum of sums.values()) {
    if (sum.n === 0 || (sum.west && sum.east)) continue;
    let outlined = false;
    for (let i = 0; i < sum.sample.length && !outlined; i += 2) {
      outlined = insideRings(rings, sum.sample[i], sum.sample[i + 1]);
    }
    if (outlined) continue;
    const u = sum.u / sum.n;
    const v = sum.v / sum.n;
    const lat = LAT_TOP - v * LAT_SPAN;
    const halfDeg = Math.max(
      OUTLINE_STEP / 6,
      Math.sqrt(sum.km2) / 111.32 / 2,
    );
    const du = halfDeg / Math.max(Math.cos(lat * RAD), 0.1) / 360;
    const dv = halfDeg / LAT_SPAN;
    markers.push(
      Float32Array.from([u, v - dv, u + du, v, u, v + dv, u - du, v, u, v - dv]),
    );
  }
  rings.push(...markers);
}

/**
 * Lattice points over the whole sphere. About three in ten fall on land. The
 * spacing is about 1 degree, so an island the size of Java or Iceland gets
 * more than ten points.
 */
export const LATTICE = 40000;

/**
 * A lattice point is land when land covers this share of the cell around it.
 * A test of the center alone misses narrow islands, such as Fiji and the
 * Lesser Sunda Islands.
 */
const LAND_SHARE = 0.1;

/**
 * Derive everything the figure draws from the land mask.
 *
 * A lattice point is land when its center is land or when land covers
 * LAND_SHARE of its cell. The outlines and the raster cover the map window.
 */
export function bakeWorld(land: Land): BakedWorld {
  const share = shareTable(land);
  const runs: number[] = [];
  let run = 0;
  let current = 0;
  forEachLatticePoint(LATTICE, (lon, lat, _ring, lonHalf, latHalf) => {
    const point =
      isLand(land, lon, lat) ||
      share(lon - lonHalf, lon + lonHalf, lat + latHalf, lat - latHalf) >=
        LAND_SHARE
        ? 1
        : 0;
    if (point !== current) {
      runs.push(run);
      run = 0;
      current = point;
    }
    run++;
  });
  runs.push(run);
  const found = landmasses(land);
  const rings = buildRings(share);
  addMarkers(rings, land, found);
  return {
    lattice: LATTICE,
    land: runs,
    rings: rings.map((ring) =>
      Array.from(ring, (value) => Math.round(value * RING_UNIT)),
    ),
    // Only the full resolution keeps every landmass. The overviews drop
    // small ones, as an overview does.
    levels: [
      buildLevel(share, 64, { land, found }),
      buildLevel(share, 32),
      buildLevel(share, 16),
    ],
  };
}
