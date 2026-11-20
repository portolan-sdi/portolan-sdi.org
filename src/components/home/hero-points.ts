/**
 * Pure math for the homepage hero figure.
 *
 * The figure has two states. A globe turns, with the land drawn as points.
 * Then the points move into a Portolan catalog, drawn as a directory tree
 * under `s3://your-bucket/`. Two files in the tree have a drawing. The
 * GeoParquet file shows a map of land outlines beside a table of row
 * groups. The COG shows the same map as a pyramid of rasters. Then the same
 * move runs backward, on a loop.
 *
 * This module reads the baked world, lays out the tree and both drawings,
 * and reports where the loop stands. `hero-bake.ts` derives the baked world
 * from the land mask before the build. This module touches no DOM, so a
 * test harness can run it alone.
 */

const RAD = Math.PI / 180;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Smooth step from 0 at `a` to 1 at `b`. */
export function smooth(a: number, b: number, v: number): number {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/* --- Timeline ------------------------------------------------------------ */

/** The globe holds briefly. The move to the catalog is the main part. */
const HOLD_GLOBE = 1.6;
const MOVE = 4.6;
const HOLD_CATALOG = 4.4;
const MOVE_BACK = 3.2;
const LOOP = HOLD_GLOBE + MOVE + HOLD_CATALOG + MOVE_BACK;

/** The globe turns this far each second, in radians. */
const SPIN = 9 * RAD;
const LON_START = 20 * RAD;

/** The north pole leans toward the viewer by this angle. */
export const TIP = 20 * RAD;

/** The axis leans sideways by this angle. */
export const ROLL = 12 * RAD;

/** Shares of the move. The first point leaves at DEPART. */
const DEPART = 0.3;
/** The last point leaves this much later. Points leave from west to east. */
const SWEEP = 0.4;
/** A point takes this share of the move to reach its place. */
const FLIGHT = 0.22;

export interface Stage {
  /** The longitude at the center of the globe, in radians. */
  lon: number;
  /** Progress of the move. 0 is the globe and 1 is the catalog. */
  p: number;
}

/**
 * Where the loop stands at a given time.
 *
 * The move back is the same move with `p` running from 1 to 0. The globe
 * turns on through every loop, also while the catalog is on screen. Each
 * loop starts about 124 degrees further on, so two loops show every
 * longitude, New Zealand and Indonesia among them.
 */
export function stageAt(seconds: number): Stage {
  const t = ((seconds % LOOP) + LOOP) % LOOP;
  const backAt = HOLD_GLOBE + MOVE + HOLD_CATALOG;
  const lon = LON_START - SPIN * seconds;
  let p = 0;
  if (t >= backAt) p = 1 - (t - backAt) / MOVE_BACK;
  else if (t >= HOLD_GLOBE) p = clamp01((t - HOLD_GLOBE) / MOVE);
  return { lon, p };
}

/** The one frame drawn under reduced motion: the catalog. */
export const STILL: Stage = { lon: LON_START, p: 1 };

/** Eased progress of a point toward its place. `share` runs west to east. */
export function flightEase(p: number, share: number): number {
  const leave = DEPART + SWEEP * share;
  return smooth(leave, leave + FLIGHT, p);
}

/** Opacity of a point at its place. The crisp map takes over from it. */
export function landedAlpha(p: number, share: number): number {
  const arrive = DEPART + SWEEP * share + FLIGHT;
  return 1 - smooth(arrive + 0.01, arrive + 0.05, p);
}

/** How much of each map is drawn, from the west edge, from 0 to 1. */
export function mapWipe(p: number): number {
  return clamp01((p - DEPART - FLIGHT - 0.01) / SWEEP);
}

/** Opacity of the table and the raster planes. They wait for the globe. */
export function structureAlpha(p: number): number {
  return smooth(0.66, 0.84, p);
}

/** Opacity of the tints, the overview pixels, and the labels. */
export function finishAlpha(p: number): number {
  return smooth(0.88, 0.99, p);
}

/** Opacity of the role notes in the wide form. */
export function noteAlpha(p: number): number {
  return smooth(0.62, 0.8, p);
}

/** How far the globe has moved to the drawing column in the wide form. */
export function globeSlide(p: number): number {
  return smooth(0.02, 0.27, p);
}

/**
 * Opacity of the globe outline and graticule. In the stacked form the globe
 * fades before the tree shows, so no point crosses the tree text.
 */
export function globeAlpha(p: number, wide: boolean): number {
  return wide ? 1 - smooth(0.32, 0.62, p) : 1 - smooth(0.14, 0.4, p);
}

/* --- The world, baked from the land mask --------------------------------- */

/** Both drawings show the same window of the world, 78 N to 57 S. */
export const LAT_TOP = 78;
export const LAT_SPAN = 135;

export function uOf(lon: number): number {
  return (lon + 180) / 360;
}

export function vOf(lat: number): number {
  return (LAT_TOP - lat) / LAT_SPAN;
}

/** One level of the raster: land as runs of cells, row by row. */
export interface RasterLevel {
  nx: number;
  ny: number;
  /** Each run is `[column, row, length]`. */
  runs: Array<[number, number, number]>;
}

export interface World {
  /** Land outlines as closed rings of `u, v` pairs in the map window. */
  rings: Float32Array[];
  /** The raster at full resolution, then two overviews. */
  levels: RasterLevel[];
  /** The land points of the globe. */
  count: number;
  /** Place on the unit sphere, with longitude 0 facing the viewer. */
  gx: Float32Array;
  gy: Float32Array;
  gz: Float32Array;
  /** Place in the map window. `v` is outside 0 to 1 near the poles. */
  u: Float32Array;
  v: Float32Array;
  /** 0 for the vector map and 1 for the raster. */
  target: Uint8Array;
  /** The graticule lines, each as unit vectors in threes. */
  graticule: Float32Array[];
}

/** The three regions of the vector map, as longitude bounds in `u`. */
export const REGIONS: Array<[number, number]> = [
  [uOf(-180), uOf(-27)],
  [uOf(-27), uOf(60)],
  [uOf(60), uOf(180)],
];

/**
 * The world as `scripts/bake-hero-world.mts` writes it to
 * `public/data/hero-world.json`.
 */
export interface BakedWorld {
  /** The number of lattice points over the whole sphere. */
  lattice: number;
  /**
   * The lattice points in the order of `forEachLatticePoint`, as run lengths
   * that alternate ocean and land. The first run is ocean and may be zero.
   */
  land: number[];
  /** Land outlines as closed rings of `u, v` pairs, in units of 1/RING_UNIT. */
  rings: number[][];
  /** The raster at full resolution, then two overviews. */
  levels: RasterLevel[];
}

/** Ring coordinates are integers in this many parts of the map window. */
export const RING_UNIT = 10000;

/**
 * Visit every point of a lattice of `count` points over the sphere.
 *
 * The points are on rings of equal latitude. Each ring holds as many points
 * as its length allows, so the points space evenly. `lonHalf` and `latHalf`
 * give the half size of the cell around each point, in degrees.
 */
export function forEachLatticePoint(
  count: number,
  visit: (
    lon: number,
    lat: number,
    ring: number,
    lonHalf: number,
    latHalf: number,
  ) => void,
): void {
  const spacing = Math.sqrt((4 * Math.PI) / count);
  const rings = Math.round(Math.PI / spacing);
  const latHalf = 90 / rings;
  for (let ring = 0; ring < rings; ring++) {
    const lat = 90 - ((ring + 0.5) * 180) / rings;
    const around = Math.max(
      1,
      Math.round((2 * Math.PI * Math.cos(lat * RAD)) / spacing),
    );
    const lonHalf = 180 / around;
    for (let k = 0; k < around; k++) {
      const lon = ((k + (ring % 2) * 0.5) / around) * 360 - 180;
      visit(lon, lat, ring, lonHalf, latHalf);
    }
  }
}

function unit(lon: number, lat: number): [number, number, number] {
  const c = Math.cos(lat * RAD);
  return [c * Math.sin(lon * RAD), Math.sin(lat * RAD), c * Math.cos(lon * RAD)];
}

function polyline(points: Array<[number, number]>): Float32Array {
  const out = new Float32Array(points.length * 3);
  points.forEach(([lon, lat], i) => out.set(unit(lon, lat), i * 3));
  return out;
}

function buildGraticule(): Float32Array[] {
  const lines: Float32Array[] = [];
  for (let lon = -180; lon < 180; lon += 30) {
    const line: Array<[number, number]> = [];
    for (let lat = -80; lat <= 80; lat += 4) line.push([lon, lat]);
    lines.push(polyline(line));
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const line: Array<[number, number]> = [];
    for (let lon = -180; lon <= 180; lon += 4) line.push([lon, lat]);
    lines.push(polyline(line));
  }
  return lines;
}

/**
 * Build what the figure draws from the baked world. This runs once.
 *
 * Alternate lattice rings go to the vector map and to the raster, so each
 * drawing receives the whole world and every point has its own place in it.
 */
export function worldFromBaked(baked: BakedWorld): World {
  const isLand = new Uint8Array(baked.lattice + 1);
  let at = 0;
  baked.land.forEach((run, i) => {
    if (i % 2 === 1) isLand.fill(1, at, at + run);
    at += run;
  });
  const lon: number[] = [];
  const lat: number[] = [];
  const which: number[] = [];
  let index = 0;
  forEachLatticePoint(baked.lattice, (pointLon, pointLat, ring) => {
    if (isLand[index++]) {
      lon.push(pointLon);
      lat.push(pointLat);
      which.push(ring % 2);
    }
  });
  const count = lon.length;
  const world: World = {
    rings: baked.rings.map((ring) =>
      Float32Array.from(ring, (value) => value / RING_UNIT),
    ),
    levels: baked.levels,
    count,
    gx: new Float32Array(count),
    gy: new Float32Array(count),
    gz: new Float32Array(count),
    u: new Float32Array(count),
    v: new Float32Array(count),
    target: new Uint8Array(count),
    graticule: buildGraticule(),
  };
  for (let i = 0; i < count; i++) {
    const [x, y, z] = unit(lon[i], lat[i]);
    world.gx[i] = x;
    world.gy[i] = y;
    world.gz[i] = z;
    world.u[i] = uOf(lon[i]);
    world.v[i] = vOf(lat[i]);
    world.target[i] = which[i];
  }
  return world;
}

/* --- The catalog tree ---------------------------------------------------- */

export type RowKind = "root" | "dir" | "file" | "data";
export type DrawingKind = "parquet" | "cog";

interface RowSpec {
  depth: number;
  name: string;
  kind: RowKind;
  /** The role of the file, shown beside its name. */
  note?: string;
  /** The format name of a data file. */
  format?: string;
  drawing?: DrawingKind;
}

/**
 * The tree is illustrative. It shows each kind of file once and is not a
 * complete valid catalog. A real collection also holds its own README.md
 * and AGENTS.md, a thumbnail, and a style for its PMTiles file.
 */
const TREE: RowSpec[] = [
  { depth: 0, name: "s3://your-bucket/", kind: "root" },
  { depth: 1, name: "catalog.json", kind: "file", note: "STAC catalog" },
  { depth: 1, name: "README.md", kind: "file", note: "for people" },
  { depth: 1, name: "AGENTS.md", kind: "file", note: "for agents" },
  { depth: 1, name: "boundaries/", kind: "dir" },
  { depth: 2, name: "collection.json", kind: "file", note: "STAC collection" },
  {
    depth: 2,
    name: "boundaries.parquet",
    kind: "data",
    format: "GeoParquet",
    drawing: "parquet",
  },
  {
    depth: 2,
    name: "boundaries.pmtiles",
    kind: "file",
    note: "for visualization",
  },
  { depth: 1, name: "landcover/", kind: "dir" },
  { depth: 2, name: "collection.json", kind: "file" },
  {
    depth: 2,
    name: "landcover.tif",
    kind: "data",
    format: "COG",
    drawing: "cog",
  },
];

export interface Row extends RowSpec {
  x: number;
  y: number;
  /** The share of the move at which the row shows. */
  at: number;
}

export interface Trunk {
  x: number;
  y0: number;
  y1: number;
}

/** The GeoParquet drawing: a map of outlines beside a table. */
export interface ParquetDrawing {
  /** The map rectangle. */
  mx: number;
  my: number;
  mw: number;
  mh: number;
  /** The table: its left edge, its width, and the column widths. */
  tx: number;
  tw: number;
  cols: number[];
  /** The top of each row group, and their shared height. */
  bands: number[];
  bandH: number;
  /** The baseline of the one column label. */
  labelY: number;
}

/** One oblique plane of the raster pyramid. */
export interface Plane {
  level: RasterLevel;
  x0: number;
  y0: number;
  w: number;
  depth: number;
  shear: number;
}

/** The COG drawing: a pyramid of planes. */
export interface CogDrawing {
  /** The planes from full resolution up to the smallest overview. */
  planes: Plane[];
}

/** Map a place on a plane, `u` and `v` from 0 to 1, to the figure. */
export function planePoint(plane: Plane, u: number, v: number): [number, number] {
  return [
    plane.x0 + plane.shear * (1 - v) + u * plane.w,
    plane.y0 + v * plane.depth,
  ];
}

/** The figure takes the wide form from this width up. */
const WIDE_FROM = 520;

/**
 * The row and drawing heights fix the height of each form: 429px wide and
 * 465px stacked. `hero-figure.tsx` reserves the same heights in CSS, so
 * change both together.
 */
const ROW = 18;
const PARQUET_H = 102;
const COG_H = 127;

function layoutParquet(x: number, y: number, w: number): ParquetDrawing {
  const mw = w >= 370 ? 200 : w >= 320 ? 170 : w >= 300 ? 160 : 112;
  const mh = Math.round((mw * LAT_SPAN) / 360);
  const gap = w >= 300 ? 18 : 12;
  const tx = x + mw + gap;
  const tw = Math.min(170, x + w - tx - 1);
  const top = y + 16;
  const bandH = 26;
  const bandGap = 4;
  const bands = [0, 1, 2].map((i) => top + i * (bandH + bandGap));
  const cols = [0.13, 0.13, 0.49].map((share) => Math.round(tw * share));
  cols.push(tw - cols[0] - cols[1] - cols[2]);
  return {
    mx: x,
    my: Math.round(top + (3 * bandH + 2 * bandGap - mh) / 2),
    mw,
    mh,
    tx,
    tw,
    cols,
    bands,
    bandH,
    labelY: y + 11,
  };
}

function layoutCog(
  x: number,
  y: number,
  w: number,
  levels: RasterLevel[],
): CogDrawing {
  const cell = w >= 265 ? 3.5 : 3;
  const cellDepth = 2.5;
  const slant = 0.62;
  const full = levels[0].nx * cell;
  const shearMax = levels[0].ny * cellDepth * slant;
  const center = x + (full + shearMax) / 2;
  const planes: Plane[] = [];
  let top = y;
  for (let k = levels.length - 1; k >= 0; k--) {
    const level = levels[k];
    const pw = level.nx * cell;
    const depth = level.ny * cellDepth;
    const shear = depth * slant;
    planes[k] = {
      level,
      x0: center - (pw + shear) / 2,
      y0: top,
      w: pw,
      depth,
      shear,
    };
    top += depth + 11;
  }
  return { planes };
}

export interface Scene {
  width: number;
  height: number;
  /** The wide form has the tree on the left and the drawings on the right. */
  wide: boolean;
  /** Size of the tree text, in CSS pixels. */
  fontPx: number;
  indent: number;
  rowH: number;
  rows: Row[];
  trunks: Trunk[];
  /** The left edge of the role notes, and their least gap from a name. */
  noteX: number;
  noteGap: number;
  /** The tree draws from the top down between these shares of the move. */
  treeFrom: number;
  treeSpan: number;
  parquet: ParquetDrawing;
  cog: CogDrawing;
  world: World;
  /** The place of each point in its drawing, in CSS pixels. */
  tx: Float32Array;
  ty: Float32Array;
  /** The globe at rest, and where it moves to before its points leave. */
  globe: { cx0: number; cx1: number; cy: number; r0: number; r1: number };
}

/**
 * Lay out the tree and both drawings for a figure of the given width, and
 * give each point its place.
 *
 * In the wide form each drawing is beside its file name. In the stacked
 * form it is under the name. A point goes to its own longitude and latitude
 * on the vector map or on the full resolution raster, so the globe unwraps
 * into both maps.
 */
export function buildScene(world: World, width: number): Scene {
  const wide = width >= WIDE_FROM;
  const small = width < 340;
  const fontPx = small ? 12 : 13;
  const indent = small ? 12 : 18;
  const drawX = wide ? 196 : 0;

  let y = 4;
  let parquet: ParquetDrawing | null = null;
  let cog: CogDrawing | null = null;
  const rows: Row[] = [];
  for (const spec of TREE) {
    const x = spec.depth * indent;
    if (!spec.drawing) {
      rows.push({ ...spec, x, y, at: 0 });
      y += ROW;
      continue;
    }
    const h = spec.drawing === "parquet" ? PARQUET_H : COG_H;
    let rowY = y;
    let dx = x + 2;
    let dy = y + ROW + 6;
    if (wide) {
      rowY = y + 6;
      dx = drawX;
      dy = rowY + 2;
      y = rowY + h + 10;
    } else {
      y += ROW + 6 + h + 10;
    }
    if (spec.drawing === "parquet") parquet = layoutParquet(dx, dy, width - dx);
    else cog = layoutCog(dx, dy, width - dx, world.levels);
    rows.push({ ...spec, x, y: rowY, at: 0 });
  }
  const height = y + 2;
  if (!parquet || !cog) throw new Error("hero tree lacks a drawing");
  const parquetDrawing: ParquetDrawing = parquet;
  const cogDrawing: CogDrawing = cog;

  const treeFrom = wide ? 0.24 : 0.42;
  const treeSpan = wide ? 0.3 : 0.34;
  for (const row of rows) row.at = treeFrom + treeSpan * (row.y / height);

  // One trunk per folder, down to its last child.
  const trunks: Trunk[] = [];
  const trunkOf = new Map<number, Trunk>();
  rows.forEach((row, i) => {
    if (row.depth === 0) return;
    let parent = i - 1;
    while (rows[parent].depth !== row.depth - 1) parent--;
    let trunk = trunkOf.get(parent);
    if (!trunk) {
      trunk = {
        x: (row.depth - 1) * indent + 4,
        y0: rows[parent].y + ROW - 1,
        y1: 0,
      };
      trunkOf.set(parent, trunk);
      trunks.push(trunk);
    }
    trunk.y1 = row.y + ROW / 2;
  });

  const tx = new Float32Array(world.count);
  const ty = new Float32Array(world.count);
  const fullPlane = cogDrawing.planes[0];
  for (let i = 0; i < world.count; i++) {
    const u = world.u[i];
    const v = clamp01(world.v[i]);
    if (world.target[i] === 0) {
      tx[i] = parquetDrawing.mx + u * parquetDrawing.mw;
      ty[i] = parquetDrawing.my + v * parquetDrawing.mh;
    } else {
      const [px, py] = planePoint(fullPlane, u, v);
      tx[i] = px;
      ty[i] = py;
    }
  }

  const r0 = Math.floor(Math.min(width * 0.42, height * 0.44, 235));
  const r1 = wide
    ? Math.floor(Math.min((width - drawX) / 2 - 6, height * 0.4, 185))
    : r0;
  return {
    width,
    height,
    wide,
    fontPx,
    indent,
    rowH: ROW,
    rows,
    trunks,
    noteX: wide ? drawX : small ? 150 : 176,
    noteGap: small ? 6 : 12,
    treeFrom,
    treeSpan,
    parquet: parquetDrawing,
    cog: cogDrawing,
    world,
    tx,
    ty,
    globe: {
      cx0: width / 2,
      cx1: wide ? drawX + (width - drawX) / 2 : width / 2,
      cy: Math.round(height / 2),
      r0,
      r1,
    },
  };
}
