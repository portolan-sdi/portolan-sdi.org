"use client";

import { useEffect, useState } from "react";

interface LiveCountProps {
  target?: number;
  durationMs?: number;
}

export function LiveCount({ target = 142, durationMs = 1400 }: LiveCountProps) {
  const [n, setN] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf: number | undefined;

    const stop = () => {
      if (raf !== undefined) cancelAnimationFrame(raf);
      raf = undefined;
    };

    const update = () => {
      stop();
      if (media.matches || durationMs <= 0) {
        setN(target);
        return;
      }

      const start = performance.now();
      const tick = (time: number) => {
        const progress = Math.min(1, (time - start) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        setN(Math.round(target * eased));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };

      raf = requestAnimationFrame(tick);
    };

    update();
    media.addEventListener("change", update);
    return () => {
      stop();
      media.removeEventListener("change", update);
    };
  }, [target, durationMs]);

  return <span className="tabular-nums">{n}</span>;
}
