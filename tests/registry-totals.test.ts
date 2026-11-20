import assert from "node:assert/strict";
import test from "node:test";
import { registryTotals, type Catalog } from "../src/lib/catalogs";

// Only the three counts matter to the sums. The rest of a catalog is
// left out on purpose.
function catalog(collections: number, features: number, bytes: number | null): Catalog {
  return {
    collection_count: collections,
    feature_count: features,
    total_size_bytes: bytes,
  } as Catalog;
}

test("registryTotals sums the counts of each catalog", () => {
  const totals = registryTotals([catalog(3, 1000, 2_000_000), catalog(2, 50, 500)]);
  assert.deepEqual(totals, {
    catalogs: 2,
    collections: 5,
    features: 1050,
    bytes: 2_000_500,
  });
});

test("registryTotals counts no bytes for a catalog with no size", () => {
  const totals = registryTotals([catalog(1, 10, null), catalog(1, 10, 100)]);
  assert.equal(totals.bytes, 100);
  assert.equal(totals.catalogs, 2);
});

test("registryTotals of no catalogs is all zero", () => {
  assert.deepEqual(registryTotals([]), {
    catalogs: 0,
    collections: 0,
    features: 0,
    bytes: 0,
  });
});
