"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getDirection } from "@/i18n/direction";
import { portalBody, portalHead } from "./pipeline-fonts";
import {
  HOLD_AT,
  ASSETS,
  LOOP,
  STEPS,
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

const STEP_KEYS = ["extract", "catalog", "build"] as const;

/** What the controls under the scene can ask the clock to do. */
interface Controls {
  /** Play step k from its start, then stop on its finished frame. */
  goTo(k: number): void;
  /** Go one step back (-1) or one step on (1), around the three. */
  move(by: number): void;
}

/**
 * The figure in the homepage solution section. It sits beside the text of
 * the section from `lg`, and under it below `lg`.
 *
 * The figure is one canvas with a camera that only moves down. It tells
 * three steps. Extract and convert: four Philadelphia layers sit in four
 * existing systems, and each one crosses a line and lands as GeoParquet
 * and PMTiles. Publish a catalog: the four plates drop into the catalog
 * tree under `s3://your-bucket/`. Build on top: the tree becomes the data
 * portal of a fictional publisher. The camera then carries on down to a
 * fresh start, so the loop never runs backward.
 *
 * The viewer steps through the figure. Each step label is a button that
 * plays its step and stops on the finished frame, and two arrow buttons
 * go one step back and one step on. Until the viewer uses a control, the
 * figure loops. After that it stays on the step the viewer chose.
 *
 * The drawing is in `pipeline-renderer.ts`. This component owns the
 * lifecycle and the clock. The thumbnails load when the figure comes near
 * the viewport. The canvas paints once they and the fonts are in. The loop
 * stops while the figure is off screen or the tab is hidden. Under reduced
 * motion the clock never runs. The figure shows the finished portal, and
 * a step button shows the finished frame of its step.
 *
 * The figure is `dir="ltr"` in every locale. Only the controls under the
 * scene follow the page direction.
 */
export function PipelineFigure() {
  const t = useTranslations("solution.figure");
  const dir = getDirection(useLocale());
  const figRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const controlsRef = useRef<Controls | null>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const fig = figRef.current;
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const stepsEl = stepsRef.current;
    if (!fig || !scene || !canvas || !stepsEl) return;

    const imgs = ASSETS.map(() => new Image());
    let renderer: Renderer | null = null;
    let disposed = false;
    let loading = false;
    let built = false;
    let frame = 0;
    let clock = 0;
    /** Where the clock stops next, or null while the figure loops. */
    let stopAt: number | null = null;
    let run = true;
    let shown = -1;
    let lastStamp = 0;
    let onScreen = false;
    let resizeTimer = 0;
    let lastW = 0;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    if (reduced) clock = HOLD_AT;

    function setRun(next: boolean) {
      run = next;
    }
    setRun(!reduced);

    // In development, `?pipe=<seconds>` holds the loop at that second, so a
    // screenshot can catch any state. Production builds drop this branch.
    const pinned =
      process.env.NODE_ENV === "development"
        ? parseFloat(new URLSearchParams(window.location.search).get("pipe") ?? "")
        : NaN;
    const held = Number.isFinite(pinned);

    function paint() {
      if (!renderer || !built) return;
      const at = held ? ((pinned % LOOP) + LOOP) % LOOP : clock;
      const step = stepAt(at);
      if (step !== shown) {
        shown = step;
        setActive(step);
      }
      renderer.draw(at);
    }

    function tick(now: number) {
      clock += Math.min(0.1, (now - lastStamp) / 1000);
      lastStamp = now;
      if (stopAt !== null && clock >= stopAt) {
        clock = stopAt;
        stopAt = null;
        frame = 0;
        setRun(false);
        paint();
        return;
      }
      clock %= LOOP;
      paint();
      frame = requestAnimationFrame(tick);
    }

    /** Start or stop the loop to match what the page can see. */
    function sync() {
      const go = built && run && !reduced && !held && onScreen && !document.hidden;
      if (go && !frame) {
        lastStamp = performance.now();
        frame = requestAnimationFrame(tick);
      } else if (!go && frame) {
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
      const head = style.getPropertyValue("--pipe-font-head").trim() || palette.sans;
      const body = style.getPropertyValue("--pipe-font-body").trim() || palette.sans;
      imgs.forEach((im, i) => {
        im.decoding = "async";
        im.src = ASSETS[i];
      });
      // `allSettled`, because a face or an image that fails must not stop
      // the figure. A missing thumbnail leaves its plate empty.
      const fonts = Promise.allSettled([
        document.fonts.load(`400 13px ${palette.mono}`),
        document.fonts.load(`500 10px ${palette.mono}`),
        document.fonts.load(`600 13px ${palette.mono}`),
        document.fonts.load(`650 13px ${palette.sans}`),
        document.fonts.load(`400 20px ${head}`),
        document.fonts.load(`700 11px ${head}`),
        document.fonts.load(`400 12px ${body}`),
        document.fonts.load(`700 11px ${body}`),
      ]);
      const pictures = Promise.allSettled(imgs.map((im) => im.decode()));
      void Promise.all([fonts, pictures]).then(() => {
        if (disposed) return;
        renderer = createPipelineRenderer(canvas!, imgs, palette, { head, body });
        if (!renderer) return;
        rebuild();
        resize.observe(scene!);
      });
    }

    const onVisibility = () => sync();
    controlsRef.current = {
      goTo(k) {
        if (held) return;
        const step = STEPS[k];
        if (reduced) {
          clock = step.hold;
        } else {
          clock = step.start;
          stopAt = step.hold;
        }
        setRun(!reduced);
        paint();
        sync();
      },
      move(by) {
        this.goTo((stepAt(clock) + by + STEPS.length) % STEPS.length);
      },
    };

    const onMotion = () => {
      reduced = motion.matches;
      if (reduced) {
        stopAt = null;
        clock = STEPS[stepAt(clock)].hold;
      }
      setRun(!reduced);
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
      controlsRef.current = null;
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
      className={`pipe-fig m-0 ${portalHead.variable} ${portalBody.variable}`}
    >
      <figcaption className="sr-only">{t("description")}</figcaption>
      <div ref={sceneRef} className="pipe-scene" aria-hidden="true">
        <canvas
          ref={canvasRef}
          className={`transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      </div>
      <div dir={dir} className="pipe-ctl">
        <ol ref={stepsRef} className="pipe-steps">
          {STEP_KEYS.map((key, k) => (
            <li key={key}>
              <button
                type="button"
                aria-current={active === k ? "step" : undefined}
                onClick={() => controlsRef.current?.goTo(k)}
              >
                <span aria-hidden="true">{k + 1}</span>
                {t(`steps.${key}`)}
              </button>
            </li>
          ))}
        </ol>
        <div className="pipe-nav">
          <button type="button" aria-label={t("previous")} onClick={() => controlsRef.current?.move(-1)}>
            <span aria-hidden="true" className="inline-block rtl:-scale-x-100">←</span>
          </button>
          <button type="button" aria-label={t("next")} onClick={() => controlsRef.current?.move(1)}>
            <span aria-hidden="true" className="inline-block rtl:-scale-x-100">→</span>
          </button>
        </div>
      </div>
    </figure>
  );
}
