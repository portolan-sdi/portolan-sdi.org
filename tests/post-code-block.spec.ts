import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const article = readFileSync("src/content/tutorials/mirroring-east-hampton.mdx", "utf8");
const blocks = [...article.matchAll(/```(?:bash|text)\n([\s\S]*?)```/g)].map(
  (match) => match[1],
);

// The system clipboard is shared across browser contexts.
test.describe.configure({ mode: "serial" });

for (const locale of [
  { prefix: "", copy: "Copy", copied: "Copied" },
  { prefix: "/es", copy: "Copiar", copied: "Copiado" },
  { prefix: "/ar", copy: "نسخ", copied: "تم النسخ" },
]) {
  test(`code wraps and copies exact source on mobile ${locale.prefix || "en"}`, async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${locale.prefix}/tutorials/mirroring-east-hampton`);
    const pre = page.locator("pre:has(> code)");
    await expect(pre).toHaveCount(blocks.length);

    for (const [index, source] of blocks.entries()) {
      const block = pre.nth(index);
      await expect(block).toHaveAttribute("dir", "ltr");
      const container = block.locator("..");
      const copy = container.getByRole("button", { name: locale.copy, exact: true });
      await expect(copy).toHaveText("");
      await expect(copy.locator("svg")).toBeVisible();
      await copy.focus();
      await copy.press("Enter");
      await expect(container.getByRole("status")).toHaveText(locale.copied);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
      const fits = await block.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return element.scrollWidth <= element.clientWidth && bounds.left >= 0 && bounds.right <= innerWidth;
      });
      expect(fits, "wrapped code must fit the mobile viewport").toBe(true);
    }
  });
}

test("copy failure gives feedback and leaves text selectable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => { throw new Error("Clipboard denied"); } },
      configurable: true,
    });
  });
  await page.goto("/tutorials/mirroring-east-hampton");
  const block = page.locator("pre:has(> code)").first();
  const container = block.locator("..");
  await container.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(container.getByRole("status")).toHaveText("Copy failed. Select and copy the text.");
  expect(await block.textContent()).toBe(blocks[0]);
  expect(await block.evaluate((element) => getComputedStyle(element).userSelect)).not.toBe("none");
});
