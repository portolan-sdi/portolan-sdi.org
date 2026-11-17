"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  STILL,
  buildScene,
  buildWorld,
  decodeLand,
  stageAt,
  type LandMaskFile,
  type World,
} from "./hero-points";
import { createRenderer, type Palette, type Renderer } from "./hero-renderer";

// The canvas cannot read a CSS variable, so the brand tokens are read once
// from the figure. These values stand in when a token is empty.
const FALLBACK: Palette = {
  bg: "#fcfcfa",
  primary: "#4163cc",
  primaryInk: "#2d4aa8",
  ink: "#16170f",
  ink2: "#3d3f33",
  ink3: "#74766a",
  lineSoft: "#d6d5ca",
  mono: "ui-monospace, Menlo, monospace",
};

function readPalette(style: CSSStyleDeclaration): Palette {
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    bg: token("--p-bg", FALLBACK.bg),
    primary: token("--p-primary", FALLBACK.primary),
    primaryInk: token("--p-primary-ink", FALLBACK.primaryInk),
    ink: token("--p-ink", FALLBACK.ink),
    ink2: token("--p-ink-2", FALLBACK.ink2),
    ink3: token("--p-ink-3", FALLBACK.ink3),
    lineSoft: token("--p-line-soft", FALLBACK.lineSoft),
    mono: token("--p-mono", FALLBACK.mono),
  };
}

// The land mask loads once per page, and the map geometry derives from it
// once. A failed load clears the promise, so a later mount tries again.
let worldRequest: Promise<World> | null = null;

function loadWorld(): Promise<World> {
  if (!worldRequest) {
    worldRequest = fetch("/data/land-mask.json")
      .then((res) => {
        if (!res.ok) throw new Error(`land mask failed: ${res.status}`);
        return res.json() as Promise<LandMaskFile>;
      })
      .then((file) => buildWorld(decodeLand(file)))
      .catch((err) => {
        worldRequest = null;
        throw err;
      });
  }
  return worldRequest;
}

/**
 * The homepage hero figure. It has two states that never show together. A
 * globe of points turns. Then the points move into a catalog, drawn as a
 * directory tree under `s3://your-bucket/` with a role note beside the
 * light files. The GeoParquet file and the COG each have a drawing that
 * shows the world map. Then the same move runs backward, on a loop.
 *
 * The math is in `hero-points.ts` and the drawing in `hero-renderer.ts`.
 * This component owns the lifecycle: it loads the land mask, sizes the
 * canvas, and runs the clock.
 *
 * The figure picks its form from its own width. The wide form has the tree
 * on the left and the drawings on the right. The stacked form has each
 * drawing under its file name. Each form has a fixed height, which the
 * container query below reserves, so the page does not shift when the land
 * mask arrives. The heights and the query width match the layout
 * in `hero-points.ts`, so change both together.
 *
 * The loop stops while the figure is off screen or the tab is hidden. Under
 * reduced motion it draws the catalog once and never moves.
 *
 * The figure is `dir="ltr"` in every locale. A globe does not mirror, and
 * the file names are Latin identifiers.
 */
export function HeroFigure({ className = "" }: { className?: string }) {
  const t = useTranslations("hero.figure");
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const box = frameRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;

    let disposed = false;
    let renderer: Renderer | null = null;
    let world: World | null = null;
    let built = false;
    let frame = 0;
    let clock = 0;
    let lastStamp = 0;
    let onScreen = true;
    let resizeTimer = 0;
    let lastW = 0;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;

    function paint() {
      if (!renderer || !built) return;
      renderer.draw(reduced ? STILL : stageAt(clock));
    }

    function tick(now: number) {
      // A long gap means the page stalled. Do not jump the loop ahead.
      clock += Math.min(0.1, (now - lastStamp) / 1000);
      lastStamp = now;
      paint();
      frame = requestAnimationFrame(tick);
    }

    /** Start or stop the loop to match what the page can see. */
    function sync() {
      const run = built && !reduced && onScreen && !document.hidden;
      if (run && !frame) {
        lastStamp = performance.now();
        frame = requestAnimationFrame(tick);
      } else if (!run && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    function rebuild() {
      if (disposed || !renderer || !world) return;
      const width = Math.round(box!.getBoundingClientRect().width);
      if (width < 200) return;
      lastW = width;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const palette = readPalette(getComputedStyle(box!));
      renderer.setScene(buildScene(world, width), palette, dpr);
      built = true;
      setReady(true);
      paint();
      sync();
    }

    const onVisibility = () => sync();
    const onMotion = () => {
      reduced = motion.matches;
      paint();
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);

    const viewport =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            for (const entry of entries) onScreen = entry.isIntersecting;
            sync();
          });
    viewport?.observe(box);

    // The figure can change size with no window resize event, so the figure
    // is observed directly. Only its width matters. CSS sets the height.
    const resize = new ResizeObserver(() => {
      const width = box.getBoundingClientRect().width;
      if (Math.abs(width - lastW) < 2) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 160);
    });

    loadWorld()
      .then((loaded) => {
        if (disposed) return;
        world = loaded;
        renderer = createRenderer(canvas);
        if (!renderer) return;
        rebuild();
        resize.observe(box);
        // The canvas draws its text with the mono web font. Ask for both
        // weights and paint again once they are in, so the text does not
        // stay in a fallback face.
        const mono = readPalette(getComputedStyle(box)).mono;
        // `allSettled`, because a face that fails to load must not stop
        // the repaint or raise an unhandled rejection.
        void Promise.allSettled([
          document.fonts.load(`13px ${mono}`),
          document.fonts.load(`600 13px ${mono}`),
        ]).then(() => {
          if (!disposed) paint();
        });
      })
      .catch((err) => {
        console.error("Hero figure data failed to load:", err);
      });

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
      viewport?.disconnect();
      resize.disconnect();
      renderer?.destroy();
    };
  }, []);

  return (
    <figure dir="ltr" className={`@container m-0 ${className}`}>
      <figcaption className="sr-only">{t("description")}</figcaption>
      <div
        ref={frameRef}
        className="relative h-[465px] @[520px]:h-[429px]"
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`absolute inset-0 block h-full w-full transition-opacity duration-700 ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </figure>
  );
}
