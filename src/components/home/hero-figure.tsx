"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  buildPalette,
  buildScene,
  decodeWorld,
  pointBudget,
  timeline,
  type Label,
  type LandMaskFile,
  type ReliefFile,
  type Rgb,
  type Tier,
  type World,
} from "./hero-points";
import { createRenderer, type Renderer } from "./hero-renderer";

// The canvas cannot read a CSS variable, so the brand tokens are read once
// from the figure. These values stand in when a token fails to parse.
const FALLBACK: Record<string, Rgb> = {
  "--p-bg": [252, 252, 250],
  "--p-primary": [65, 99, 204],
  "--p-primary-ink": [45, 74, 168],
  "--p-ink": [22, 23, 15],
};

function readToken(style: CSSStyleDeclaration, name: string): Rgb {
  const match = /^#([0-9a-f]{6})$/i.exec(style.getPropertyValue(name).trim());
  if (!match) return FALLBACK[name];
  const value = parseInt(match[1], 16);
  return [value >> 16, (value >> 8) & 255, value & 255];
}

// Both data files load once per page. A failed load clears the promise, so
// a later mount tries again.
let worldRequest: Promise<World> | null = null;

function loadWorld(): Promise<World> {
  if (!worldRequest) {
    const get = async <T,>(url: string): Promise<T> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url} failed: ${res.status}`);
      return res.json() as Promise<T>;
    };
    worldRequest = Promise.all([
      get<LandMaskFile>("/data/land-mask.json"),
      get<ReliefFile>("/data/world-relief.json"),
    ])
      .then(([mask, relief]) => decodeWorld(mask, relief))
      .catch((err) => {
        worldRequest = null;
        throw err;
      });
  }
  return worldRequest;
}

interface Listing {
  labels: Label[];
  fontPx: number;
  rule: { x: number; y: number; w: number };
}

/**
 * The homepage hero figure. One cloud of points draws a world map, moves
 * into a file listing in a storage bucket, and moves back, on a loop.
 *
 * The math lives in `hero-points.ts` and the drawing in `hero-renderer.ts`.
 * This component owns the lifecycle: it loads the data, sizes the canvas,
 * runs the clock, and places the file names as DOM text over the canvas.
 *
 * The loop stops while the figure is off screen or the tab is hidden. Under
 * reduced motion it draws the file listing once and never moves.
 *
 * The figure is `dir="ltr"` in every locale. A map does not mirror, and the
 * file names are Latin identifiers.
 */
export function HeroFigure({ className = "" }: { className?: string }) {
  const t = useTranslations("hero.figure");
  const figureRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const figure = figureRef.current;
    const canvas = canvasRef.current;
    const labels = labelsRef.current;
    if (!figure || !canvas || !labels) return;

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
    let lastH = 0;
    let lastLabel = -1;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;

    function paint() {
      if (!renderer || !built) return;
      const state = reduced ? { morph: 1, label: 1 } : timeline(clock);
      renderer.draw(state.morph);
      if (state.label !== lastLabel) {
        lastLabel = state.label;
        labels!.style.opacity = state.label.toFixed(3);
      }
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
      const box = figure!.getBoundingClientRect();
      const width = Math.round(box.width);
      const height = Math.round(box.height);
      if (width < 120 || height < 120) return;
      lastW = width;
      lastH = height;

      const cores = navigator.hardwareConcurrency || 4;
      const tier: Tier =
        renderer.kind === "2d" ? "canvas" : cores <= 4 ? "low" : "full";
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const style = getComputedStyle(figure!);
      const palette = buildPalette({
        bg: readToken(style, "--p-bg"),
        primary: readToken(style, "--p-primary"),
        primaryInk: readToken(style, "--p-primary-ink"),
        ink: readToken(style, "--p-ink"),
      });

      const scene = buildScene(
        world,
        width,
        height,
        pointBudget(width, height, tier),
      );
      renderer.setScene(scene, palette, dpr);
      built = true;
      setListing({
        labels: scene.labels,
        fontPx: scene.fontPx,
        rule: scene.rule,
      });
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
    viewport?.observe(figure);

    // The rail collapse resizes the figure with no window resize event, so
    // the figure is observed directly.
    const resize = new ResizeObserver(() => {
      const box = figure.getBoundingClientRect();
      if (
        Math.abs(box.width - lastW) < 2 &&
        Math.abs(box.height - lastH) < 2
      ) {
        return;
      }
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
        resize.observe(figure);
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
    <figure ref={figureRef} dir="ltr" className={`relative m-0 ${className}`}>
      <figcaption className="sr-only">{t("description")}</figcaption>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`absolute inset-0 block h-full w-full transition-opacity duration-700 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        ref={labelsRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 font-mono leading-[1.5] text-p-ink opacity-0 ${
          listing?.fontPx === 13 ? "text-small" : "text-eyebrow"
        }`}
      >
        {listing && (
          <span
            className="absolute block border-t border-p-line"
            style={{
              insetInlineStart: listing.rule.x,
              top: listing.rule.y,
              width: listing.rule.w,
            }}
          />
        )}
        {listing?.labels.map((label) => (
          <span
            key={label.id}
            className={`absolute whitespace-nowrap ${
              label.head ? "font-bold" : ""
            }`}
            style={{ insetInlineStart: label.x, top: label.y }}
          >
            {label.name}
            {label.note && (
              <span
                className={`text-p-primary-ink ${
                  label.stacked ? "block" : "ms-[1.2ch]"
                }`}
              >
                {label.note}
              </span>
            )}
          </span>
        ))}
      </div>
    </figure>
  );
}
