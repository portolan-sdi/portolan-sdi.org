import { expect, test } from "@playwright/test";

// MapLibre 6 broke the registry map in two ways. Its tile worker URL broke
// under the bundler, so the map never fired "load" and drew no marker. It
// also removed `map.transform`, which react-map-gl 8.1.1 read on each camera
// event. Each scroll or drag then threw, and the page never saw the move.
// These tests check for both failures.

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

test("scroll and drag move the registry map without errors", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto("/registry");
  await expect(page.locator(".maplibregl-marker").first()).toBeAttached({ timeout: 30_000 });

  const canvas = page.locator(".maplibregl-canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("The map canvas has no bounding box");
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  // The page writes the view to ?m=zoom/lat/lng after each move ends.
  await page.mouse.move(centerX, centerY);
  for (let step = 0; step < 4; step += 1) {
    await page.mouse.wheel(0, -240);
  }
  await expect(page).toHaveURL(/[?&]m=(?!1\.30%2F)/, { timeout: 10_000 });
  const afterZoom = page.url();

  await page.mouse.move(centerX, centerY);
  await page.mouse.down();
  await page.mouse.move(centerX - 150, centerY - 100, { steps: 10 });
  await page.mouse.up();
  await expect(page).not.toHaveURL(afterZoom, { timeout: 10_000 });

  expect(pageErrors).toEqual([]);
});
