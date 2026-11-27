import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const locale of ["en", "es", "ar"]) {
  for (const width of [390, 1440]) {
    test(`CARTO case study ${locale} at ${width}px`, async ({ page }) => {
      const prefix = locale === "en" ? "" : `/${locale}`;
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${prefix}/case-studies`);
      // Other studies can be on the index page, so find this one by its mark.
      const entry = page
        .locator("main article")
        .filter({ has: page.getByRole("img", { name: "CARTO", exact: true }) });
      await expect(entry).toHaveCount(1);
      await entry.locator('a[href$="/case-studies/carto-sdi"]').last().click();
      await expect(page).toHaveURL(`${prefix}/case-studies/carto-sdi`);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1 img")).toHaveAttribute("alt", "CARTO");
      await expect(page.locator("blockquote")).toBeVisible();
      await expect(page.getByText("Draft for CARTO review.", { exact: false })).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
      await expect(page.locator("main figure")).toHaveCount(4);
      for (const figure of await page.locator("main figure").all()) {
        await expect(figure).toHaveAttribute("dir", "ltr");
      }
      for (const image of await page.locator("main figure img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
      }
      const recording = page.locator('iframe[src="https://www.youtube-nocookie.com/embed/fijSkOLFUPE"]');
      await expect(recording).toHaveAttribute("title", /Helsinki/);
      await expect(recording).toHaveAttribute("loading", "lazy");
      await expect(page.getByRole("link", { name: "Watch the full talk on YouTube" })).toHaveAttribute("href", "https://www.youtube.com/watch?v=fijSkOLFUPE");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // The external video owns its internal UI. Check the host document.
      const results = await new AxeBuilder({ page })
        .exclude('iframe[src^="https://www.youtube-nocookie.com/"]')
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
    });
  }
}

test("homepage CARTO card opens the case study", async ({ page }) => {
  await page.goto("/");
  const card = page.locator('#cases a[href="/case-studies/carto-sdi"]');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Read the case study");
  await card.click();
  await expect(page).toHaveURL("/case-studies/carto-sdi");
});
