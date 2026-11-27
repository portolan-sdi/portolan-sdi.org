import { expect, test } from "@playwright/test";

const EXPLORER = /^https:\/\/jakenotjay\.github\.io\/me\/explorer\//;

test("Epoch Blue embeds the explorer with full screen and a link out", async ({ page }) => {
  await page.goto("/case-studies/epoch-blue");

  const viewer = page.locator('iframe[title="Epoch open data explorer"]');
  await expect(viewer).toHaveAttribute("src", EXPLORER);
  await expect(
    page.getByRole("link", { name: "Open the explorer" }),
  ).toHaveAttribute("href", EXPLORER);

  // Headless Chromium supports element full screen.
  const full = page.getByRole("button", { name: "Full screen" });
  await full.click();
  await expect(
    page.getByRole("button", { name: "Exit full screen" }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.fullscreenElement !== null)).toBe(true);

  await page.getByRole("button", { name: "Exit full screen" }).click();
  await expect(full).toBeVisible();
});
