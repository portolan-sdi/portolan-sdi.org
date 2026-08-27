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
  const map = page.locator(".maplibregl-map");
  await expect(map).toBeVisible();

  await map.evaluate((container) => {
    const marker = document.createElement("div");
    marker.className = "maplibregl-marker";
    marker.dataset.observerProbe = "true";
    marker.setAttribute("aria-label", "Synthetic MapLibre marker");
    marker.setAttribute("role", "button");
    marker.setAttribute("tabindex", "0");
    marker.appendChild(document.createElement("button"));
    container.appendChild(marker);
  });

  const marker = page.locator("[data-observer-probe=true]");
  await expect(marker).toHaveAttribute("role", "presentation");
  await expect(marker).not.toHaveAttribute("aria-label", /.+/);
  await expect(marker).not.toHaveAttribute("tabindex", /.+/);

  // The old observer loop kept Firefox busy for about 44 seconds here.
  const before = await page.evaluate(() => performance.now());
  await page.waitForTimeout(250);
  const after = await page.evaluate(() => performance.now());
  expect(after - before).toBeLessThan(1_000);
});
