import { expect, test } from "@playwright/test";
import { neutralizeMarkerHosts } from "../src/lib/marker-hosts";

test("marker normalization releases the Firefox main thread", async ({ page }) => {
  test.setTimeout(10_000);
  const source = neutralizeMarkerHosts.toString();

  const result = await page.evaluate(async (functionSource) => {
    const neutralize = (0, eval)(`(${functionSource})`) as (container: ParentNode) => void;
    const marker = document.createElement("div");
    marker.className = "maplibregl-marker";
    marker.setAttribute("aria-label", "Synthetic MapLibre marker");
    marker.setAttribute("role", "button");
    marker.setAttribute("tabindex", "0");
    marker.appendChild(document.createElement("button"));
    document.body.appendChild(marker);

    let callbacks = 0;
    const observer = new MutationObserver(() => {
      callbacks += 1;
      neutralize(document.body);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-label", "role", "tabindex"],
    });

    neutralize(document.body);
    await new Promise((resolve) => window.setTimeout(resolve, 250));
    observer.disconnect();

    return {
      callbacks,
      ariaLabel: marker.getAttribute("aria-label"),
      role: marker.getAttribute("role"),
      tabIndex: marker.getAttribute("tabindex"),
    };
  }, source);

  expect(result).toEqual({
    callbacks: 1,
    ariaLabel: null,
    role: "presentation",
    tabIndex: null,
  });
});
