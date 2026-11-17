/**
 * Pure math for the homepage hero figure.
 *
 * The figure is one cloud of points with two homes. In the map state the
 * points draw the world's land. In the files state the same points fill the
 * blocks of a file listing in a storage bucket. This module samples the
 * points, lays out both states, pairs each map point with a file slot, and
 * computes a frame. It touches no DOM, so a test harness can run it alone.
 */

/** The run-length land mask written by scripts/bake-land-mask.mjs. */
export interface LandMaskFile {
  step: number;
  width: number;
  height: number;
  rle: number[][];
}

/** The elevation grid written by scripts/bake-world-map.mjs. */
export interface ReliefFile {
  n: number;
  x: number[];
  y: number[];
  z: number[];
}

/** Decoded inputs. Build this once and reuse it for every layout. */
export interface World {
  mask: Uint8Array;
  maskW: number;
  maskH: number;
  relief: ReliefFile;
}

export interface Label {
  /** Stable key for the renderer. */
  id: string;
  x: number;
  y: number;
  name: string;
  /** The format the file is written in. Empty when the name says enough. */
  note: string;
  /** True when the note sits on its own line under the name. */
  stacked: boolean;
  /** True for the bucket address at the head of the listing. */
  head: boolean;
}

export interface Scene {
  width: number;
  height: number;
  count: number;
  /** Map position, in CSS pixels. */
  ax: Float32Array;
  ay: Float32Array;
  /** File position, in CSS pixels. */
  bx: Float32Array;
  by: Float32Array;
  /** When a point leaves, from 0 for the first to 1 for the last. */
  delay: Float32Array;
  /** Sideways swing of the flight path, as a share of its length. */
  bend: Float32Array;
  sizeA: Float32Array;
  sizeB: Float32Array;
  /** Indexes into the palette from `buildPalette`. */
  toneA: Uint8Array;
  toneB: Uint8Array;
  labels: Label[];
  /** Label font size in CSS pixels, 11 or 13. */
  fontPx: number;
  /** The rule under the bucket address. */
  rule: { x: number; y: number; w: number };
}

/* --- Timeline ------------------------------------------------------------ */

export const HOLD_MAP = 4;
export const MORPH = 2.8;
export const HOLD_FILES = 4.8;
export const LOOP = HOLD_MAP + MORPH + HOLD_FILES + MORPH;

/** Share of a morph spent waiting for the last point to leave. */
export const STAGGER = 0.5;

/** Seconds the labels take to fade out before the points leave the files. */
const LABEL_OUT = 0.45;

/**
 * Where the loop stands at a given time.
 *
 * `morph` runs from 0 on the map to 1 on the files. `label` is the opacity
 * of the file labels. They fade in while the last points settle and fade out
 * before the first point leaves.
 */
export function timeline(seconds: number): { morph: number; label: number } {
  const t = ((seconds % LOOP) + LOOP) % LOOP;
  const filesAt = HOLD_MAP + MORPH;
  const leaveAt = filesAt + HOLD_FILES;
  if (t < HOLD_MAP) return { morph: 0, label: 0 };
  if (t < filesAt) {
    const m = (t - HOLD_MAP) / MORPH;
    return { morph: m, label: clamp01((m - 0.74) / 0.26) };
  }
  if (t < leaveAt) {
    return { morph: 1, label: clamp01((leaveAt - t) / LABEL_OUT) };
  }
  return { morph: 1 - (t - leaveAt) / MORPH, label: 0 };
}

/** Eased progress of one point. The GLSL in hero-figure.tsx mirrors this. */
export function pointEase(morph: number, delay: number): number {
  const local = clamp01((morph - delay * STAGGER) / (1 - STAGGER));
  return local * local * local * (local * (local * 6 - 15) + 10);
}

/* --- Palette ------------------------------------------------------------- */

export type Rgb = [number, number, number];

export interface PaletteInput {
  bg: Rgb;
  primary: Rgb;
  primaryInk: Rgb;
  ink: Rgb;
}

/** Number of steps in the map ramp. The file tones follow it. */
export const RAMP = 64;
export const TONE_INK = RAMP;
export const TONE_PRIMARY = RAMP + 1;
export const TONE_PRIMARY_INK = RAMP + 2;
export const TONE_PRIMARY_SOFT = RAMP + 3;
export const PALETTE_SIZE = RAMP + 4;

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Build the palette as RGB bytes, three per entry.
 *
 * The map ramp runs from a pale blue wash through the brand blue to a blue
 * ink. Every stop is a mix of the brand tokens, so the figure stays in the
 * one blue family.
 */
export function buildPalette(input: PaletteInput): Uint8Array {
  const stops: Array<[number, Rgb]> = [
    [0, mix(input.bg, input.primary, 0.34)],
    [0.3, mix(input.bg, input.primary, 0.7)],
    [0.55, input.primary],
    [0.78, input.primaryInk],
    [1, mix(input.primaryInk, input.ink, 0.72)],
  ];
  const out = new Uint8Array(PALETTE_SIZE * 3);
  const put = (i: number, c: Rgb) => {
    out[i * 3] = Math.round(c[0]);
    out[i * 3 + 1] = Math.round(c[1]);
    out[i * 3 + 2] = Math.round(c[2]);
  };
  for (let i = 0; i < RAMP; i++) {
    const v = i / (RAMP - 1);
    let k = 0;
    while (k < stops.length - 2 && v > stops[k + 1][0]) k++;
    const [v0, c0] = stops[k];
    const [v1, c1] = stops[k + 1];
    put(i, mix(c0, c1, clamp01((v - v0) / (v1 - v0))));
  }
  put(TONE_INK, input.ink);
  put(TONE_PRIMARY, input.primary);
  put(TONE_PRIMARY_INK, input.primaryInk);
  put(TONE_PRIMARY_SOFT, mix(input.bg, input.primary, 0.72));
  return out;
}

/* --- Inputs -------------------------------------------------------------- */

/**
 * Decode the land mask at half resolution, one byte per cell.
 *
 * Each row holds run lengths that alternate ocean, land, ocean. The first
 * run is ocean and may be zero long. Half resolution is 0.2 degrees, which
 * is finer than one point at any size the figure draws.
 */
export function decodeWorld(mask: LandMaskFile, relief: ReliefFile): World {
  const maskW = mask.width >> 1;
  const maskH = mask.height >> 1;
  const out = new Uint8Array(maskW * maskH);
  const row = new Uint8Array(mask.width);
  for (let r = 0; r < maskH; r++) {
    const runs = mask.rle[r * 2];
    let c = 0;
    let land = 0;
    for (const run of runs) {
      if (land) row.fill(1, c, c + run);
      else row.fill(0, c, c + run);
      c += run;
      land ^= 1;
    }
    const base = r * maskW;
    for (let x = 0; x < maskW; x++) out[base + x] = row[x * 2];
  }
  return { mask: out, maskW, maskH, relief };
}

const RAD = Math.PI / 180;

function isLand(world: World, lon: number, lat: number): boolean {
  let c = Math.floor(((lon + 180) / 360) * world.maskW);
  const r = Math.floor(((90 - lat) / 180) * world.maskH);
  if (r < 0 || r >= world.maskH) return false;
  c = ((c % world.maskW) + world.maskW) % world.maskW;
  return world.mask[r * world.maskW + c] === 1;
}

/** Bilinear elevation. The grid spaces latitude on a Mercator axis. */
function elevation(world: World, lon: number, lat: number): number {
  const { n, x, z } = world.relief;
  const w = n + 1;
  const clamped = Math.max(-84.9, Math.min(84.9, lat)) * RAD;
  // The grid's latitude axis runs from north at -1 to south at 1.
  const my = -Math.log(Math.tan(Math.PI / 4 + clamped / 2)) / Math.PI;
  let lo = 0;
  let hi = n;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (x[mid] <= my) lo = mid;
    else hi = mid;
  }
  const fx = clamp01((my - x[lo]) / (x[hi] - x[lo]));
  const gy = clamp01((lon + 180) / 360) * n;
  const j = Math.min(n - 1, Math.floor(gy));
  const fy = gy - j;
  const a = z[j * w + lo];
  const b = z[j * w + hi];
  const c = z[(j + 1) * w + lo];
  const d = z[(j + 1) * w + hi];
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}

/* --- Projection ---------------------------------------------------------- */

// Equal Earth, after Savric, Patterson, and Jenny (2018).
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

function eeY(lat: number): number {
  const t = Math.asin(M * Math.sin(lat * RAD));
  const t2 = t * t;
  const t6 = t2 * t2 * t2;
  return t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
}

/** Invert Equal Earth. Returns false for a point off the globe. */
function eeInverse(px: number, py: number, out: Float64Array): boolean {
  let t = py;
  for (let i = 0; i < 8; i++) {
    const t2 = t * t;
    const t6 = t2 * t2 * t2;
    const f = t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)) - py;
    const df = A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2);
    const step = f / df;
    t -= step;
    if (Math.abs(step) < 1e-9) break;
  }
  const s = Math.sin(t) / M;
  if (s < -1 || s > 1) return false;
  const t2 = t * t;
  const t6 = t2 * t2 * t2;
  const lon =
    (M * px * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))) / Math.cos(t);
  if (lon < -Math.PI || lon > Math.PI) return false;
  out[0] = lon / RAD;
  out[1] = Math.asin(s) / RAD;
  return true;
}

// The map leaves out Antarctica and the empty sea north of the land.
const LAT_TOP = 84;
const LAT_BOTTOM = -57;
const EE_HALF_W = 2.7066;
const EE_TOP = eeY(LAT_TOP);
const EE_BOTTOM = eeY(LAT_BOTTOM);

/* --- Small helpers ------------------------------------------------------- */

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Seeded generator, so every build draws the same cloud. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(ix: number, iy: number): number {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in 0 to 1. */
function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
}

/** Position of a cell along a Hilbert curve of the given order. */
function hilbert(order: number, x: number, y: number): number {
  let d = 0;
  for (let s = 1 << (order - 1); s > 0; s >>= 1) {
    const rx = (x & s) > 0 ? 1 : 0;
    const ry = (y & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      const t = x;
      x = y;
      y = t;
    }
  }
  return d;
}

/* --- Point budget -------------------------------------------------------- */

/** How much the device can draw. `canvas` is the Canvas 2D fallback. */
export type Tier = "full" | "low" | "canvas";

const TIER_CAP: Record<Tier, number> = {
  full: 60000,
  low: 30000,
  canvas: 14000,
};

/**
 * How many points to draw for a canvas of the given CSS size.
 *
 * The count follows the canvas area, so the cloud keeps one density from a
 * phone to a wide desktop. Each tier caps the count at what it can move at
 * 60 frames a second.
 */
export function pointBudget(width: number, height: number, tier: Tier): number {
  const byArea = Math.round(width * Math.min(height, width * 0.62) * 0.13);
  return Math.max(10000, Math.min(TIER_CAP[tier], byArea));
}

/* --- File layout --------------------------------------------------------- */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Fixed tone, or -1 to keep the tone the point has on the map. */
  tone: number;
}

interface FileBlock {
  rects: Rect[];
}

interface FilesLayout {
  files: FileBlock[];
  labels: Label[];
  fontPx: number;
  rule: { x: number; y: number; w: number };
}

const FILES = [
  { id: "catalog", name: "catalog.json", note: "STAC" },
  { id: "readme", name: "README.md", note: "" },
  { id: "agents", name: "AGENTS.md", note: "" },
  { id: "parquet", name: "parcels/parcels.parquet", note: "GeoParquet" },
  { id: "pmtiles", name: "parcels/parcels.pmtiles", note: "PMTiles" },
  { id: "tif", name: "orthophoto/2025.tif", note: "COG" },
] as const;

const BUCKET = "s3://your-bucket/";

/**
 * A Parquet file is a stack of row groups with a footer after them.
 * The bands are the row groups. The thin block at the end is the footer.
 */
function parquetRects(x: number, y: number, w: number, h: number): Rect[] {
  const gap = 3;
  const bands = h >= 64 ? 4 : 3;
  const footer = Math.max(5, Math.round(w * 0.018));
  const bandW = w - footer - gap;
  const bandH = (h - gap * (bands - 1)) / bands;
  const rects: Rect[] = [];
  for (let i = 0; i < bands; i++) {
    rects.push({
      x,
      y: y + i * (bandH + gap),
      w: bandW,
      h: bandH,
      tone: TONE_PRIMARY,
    });
  }
  rects.push({ x: x + bandW + gap, y, w: footer, h, tone: TONE_PRIMARY_INK });
  return rects;
}

/**
 * A PMTiles archive is a tile pyramid. Each square is one zoom level, cut
 * into the tiles that level holds: 1, then 4, then 16, and so on.
 */
function pmtilesRects(x: number, y: number, w: number, h: number): Rect[] {
  const gap = Math.max(6, Math.round(h * 0.12));
  const rects: Rect[] = [];
  let left = x;
  for (let z = 0; z < 5; z++) {
    const cells = 1 << z;
    const seam = z === 0 ? 0 : 1.6;
    const cell = (h - seam * (cells - 1)) / cells;
    if (cell < 5.5 || left + h > x + w + 0.5) break;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        rects.push({
          x: left + c * (cell + seam),
          y: y + r * (cell + seam),
          w: cell,
          h: cell,
          tone: TONE_PRIMARY_INK,
        });
      }
    }
    left += h + gap;
  }
  return rects;
}

/**
 * A COG is a raster with its overviews. The wide block is the full image.
 * Each block after it is the same image at half the size of the last.
 * The points keep their map tone here, so the raster reads as imagery.
 */
function cogRects(x: number, y: number, w: number, h: number): Rect[] {
  const gap = Math.max(6, Math.round(h * 0.08));
  const full = Math.min((w - gap * 3) / 1.875, h * 3.1);
  const rects: Rect[] = [];
  let left = x;
  for (let level = 0; level < 4; level++) {
    const scale = 1 / (1 << level);
    if (h * scale < 5) break;
    rects.push({ x: left, y, w: full * scale, h: h * scale, tone: -1 });
    left += full * scale + gap;
  }
  return rects;
}

/**
 * Lay out the listing for a canvas of the given CSS size.
 *
 * A wide canvas runs two columns, names on the left and blocks on the right.
 * A narrow canvas stacks each data file's name over its block, so the names
 * keep a readable size on a phone.
 */
function layoutFiles(width: number, height: number): FilesLayout {
  const wide = width >= 600;
  const fontPx = wide ? 13 : 11;
  const ch = fontPx * 0.6;
  const line = Math.round(fontPx * 1.5);
  const pad = Math.max(12, Math.min(28, Math.round(width * 0.052)));
  const x0 = pad;
  const right = width - pad;

  const headH = line + 12;
  const smallH = line + (wide ? 6 : 3);
  const rowGap = wide ? 18 : 9;
  const labelH = wide ? 0 : line + 2;

  // The three data files share the height the head and text files leave.
  const fixed = headH + smallH * 3 + rowGap * 3 + labelH * 3;
  const maxBody = wide ? width * 0.42 : width * 0.62;
  const body = Math.max(60, Math.min(height - pad * 2 - fixed, maxBody));
  const shares = [0.25, 0.3, 0.45];
  const top = Math.max(pad, Math.round((height - fixed - body) / 2));

  const labels: Label[] = [];
  const files: FileBlock[] = [];
  let y = top;

  labels.push({
    id: "bucket",
    x: x0,
    y,
    name: BUCKET,
    note: "",
    stacked: false,
    head: true,
  });
  const rule = { x: x0, y: y + line + 4, w: right - x0 };
  y += headH;

  const blockX = wide ? x0 + Math.round(ch * 25) : x0;
  const blockW = right - blockX;
  const sliverX = wide ? blockX : x0 + Math.round(ch * 19);
  const sliverH = Math.max(5, Math.round(fontPx * 0.5));
  const sliverW = [34, 22, 14];

  for (let i = 0; i < 3; i++) {
    const file = FILES[i];
    labels.push({
      id: file.id,
      x: x0,
      y,
      name: file.name,
      note: file.note,
      stacked: false,
      head: false,
    });
    files.push({
      rects: [
        {
          x: sliverX,
          y: y + (line - sliverH) / 2,
          w: sliverW[i],
          h: sliverH,
          tone: TONE_INK,
        },
      ],
    });
    y += smallH;
  }
  y += rowGap - (wide ? 6 : 3);

  const makers = [parquetRects, pmtilesRects, cogRects];
  for (let i = 0; i < 3; i++) {
    const file = FILES[i + 3];
    const h = Math.round(body * shares[i]);
    labels.push({
      id: file.id,
      x: x0,
      y,
      name: file.name,
      note: file.note,
      stacked: wide,
      head: false,
    });
    y += labelH;
    const w = i === 0 ? blockW * (wide ? 0.82 : 0.9) : blockW;
    files.push({ rects: makers[i](blockX, y, w, h) });
    y += h + rowGap;
  }

  return { files, labels, fontPx, rule };
}

/** Lattice size of a block at a given dot pitch. */
function latticeOf(rect: Rect, pitch: number): [number, number] {
  return [
    Math.max(1, Math.round(rect.w / pitch)),
    Math.max(1, Math.round(rect.h / pitch)),
  ];
}

function capacityAt(layout: FilesLayout, pitch: number): number {
  let total = 0;
  for (const file of layout.files) {
    for (const rect of file.rects) {
      const [cols, rows] = latticeOf(rect, pitch);
      total += cols * rows;
    }
  }
  return total;
}

/* --- Scene --------------------------------------------------------------- */

/**
 * Build both states for a canvas of the given CSS size.
 *
 * The pairing keeps motion coherent. Points are ordered along a Hilbert
 * curve over the map, so each file takes one compact region of the world.
 * Inside a file the slots follow a second curve over the block, and the two
 * orders are matched one to one. Points that start as neighbours end as
 * neighbours, so a region travels as one stream.
 */
export function buildScene(
  world: World,
  width: number,
  height: number,
  budget: number,
): Scene {
  const rand = mulberry32(0x504f5254);
  const layout = layoutFiles(width, height);

  // Probe the projection on a coarse grid. The probe finds the box the
  // land fills and the share of that box that is land.
  const lonLat = new Float64Array(2);
  const PROBE_W = 200;
  const PROBE_H = 90;
  const probeX = (2 * EE_HALF_W) / PROBE_W;
  const probeY = (EE_TOP - EE_BOTTOM) / PROBE_H;
  let west = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  let south = Infinity;
  let hits = 0;
  for (let r = 0; r < PROBE_H; r++) {
    for (let c = 0; c < PROBE_W; c++) {
      const px = (c + 0.5) * probeX - EE_HALF_W;
      const py = EE_TOP - (r + 0.5) * probeY;
      if (eeInverse(px, py, lonLat) && isLand(world, lonLat[0], lonLat[1])) {
        hits++;
        west = Math.min(west, px);
        east = Math.max(east, px);
        north = Math.max(north, py);
        south = Math.min(south, py);
      }
    }
  }
  west -= probeX;
  east += probeX;
  north += probeY;
  south -= probeY;
  const aspect = (east - west) / (north - south);

  // Fit that box inside the canvas with a small margin. Cropping to the
  // land draws the continents larger than the whole projection would.
  const padX = Math.max(8, Math.round(width * 0.025));
  const padY = Math.max(8, Math.round(height * 0.03));
  const mapW = Math.min(width - padX * 2, (height - padY * 2) * aspect);
  const mapH = mapW / aspect;
  const mapX = (width - mapW) / 2;
  const mapY = (height - mapH) / 2;
  const unit = mapW / (east - west);

  // Size the sampling grid so the land holds a little over the budget.
  const landArea = hits * probeX * probeY * unit * unit;
  const cell = Math.sqrt(landArea / (budget * 1.05));

  // A jittered grid spreads the points evenly without a visible lattice.
  const cols = Math.ceil(mapW / cell);
  const rows = Math.ceil(mapH / cell);
  const sx: number[] = [];
  const sy: number[] = [];
  const slon: number[] = [];
  const slat: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5 + (rand() - 0.5) * 0.92) * cell;
      const y = (r + 0.5 + (rand() - 0.5) * 0.92) * cell;
      const px = west + x / unit;
      const py = north - y / unit;
      if (!eeInverse(px, py, lonLat)) continue;
      if (!isLand(world, lonLat[0], lonLat[1])) continue;
      sx.push(mapX + x);
      sy.push(mapY + y);
      slon.push(lonLat[0]);
      slat.push(lonLat[1]);
    }
  }
  const sampled = sx.length;

  // Pick the dot pitch that fills the blocks with the points on hand.
  let pitch = 6;
  while (pitch > 0.9 && capacityAt(layout, pitch * 0.995) <= sampled) {
    pitch *= 0.995;
  }
  const count = Math.min(sampled, capacityAt(layout, pitch));

  // Drop the surplus points evenly, so no region thins out.
  const keep = new Uint8Array(sampled).fill(1);
  const surplus = sampled - count;
  if (surplus > 0) {
    const stride = sampled / surplus;
    for (let k = 0; k < surplus; k++) {
      keep[Math.min(sampled - 1, Math.floor((k + rand()) * stride))] = 0;
    }
  }
  const order: number[] = [];
  for (let i = 0; i < sampled; i++) if (keep[i]) order.push(i);

  // Order the map points along a Hilbert curve.
  const ORDER = 9;
  const side = 1 << ORDER;
  const span = Math.max(mapW, mapH);
  const key = new Float64Array(sampled);
  for (const i of order) {
    const hx = Math.min(side - 1, Math.floor(((sx[i] - mapX) / span) * side));
    const hy = Math.min(side - 1, Math.floor(((sy[i] - mapY) / span) * side));
    key[i] = hilbert(ORDER, hx, hy);
  }
  order.sort((a, b) => key[a] - key[b]);

  const scene: Scene = {
    width,
    height,
    count,
    ax: new Float32Array(count),
    ay: new Float32Array(count),
    bx: new Float32Array(count),
    by: new Float32Array(count),
    delay: new Float32Array(count),
    bend: new Float32Array(count),
    sizeA: new Float32Array(count),
    sizeB: new Float32Array(count),
    toneA: new Uint8Array(count),
    toneB: new Uint8Array(count),
    labels: layout.labels,
    fontPx: layout.fontPx,
    rule: layout.rule,
  };

  // Collect every slot, file by file.
  const dotB = Math.max(1, Math.min(1.9, pitch * 0.62));
  let cursor = 0;
  let out = 0;
  for (const file of layout.files) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const rect of file.rects) {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.w);
      maxY = Math.max(maxY, rect.y + rect.h);
    }
    const reach = Math.max(maxX - minX, maxY - minY, 1);

    const slots: Array<{ x: number; y: number; tone: number; k: number }> = [];
    for (const rect of file.rects) {
      const [lc, lr] = latticeOf(rect, pitch);
      const stepX = rect.w / lc;
      const stepY = rect.h / lr;
      for (let r = 0; r < lr; r++) {
        for (let c = 0; c < lc; c++) {
          const x = rect.x + (c + 0.5) * stepX;
          const y = rect.y + (r + 0.5) * stepY;
          const hx = Math.min(side - 1, Math.floor(((x - minX) / reach) * side));
          const hy = Math.min(side - 1, Math.floor(((y - minY) / reach) * side));
          slots.push({ x, y, tone: rect.tone, k: hilbert(ORDER, hx, hy) });
        }
      }
    }
    slots.sort((a, b) => a.k - b.k);

    for (const slot of slots) {
      if (out >= count || cursor >= order.length) break;
      const i = order[cursor++];
      const lon = slon[i];
      const lat = slat[i];

      // Tone on the map: height, a north-west light, and a little grain.
      const z = elevation(world, lon, lat);
      // Greenland's ice sheet is high ground. Hold it pale, as ice.
      const ice = lat > 58 && lon > -75 && lon < -10 ? 0.3 : 1;
      const high = Math.pow(clamp01(z / 0.042), 0.6) * ice;
      const dzx =
        elevation(world, lon + 2.5, lat) - elevation(world, lon - 2.5, lat);
      const dzy =
        elevation(world, lon, lat + 2.5) - elevation(world, lon, lat - 2.5);
      const shade = Math.max(-1, Math.min(1, (dzx - dzy) * 60 * ice));
      const grain =
        valueNoise(lon * 0.09, lat * 0.09) * 0.45 +
        valueNoise(lon * 0.31 + 40, lat * 0.31) * 0.55;

      // Count the land around the point. A low count marks a coast.
      let near = 0;
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2;
        if (isLand(world, lon + Math.cos(ang) * 1.6, lat + Math.sin(ang) * 1.2)) {
          near++;
        }
      }
      const inland = near / 8;

      const tone = clamp01(
        0.1 +
          high * 0.56 +
          shade * 0.3 +
          (grain - 0.5) * 0.22 +
          inland * 0.16 +
          (rand() - 0.5) * 0.22,
      );
      const toneA = Math.round(tone * (RAMP - 1));

      scene.ax[out] = sx[i];
      scene.ay[out] = sy[i];
      scene.bx[out] = slot.x;
      scene.by[out] = slot.y;
      scene.toneA[out] = toneA;
      scene.toneB[out] = slot.tone < 0 ? toneA : slot.tone;
      scene.sizeA[out] = 1.1 + tone * 0.6 + rand() * 0.5;
      scene.sizeB[out] = dotB;

      // The west leaves first, so the change crosses the map as a wave.
      const across = (sx[i] - mapX) / mapW;
      scene.delay[out] = clamp01(across * 0.6 + rand() * 0.4);
      scene.bend[out] = 0.22 + (rand() - 0.5) * 0.08;
      out++;
    }
  }
  scene.count = out;
  return scene;
}

/**
 * Write one frame's positions and sizes for the Canvas 2D renderer.
 *
 * The WebGL renderer does the same work in its vertex shader. `xyOut` holds
 * x and y pairs. `easeOut` holds each point's eased progress.
 */
export function computeFrame(
  scene: Scene,
  morph: number,
  xyOut: Float32Array,
  easeOut: Float32Array,
): void {
  const { ax, ay, bx, by, delay, bend, count } = scene;
  for (let i = 0; i < count; i++) {
    const e = pointEase(morph, delay[i]);
    const dx = bx[i] - ax[i];
    const dy = by[i] - ay[i];
    const swing = Math.sin(e * Math.PI) * bend[i];
    xyOut[i * 2] = ax[i] + dx * e - dy * swing;
    xyOut[i * 2 + 1] = ay[i] + dy * e + dx * swing;
    easeOut[i] = e;
  }
}
