import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  bakeWorld,
  decodeLand,
  insideRings,
  landmasses,
  type LandMaskFile,
} from "../src/components/home/hero-bake";
import {
  LAT_SPAN,
  LAT_TOP,
  worldFromBaked,
  type BakedWorld,
} from "../src/components/home/hero-points";

const RAD = Math.PI / 180;
/** The border of the outline grid, one 1.5 degree step, in map units. */
const EDGE_U = 1.5 / 360;
const EDGE_V = 1.5 / LAT_SPAN;
const mask = JSON.parse(
  readFileSync("public/data/land-mask.json", "utf8"),
) as LandMaskFile;
const baked = JSON.parse(
  readFileSync("public/data/hero-world.json", "utf8"),
) as BakedWorld;
const land = decodeLand(mask);
const world = worldFromBaked(baked);

/** The longitude and latitude of each globe point, in degrees. */
const points = Array.from({ length: world.count }, (_, i) => ({
  lon: Math.atan2(world.gx[i], world.gz[i]) / RAD,
  lat: Math.asin(world.gy[i]) / RAD,
}));

/** The center of a decoded mask cell, in degrees. */
function cellCenter(k: number): { lon: number; lat: number } {
  const r = Math.floor(k / land.w);
  const c = k - r * land.w;
  return {
    lon: ((c + 0.5) * 360) / land.w - 180,
    lat: 90 - ((r + 0.5) * 180) / land.h,
  };
}

/** The mask cells of each landmass that is large enough to show. */
function largeMasses(): number[][] {
  const { label, large } = landmasses(land);
  const cells = new Map<number, number[]>();
  label.forEach((id, k) => {
    if (id < 0 || !large[id]) return;
    const list = cells.get(id);
    if (list) list.push(k);
    else cells.set(id, [k]);
  });
  return [...cells.values()];
}

test("hero-world.json matches a fresh bake of the land mask", () => {
  const fresh = JSON.parse(JSON.stringify(bakeWorld(land)));
  assert.deepEqual(
    baked,
    fresh,
    "public/data/hero-world.json is stale. Run pnpm bake:hero-world.",
  );
});

test("the globe shows islands that a center test misses", () => {
  const boxes: Array<[string, number, number, number, number, number]> = [
    // name, west, south, east, north, least points
    ["New Zealand", 166, -48, 179, -34, 20],
    ["Java", 105, -9, 115, -5.5, 8],
    ["Iceland", -25, 63, -13, 67, 8],
    ["Hawaii", -161, 18, -154, 23, 2],
    ["Fiji", 176, -20, 180, -15, 2],
    ["New Caledonia", 163, -23, 168, -19, 2],
  ];
  for (const [name, west, south, east, north, least] of boxes) {
    const found = points.filter(
      (p) => p.lon >= west && p.lon <= east && p.lat >= south && p.lat <= north,
    ).length;
    assert.ok(found >= least, `${name} has ${found} points, wants ${least}`);
  }
});

test("every large landmass has a point on the globe", () => {
  const byDegree = new Map<string, number[]>();
  points.forEach((p, i) => {
    const key = `${Math.floor(p.lat)},${Math.floor(p.lon)}`;
    const list = byDegree.get(key);
    if (list) list.push(i);
    else byDegree.set(key, [i]);
  });
  const near = (lon: number, lat: number) => {
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const key = `${Math.floor(lat) + a},${Math.floor(lon) + b}`;
        for (const i of byDegree.get(key) ?? []) {
          const dLon = Math.abs(points[i].lon - lon) * Math.cos(lat * RAD);
          if (Math.abs(points[i].lat - lat) < 0.7 && dLon < 0.7) return true;
        }
      }
    }
    return false;
  };
  for (const cells of largeMasses()) {
    const shown = cells.some((k) => {
      const { lon, lat } = cellCenter(k);
      return near(lon, lat);
    });
    const { lon, lat } = cellCenter(cells[0]);
    assert.ok(shown, `no globe point near ${lat.toFixed(1)}, ${lon.toFixed(1)}`);
  }
});

test("every large landmass in the map window shows on both maps", () => {
  const full = world.levels[0];
  const grid = new Uint8Array(full.nx * full.ny);
  for (const [c, r, length] of full.runs) {
    grid.fill(1, r * full.nx + c, r * full.nx + c + length);
  }
  for (const cells of largeMasses()) {
    const inside = cells
      .map(cellCenter)
      .filter((p) => p.lat <= LAT_TOP && p.lat >= LAT_TOP - LAT_SPAN)
      .map((p) => ({ u: (p.lon + 180) / 360, v: (LAT_TOP - p.lat) / LAT_SPAN }));
    if (inside.length === 0) continue;
    const where = `${(LAT_TOP - inside[0].v * LAT_SPAN).toFixed(1)}, ${(inside[0].u * 360 - 180).toFixed(1)}`;
    const onRaster = inside.some(({ u, v }) => {
      const r = Math.min(full.ny - 1, Math.floor(v * full.ny));
      return grid[r * full.nx + Math.min(full.nx - 1, Math.floor(u * full.nx))];
    });
    assert.ok(onRaster, `no raster cell for the landmass at ${where}`);
    // The outline grid keeps its border cells as ocean, so a landmass must
    // reach inside that border to get a ring. The flat map also cuts a
    // landmass on the antimeridian, such as Wrangel Island, into two
    // slivers. The globe and the raster still show such a landmass.
    const crosses =
      inside.some(({ u }) => u < EDGE_U) &&
      inside.some(({ u }) => u > 1 - EDGE_U);
    const inner = inside.filter(
      ({ u, v }) =>
        u > EDGE_U && u < 1 - EDGE_U && v > EDGE_V && v < 1 - EDGE_V,
    );
    if (crosses || inner.length === 0) continue;
    const every = Math.max(1, Math.floor(inner.length / 200));
    const outlined = inner.some(
      ({ u, v }, i) => i % every === 0 && insideRings(world.rings, u, v),
    );
    assert.ok(outlined, `no outline for the landmass at ${where}`);
  }
});
