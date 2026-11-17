"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getDirection } from "@/i18n/direction";
import { portalSans, portalSerif } from "./pipeline-fonts";
import {
  HOLD_AT,
  IMAGES,
  LOOP,
  T,
  counter,
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

/* The session text is a Claude Code transcript. It stays Latin English in
   every locale, like the file names and commands in it. */
const PROMPT = "Publish these four layers as a Portolan catalog";
const SAY = "I'll fetch the four sources, convert them, and build the catalog.";
const REPLY = "Done. The catalog is live as its own site:";
const SITE = "https://your-bucket.s3.amazonaws.com/";
const SPIN = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];
/** Seconds of story time per second of loop, for the spinner clock. */
const PACE = 19;

/*
 * One command per source, run in parallel. The two files are copied into
 * their collection folders, because `portolan add` takes a collection from
 * the folder a file is in. The two services are read by `portolan extract`
 * with `--raw`, so no catalog exists until `portolan init`. A finished
 * `portolan` line is the summary line that the command prints. While a
 * source is in flight, its line shows the progress the scene draws.
 */
const CMD = [
  "cp -r /mnt/gis-share/planning/dor_parcel .",
  "mkdir land_use && cp ~/Desktop/land_use.gpkg land_use/",
  "portolan extract arcgis --raw https://services.arcgis.com/…/FeatureServer/0 .",
  "portolan extract wfs --raw --layers zoning_basedistricts https://…/geoserver/ows .",
];
const nf = (n: number) => n.toLocaleString("en-US");
type Count = ReturnType<typeof counter>;
const LIVE: ((k: Count, done: boolean) => string)[] = [
  (k, done) =>
    done
      ? `<span class="hi">4 files</span> · 268 MB`
      : `copying · <span class="hi">${k.files} of 4 files</span> · ${k.mb} MB`,
  (k, done) =>
    done ? `<span class="hi">1 file</span> · 389 MB` : `copying · <span class="hi">${k.mb} MB</span>`,
  (k, done) =>
    done
      ? `✓ <span class="hi">Extracted 1/1 layers</span>`
      : `→ [1/1] li_building_footprints · <span class="hi">${nf(k.feat)} features</span>`,
  (k, done) =>
    done
      ? `✓ <span class="hi">Extracted 1/1 layers</span>`
      : `→ [1/1] zoning_basedistricts · <span class="hi">${nf(k.feat)} features</span>`,
];
/** The commands after the fetch: command, result, start, end. */
const LATER: [string, string, number, number][] = [
  [
    "portolan init --auto --license CC-BY-4.0",
    "✓ Initialized Portolan catalog in /home/you/phl-housing",
    T.init[0],
    T.init[1],
  ],
  [
    "portolan add . --pmtiles",
    `✓ <span class="hi">Added 4 files to 4 collections</span>`,
    T.conv[0],
    T.conv[1],
  ],
  ["portolan check", "✓ Catalog conforms (31 file(s) checked)", T.cat[0], T.cat[1]],
  [
    "portolan push s3://your-bucket/",
    `✓ <span class="hi">Pushed 4 collection(s), 4 version(s), 31 file(s)</span> (412.6 MB, avg 38.4 MiB/s)`,
    T.push[0],
    T.push[1],
  ],
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clockStr = (secs: number) => {
  const s = Math.max(0, Math.round(secs));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};

interface Row {
  el: HTMLDivElement;
  show: number;
  done: number;
  live?: number;
  full?: string;
  spin?: boolean;
  html?: string;
}

/** Builds the transcript rows and returns a function that sets them to time t. */
function createSession(root: HTMLElement, steps: HTMLElement[]) {
  const q = <E extends HTMLElement>(slot: string) =>
    root.querySelector(`[data-slot="${slot}"]`) as E;
  const rowsEl = q<HTMLDivElement>("rows");
  const view = q<HTMLDivElement>("view");
  const scrollEl = q<HTMLDivElement>("scroll");
  const welcome = q<HTMLDivElement>("welcome");
  const pin = q<HTMLDivElement>("pin");
  const typedEl = q<HTMLSpanElement>("typed");
  const caret = q<HTMLSpanElement>("caret");
  const hint = q<HTMLSpanElement>("hint");
  const field = typedEl.parentElement as HTMLElement;
  q<HTMLSpanElement>("pin-text").textContent = PROMPT;

  // The rows are fixed Latin strings from this file, so they are set as
  // markup. The commands are escaped, because they hold `&&`.
  rowsEl.replaceChildren();
  const R: Row[] = [];
  const addRow = (
    cls: string,
    html: string,
    show: number,
    done?: number,
    extra: Partial<Row> = {},
  ) => {
    const el = document.createElement("div");
    el.className = `pipe-row ${cls}`;
    el.innerHTML = html;
    rowsEl.appendChild(el);
    R.push({ el, show, done: done ?? show, ...extra });
    return el;
  };
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const tool = (cmd: string) =>
    `<span class="g">●</span><span><b>Bash</b>(<span class="arg">${esc(cmd)}</span>)</span>`;
  const res = (s: string) =>
    `<span class="g"></span><span>⎿&nbsp; <span class="rv">${s}</span></span>`;

  addRow("is-user", `<span class="g">❯</span><span>${PROMPT}</span>`, T.submit);
  addRow("is-say", `<span class="g">●</span><span>${SAY}</span>`, T.say, undefined, { full: SAY });
  CMD.forEach((cmd, i) => {
    addRow("is-tool is-nw", tool(cmd), T.ing[i][0], T.ing[i][1]);
    addRow("is-res", res(""), T.ing[i][0], T.ing[i][1], { live: i });
  });
  for (const [cmd, out, a, b] of LATER) {
    addRow("is-tool is-nw", tool(cmd), a, b);
    addRow("is-res", res(out), b);
  }
  addRow("is-say", `<span class="g">●</span><span>${REPLY}</span>`, T.reply, undefined, {
    full: REPLY,
  });
  addRow("is-list", `<span class="g"></span><span><span class="tok">${SITE}</span></span>`, T.list);
  const doneRow = addRow("is-done is-nw", `<span class="g">✻</span><span class="dt"></span>`, T.done);
  const spinRow = addRow(
    "is-spin",
    `<span class="g sp"></span><span><span class="verb"></span> <span class="meta"></span></span>`,
    T.submit,
    undefined,
    { spin: true },
  );
  const dt = doneRow.querySelector(".dt") as HTMLElement;
  const sp = spinRow.querySelector(".sp") as HTMLElement;
  const verb = spinRow.querySelector(".verb") as HTMLElement;
  const meta = spinRow.querySelector(".meta") as HTMLElement;

  let fitChars = 40;
  let heights: number[] = [];
  let gap = 6;
  let viewH = 300;
  let welcomeH = 0;
  let pinH = 0;

  /** Measure each row at its final size, so the scroll does not jump. */
  function measure() {
    const probe = document.createElement("span");
    probe.textContent = "0".repeat(20);
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
    field.appendChild(probe);
    const cw = probe.getBoundingClientRect().width / 20;
    probe.remove();
    fitChars = Math.max(10, Math.floor((field.getBoundingClientRect().width - 12) / cw));
    for (const r of R) {
      r.el.style.display = "";
      r.el.style.minHeight = "";
      r.html = undefined;
      if (r.full) (r.el.lastElementChild as HTMLElement).textContent = r.full;
      if (r.live !== undefined) {
        (r.el.querySelector(".rv") as HTMLElement).innerHTML = LIVE[r.live](
          counter(r.live, 99),
          false,
        );
      }
    }
    dt.textContent = "Worked for 3m 58s";
    verb.textContent = "Publishing…";
    heights = R.map(
      (r) =>
        r.el.getBoundingClientRect().height + (parseFloat(getComputedStyle(r.el).marginTop) || 0),
    );
    for (const r of R) {
      if (r.full) r.el.style.minHeight = `${r.el.getBoundingClientRect().height}px`;
    }
    gap = parseFloat(getComputedStyle(rowsEl).rowGap) || 6;
    welcomeH = welcome.getBoundingClientRect().height;
    pinH = pin.getBoundingClientRect().height;
    viewH = view.clientHeight - 14 - 8;
  }

  /** The height of the transcript at time t, and the top of each block. */
  function contentAt(t: number) {
    let h = welcomeH;
    let n = 0;
    const tops: number[] = [];
    R.forEach((r, k) => {
      const on = r.spin ? t >= T.submit && t < T.done : t >= r.show;
      if (!on) return;
      if (n) h += gap;
      // A result row hangs under its command, so a block starts at a
      // row that is not a result.
      if (!r.el.classList.contains("is-res") && !r.el.classList.contains("is-list")) tops.push(h);
      h += heights[k];
      n++;
    });
    return { h, tops };
  }

  function render(t: number, still: boolean) {
    const clearA = t >= T.reset ? 1 - smooth(0, 0.45, t - T.reset) : 1;
    const gone = t >= T.reset + 0.45;
    const n = Math.floor((t - T.typeStart) * T.cps);
    const shown =
      t < T.typeStart || t >= T.submit ? "" : PROMPT.slice(0, Math.min(n, PROMPT.length));
    typedEl.textContent =
      shown.length > fitChars ? "…" + shown.slice(shown.length - fitChars + 1) : shown;
    const typeEnd = T.typeStart + PROMPT.length / T.cps;
    const typing = t > T.typeStart && t < typeEnd + 0.1;
    caret.style.opacity = still || typing || t % 1 < 0.5 ? "1" : "0";

    const working = t >= T.submit && t < T.done && !gone;
    for (const r of R) {
      const on = r.spin ? working : t >= r.show && !gone;
      r.el.style.display = on ? "" : "none";
      if (!on) continue;
      const running = t < r.done;
      r.el.classList.toggle("is-running", running);
      if (r.el.classList.contains("is-tool")) {
        (r.el.firstElementChild as HTMLElement).style.opacity =
          running && Math.floor(t * 3) % 2 ? "0.25" : "1";
      }
      if (r.live !== undefined) {
        const html = LIVE[r.live](counter(r.live, t), !running);
        if (r.html !== html) {
          (r.el.querySelector(".rv") as HTMLElement).innerHTML = html;
          r.html = html;
        }
      }
      if (r.full) {
        const k = Math.floor((t - r.show) * 70);
        (r.el.lastElementChild as HTMLElement).textContent = r.full.slice(0, Math.max(1, k));
      }
    }
    if (working) {
      let v = "Thinking…";
      if (t >= T.ing[0][0]) v = "Fetching sources…";
      if (t >= T.init[0]) v = "Converting…";
      if (t >= T.cat[0]) v = "Cataloging…";
      if (t >= T.push[0]) v = "Publishing…";
      if (t >= T.reply) v = "Wrapping up…";
      sp.textContent = SPIN[Math.floor(t * 9) % SPIN.length];
      verb.textContent = v;
      const tokens = (t - T.submit) * 1.4;
      meta.textContent = `(${clockStr((t - T.submit) * PACE)} · ↓ ${tokens.toFixed(1)}k tokens)`;
    }
    hint.textContent = working ? "· esc to interrupt" : "(shift+tab to cycle)";
    dt.textContent = `Worked for ${clockStr((T.done - T.submit) * PACE)}`;

    // Keep the newest row in view, eased. The rest offsets snap to whole
    // blocks. The welcome box scrolls off in one piece, and past it the
    // pinned prompt covers the top of the view.
    const tt = gone ? T.reset : t;
    // Under the pin, the view starts at the top of a whole block, so the
    // pin never cuts a row in half.
    const snap = ({ h, tops }: { h: number; tops: number[] }) => {
      const need = h - viewH;
      if (need <= 0) return 0;
      if (need <= welcomeH) return welcomeH;
      const top = tops.find((y) => y >= need + pinH - 8) ?? need + pinH - 8;
      return top - pinH + 8;
    };
    let off = 0;
    let wsum = 0;
    for (let k = 0; k <= 8; k++) {
      const w = 1 - k / 9;
      off += snap(contentAt(tt - k * 0.035)) * w;
      wsum += w;
    }
    off /= wsum;
    if (t >= T.reset + 0.25) off *= 1 - inOut(clamp01((t - T.reset - 0.25) / 0.5));
    scrollEl.style.transform = `translateY(${-Math.round(off)}px)`;
    rowsEl.style.opacity = String(clearA);
    pin.style.visibility = off > welcomeH + 2 && !gone ? "visible" : "hidden";
    pin.style.opacity = String(clearA);

    const step = still ? -1 : stepAt(t);
    steps.forEach((el, k) => el.classList.toggle("is-on", k === step));
  }

  return { measure, render };
}

/**
 * The figure in the homepage solution section. Two halves on one clock.
 *
 * The left half is a Claude Code session. It fetches four Philadelphia
 * layers from four existing systems, converts them, catalogs them, and
 * pushes the catalog to a bucket. The right half is one canvas with a
 * camera that only moves down. The four sources sit in their systems at
 * the top. Files are copied and services are paged down into a local
 * folder, where each layer converts to GeoParquet and PMTiles. The four
 * plates drop into the catalog tree under `s3://your-bucket/`, and the tree
 * becomes the data portal of a fictional publisher. The camera then carries
 * on down to a fresh start, so the loop never runs backward.
 *
 * The drawing is in `pipeline-renderer.ts`. This component owns the
 * session, the lifecycle, and the clock. The thumbnails load when the
 * figure comes near the viewport. The canvas paints once they and the
 * fonts are in. The loop stops while the figure is off screen or the tab
 * is hidden. Under reduced motion it holds the finished portal.
 *
 * The figure is `dir="ltr"` in every locale. Only the step labels under
 * the scene follow the page direction.
 */
export function PipelineFigure() {
  const t = useTranslations("solution.figure");
  const dir = getDirection(useLocale());
  const figRef = useRef<HTMLElement>(null);
  const sessionRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fig = figRef.current;
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const sessionEl = sessionRef.current;
    const stepsEl = stepsRef.current;
    if (!fig || !scene || !canvas || !sessionEl || !stepsEl) return;

    const session = createSession(sessionEl, Array.from(stepsEl.children) as HTMLElement[]);
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
      session.render(at, !held && reduced);
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
      session.measure();
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
      <div className="pipe-halves" aria-hidden="true">
        <div ref={sessionRef} className="pipe-session">
          <div className="pipe-view" data-slot="view">
            <div className="pipe-scroll" data-slot="scroll">
              <div className="pipe-welcome" data-slot="welcome">
                <div className="pipe-box">
                  <p>
                    <span className="star">✻</span> Welcome to <b>Claude Code</b>
                  </p>
                  <p className="dim">cwd: ~/phl-housing · portolan skills installed</p>
                </div>
              </div>
              <div className="pipe-rows" data-slot="rows" />
            </div>
            <div className="pipe-pin" data-slot="pin">
              <span className="g">❯</span>
              <span data-slot="pin-text" />
            </div>
          </div>
          <div className="pipe-input">
            <span className="g">❯</span>
            <span className="pipe-field">
              <span data-slot="typed" />
              <span className="pipe-caret" data-slot="caret" />
            </span>
          </div>
          <div className="pipe-foot">
            <span />
            <span>
              <strong>⏵⏵ auto mode on</strong>{" "}
              <span data-slot="hint">(shift+tab to cycle)</span>
            </span>
          </div>
        </div>
        <div ref={sceneRef} className="pipe-scene">
          <canvas
            ref={canvasRef}
            className={`transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      </div>
      <div className="pipe-under" aria-hidden="true">
        <ol ref={stepsRef} dir={dir} className="pipe-steps">
          <li>{t("steps.ingest")}</li>
          <li>{t("steps.convert")}</li>
          <li>{t("steps.catalog")}</li>
          <li>{t("steps.publish")}</li>
        </ol>
      </div>
    </figure>
  );
}
