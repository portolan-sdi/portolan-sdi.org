/**
 * Canvas 2D drawing for the homepage solution figure, the right half of
 * `PipelineFigure`.
 *
 * The scene is one tall world, read from the top down, and a camera that
 * only ever moves down through it:
 *
 *   the existing systems, outside        (y from 0)
 *   a boundary, then ~/phl-housing       (where the data lands, converts)
 *   s3://your-bucket/                    (the catalog tree)
 *   the portal                           (one frame tall)
 *
 * and then the systems again, so the loop restarts by carrying on down.
 * Four real thumbnails are the objects that travel. Each source has its own
 * lane, and every object moves straight down its lane.
 *
 * The timeline `T` is shared with the session in `pipeline-figure.tsx`, so
 * the two halves run on one clock.
 */

/* ===================================================================
   Timeline. Four stages, in order: ingest, convert, catalog, publish.
   =================================================================== */

/** The length of one loop, in seconds. */
export const LOOP = 23.2;
/** The frame that reduced motion holds: the portal, with the session done. */
export const HOLD_AT = 17;

export const T = {
  typeStart: 0.3,
  cps: 42,
  submit: 1.55,
  say: 1.7,
  /** Ingest: one window per source, overlapping like parallel tool calls. */
  ing: [
    [2.0, 3.3],
    [2.75, 3.95],
    [3.35, 6.7],
    [4.5, 6.95],
  ] as [number, number][],
  /** Convert: `portolan init`, then one `portolan add` for all four. */
  init: [7.15, 7.5] as [number, number],
  conv: [7.55, 9.95] as [number, number],
  convAt: 7.9,
  convStep: 0.36,
  convDur: 0.9,
  /** Catalog: the plates drop into the bucket, the docs are written. */
  cat: [10.1, 12.1] as [number, number],
  dropAt: 10.3,
  dropStep: 0.28,
  dropDur: 1.0,
  docsAt: 11.7,
  push: [12.25, 12.95] as [number, number],
  /** Publish: the tree becomes the portal. */
  morph: 13.05,
  reply: 13.35,
  list: 13.75,
  done: 14.15,
  /** The camera carries on down into a fresh start. */
  reset: 20.8,
  resetDur: 1.5,
};

/** Which of the four steps is current at time t, or -1 for none. */
export function stepAt(t: number): number {
  if (t >= T.ing[0][0] && t < T.init[0]) return 0;
  if (t >= T.init[0] && t < T.cat[0]) return 1;
  if (t >= T.cat[0] && t < T.morph) return 2;
  if (t >= T.morph && t < T.reset) return 3;
  return -1;
}

/* ===================================================================
   The four collections and the systems they live in today. Titles,
   descriptions, and row counts are from the real catalog. The sizes and
   the share and desktop paths are illustrative.
   =================================================================== */
type How = "copy" | "pages" | "stream";
interface Collection {
  id: string;
  title: string;
  rows: number;
  kind: string;
  how: How;
  loc: string;
  file: string;
  /** The shorter file label for the narrow form. */
  nfile: string;
  sheets?: number;
  mb?: number;
  tag?: string;
  req?: string;
  strips?: number;
  pages?: number;
  desc: string;
}

export const COL: Collection[] = [
  {
    id: "dor_parcel", title: "Property Parcels", rows: 608124,
    kind: "Shapefile", how: "copy", loc: "//gis-share/planning/", file: "parcels.shp", nfile: "parcels.shp",
    sheets: 4, mb: 268,
    desc: "Boundaries of every real estate property parcel in Philadelphia, drawn from legally recorded deed documents.",
  },
  {
    id: "land_use", title: "Land Use", rows: 559077,
    kind: "GeoPackage", how: "copy", loc: "~/Desktop/", file: "land_use.gpkg", nfile: "land_use.gpkg",
    sheets: 1, mb: 389,
    desc: "Land use assigned to each parcel in Philadelphia, maintained by the City Planning Commission.",
  },
  {
    id: "li_building_footprints", title: "Building Footprints", rows: 546083,
    kind: "ArcGIS REST", how: "pages", loc: "services.arcgis.com/…", file: "FeatureServer/0", nfile: "FeatureServer",
    tag: "REST", req: "GET /query", strips: 8, pages: 274,
    desc: "Outlines of buildings and related structures across Philadelphia, captured photogrammetrically from aerial imagery.",
  },
  {
    id: "zoning_basedistricts", title: "Zoning Base Districts", rows: 29210,
    kind: "WFS", how: "stream", loc: "…/geoserver/ows", file: "ows?service=WFS", nfile: "geoserver/ows",
    tag: "OGC WFS", req: "GetFeature", strips: 14,
    desc: "Boundaries of the zoning base districts under the zoning code that took effect in August 2012.",
  },
];

/** The thumbnail of each collection, in `COL` order. */
export const IMAGES = COL.map((c) => `/img/home/pipeline/${c.id}.webp`);

const ADDR = "your-bucket.s3.amazonaws.com";
const nf = (n: number) => n.toLocaleString("en-US");

/* ===================================================================
   Helpers
   =================================================================== */
interface Rect { x: number; y: number; w: number; h: number }
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const prog = (t: number, a: number, d: number) => clamp01((t - a) / d);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const out3 = (x: number) => 1 - Math.pow(1 - x, 3);
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t),
});

/* ===================================================================
   Stage state, as pure functions of t.
   =================================================================== */
const ingP = (i: number, t: number) => prog(t, T.ing[i][0], T.ing[i][1] - T.ing[i][0]);
const convP = (i: number, t: number) => prog(t, T.convAt + i * T.convStep, T.convDur);
const dropP = (i: number, t: number) => prog(t, T.dropAt + i * T.dropStep, T.dropDur);
/** The three small cards leave the tree first, the featured plate last. */
const morphStart = (i: number) => [0.55, 0.36, 0.23, 0.1][i] + T.morph;
const morphP = (i: number, t: number) => prog(t, morphStart(i), i === 0 ? 1.0 : 1.1);

/** A copied file: sheet k leaves the source and travels down its lane. */
function sheetP(i: number, k: number, t: number) {
  const a = T.ing[i][0];
  return i === 0 ? prog(t, a + 0.08 + k * 0.012, 0.95) : prog(t, a + 0.08, 1.1);
}
/** A service: request k goes up, then its page comes down. */
function reqWindow(i: number, k: number): [number, number] {
  const a = T.ing[i][0];
  if (COL[i].how === "pages") {
    const q = a + 0.1 + k * 0.36;
    return [q, q + 0.2];
  }
  return [a + 0.1, a + 0.4];
}
function stripP(i: number, k: number, t: number) {
  const a = T.ing[i][0];
  if (COL[i].how === "pages") return prog(t, a + 0.28 + k * 0.36, 0.5);
  return prog(t, a + 0.45 + k * 0.11, 0.55);
}
/** How much of source i has arrived, 0..1, from the moving parts. */
function arrived(i: number, t: number) {
  const c = COL[i];
  let s = 0;
  if (c.how === "copy") {
    for (let k = 0; k < c.sheets!; k++) s += sheetP(i, k, t);
    return s / c.sheets!;
  }
  for (let k = 0; k < c.strips!; k++) s += stripP(i, k, t);
  return s / c.strips!;
}
/** The counter under each landing slot, shared with the session. */
export function counter(i: number, t: number) {
  const c = COL[i];
  const f = arrived(i, t);
  if (c.how === "copy") {
    let files = 0;
    for (let k = 0; k < c.sheets!; k++) if (sheetP(i, k, t) >= 1) files++;
    return { f, files, mb: Math.round(c.mb! * f), page: 0, feat: 0 };
  }
  if (c.how === "pages") {
    const page = Math.min(c.pages!, Math.ceil(f * c.pages! - 1e-6));
    return { f, files: 0, mb: 0, page, feat: f >= 1 ? c.rows : Math.min(c.rows, page * 2000) };
  }
  return { f, files: 0, mb: 0, page: 0, feat: Math.round(c.rows * f) };
}

/* ===================================================================
   The renderer
   =================================================================== */

/** The site tokens the figure draws with, read from CSS at runtime. */
export interface Palette {
  bg: string;
  paper: string;
  ink: string;
  ink2: string;
  ink3: string;
  line: string;
  primary: string;
  primaryInk: string;
  mono: string;
  sans: string;
}
/** The two faces of the fictional publisher's portal. */
export interface PortalFonts {
  serif: string;
  sans: string;
}

/*
 * The brand of Rowhouse Atlas, the fictional publisher whose portal the
 * catalog becomes. It is that publisher's palette, not Portolan's, so it
 * lives here as canvas constants. Warm paper, brick, and ink.
 */
const BRAND = {
  paper: "#f6f1e8",
  ink: "#231d18",
  ink2: "#4d4338",
  ink3: "#6f6457",
  brick: "#a8361f",
};
/** The wordmark: a row of three gabled roofs. */
const ROOFS = "M1 17V7l4-5 4 5v10M9 17V7l4-5 4 5v10M17 17V7l4-5 4 5v10M1 17h24";

export interface Renderer {
  /** Size the canvas to its box. Call on mount and on resize. */
  setSize(width: number, height: number, dpr: number): void;
  draw(t: number): void;
}

interface Tree {
  top: number;
  FROW: number;
  ox: number;
  rootBase: number;
  trunkX: number;
  nameX: number;
  noteX: number;
  docs: number[];
  fold: number[];
  bottom: number;
}
interface Portal {
  y0: number;
  chromeH: number;
  pad: number;
  brickY: number;
  headY: number;
  headH: number;
  rule1: number;
  eyebrowY: number;
  titleSize: number;
  titleY: number[];
  ledeY: number;
  rule2: number;
  feat: Rect;
  featCol: { x: number; w: number };
  featTitle: { x: number; y: number; size: number };
  rule3: number;
  cards: { img: Rect; title: { x: number; y: number; size: number } }[];
}
interface Layout {
  wide: boolean;
  cw: number;
  kick: number;
  text0: number;
  lineH: number;
  src: Rect[];
  boundary: number;
  land: Rect[];
  lab: number[];
  landBottom: number;
  tree: Tree;
  fold: Rect[];
  c0: number;
  c1: number;
  cT: number;
  c2: number;
  Pd: number;
  P: Portal;
}

export function createPipelineRenderer(
  canvas: HTMLCanvasElement,
  imgs: HTMLImageElement[],
  C: Palette,
  F: PortalFonts,
): Renderer | null {
  const maybe = canvas.getContext("2d");
  if (!maybe) return null;
  const g: CanvasRenderingContext2D = maybe;
  const roofs = new Path2D(ROOFS);
  const MONO = C.mono;
  const SANS = C.sans;
  const SERIF = F.serif;
  const PSANS = F.sans;

  let W = 0;
  let H = 0;
  let dpr = 1;
  let L: Layout;

  /* ------------------------------------------------------------ layout */
  function layout() {
    const wide = W >= 520;
    const A = 683 / 1024;

    // Four lanes, one per source. The lanes sit inside the frame with room
    // for the server boxes, which draw a few pixels outside their plate.
    const gx = wide ? 16 : 10;
    const inset = wide ? 5 : 4;
    const cw = (W - 2 * inset - 3 * gx) / 4;
    const ch = cw * A;
    const lineH = wide ? 15 : 13;
    const nLines = wide ? 3 : 2;
    // The first station is centered in the first frame.
    const contentH = 42 + (nLines - 1) * lineH + (wide ? 30 : 25) + ch +
      (wide ? 66 : 52) + (wide ? 36 : 30) + ch + (wide ? 38 : 48);
    const top = Math.max(0, Math.round((H - contentH) * 0.42));
    const kick = top + (wide ? 16 : 14);
    const text0 = top + (wide ? 42 : 36);
    const thumbY = Math.round(text0 + (nLines - 1) * lineH + (wide ? 30 : 25));
    const lane = [0, 1, 2, 3].map((i) => Math.round(inset + i * (cw + gx)));
    const src = lane.map((x) => ({ x, y: thumbY, w: cw, h: ch }));
    const boundary = Math.round(thumbY + ch + (wide ? 66 : 52));
    const land = lane.map((x) => ({ x, y: boundary + (wide ? 36 : 30), w: cw, h: ch }));
    const lb = land[0].y + ch;
    const lab = wide ? [lb + 17, lb + 33] : [lb + 15, lb + 29, lb + 43];
    const landBottom = wide ? lb + 38 : lb + 48;

    // The catalog tree under the bucket.
    const ttop = Math.round(landBottom + (wide ? 58 : 44));
    const ROW = 22;
    const FROW = wide ? 50 : 44;
    const tw = wide ? 60 : 48;
    const th = tw * A;
    const ox = inset;
    const fold = [0, 1, 2, 3].map((i) => ttop + ROW * 4 + 4 + FROW * i);
    const tree: Tree = {
      top: ttop,
      FROW,
      ox,
      rootBase: ttop + 15,
      trunkX: ox + 6,
      nameX: ox + 22,
      noteX: ox + (wide ? 214 : 150),
      docs: [0, 1, 2].map((k) => ttop + ROW * (k + 1)),
      fold,
      bottom: fold[3] + FROW,
    };
    const foldR = fold.map((y) => ({ x: ox + 22, y: y + Math.round((FROW - 8 - th) / 2), w: tw, h: th }));

    // Camera stops. The camera only ever moves down.
    const c0 = 0;
    const c1 = boundary - 10;
    const c2 = Math.max(c1, tree.top - 14);
    // Once the plates have dropped, the tree is centered in the frame.
    const cT = Math.min(c2, Math.max(c1, tree.bottom + 16 - H, Math.round((tree.top + tree.bottom - H) / 2)));

    L = {
      wide, cw, kick, text0, lineH, src, boundary, land, lab, landBottom,
      tree, fold: foldR, c0, c1, cT, c2, Pd: c2 + H,
      P: portalLayout(wide, c2),
    };
  }

  /** The portal, one frame tall, in world coordinates. */
  function portalLayout(wide: boolean, y0: number): Portal {
    const pad = wide ? 20 : 16;
    const headY = y0 + 34;
    const headH = wide ? 44 : 40;
    const rule1 = headY + headH;
    const eyebrowY = rule1 + (wide ? 22 : 20);
    const titleSize = wide ? 30 : 26;
    const titleY = wide ? [eyebrowY + 33] : [eyebrowY + 29, eyebrowY + 57];
    const ledeY = wide ? titleY[0] + 22 : 0;
    const rule2 = (wide ? ledeY : titleY[1]) + 16;
    const base = { y0, chromeH: 30, pad, brickY: y0 + 30, headY, headH, rule1, eyebrowY, titleSize, titleY, ledeY, rule2 };
    if (wide) {
      const fw = 276;
      const fh = Math.round((fw * 683) / 1024);
      const feat = { x: pad, y: rule2 + 14, w: fw, h: fh };
      const featCol = { x: pad + fw + 18, w: W - pad - (pad + fw + 18) };
      const rule3 = feat.y + fh + 14;
      const gap = 14;
      const cwid = (W - 2 * pad - 2 * gap) / 3;
      const chh = Math.round((cwid * 683) / 1024);
      return {
        ...base, feat, featCol, featTitle: { x: featCol.x, y: feat.y + 40, size: 19 }, rule3,
        cards: [0, 1, 2].map((k) => ({
          img: { x: pad + k * (cwid + gap), y: rule3 + 12, w: cwid, h: chh },
          title: { x: pad + k * (cwid + gap), y: rule3 + 12 + chh + 18, size: 14 },
        })),
      };
    }
    const gap = 10;
    const cwid = (W - 2 * pad - 2 * gap) / 3;
    const chh = Math.round((cwid * 683) / 1024);
    // The featured plate fills the column on a phone. In a wider narrow
    // frame, as at `lg` just past the breakpoint, it shrinks so the cards
    // still fit in the frame.
    const room = y0 + H - (rule2 + 12) - 25 - 32 - 11 - chh - 14;
    const fw = Math.min(W - 2 * pad, Math.floor((room * 1024) / 683));
    const fh = Math.round((fw * 683) / 1024);
    const feat = { x: pad, y: rule2 + 12, w: fw, h: fh };
    const featTitle = { x: pad, y: feat.y + fh + 25, size: 18 };
    const rule3 = featTitle.y + 32;
    return {
      ...base, feat, featCol: { x: pad, w: fw }, featTitle, rule3,
      cards: [0, 1, 2].map((k) => ({
        img: { x: pad + k * (cwid + gap), y: rule3 + 11, w: cwid, h: chh },
        title: { x: pad + k * (cwid + gap), y: rule3 + 11 + chh + 16, size: 12 },
      })),
    };
  }
  const portalImg = (i: number) => (i === 0 ? L.P.feat : L.P.cards[i - 1].img);

  /* -------------------------------------------------------- primitives */
  const px = (v: number) => Math.round(v * dpr) / dpr;
  function hline(x1: number, x2: number, y: number, color: string, a = 1, w = 1) {
    if (a <= 0) return;
    g.globalAlpha = a;
    g.fillStyle = color;
    g.fillRect(px(x1), px(y), px(x2) - px(x1), w);
  }
  function vline(x: number, y1: number, y2: number, color: string, a = 1, w = 1) {
    if (a <= 0) return;
    g.globalAlpha = a;
    g.fillStyle = color;
    g.fillRect(px(x), px(y1), w, px(y2) - px(y1));
  }
  function rectStroke(r: Rect, color: string, a = 1, w = 1) {
    if (a <= 0) return;
    g.globalAlpha = a;
    g.fillStyle = color;
    const x = px(r.x), y = px(r.y), x2 = px(r.x + r.w), y2 = px(r.y + r.h);
    g.fillRect(x, y, x2 - x, w);
    g.fillRect(x, y2 - w, x2 - x, w);
    g.fillRect(x, y, w, y2 - y);
    g.fillRect(x2 - w, y, w, y2 - y);
  }
  function dashRect(r: Rect, color: string, a = 1) {
    if (a <= 0) return;
    g.globalAlpha = a;
    g.strokeStyle = color;
    g.lineWidth = 1;
    g.setLineDash([4, 3]);
    g.strokeRect(px(r.x) + 0.5, px(r.y) + 0.5, px(r.x + r.w) - px(r.x) - 1, px(r.y + r.h) - px(r.y) - 1);
    g.setLineDash([]);
  }
  function fillRect(r: Rect, color: string, a = 1) {
    if (a <= 0) return;
    g.globalAlpha = a;
    g.fillStyle = color;
    g.fillRect(px(r.x), px(r.y), px(r.x + r.w) - px(r.x), px(r.y + r.h) - px(r.y));
  }
  function text(
    s: string, x: number, y: number, color: string, size: number, a = 1,
    weight = 400, family = MONO, spacing = 0, style = "",
  ) {
    if (a <= 0.003 || !s) return 0;
    g.globalAlpha = a;
    g.font = `${style} ${weight} ${size}px ${family}`;
    g.fillStyle = color;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.letterSpacing = spacing ? `${spacing}px` : "0px";
    g.fillText(s, x, y);
    const w = g.measureText(s).width;
    g.letterSpacing = "0px";
    return w;
  }
  function measure(s: string, size: number, weight = 400, family = MONO, spacing = 0) {
    g.font = `${weight} ${size}px ${family}`;
    g.letterSpacing = spacing ? `${spacing}px` : "0px";
    const w = g.measureText(s).width;
    g.letterSpacing = "0px";
    return w;
  }
  function fit(s: string, maxW: number, size: number, weight = 400, family = MONO) {
    if (measure(s, size, weight, family) <= maxW) return s;
    let lo = 0, hi = s.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (measure(s.slice(0, mid) + "…", size, weight, family) <= maxW) lo = mid;
      else hi = mid - 1;
    }
    return s.slice(0, lo).trimEnd() + "…";
  }
  function wrap(s: string, maxW: number, maxLines: number, size: number, weight: number, family: string) {
    const lines: string[] = [];
    let cur = "";
    for (const w of s.split(" ")) {
      const tryS = cur ? `${cur} ${w}` : w;
      if (measure(tryS, size, weight, family) <= maxW) {
        cur = tryS;
        continue;
      }
      lines.push(cur);
      cur = w;
    }
    if (cur) lines.push(cur);
    if (lines.length > maxLines) {
      const rest = lines.slice(maxLines - 1).join(" ");
      lines.length = maxLines;
      lines[maxLines - 1] = fit(rest, maxW, size, weight, family);
    }
    return lines;
  }
  /** A real thumbnail, drawn from its full source pixels (or one band of them). */
  function plate(i: number, r: Rect, a = 1, v0 = 0, v1 = 1) {
    if (a <= 0.003 || r.w < 1 || r.h < 0.5) return;
    const im = imgs[i];
    if (!im || !im.complete || !im.naturalWidth) return;
    g.globalAlpha = a;
    const x = px(r.x), y = px(r.y), w = px(r.x + r.w) - x, h = px(r.y + r.h) - y;
    const nh = im.naturalHeight;
    g.drawImage(im, 0, v0 * nh, im.naturalWidth, (v1 - v0) * nh, x, y, w, h);
  }
  function typed(s: string, t: number, at: number, cps = 60) {
    if (t < at) return "";
    return s.slice(0, Math.max(1, Math.floor((t - at) * cps)));
  }

  function camAt(t: number) {
    let c = L.c0;
    c = lerp(c, L.c1, inOut(prog(t, 6.95, 1.25)));
    c = lerp(c, L.cT, inOut(prog(t, 11.5, 1.2)));
    c = lerp(c, L.c2, inOut(prog(t, T.morph, 1.45)));
    c = lerp(c, L.Pd, inOut(prog(t, T.reset, T.resetDur)));
    return c;
  }

  /* ------------------------------------------------ 1. the outside world */
  function drawOutside(off: number, t: number, live: boolean) {
    const wide = L.wide;
    const x0 = L.src[0].x;
    // the edge of the outside
    hline(0, W, off + L.boundary, C.line, 1, 2);
    text("Existing systems", x0, off + L.kick, C.ink3, wide ? 11 : 10.5);
    text("~/phl-housing", x0, off + L.boundary + (wide ? 18 : 16), C.ink3, wide ? 11 : 10.5);
    // empty places inside, waiting for the data
    for (let i = 0; i < 4; i++) {
      const a = live ? 1 - smooth(0, 0.1, ingP(i, t)) : 1;
      const r = L.land[i];
      dashRect({ x: r.x, y: off + r.y, w: r.w, h: r.h }, C.ink3, a * 0.7);
    }
    for (let i = 0; i < 4; i++) drawSource(i, off, live ? t : -1);
  }

  /** One existing system, drawn as the thing it is, with its data inside. */
  function drawSource(i: number, off: number, t: number) {
    const c = COL[i], wide = L.wide;
    const r = { ...L.src[i], y: L.src[i].y + off };
    const busy = t >= T.ing[i][0] && t < T.ing[i][1] + 0.15;
    const y0 = off + L.text0;
    text(c.kind, r.x, y0, busy ? C.primaryInk : C.ink, wide ? 13 : 11.5, 1, 650, SANS);
    if (wide) {
      text(fit(c.loc, L.cw, 10.5), r.x, y0 + L.lineH, C.ink3, 10.5);
      text(fit(c.file, L.cw, 10.5), r.x, y0 + 2 * L.lineH, C.ink2, 10.5);
    } else {
      text(fit(c.nfile, L.cw, 9.5), r.x, y0 + L.lineH, C.ink3, 9.5);
    }
    if (c.how === "copy" && c.sheets! > 1) {
      // A Shapefile is four files: .shp with .dbf, .shx, and .prj behind it.
      for (let k = c.sheets! - 1; k >= 1; k--) {
        const s = { x: r.x + k * 3, y: r.y - k * 3, w: r.w, h: r.h };
        fillRect(s, C.paper);
        rectStroke(s, C.line);
      }
      plate(i, r);
      rectStroke(r, C.line);
    } else if (c.how === "copy") {
      // A GeoPackage is one file.
      plate(i, r);
      rectStroke(r, C.line);
      dogEar(r, wide ? 13 : 9);
    } else {
      // A service: the data behind an endpoint.
      const p = wide ? 4 : 3, sh = wide ? 16 : 13;
      const box = { x: r.x - p, y: r.y - sh - p, w: r.w + 2 * p, h: r.h + sh + 2 * p };
      fillRect(box, C.paper);
      fillRect({ x: box.x, y: box.y, w: box.w, h: sh + 1 }, C.ink);
      text(c.tag!, box.x + 6, box.y + sh - (wide ? 4.5 : 3.5), C.bg, wide ? 9.5 : 8.5, 1, 500);
      // vents, so it reads as a machine
      for (let k = 0; k < 3; k++) {
        hline(box.x + box.w - 8 - k * 5, box.x + box.w - 5 - k * 5, box.y + sh / 2, C.bg, 0.7);
      }
      rectStroke(box, C.line);
      plate(i, r);
    }
  }
  function dogEar(r: Rect, d: number) {
    const x2 = r.x + r.w, y = r.y;
    g.globalAlpha = 1;
    g.fillStyle = C.bg;
    g.beginPath();
    g.moveTo(x2 - d, y - 1);
    g.lineTo(x2 + 1, y - 1);
    g.lineTo(x2 + 1, y + d);
    g.closePath();
    g.fill();
    g.fillStyle = C.paper;
    g.strokeStyle = C.line;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x2 - d, y + 0.5);
    g.lineTo(x2 - d, y + d);
    g.lineTo(x2 - 0.5, y + d);
    g.closePath();
    g.fill();
    g.stroke();
  }

  /* ---------------------------------------------------------- 2. fetch */
  function drawIngest(i: number, t: number) {
    const c = COL[i];
    const [a, b] = T.ing[i];
    if (t < a || t > b + 0.4) return;
    const src = L.src[i], dst = L.land[i];
    if (c.how === "copy") {
      // Files travel whole. Back sheets first so the .shp lands on top.
      for (let k = c.sheets! - 1; k >= 0; k--) {
        const p = sheetP(i, k, t);
        if (p <= 0 || p >= 1) continue;
        const off = k * 3;
        const r = lerpRect(
          { x: src.x + off, y: src.y - off, w: src.w, h: src.h },
          { x: dst.x + off, y: dst.y - off, w: dst.w, h: dst.h },
          inOut(p),
        );
        r.x += Math.sin(Math.PI * p) * 5;
        if (k === 0) {
          plate(i, r);
          rectStroke(r, C.line);
          if (c.sheets === 1) dogEar(r, L.wide ? 13 : 9);
        } else {
          fillRect(r, C.paper);
          rectStroke(r, C.line);
        }
      }
      return;
    }
    // Services answer requests. A dashed line runs from the local folder up
    // to the endpoint. Each request rides up it, and its page comes back.
    const lx = Math.round(src.x + src.w / 2);
    const lineA = smooth(a - 0.05, a + 0.15, t) * (1 - smooth(b, b + 0.35, t));
    g.globalAlpha = lineA * 0.9;
    g.strokeStyle = C.primary;
    g.lineWidth = 1;
    g.setLineDash([3, 3]);
    g.beginPath();
    g.moveTo(lx + 0.5, src.y + src.h + 3);
    g.lineTo(lx + 0.5, dst.y - 3);
    g.stroke();
    g.setLineDash([]);
    const n = c.how === "pages" ? c.strips! : 1;
    for (let k = 0; k < n; k++) {
      const [q0, q1] = reqWindow(i, k);
      const p = prog(t, q0, q1 - q0);
      if (p <= 0 || p >= 1) continue;
      const y = lerp(dst.y - 4, src.y + src.h + 4, inOut(p));
      g.globalAlpha = lineA;
      g.fillStyle = C.primary;
      g.fillRect(lx - 1, y - 6, 3, 12);
    }
    // the request, named on the line in the outside zone
    {
      const my = Math.round((src.y + src.h + L.boundary) / 2);
      const fs = L.wide ? 10 : 9;
      const w = measure(c.req!, fs);
      const bx = Math.min(Math.max(src.x, lx - w / 2 - 4), src.x + src.w - w - 8);
      fillRect({ x: bx, y: my - 8, w: w + 8, h: 15 }, C.bg, lineA);
      rectStroke({ x: bx, y: my - 8, w: w + 8, h: 15 }, C.primary, lineA);
      text(c.req!, bx + 4, my + 3, C.primaryInk, fs, lineA);
    }
    // pages in flight
    for (let k = 0; k < c.strips!; k++) {
      const p = stripP(i, k, t);
      if (p <= 0 || p >= 1) continue;
      const v0 = k / c.strips!, v1 = (k + 1) / c.strips!;
      const r0 = { x: src.x, y: src.y + v0 * src.h, w: src.w, h: (v1 - v0) * src.h };
      const r1 = { x: dst.x, y: dst.y + v0 * dst.h, w: dst.w, h: (v1 - v0) * dst.h };
      plate(i, lerpRect(r0, r1, inOut(p)), 1, v0, v1);
    }
  }

  /* What has arrived in ~/phl-housing, then its conversion. */
  function drawLanded(i: number, t: number) {
    const c = COL[i], r = L.land[i];
    if (t < T.ing[i][0] || t >= T.morph + 1) return;
    const dp = dropP(i, t);
    const cp = convP(i, t);
    const wide = L.wide;
    if (dp <= 0) {
      // the raw form: what arrived, as it arrived
      const raw = 1 - smooth(0, 0.7, cp);
      if (c.how === "copy") {
        for (let k = c.sheets! - 1; k >= 0; k--) {
          if (sheetP(i, k, t) < 1) continue;
          const off = k * 3 * (1 - inOut(cp));
          const s = { x: r.x + off, y: r.y - off, w: r.w, h: r.h };
          if (k === 0) {
            plate(i, s);
            rectStroke(s, C.line);
            if (c.sheets === 1) dogEar(s, wide ? 13 : 9);
          } else {
            fillRect(s, C.paper, raw);
            rectStroke(s, C.line, raw);
          }
        }
      } else {
        for (let k = 0; k < c.strips!; k++) {
          if (stripP(i, k, t) < 1) continue;
          const v0 = k / c.strips!, v1 = (k + 1) / c.strips!;
          // pages arrive as separate pieces, a stream arrives continuous
          const seam = c.how === "pages" && k ? 1 : 0;
          plate(i, { x: r.x, y: r.y + v0 * r.h + seam, w: r.w, h: (v1 - v0) * r.h - seam }, 1, v0, v1);
        }
        if (arrived(i, t) >= 1 && c.how === "stream") dashRect(r, C.ink2, raw);
      }
      // conversion: one sweep down the plate leaves one clean form behind
      if (cp > 0) {
        const sy = r.y + r.h * inOut(cp);
        g.save();
        g.beginPath();
        g.rect(r.x - 1, r.y - 14, r.w + 16, sy - r.y + 14);
        g.clip();
        fillRect({ x: r.x, y: r.y - 13, w: r.w + 14, h: 13 }, C.bg);
        fillRect({ x: r.x + r.w, y: r.y - 13, w: 14, h: r.h + 13 }, C.bg);
        plate(i, r);
        g.restore();
        if (cp < 1) hline(r.x - 3, r.x + r.w + 3, sy, C.primary, 1, 2);
        rectStroke({ x: r.x, y: r.y, w: r.w, h: sy - r.y }, C.line);
      }
    }
    // labels under the plate
    const ia = smooth(T.ing[i][0], T.ing[i][0] + 0.2, t);
    const pre = ia * (1 - smooth(0, 0.4, cp));
    const post = smooth(0.45, 1, cp) * (1 - smooth(0, 0.18, dp));
    const k = counter(i, t);
    const fs = wide ? 11 : 9.5;
    if (pre > 0) {
      let l1: string, l2: string;
      if (c.how === "copy") {
        l1 = c.sheets! > 1 ? (k.files > 1 ? `${c.file} +${k.files - 1}` : c.file) : c.file;
        l2 = `${k.mb} MB`;
        if (!wide) l1 = c.sheets! > 1 ? `${k.files} of 4 files` : "1 file";
      } else if (c.how === "pages") {
        l1 = wide ? `page ${k.page} of ${c.pages}` : `p. ${k.page}/${c.pages}`;
        l2 = wide ? `${nf(k.feat)} features` : nf(k.feat);
      } else {
        l1 = wide ? "one response" : "stream";
        l2 = wide ? `${nf(k.feat)} features` : nf(k.feat);
      }
      text(fit(l1, r.w, fs), r.x, L.lab[0], C.ink2, fs, pre);
      text(fit(l2, r.w, fs), r.x, L.lab[1], k.f >= 1 ? C.ink : C.primaryInk, fs, pre, k.f >= 1 ? 400 : 500);
    }
    if (post > 0) {
      const cs = wide ? 10 : 9;
      const chip = (s: string, x: number, y: number) => {
        const w = measure(s, cs) + 8;
        fillRect({ x, y: y - cs - 2, w, h: cs + 6 }, C.paper, post);
        rectStroke({ x, y: y - cs - 2, w, h: cs + 6 }, C.line, post);
        text(s, x + 4, y + 0.5, C.ink, cs, post);
        return w;
      };
      if (wide) {
        const w = chip("GeoParquet", r.x, L.lab[0]);
        chip("PMTiles", r.x + w + 4, L.lab[0]);
        text(`${nf(c.rows)} rows`, r.x, L.lab[1] + 2, C.ink3, fs, post);
      } else {
        chip("GeoParquet", r.x, L.lab[0]);
        chip("PMTiles", r.x, L.lab[1]);
        text(`${nf(c.rows)} rows`, r.x, L.lab[2] + 1, C.ink3, fs, post);
      }
    }
  }

  /* -------------------------------------------------------- 3. catalog */
  function treeRect(i: number, t: number) {
    const dp = dropP(i, t);
    const r = lerpRect(L.land[i], L.fold[i], inOut(dp));
    r.x += Math.sin(Math.PI * dp) * -8;
    return r;
  }
  /** Where plate i is after it has left ~/phl-housing. */
  function travelRect(i: number, t: number) {
    const mp = morphP(i, t);
    if (mp <= 0) return treeRect(i, t);
    return lerpRect(L.fold[i], portalImg(i), inOut(mp));
  }
  function drawTravel(i: number, t: number) {
    if (dropP(i, t) <= 0 || t >= T.reset + T.resetDur) return;
    const r = travelRect(i, t);
    plate(i, r);
    // the plate's frame belongs to the tree, the portal's images run clean
    rectStroke(r, C.line, 1 - smooth(0.6, 1, morphP(i, t)));
  }

  function drawTree(t: number) {
    const tr = L.tree, wide = L.wide;
    if (t < T.cat[0] || t > T.morph + 1.6) return;
    const m0 = T.morph;
    // the tree's own lines fade as the portal forms
    const outA = 1 - smooth(m0, m0 + 0.5, t);
    const fs = wide ? 13 : 12, ns = wide ? 11 : 10;
    const rootA = smooth(T.cat[0], T.cat[0] + 0.3, t);

    // root: the bucket. Its name travels into the address bar.
    {
      const mp = prog(t, m0, 0.8), e = inOut(mp);
      const pre = "s3://", name = "your-bucket";
      const x0 = tr.ox, y0 = tr.rootBase;
      const xa = 16, ya = L.P.y0 + 19.5;
      const preW = measure(pre, fs, 600);
      text(pre, x0, y0, C.ink, fs, rootA * (1 - smooth(0, 0.3, mp)), 600);
      if (mp < 1) {
        text(typed(name, t, T.cat[0], 50), lerp(x0 + preW, xa, e), lerp(y0, ya, e), C.ink,
          lerp(fs, 11, e), rootA, mp > 0.5 ? 400 : 600);
      }
      text("/", x0 + preW + measure(name, fs, 600), y0, C.ink, fs, rootA * (1 - smooth(0, 0.3, mp)), 600);
      // push state, as a note on the root
      const pushed = t >= T.push[1];
      const note = t < T.push[0] ? "" : pushed ? "31 files pushed" : "pushing…";
      text(note, tr.noteX, y0, pushed ? C.primaryInk : C.ink3, ns, rootA * outA);
    }

    // trunk: grows to the lowest row present
    let last = -1;
    for (let i = 0; i < 4; i++) if (dropP(i, t) >= 0.85) last = i;
    const docsOn = t >= T.docsAt;
    const lowY = last >= 0 ? tr.fold[last] + tr.FROW / 2 - 4 : docsOn ? tr.docs[2] + 11 : tr.top + 18;
    if (rootA > 0 && (last >= 0 || docsOn)) vline(tr.trunkX, tr.top + 20, lowY + 1, C.ink3, outA * rootA);

    // the docs, written last
    const DOCS = [["catalog.json", "STAC catalog"], ["README.md", "for people"], ["AGENTS.md", "for agents"]];
    DOCS.forEach(([name, note], k) => {
      const at = T.docsAt + k * 0.17;
      if (t < at) return;
      const y = tr.docs[k] + 15;
      hline(tr.trunkX, tr.trunkX + 10, y - 4, C.ink3, outA);
      if (k === 0) {
        // catalog.json travels down into the page title and hands over to it
        const mp = prog(t, m0 + 0.45, 0.7), e = inOut(mp);
        text(typed(name, t, at, 70), lerp(tr.nameX, L.P.pad, e), lerp(y, L.P.titleY[0], e), C.ink,
          lerp(fs, L.P.titleSize * 0.6, e), 1 - smooth(0.55, 1, mp));
      } else {
        text(typed(name, t, at, 70), tr.nameX, y, C.ink, fs, 1 - smooth(m0 + 0.05, m0 + 0.4, t));
      }
      text(typed(note, t, at + 0.12, 70), tr.noteX, y, C.ink3, ns, outA);
    });

    // collections: a row appears as its plate lands
    for (let i = 0; i < 4; i++) {
      if (dropP(i, t) < 0.85) continue;
      const at = T.dropAt + i * T.dropStep + T.dropDur * 0.85;
      const mid = tr.fold[i] + tr.FROW / 2 - 4;
      hline(tr.trunkX, L.fold[i].x - 4, mid, C.ink3, outA);
      const x = L.fold[i].x + L.fold[i].w + 10;
      const na = 1 - smooth(morphStart(i) - 0.05, morphStart(i) + 0.25, t);
      text(typed(`${COL[i].id}/`, t, at, 70), x, mid - 1, C.ink, fs, na);
      text(typed(`${nf(COL[i].rows)} rows · GeoParquet + PMTiles`, t, at + 0.15, 90), x, mid + (wide ? 15 : 14), C.ink3, ns, outA);
    }

    // push: one pass down the tree
    if (t >= T.push[0] && t < T.push[1] + 0.2) {
      const p = inOut(prog(t, T.push[0], T.push[1] - T.push[0]));
      const y = lerp(tr.top + 20, tr.bottom - 6, p);
      const a = 1 - smooth(T.push[1], T.push[1] + 0.2, t);
      hline(tr.ox, wide ? W * 0.62 : W - tr.ox, y, C.primary, a, 2);
    }
  }

  /* --------------------------------------------------------- 4. portal */
  function navItems() {
    const P = L.P;
    const y = P.headY + P.headH / 2 + 4.5;
    if (!L.wide) return [{ s: "Menu", x: W - P.pad - measure("Menu", 12, 500, PSANS), y }];
    const labels = ["Collections", "About", "For agents"];
    const ws = labels.map((s) => measure(s, 12, 500, PSANS));
    let x = W - P.pad - ws.reduce((a, b) => a + b, 0) - 2 * 16;
    return labels.map((s, k) => {
      const it = { s, x, y };
      x += ws[k] + 16;
      return it;
    });
  }

  function drawPortalBack(t: number) {
    const P = L.P, m0 = T.morph;
    // the browser window opens around the bucket
    const fa = smooth(m0, m0 + 0.35, t);
    fillRect({ x: 0, y: P.y0, w: W, h: P.chromeH }, C.bg, fa);
    rectStroke({ x: 8, y: P.y0 + 5, w: W - 16, h: 20 }, C.line, fa * 0.25);
    fillRect({ x: 9, y: P.y0 + 6, w: W - 18, h: 18 }, C.paper, fa);
    // the page fills in from the top, the way the flow runs
    const wp = inOut(prog(t, m0 + 0.15, 0.9));
    fillRect({ x: 0, y: P.y0 + P.chromeH, w: W, h: (H - P.chromeH) * wp }, BRAND.paper);
  }

  function drawPortalFront(t: number) {
    const P = L.P, m0 = T.morph, wide = L.wide;
    const y0 = P.y0;
    const fa = smooth(m0, m0 + 0.35, t);
    rectStroke({ x: 0, y: y0, w: W, h: H }, C.line, fa);
    hline(0, W, y0 + P.chromeH, C.line, fa);
    // the address: the bucket name arrives from the tree, the host types on
    if (t >= m0 + 0.8) {
      const nw = text("your-bucket", 16, y0 + 19.5, C.ink, 11);
      text(ADDR.slice(11, 11 + Math.floor((t - m0 - 0.8) * 45)), 16 + nw, y0 + 19.5, C.ink2, 11);
    }
    // the brand arrives once the content has landed, top to bottom
    const at = (k: number) => out3(prog(t, m0 + 0.75 + k * 0.08, 0.5));
    const a0 = at(0), a1 = at(1), a2 = at(2), a3 = at(3), a4 = at(4), a5 = at(5);
    fillRect({ x: 0, y: P.brickY, w: W * inOut(prog(t, m0 + 0.6, 0.6)), h: 4 }, BRAND.brick);
    // wordmark
    {
      const s = wide ? 1 : 0.88;
      const cy = P.headY + P.headH / 2;
      g.save();
      g.globalAlpha = a0;
      g.translate(P.pad, cy - 9 * s);
      g.scale(s, s);
      g.strokeStyle = BRAND.brick;
      g.lineWidth = 1.7;
      g.lineJoin = "miter";
      g.stroke(roofs);
      g.restore();
      text("Rowhouse Atlas", P.pad + 34 * s, cy + 7 * s, BRAND.ink, wide ? 20 : 18, a0, 600, SERIF, -0.2);
    }
    // nav: README.md and AGENTS.md hand over to About and For agents
    navItems().forEach((it, k) => {
      const a = k === 0 || !wide ? a1 : smooth(m0 + 0.75, m0 + 1.05, t);
      text(it.s, it.x, it.y, BRAND.ink3, 12, a, 500, PSANS);
    });
    hline(0, W, P.rule1, BRAND.ink, a1);
    // eyebrow, title, lede
    text("OPEN DATA · 4 COLLECTIONS", P.pad, P.eyebrowY, BRAND.brick, wide ? 10 : 9.5, a2, 600, PSANS, 1.3);
    {
      const ta = smooth(m0 + 0.85, m0 + 1.25, t);
      const sz = P.titleSize;
      if (wide) {
        let x = P.pad;
        x += text("Philadelphia Housing ", x, P.titleY[0], BRAND.ink, sz, ta, 400, SERIF, -0.4);
        x += text("and", x, P.titleY[0], BRAND.brick, sz, ta, 400, SERIF, -0.2, "italic");
        text(" Land Use", x, P.titleY[0], BRAND.ink, sz, ta, 400, SERIF, -0.4);
        text("Parcels, land use, buildings, and zoning for Philadelphia, as GeoParquet and PMTiles.",
          P.pad, P.ledeY, BRAND.ink2, 12.5, a3, 400, PSANS);
      } else {
        text("Philadelphia Housing", P.pad, P.titleY[0], BRAND.ink, sz, ta, 400, SERIF, -0.4);
        const x = P.pad + text("and", P.pad, P.titleY[1], BRAND.brick, sz, ta, 400, SERIF, -0.2, "italic");
        text(" Land Use", x, P.titleY[1], BRAND.ink, sz, ta, 400, SERIF, -0.4);
      }
    }
    hline(P.pad, W - P.pad, P.rule2, BRAND.ink, a3);
    // the featured collection
    const ft = smooth(m0 + 0.95, m0 + 1.3, t);
    if (wide) {
      const x = P.featCol.x;
      text("FEATURED", x, P.feat.y + 10, BRAND.brick, 10, a4, 600, PSANS, 1.3);
      text(COL[0].title, x, P.featTitle.y, BRAND.ink, P.featTitle.size, ft, 500, SERIF, -0.2);
      const lines = wrap(COL[0].desc, P.featCol.w, 4, 12, 400, PSANS);
      lines.forEach((s, k) => text(s, x, P.featTitle.y + 22 + k * 17, BRAND.ink2, 12, a4, 400, PSANS));
      const my = P.featTitle.y + 22 + lines.length * 17 + 14;
      const rw = text(`${nf(COL[0].rows)} rows`, x, my, BRAND.ink3, 11.5, a4, 500, PSANS);
      let tx = x + rw + 10;
      for (const s of ["GEOPARQUET", "PMTILES"]) {
        const w = measure(s, 9, 600, PSANS, 0.8) + 10;
        rectStroke({ x: tx, y: my - 11.5, w, h: 17 }, BRAND.ink, a4);
        text(s, tx + 5, my, BRAND.ink, 9, a4, 600, PSANS, 0.8);
        tx += w + 5;
      }
      const cy = my + 30;
      const lw = text("Open the map  →", x, cy, BRAND.brick, 12.5, a5, 600, PSANS);
      hline(x, x + lw, cy + 4, BRAND.brick, a5);
    } else {
      text(COL[0].title, P.featTitle.x, P.featTitle.y, BRAND.ink, P.featTitle.size, ft, 500, SERIF, -0.2);
      let tx = P.pad + measure(COL[0].title, P.featTitle.size, 500, SERIF, -0.2) + 10;
      for (const s of ["GEOPARQUET", "PMTILES"]) {
        const w = measure(s, 8.5, 600, PSANS, 0.7) + 9;
        rectStroke({ x: tx, y: P.featTitle.y - 12, w, h: 16 }, BRAND.ink, a4);
        text(s, tx + 4.5, P.featTitle.y - 0.5, BRAND.ink, 8.5, a4, 600, PSANS, 0.7);
        tx += w + 4;
      }
      text(`${nf(COL[0].rows)} rows · Updated weekly`, P.pad, P.featTitle.y + 18, BRAND.ink3, 11.5, a4, 500, PSANS);
    }
    hline(P.pad, W - P.pad, P.rule3, BRAND.ink, a4);
    // the other three. On a phone the cards run on below the fold.
    if (!wide) return;
    for (let k = 0; k < 3; k++) {
      const i = k + 1, cd = P.cards[k];
      const ca = smooth(m0 + 1.0 + k * 0.06, m0 + 1.35 + k * 0.06, t);
      text(fit(COL[i].title, cd.img.w, cd.title.size, 500, SERIF), cd.title.x, cd.title.y, BRAND.ink, cd.title.size, ca, 500, SERIF);
      text(`${nf(COL[i].rows)} rows · GeoParquet, PMTiles`, cd.title.x, cd.title.y + 16, BRAND.ink3, 11, a5, 500, PSANS);
    }
  }

  /* ---------------------------------------------------------- the frame */
  function draw(t: number) {
    if (!W || !H) return;
    const cam = camAt(t);
    g.setTransform(dpr, 0, 0, dpr, 0, -Math.round(cam * dpr));
    g.globalAlpha = 1;
    g.fillStyle = C.bg;
    g.fillRect(0, cam - 2, W, H + 4);

    const portalOn = t >= T.morph;
    // Station one: the outside, and the local folder below it.
    if (cam < L.landBottom + 20) drawOutside(0, t, true);
    // The fresh start below the portal, reached at the end of the loop.
    if (cam + H > L.Pd) drawOutside(L.Pd, 0, false);

    for (let i = 0; i < 4; i++) drawLanded(i, t);
    for (let i = 0; i < 4; i++) drawIngest(i, t);
    if (portalOn) drawPortalBack(t);
    drawTree(t);
    for (let i = 0; i < 4; i++) drawTravel(i, t);
    if (portalOn) drawPortalFront(t);
    g.globalAlpha = 1;
  }

  return {
    setSize(width, height, ratio) {
      W = Math.round(width);
      H = Math.round(height);
      dpr = ratio;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      layout();
    },
    draw,
  };
}
