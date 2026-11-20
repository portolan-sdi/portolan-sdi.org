import assert from "node:assert/strict";
import test from "node:test";
import type { CoverageIndex } from "../src/lib/collection-points";
import { catalogsInView, offMapCount } from "../src/lib/registry-view";

const catalogs = [{ id: "a" }, { id: "b" }, { id: "c" }];

// Only the parts the helpers read. Catalog "a" has a point. Catalog "b"
// has only a broad extent. Catalog "c" has no extent.
const index = {
  catalogs: [{ id: "a" }, { id: "b" }],
  points: [{ catalogId: "a" }],
} as unknown as CoverageIndex;

test("catalogsInView keeps every catalog before the index or the view", () => {
  assert.deepEqual(catalogsInView(catalogs, null, null), catalogs);
  assert.deepEqual(
    catalogsInView(catalogs, index, null),
    catalogs
  );
});

test("offMapCount counts the catalogs with no point on the map", () => {
  assert.equal(offMapCount(catalogs, index), 2);
});

test("offMapCount counts only the catalogs it gets", () => {
  assert.equal(offMapCount([{ id: "a" }], index), 0);
  assert.equal(offMapCount([{ id: "a" }, { id: "c" }], index), 1);
});
