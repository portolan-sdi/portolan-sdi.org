import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const locale of ["en", "es", "ar"]) {
  for (const width of [390, 1440]) {
    test(`FTW case study ${locale} at ${width}px`, async ({ page }) => {
      const prefix = locale === "en" ? "" : `/${locale}`;
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${prefix}/case-studies`);
      const entry = page.locator("main article").filter({ hasText: "Fields of the World" });
      await expect(entry).toHaveCount(1);
      const thumbnail = entry.locator("img").first();
      await expect.poll(() => thumbnail.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
      await entry.locator('a[href$="/case-studies/fields-of-the-world"]').last().click();
      await expect(page).toHaveURL(`${prefix}/case-studies/fields-of-the-world`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1 img")).toHaveAttribute("alt", "Fields of the World");
      await expect(page.getByText("Draft for Isaac Corley's review.", { exact: false })).toBeVisible();
      await expect(page.locator("blockquote")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://www.portolan-sdi.org${prefix}/case-studies/fields-of-the-world`);
      for (const figure of await page.locator("main figure").all()) {
        await expect(figure).toHaveAttribute("dir", "ltr");
      }
      for (const image of await page.locator("main figure img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
      }
      const viewer = page.locator('iframe[title="Global FTW 2nd Edition interactive preview"]');
      await expect(viewer).toHaveAttribute("src", "https://research.taylorgeospatial.org/global-ftw-2e/");
      await expect(viewer).toHaveAttribute("loading", "lazy");
      await expect(page.getByRole("link", { name: "Open the interactive preview in a new tab" })).toHaveAttribute("href", "https://research.taylorgeospatial.org/global-ftw-2e/");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const results = await new AxeBuilder({ page })
        .exclude('iframe[title="Global FTW 2nd Edition interactive preview"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
    });
  }
}

test("FTW routes appear in sitemap, stay out of RSS, and reject unknown slugs", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const prefix of ["", "/es", "/ar"]) {
    expect(sitemap).toContain(`https://www.portolan-sdi.org${prefix}/case-studies/fields-of-the-world`);
  }
  const feed = await (await request.get("/blog/feed.xml")).text();
  expect(feed).not.toContain("/case-studies/");
  expect((await request.get("/case-studies/unknown-study")).status()).toBe(404);
});


test("homepage FTW card opens the case study", async ({ page }) => {
  await page.goto("/");
  const card = page.locator('#cases a[href="/case-studies/fields-of-the-world"]');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Read the case study");
  await card.click();
  await expect(page).toHaveURL("/case-studies/fields-of-the-world");
});
