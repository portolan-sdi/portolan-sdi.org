import { getCoverageTier } from "./catalogs";

/**
 * The geometry behind the registry explorer.
 *
 * scripts/bake-coverage-bboxes.mjs crawls every registered catalog and writes
 * one record per collection extent. The same file feeds the landing page's A5
 * coverage bake, so the crawl runs once and both maps read its output.
 *
 * The explorer spends the records two ways. It draws a centroid point per
 * collection, and it matches a catalog to the viewport when any of that
 * catalog's bboxes overlaps it. A centroid never decides a result.
 */

export type Bbox = [number, number, number, number];

export interface CollectionRecord {
  id: string;
  title: string;
  bbox: Bbox;
}

export interface CatalogCoverage {
  id: string;
  collection_count: number;
  collections: CollectionRecord[];
}

export interface CoverageBboxes {
  generated: string;
  registry_generated: string | null;
  catalogs: CatalogCoverage[];
}

/**
 * One drawable point. A broad extent never becomes one, and neither does a
 * collection that stands on the same ground as one already placed.
 */
export interface CollectionPoint {
  catalogId: string;
  /** Stable across renders. The catalog id and the group's rank within it. */
  key: string;
  /**
   * The collections at this place, named. Empty above NAMED_LIMIT, where a
   * list stops reading as an answer.
   */
  titles: string[];
  /** How many of the catalog's collections this point stands for. */
  count: number;
  /** Where this place falls among the catalog's places, counting from one. */
  placeIndex: number;
  /** How many places the catalog holds in all. */
  placeCount: number;
  lng: number;
  lat: number;
}

/** A viewport, as MapLibre reports it. West may exceed east. */
export interface Viewport {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface CoverageIndex {
  /** Every catalog that reported at least one usable extent. */
  catalogs: CatalogCoverage[];
  /** Map points, one per collection with a bounded extent. */
  points: CollectionPoint[];
  /** Collections whose extent is too broad to place a point on. */
  broadCount: number;
}

const DATA_URL = "/data/coverage-bboxes.json";

export async function fetchCoverage(signal?: AbortSignal): Promise<CoverageBboxes> {
  const res = await fetch(DATA_URL, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as CoverageBboxes;
}

/**
 * Whether an extent is too broad to stand for a place.
 *
 * A collection claiming half the globe has no meaningful centre, and a point at
 * the middle of such a bbox lands in an ocean it says nothing about. The test
 * reuses the registry's own tiering so the map and the cards agree on the word.
 */
export function isBroadExtent(bbox: Bbox): boolean {
  return getCoverageTier(bbox) === "global";
}

export function centroid(bbox: Bbox): { lng: number; lat: number } {
  const [west, south, east, north] = bbox;
  return { lng: (west + east) / 2, lat: (south + north) / 2 };
}

/** Half the bbox diagonal, in degrees. Stands for how far the extent reaches. */
function reach(bbox: Bbox): number {
  const [west, south, east, north] = bbox;
  return Math.hypot(east - west, north - south) / 2;
}

function area(bbox: Bbox): number {
  const [west, south, east, north] = bbox;
  return (east - west) * (north - south);
}

/**
 * How close two centroids must be, in degrees, before the map treats them as
 * one place. A tiny extent needs a tiny floor, or two city collections at the
 * same address would draw two squares.
 */
const MIN_MERGE_DEGREES = 0.05;

/** How many Weiszfeld rounds place a point. The step is tiny well before 30. */
const WEISZFELD_STEPS = 30;

/**
 * How many collections a place names before it stops trying.
 *
 * Three titles say what a dot is. Fifty-eight titles say only that the catalog
 * is large, which the card below already reports, and more precisely: the map
 * counts deduplicated extents while the card counts collections.
 */
const NAMED_LIMIT = 3;

type LngLat = { lng: number; lat: number };

function marginalMedian(points: LngLat[]): LngLat {
  const middle = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const half = sorted.length >> 1;
    return sorted.length % 2 ? sorted[half] : (sorted[half - 1] + sorted[half]) / 2;
  };
  return {
    lng: middle(points.map((point) => point.lng)),
    lat: middle(points.map((point) => point.lat)),
  };
}

/**
 * The point with the least total distance to the members.
 *
 * A mean follows its outliers. Portolan NL holds one collection covering the
 * Dutch North Sea, and averaging its centroid with 31 inland ones drops the
 * country's marker in open water. The geometric median ignores it, because
 * moving toward one distant member costs more than it saves.
 *
 * Weiszfeld's iteration, seeded with the marginal median so it starts inside
 * the data rather than at a mean the outlier already moved.
 */
function geometricMedian(points: LngLat[]): LngLat {
  if (points.length <= 2) {
    return {
      lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
      lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
    };
  }

  let best = marginalMedian(points);
  for (let step = 0; step < WEISZFELD_STEPS; step++) {
    let lng = 0;
    let lat = 0;
    let weight = 0;
    for (const point of points) {
      // The floor keeps the iteration finite when a member sits on the
      // current estimate, where the true gradient is undefined.
      const away = Math.max(1e-6, Math.hypot(point.lng - best.lng, point.lat - best.lat));
      lng += point.lng / away;
      lat += point.lat / away;
      weight += 1 / away;
    }
    best = { lng: lng / weight, lat: lat / weight };
  }
  return best;
}

/**
 * Collapse one catalog's collections into the places it publishes about.
 *
 * A publisher usually describes one territory many times over. Portolan NL
 * holds 32 collections whose extents all cover the Netherlands, and their
 * centroids sit within 0.7 degrees of each other. Drawing 32 squares there says
 * nothing except that the catalog is large.
 *
 * The test is scale aware. Two centroids merge when they sit closer together
 * than the extents themselves reach, so national layers collapse to one point
 * while a disaster catalog keeps a separate point per event.
 *
 * A place sits at the geometric median of the collections it holds. The
 * running mean the grouping uses is only a working centre, because a mean
 * follows an outlier and the drawn point must not.
 */
function placesFor(records: CollectionRecord[]): CollectionPoint[] {
  const placeable = records.filter((record) => !isBroadExtent(record.bbox));
  if (placeable.length === 0) return [];

  const widestFirst = [...placeable].sort((a, b) => area(b.bbox) - area(a.bbox));
  const groups: Array<{
    titles: string[];
    reach: number;
    members: LngLat[];
    centre: LngLat;
  }> = [];

  for (const record of widestFirst) {
    const point = centroid(record.bbox);
    const own = reach(record.bbox);
    const group = groups.find((candidate) => {
      const limit = Math.max(MIN_MERGE_DEGREES, (candidate.reach + own) / 2);
      return Math.hypot(candidate.centre.lng - point.lng, candidate.centre.lat - point.lat) <= limit;
    });

    if (group) {
      group.members.push(point);
      if (group.titles.length < NAMED_LIMIT) group.titles.push(record.title);
      group.centre = {
        lng: group.members.reduce((sum, p) => sum + p.lng, 0) / group.members.length,
        lat: group.members.reduce((sum, p) => sum + p.lat, 0) / group.members.length,
      };
      continue;
    }

    groups.push({
      titles: [record.title],
      reach: own,
      members: [point],
      centre: point,
    });
  }

  return groups.map((group, i) => {
    const place = geometricMedian(group.members);
    return {
      catalogId: "",
      key: "",
      titles: group.members.length <= NAMED_LIMIT ? group.titles : [],
      count: group.members.length,
      placeIndex: i + 1,
      placeCount: groups.length,
      lng: place.lng,
      lat: place.lat,
    };
  });
}

export function buildIndex(data: CoverageBboxes): CoverageIndex {
  const points: CollectionPoint[] = [];
  let broadCount = 0;

  for (const catalog of data.catalogs) {
    broadCount += catalog.collections.filter((c) => isBroadExtent(c.bbox)).length;
    placesFor(catalog.collections).forEach((place, i) => {
      points.push({ ...place, catalogId: catalog.id, key: `${catalog.id}-${i}` });
    });
  }

  return { catalogs: data.catalogs, points, broadCount };
}

/**
 * Cut a viewport into plain rectangles.
 *
 * MapLibre reports west > east once the view crosses the antimeridian, and it
 * reports a span past 360 degrees when the world repeats on screen. Both cases
 * become rectangles the overlap test can read straight.
 */
function viewportParts(viewport: Viewport): Bbox[] {
  const { south, north } = viewport;
  const lo = Math.max(-90, south);
  const hi = Math.min(90, north);
  if (lo > hi) return [];

  const span = viewport.east - viewport.west;
  if (span >= 360) return [[-180, lo, 180, hi]];

  const west = wrapLng(viewport.west);
  const east = wrapLng(viewport.east);
  if (west <= east) return [[west, lo, east, hi]];
  return [
    [west, lo, 180, hi],
    [-180, lo, east, hi],
  ];
}

function wrapLng(lng: number): number {
  const wrapped = ((lng + 180) % 360 + 360) % 360 - 180;
  return wrapped === -180 ? 180 : wrapped;
}

function overlaps(a: Bbox, b: Bbox): boolean {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

/**
 * The catalogs the viewport reaches.
 *
 * A catalog matches when at least one of its collection bboxes overlaps the
 * view. Broad extents take part, so a global collection still answers wherever
 * it genuinely applies.
 */
export function catalogsInViewport(
  index: CoverageIndex,
  viewport: Viewport
): Set<string> {
  const parts = viewportParts(viewport);
  const hits = new Set<string>();
  if (parts.length === 0) return hits;

  for (const catalog of index.catalogs) {
    for (const collection of catalog.collections) {
      if (parts.some((part) => overlaps(collection.bbox, part))) {
        hits.add(catalog.id);
        break;
      }
    }
  }
  return hits;
}
