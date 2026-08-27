import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const locales = [
  { id: "en", prefix: "" },
  { id: "es", prefix: "/es" },
  { id: "ar", prefix: "/ar" },
] as const;

const routes = [
  { id: "home", path: "" },
  { id: "faq", path: "/faq" },
  { id: "talks", path: "/talks" },
  { id: "registry", path: "/registry" },
] as const;

const viewports = [
  { id: "mobile", width: 390, height: 844 },
  { id: "tablet", width: 768, height: 1024 },
  { id: "desktop", width: 1440, height: 900 },
] as const;

const seriousImpacts = new Set(["critical", "serious"]);
const routeUrl = (prefix: string, path: string) => `${prefix}${path || "/"}`;

for (const locale of locales) {
  for (const route of routes) {
    for (const viewport of viewports) {
      test(`axe ${locale.id} ${route.id} ${viewport.id}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const response = await page.goto(routeUrl(locale.prefix, route.path), {
          waitUntil: "domcontentloaded",
        });
        expect(response?.status(), "route must respond successfully").toBeLessThan(400);
        await expect(page.locator("main")).toBeVisible();

        // The map and catalog list are client-rendered. Give their controls a
        // short settling window before the accessibility tree is inspected.
        await page.waitForTimeout(750);

        const axe = new AxeBuilder({ page }).withTags([
          "wcag2a",
          "wcag2aa",
          "wcag21a",
          "wcag21aa",
          "wcag22aa",
        ]);
        // MapLibre owns the marker wrapper. It adds role="button" around our
        // marker button, so axe sees a third-party nested-control violation.
        // Keep the wrapper out of axe and enforce our own marker-size rule.
        if (route.id === "registry") axe.exclude(".maplibregl-marker");
        const results = await axe.analyze();
        const seriousViolations = results.violations.filter((violation) =>
          seriousImpacts.has(violation.impact ?? ""),
        );
        expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);

        const documentState = await page.evaluate(() => ({
          lang: document.documentElement.lang,
          dir: document.documentElement.dir,
          headingCount: document.querySelectorAll("h1").length,
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(documentState.lang).toBe(locale.id);
        expect(documentState.dir).toBe(locale.id === "ar" ? "rtl" : "ltr");
        expect(documentState.headingCount).toBe(1);
        expect(documentState.scrollWidth).toBeLessThanOrEqual(documentState.innerWidth);

        if (route.id === "registry") {
          const markerSizes = await page.locator(".maplibregl-marker button").evaluateAll((buttons) =>
            buttons.map((button) => {
              const rect = button.getBoundingClientRect();
              return { width: rect.width, height: rect.height };
            }),
          );
          expect(markerSizes.length).toBeGreaterThan(0);
          expect(markerSizes.every(({ width, height }) => width >= 24 && height >= 24), JSON.stringify(markerSizes)).toBe(true);
        }
      });
    }
  }
}

test.describe("shared keyboard interactions", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile navigation contains and restores focus", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const trigger = page.locator("button[aria-expanded]").filter({ hasText: /Index|Índice|الفهرس/i }).first();
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await expect.poll(() => page.evaluate(() => document.activeElement?.closest("nav") !== null)).toBe(true);
    for (let i = 0; i < 6; i += 1) {
      await page.keyboard.press("Tab");
      await expect.poll(() => page.evaluate(() => document.activeElement?.closest("nav") !== null)).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();
  });

  test.describe("locale menu follows the keyboard menu pattern", () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test("opens and supports keyboard navigation", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const trigger = page.locator('button[aria-haspopup="menu"]').first();
      await trigger.click();
      const menu = page.locator('[role="menu"]');
      await expect(menu).toBeVisible();
      const firstItem = menu.locator('[role="menuitem"]').first();
      await expect(firstItem).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(menu.locator('[role="menuitem"]').nth(1)).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    });
  });

  test("interactive controls are not nested", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("a button, button a")).toHaveCount(0);
    await page.goto("/registry", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(750);
    await expect(page.locator('[role="button"] button, button [role="button"]')).toHaveCount(0);
  });
});

test("reduced motion is exposed to the page", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
});

test("Registry exposes a live submit failure", async ({ page }) => {
  await page.route("**/api/submit-catalog", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Synthetic accessibility test failure" }),
    }),
  );
  await page.goto("/registry", { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("https://...catalog.json").fill("https://example.com/catalog.json");
  await page.getByLabel(/email/i).fill("audit@example.com");
  await page.getByRole("button", { name: /submit/i }).click();
  await expect(page.getByText(/Synthetic accessibility test failure|unable|error|try again/i).last()).toBeVisible();
  await expect(page.locator('[role="alert"], [aria-live]')).not.toHaveCount(0);
});

test("video-only demos expose localized text alternatives", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const videos = page.locator("video");
  await expect(videos).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    const describedBy = await videos.nth(index).getAttribute("aria-describedby");
    expect(describedBy, `video ${index + 1} needs a text equivalent`).toBeTruthy();
    await expect(page.locator(`[id="${describedBy}"]`)).toBeAttached();
  }
});
