import assert from "node:assert/strict";
import test from "node:test";
import { buildIndex, catalogsInViewport, centroid } from "../src/lib/collection-points";
import type { CoverageBboxes } from "../src/lib/catalogs";

// Extents from parquetry.geomermaids.com, October 2026. West > east marks an
// antimeridian crossing (STAC Collection spec, Spatial Extent).
const ALASKA = [172.3478, 51.2, -129.8571, 71.4] as [number, number, number, number];
const NORTH_AMERICA = [172.3478, 14.5, -52.6, 83.3] as [number, number, number, number];
const RAILWAYS = [-166.7, 14.7, -52.7, 65.2] as [number, number, number, number];
const CENSUS = [144.5632, -14.6018, -64.5126, 71.4399] as [number, number, number, number];

function coverage(...bboxes: Array<[number, number, number, number]>): CoverageBboxes {
  return {
    generated: "2026-10-12T00:00:00Z",
    registry_generated: "2026-10-12T00:00:00Z",
    catalogs: [
      {
        id: "osm",
        collection_count: bboxes.length,
        collections: bboxes.map((bbox, i) => ({ id: `c${i}`, title: `C${i}`, bbox })),
      },
    ],
  };
}

test("the centroid of a bbox across the antimeridian lies inside it", () => {
  const { lng, lat } = centroid(ALASKA);
  assert.ok(Math.abs(lng - -158.75) < 0.01, `lng ${lng}`);
  assert.ok(Math.abs(lat - 61.3) < 0.01, `lat ${lat}`);
  assert.equal(centroid([-10, 0, 10, 2]).lng, 0);
});

test("a North American catalog gets its point in North America", () => {
  const index = buildIndex(coverage(NORTH_AMERICA, RAILWAYS));
  assert.equal(index.points.length, 1);
  const [point] = index.points;
  assert.ok(point.lng > -130 && point.lng < -90, `lng ${point.lng}`);
  assert.ok(point.lat > 35 && point.lat < 55, `lat ${point.lat}`);
});

test("a US catalog from Guam to the Virgin Islands stays in the Pacific half", () => {
  const index = buildIndex(coverage(CENSUS));
  const [point] = index.points;
  assert.ok(point.lng < -100 || point.lng > 170, `lng ${point.lng}`);
});

test("a viewport on the Aleutians finds a catalog that crosses the antimeridian", () => {
  const index = buildIndex(coverage(ALASKA));
  const west = catalogsInViewport(index, { west: 172, south: 50, east: 179, north: 54 });
  const east = catalogsInViewport(index, { west: -170, south: 52, east: -160, north: 60 });
  const europe = catalogsInViewport(index, { west: 0, south: 45, east: 10, north: 50 });
  assert.ok(west.has("osm"));
  assert.ok(east.has("osm"));
  assert.ok(!europe.has("osm"));
});
