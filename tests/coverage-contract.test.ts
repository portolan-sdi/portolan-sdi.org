import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildIndex, dedupeCoverage } from "../src/lib/collection-points";
import type { CoverageBboxes } from "../src/lib/catalogs";

test("the explorer gives each catalog bbox one vote", () => {
  const duplicate = [4, 50, 5, 51] as const;
  const data: CoverageBboxes = {
    generated: "2026-08-27T12:00:00Z",
    registry_generated: "2026-08-27T12:00:00Z",
    catalogs: [
      {
        id: "example",
        collection_count: 3,
        collections: [
          { id: "first", title: "First", bbox: [...duplicate] },
          { id: "copy", title: "Copy", bbox: [...duplicate] },
          { id: "remote", title: "Remote", bbox: [40, -20, 41, -19] },
        ],
      },
    ],
  };

  const unique = dedupeCoverage(data);
  const index = buildIndex(data);

  assert.equal(data.catalogs[0].collections.length, 3, "the input stays unchanged");
  assert.equal(unique.catalogs[0].collections.length, 2);
  assert.equal(index.catalogs[0].collections.length, 2);
  assert.equal(index.points.length, 2);
  assert.deepEqual(index.points[0].titles, ["First"]);
});

test("the bake workflow fixes its base and reconciles an unchanged pull request", async () => {
  const workflow = await readFile(".github/workflows/bake-coverage.yml", "utf8");

  assert.match(workflow, /ref: main/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /queue: max/);
  assert.match(workflow, /github\.event\.client_payload\.registry_sha/);
  assert.match(workflow, /gh pr close "\$open" --delete-branch/);

  const tokenStep = workflow.slice(
    workflow.indexOf("- name: Create bot token"),
    workflow.indexOf("- name: Open or update the coverage pull request"),
  );
  assert.doesNotMatch(tokenStep, /if:/);
});

test("the bake uses a bounded immutable fetch and ignores source timestamps", async () => {
  const script = await readFile("scripts/bake-a5-coverage.mjs", "utf8");

  assert.match(script, /process\.env\.COVERAGE_BBOX_URL/);
  assert.match(script, /AbortSignal\.timeout\(FETCH_TIMEOUT_MS\)/);
  assert.match(script, /const FETCH_RETRIES = 1/);
  assert.doesNotMatch(script, /generated: index\.generated/);
});
