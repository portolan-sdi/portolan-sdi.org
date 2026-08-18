"use client";

import { useEffect, useRef, useState } from "react";

// Fires once, when the element first scrolls into view. Everything the hook
// drives is decorative, so a browser without IntersectionObserver — or a
// reader who asks for reduced motion — sees the finished state immediately.
export function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, revealed };
}
