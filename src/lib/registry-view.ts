import type { Catalog } from "./catalogs";
import { catalogsInViewport, type CoverageIndex, type Viewport } from "./collection-points";

/**
 * The fields of a catalog that the count line under a registry map reads.
 * The homepage sends only these to the browser, not the whole listing.
 */
export type CountedCatalog = Pick<
  Catalog,
  "id" | "collection_count" | "feature_count" | "total_size_bytes" | "last_crawled"
>;

/** Cut a catalog down to the fields of the count line. */
export function toCounted(catalog: Catalog): CountedCatalog {
  return {
    id: catalog.id,
    collection_count: catalog.collection_count,
    feature_count: catalog.feature_count,
    total_size_bytes: catalog.total_size_bytes,
    last_crawled: catalog.last_crawled,
  };
}

/**
 * The catalogs in a map view. Before the index and the view arrive, every
 * catalog is in view.
 *
 * A catalog the crawl could not place cannot be ruled out by geography, so
 * the view never hides it. A global catalog answers through its own bboxes,
 * which overlap every view, even though the map draws no point for it.
 */
export function catalogsInView<T extends { id: string }>(
  catalogs: T[],
  index: CoverageIndex | null,
  viewport: Viewport | null
): T[] {
  if (!index || !viewport) return catalogs;
  const hits = catalogsInViewport(index, viewport);
  const located = new Set(index.catalogs.map((catalog) => catalog.id));
  return catalogs.filter((catalog) => hits.has(catalog.id) || !located.has(catalog.id));
}

/**
 * The catalogs the map draws no point for. Either every extent is too broad
 * to stand for a place, or the crawl found no extent at all. Both still
 * answer the view filter.
 */
export function offMapCount(catalogs: { id: string }[], index: CoverageIndex): number {
  const drawn = new Set(index.points.map((point) => point.catalogId));
  return catalogs.filter((catalog) => !drawn.has(catalog.id)).length;
}
