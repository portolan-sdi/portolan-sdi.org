"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getDirection } from "@/i18n/direction";
import { portalSans, portalSerif } from "./pipeline-fonts";
import {
  HOLD_AT,
  IMAGES,
  LOOP,
  createPipelineRenderer,
  stepAt,
  type Palette,
  type Renderer,
} from "./pipeline-renderer";

// The canvas cannot read a CSS variable, so the tokens are read once from
// the figure. These values stand in when a token is empty.
const FALLBACK: Palette = {
  bg: "#fcfcfa",
  paper: "#ffffff",
  ink: "#16170f",
  ink2: "#3d3f33",
  ink3: "#74766a",
  line: "#16170f",
  primary: "#4163cc",
  primaryInk: "#2d4aa8",
  mono: "ui-monospace, Menlo, monospace",
  sans: "system-ui, sans-serif",
};

function readPalette(style: CSSStyleDeclaration): Palette {
  const token = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;
  return {
    bg: token("--p-bg", FALLBACK.bg),
    paper: token("--p-paper", FALLBACK.paper),
    ink: token("--p-ink", FALLBACK.ink),
    ink2: token("--p-ink-2", FALLBACK.ink2),
    ink3: token("--p-ink-3", FALLBACK.ink3),
    line: token("--p-line", FALLBACK.line),
    primary: token("--p-primary", FALLBACK.primary),
    primaryInk: token("--p-primary-ink", FALLBACK.primaryInk),
    mono: token("--p-mono", FALLBACK.mono),
    sans: token("--p-sans", FALLBACK.sans),
  };
}

/**
 * The figure in the homepage solution section. It sits beside the text of
 * the section from `lg`, and under it below `lg`.
 *
 * The figure is one canvas with a camera that only moves down. Four
 * Philadelphia layers sit in four existing systems at the top. Files are
 * copied and services are paged down into a local folder, where each layer
 * converts to GeoParquet and PMTiles. The four plates drop into the catalog
 * tree under `s3://your-bucket/`, and the tree becomes the data portal of a
 * fictional publisher. The camera then carries on down to a fresh start, so
 * the loop never runs backward.
 *
 * The figure had a Claude Code session beside the canvas. The session left
 * in November 2026, because the scene shows the same four steps.
 *
 * The drawing is in `pipeline-renderer.ts`. This component owns the
 * lifecycle and the clock. The thumbnails load when the figure comes near
 * the viewport. The canvas paints once they and the fonts are in. The loop
 * stops while the figure is off screen or the tab is hidden. Under reduced
 * motion it holds the finished portal.
 *
 * The figure is `dir="ltr"` in every locale. Only the step labels under
 * the scene follow the page direction.
 */
export function PipelineFigure() {
  const t = useTranslations("solution.figure");
  const dir = getDirection(useLocale());
  const figRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fig = figRef.current;
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const stepsEl = stepsRef.current;
    if (!fig || !scene || !canvas || !stepsEl) return;

    const steps = Array.from(stepsEl.children) as HTMLElement[];
    const imgs = IMAGES.map(() => new Image());
    let renderer: Renderer | null = null;
    let disposed = false;
    let loading = false;
    let built = false;
    let frame = 0;
    let clock = 0;
    let lastStamp = 0;
    let onScreen = false;
    let resizeTimer = 0;
    let lastW = 0;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;

    // In development, `?pipe=<seconds>` holds the loop at that second, so a
    // screenshot can catch any state. Production builds drop this branch.
    const pinned =
      process.env.NODE_ENV === "development"
        ? parseFloat(new URLSearchParams(window.location.search).get("pipe") ?? "")
        : NaN;
    const held = Number.isFinite(pinned);

    function paint() {
      if (!renderer || !built) return;
      const at = held ? ((pinned % LOOP) + LOOP) % LOOP : reduced ? HOLD_AT : clock;
      // No step is current while the figure holds its finished state.
      const step = !held && reduced ? -1 : stepAt(at);
      steps.forEach((el, k) => el.classList.toggle("is-on", k === step));
      renderer.draw(at);
    }

    function tick(now: number) {
      // A long gap means the page stalled. Do not jump the loop ahead.
      clock = (clock + Math.min(0.1, (now - lastStamp) / 1000)) % LOOP;
      lastStamp = now;
      paint();
      frame = requestAnimationFrame(tick);
    }

    /** Start or stop the loop to match what the page can see. */
    function sync() {
      const run = built && !reduced && !held && onScreen && !document.hidden;
      if (run && !frame) {
        lastStamp = performance.now();
        frame = requestAnimationFrame(tick);
      } else if (!run && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    function rebuild() {
      if (disposed || !renderer) return;
      const rect = scene!.getBoundingClientRect();
      if (rect.width < 200) return;
      lastW = rect.width;
      renderer.setSize(rect.width, rect.height, Math.min(3, window.devicePixelRatio || 1));
      built = true;
      setReady(true);
      paint();
      sync();
    }

    // The scene can change size with no window resize event, so it is
    // observed directly. CSS sets both its width and its height.
    const resize = new ResizeObserver(() => {
      const width = scene.getBoundingClientRect().width;
      if (Math.abs(width - lastW) < 2) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(rebuild, 160);
    });

    /** Fetch the thumbnails and the fonts, then build. Runs once. */
    function load() {
      if (loading) return;
      loading = true;
      const style = getComputedStyle(fig!);
      const palette = readPalette(style);
      const serif = style.getPropertyValue("--pipe-font-serif").trim() || "Georgia, serif";
      const sans = style.getPropertyValue("--pipe-font-sans").trim() || palette.sans;
      imgs.forEach((im, i) => {
        im.decoding = "async";
        im.src = IMAGES[i];
      });
      // `allSettled`, because a face or an image that fails must not stop
      // the figure. A missing thumbnail leaves its plate empty.
      const fonts = Promise.allSettled([
        document.fonts.load(`400 13px ${palette.mono}`),
        document.fonts.load(`500 10px ${palette.mono}`),
        document.fonts.load(`600 13px ${palette.mono}`),
        document.fonts.load(`650 13px ${palette.sans}`),
        document.fonts.load(`400 30px ${serif}`),
        document.fonts.load(`italic 400 30px ${serif}`),
        document.fonts.load(`500 19px ${serif}`),
        document.fonts.load(`600 20px ${serif}`),
        document.fonts.load(`400 12px ${sans}`),
        document.fonts.load(`500 12px ${sans}`),
        document.fonts.load(`600 12px ${sans}`),
      ]);
      const pictures = Promise.allSettled(imgs.map((im) => im.decode()));
      void Promise.all([fonts, pictures]).then(() => {
        if (disposed) return;
        renderer = createPipelineRenderer(canvas!, imgs, palette, { serif, sans });
        if (!renderer) return;
        rebuild();
        resize.observe(scene!);
      });
    }

    const onVisibility = () => sync();
    const onMotion = () => {
      reduced = motion.matches;
      paint();
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotion);

    // Two observers. The first starts the downloads a little before the
    // figure scrolls in. The second runs the clock only while it is seen.
    let near: IntersectionObserver | null = null;
    let viewport: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "undefined") {
      onScreen = true;
      load();
    } else {
      near = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          near?.disconnect();
          load();
        },
        { rootMargin: "800px 0px" },
      );
      viewport = new IntersectionObserver((entries) => {
        for (const entry of entries) onScreen = entry.isIntersecting;
        sync();
      });
      near.observe(fig);
      viewport.observe(fig);
    }

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotion);
      near?.disconnect();
      viewport?.disconnect();
      resize.disconnect();
    };
  }, []);

  return (
    <figure
      ref={figRef}
      dir="ltr"
      className={`pipe-fig m-0 ${portalSerif.variable} ${portalSans.variable}`}
    >
      <figcaption className="sr-only">{t("description")}</figcaption>
      <div ref={sceneRef} className="pipe-scene" aria-hidden="true">
        <canvas
          ref={canvasRef}
          className={`transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <ol ref={stepsRef} dir={dir} className="pipe-steps" aria-hidden="true">
        <li>{t("steps.ingest")}</li>
        <li>{t("steps.convert")}</li>
        <li>{t("steps.catalog")}</li>
        <li>{t("steps.publish")}</li>
      </ol>
    </figure>
  );
}
