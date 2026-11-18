import { expect, test } from "@playwright/test";

// The shared accessibility test scans this page. This file checks the
// parts that only this study has.
test("Epoch Blue embeds the explorer and links to it", async ({ page }) => {
  await page.goto("/case-studies/epoch-blue");
  const viewer = page.locator('iframe[title="Epoch open data explorer"]');
  await expect(viewer).toHaveAttribute(
    "src",
    /^https:\/\/jakenotjay\.github\.io\/me\/explorer\//,
  );
  await expect(
    page.getByRole("link", { name: /Open the explorer in a new tab/ }),
  ).toBeVisible();
});
