"use client";

import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { linkEvent } from "@/lib/link-events";

// Sends the link events in `src/lib/link-events.ts`. The listener sits on the
// document in the capture phase, so a component that stops propagation still
// reports its clicks. `auxclick` catches a middle click, which opens a tab.
export function LinkTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.type === "auxclick" && event.button !== 1) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const found = linkEvent(
        anchor.href,
        window.location.origin,
        anchor.getAttribute("data-track"),
      );
      if (found) track(found.name, { target: found.target });
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, []);

  return null;
}
