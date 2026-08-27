import { expect, test } from "@playwright/test";

test("registry markers do not block the Firefox main thread", async ({ page }) => {
  await page.route("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ version: 8, sources: {}, layers: [] }),
    }),
  );

  await page.goto("/registry", { waitUntil: "domcontentloaded" });

  // The old observer loop kept Firefox busy for about 44 seconds here.
  await expect(page.locator(".maplibregl-marker button").first()).toBeVisible({
    timeout: 5_000,
  });

  const before = await page.evaluate(() => performance.now());
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => performance.now());
  expect(after - before).toBeLessThan(1_000);
});
