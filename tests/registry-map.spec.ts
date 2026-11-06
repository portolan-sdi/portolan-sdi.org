import { expect, test } from "@playwright/test";

// MapLibre 6 loads its tile worker from a separate file. When the bundler
// moves MapLibre and the worker URL breaks, the canvas still mounts. But the
// map never fires "load", so no marker renders. This test checks for both
// symptoms.
test("the registry map starts its worker and draws markers", async ({ page }) => {
  const workerErrors: string[] = [];
  const missingWorkers: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("Worker failed to load")) {
      workerErrors.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.url().includes("maplibre-gl-worker") && !response.ok()) {
      missingWorkers.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto("/registry");

  const markers = page.locator(".maplibregl-marker");
  await expect(markers.first()).toBeAttached({ timeout: 30_000 });

  expect(missingWorkers).toEqual([]);
  expect(workerErrors).toEqual([]);
});
