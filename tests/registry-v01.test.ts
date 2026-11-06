import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { parseCatalogs } from "../src/lib/catalogs";
import {
  COVERAGE_INDEX_URL,
  REGISTRY_LINE,
  checkCatalogs,
  loadCoverage,
  schemaKind,
} from "../src/lib/registry-v01.mjs";

// The fixtures are real registry files from the 0.1 line, cut to two
// catalogs. The schemas are the released v0.1.0 copies. The registry never
// changes a released schema, so a local copy stays correct.
const FIXTURES = "tests/fixtures/registry";

function read(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(`${FIXTURES}/${path}`, "utf8"));
}

/** A fetchJson that serves the fixture files by their published URL. */
function fixtureFetch(overrides: Record<string, unknown> = {}) {
  return async (url: string): Promise<unknown> => {
    if (url in overrides) return structuredClone(overrides[url]);
    if (!url.startsWith(`${REGISTRY_LINE}/`)) throw new Error(`No fixture for ${url}`);
    return read(`v0.1/${url.slice(REGISTRY_LINE.length + 1)}`);
  };
}

test("the fixtures conform to the released v0.1.0 schemas", () => {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  const extension = ajv.compile(read("schemas/v0.1.0/extension.json"));
  const coverage = ajv.compile(read("schemas/v0.1.0/coverage.json"));

  assert.ok(extension(read("v0.1/catalogs.json")), ajv.errorsText(extension.errors));
  for (const file of ["index", "anncsu", "baden-wuerttemberg-lgl"]) {
    assert.ok(coverage(read(`v0.1/coverage/${file}.json`)), `${file}: ${ajv.errorsText(coverage.errors)}`);
  }
});

test("schemaKind accepts each 0.1 release and nothing else", () => {
  const base = "https://registry.portolan-sdi.org/schemas";
  assert.equal(schemaKind(`${base}/v0.1.0/extension.json`), "extension");
  assert.equal(schemaKind(`${base}/v0.1.7/coverage.json`), "coverage");
  assert.equal(schemaKind(`${base}/v0.2.0/coverage.json`), null);
  assert.equal(schemaKind("https://registry.portolan-sdi.org/next/schemas/coverage.json"), null);
  assert.equal(schemaKind(undefined), null);
});

test("parseCatalogs reads the 0.1 catalogs.json", () => {
  const doc = read("v0.1/catalogs.json");
  const result = parseCatalogs(doc);

  assert.equal(result.generated, doc["portolan_registry:generated"]);
  assert.equal(result.count, 2);
  assert.deepEqual(
    result.catalogs.map((catalog) => catalog.id),
    ["anncsu", "baden-wuerttemberg-lgl"]
  );
  const anncsu = result.catalogs[0];
  assert.ok(anncsu.url.startsWith("https://"));
  assert.ok(anncsu.collection_count > 0);
});

test("checkCatalogs rejects a document without the 0.1 extension", () => {
  const doc = read("v0.1/catalogs.json");
  doc.stac_extensions = ["https://registry.portolan-sdi.org/schemas/v0.2.0/extension.json"];
  assert.throws(() => checkCatalogs(doc), /0\.1 extension schema/);
});

test("loadCoverage combines the index and each catalog file", async () => {
  const result = await loadCoverage(fixtureFetch());
  const index = read("v0.1/coverage/index.json");

  assert.equal(result.generated, index.generated);
  assert.deepEqual(result.mixed, []);
  assert.deepEqual(
    result.catalogs.map((catalog) => catalog.id),
    ["anncsu", "baden-wuerttemberg-lgl"]
  );
  const anncsu = read("v0.1/coverage/anncsu.json");
  assert.deepEqual(result.catalogs[0].collections, anncsu.collections);
});

test("loadCoverage reports a file from another export", async () => {
  const url = `${REGISTRY_LINE}/coverage/anncsu.json`;
  const old = { ...read("v0.1/coverage/anncsu.json"), generated: "2020-01-01T00:00:00Z" };
  const result = await loadCoverage(fixtureFetch({ [url]: old }));
  assert.deepEqual(result.mixed, ["anncsu"]);
});

test("loadCoverage refuses a href outside the 0.1 line", async () => {
  const index = read("v0.1/coverage/index.json");
  const catalogs = index.catalogs as Record<string, unknown>[];
  catalogs[0].href = "https://example.com/v0.1/coverage/anncsu.json";
  await assert.rejects(
    loadCoverage(fixtureFetch({ [COVERAGE_INDEX_URL]: index })),
    /leaves the 0\.1 line/
  );
});

test("loadCoverage refuses a file that names another catalog", async () => {
  const url = `${REGISTRY_LINE}/coverage/anncsu.json`;
  const wrong = { ...read("v0.1/coverage/anncsu.json"), id: "someone-else" };
  await assert.rejects(loadCoverage(fixtureFetch({ [url]: wrong })), /holds catalog/);
});

test("loadCoverage refuses a coverage file from another release line", async () => {
  const index = {
    ...read("v0.1/coverage/index.json"),
    $schema: "https://registry.portolan-sdi.org/schemas/v0.2.0/coverage.json",
  };
  await assert.rejects(
    loadCoverage(fixtureFetch({ [COVERAGE_INDEX_URL]: index })),
    /not 0\.1 coverage/
  );
});
