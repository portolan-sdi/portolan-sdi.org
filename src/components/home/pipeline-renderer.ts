/**
 * Canvas 2D drawing for the homepage solution figure, the right half of
 * `PipelineFigure`.
 *
 * The scene is one tall world, read from the top down, and a camera that
 * only ever moves down through it:
 *
 *   the existing systems                 (y from 0)
 *   a line, then cloud-optimized files   (each layer lands converted)
 *   s3://your-bucket/                    (the catalog tree)
 *   the portal                           (one frame tall)
 *
 * The story runs one way, from the existing systems to cloud storage. The
 * clock plays it once and stops on the portal. It never wraps.
 * Four real thumbnails are the objects that travel. Each source has its own
 * lane, and every object moves straight down its lane.
 *
 * The figure tells three steps. Each step ends on a frame that reads well
 * when the clock stops there, because a viewer can open a step and hold it.
 */

/* ===================================================================
   Timeline. Three steps, in order: extract and convert, publish a
   catalog, build on top.
   =================================================================== */


export const T = {
  /** Step 1. One start per source. Each layer leaves its system and
      lands as cloud-optimized files. */
  ext: [0.5, 1.0, 1.5, 2.0],
  extDur: 1.15,
  chipDur: 0.4,
  /** Step 2. The camera moves down and the plates drop into the tree. */
  cat: 5.2,
  camDur: 1.3,
  rootAt: 5.4,
  docsAt: 5.7,
  dropAt: 6.1,
  dropStep: 0.28,
  dropDur: 1.0,
  /** Step 3. The tree becomes the portal. */
  morph: 9.6,
};

/**
 * The three steps. A step button starts the clock at `start`. The clock
 * then runs to `hold`, where the step is complete, and stops there.
 */
export const STEPS = [
  { start: 0, hold: 4.2 },
  { start: T.cat, hold: 8.6 },
  { start: T.morph, hold: 12.4 },
];

/** The last frame: the finished portal. The clock never runs past it. */
export const END = STEPS[STEPS.length - 1].hold;

/** Which of the three steps is current at time t. */
export function stepAt(t: number): number {
  if (t >= STEPS[2].start) return 2;
  if (t >= STEPS[1].start) return 1;
  return 0;
}

/* ===================================================================
   The four collections and the systems they live in today. Titles are
   from the real catalog. The file names of the two files are
   illustrative.
   =================================================================== */
interface Collection {
  id: string;
  title: string;
  /** The type of the endpoint, which is the label of the source. */
  kind: string;
  /** How the source draws: a set of files, one file, or a service. */
  shape: "files" | "file" | "service";
  file: string;
  /** The shorter file label for the narrow form. */
  nfile: string;
  tag?: string;
}

export const COL: Collection[] = [
  {
    id: "dor_parcel", title: "Property Parcels",
    kind: "Shapefile", shape: "files", file: "parcels.shp", nfile: "parcels.shp",
  },
  {
    id: "land_use", title: "Land Use",
    kind: "GeoPackage", shape: "file", file: "land_use.gpkg", nfile: "land_use.gpkg",
  },
  {
    id: "li_building_footprints", title: "Building Footprints",
    kind: "ArcGIS REST", shape: "service", file: "FeatureServer/0", nfile: "FeatureServer",
    tag: "REST",
  },
  {
    id: "zoning_basedistricts", title: "Zoning Base Districts",
    kind: "WFS", shape: "service", file: "ows?service=WFS", nfile: "geoserver/ows",
    tag: "OGC WFS",
  },
];

/** The thumbnail of each collection, in `COL` order. */
export const IMAGES = COL.map((c) => `/img/home/pipeline/${c.id}.webp`);
/**
 * Every picture the canvas draws: the four thumbnails, then the icon of
 * QGIS for the one button of the portal. The icon is the official one,
 * from the QGIS repository.
 */
export const ASSETS = [...IMAGES, "/img/home/pipeline/qgis.svg"];
const QGIS_ICON = IMAGES.length;

/** A Shapefile is four files: .shp with .dbf, .shx, and .prj behind it. */
const SHEETS = 4;
const ADDR = "your-bucket.s3.amazonaws.com";

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
const extP = (i: number, t: number) => prog(t, T.ext[i], T.extDur);
const dropP = (i: number, t: number) => prog(t, T.dropAt + i * T.dropStep, T.dropDur);
/** The three small cards leave the tree first, the featured plate last. */
const morphStart = (i: number) => [0.55, 0.36, 0.23, 0.1][i] + T.morph;
const morphP = (i: number, t: number) => prog(t, morphStart(i), i === 0 ? 1.0 : 1.1);

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
/** The two faces of the portal: one for headings, one for body text. */
export interface PortalFonts {
  head: string;
  body: string;
}

/*
 * The colors of the portal at the end of the figure. The portal is a
 * sample of what a publisher builds on a catalog, and it uses the colors
 * of the City of Philadelphia digital standards, with no logo and no
 * name of a publisher. They are that style guide's colors, not
 * Portolan's, so they live here as canvas constants.
 */
const CITY = {
  /** dark-ben-franklin: the head of the page, and card headings. */
  navy: "#0f4d90",
  /** ben-franklin-blue: the rule under each card. */
  blue: "#2176d2",
  /** electric-blue: buttons. */
  electric: "#25cef7",
  ground: "#ffffff",
  /** ghost-gray: cards. */
  card: "#f0f0f0",
  /** dark-gray: text. */
  ink: "#444444",
  /** bell-yellow: the one button for QGIS, and the top bar of the chart. */
  yellow: "#f3c613",
  /** light-blue: the head of the chat panel. */
  pale: "#daedfe",
  /** medium-gray: small labels and the input. */
  mid: "#a1a1a1",
  /** sidewalk: the edge of the chat panel. */
  rule: "#cfcfcf",
};

/**
 * The "bot" icon of Lucide (ISC license), on its 24 by 24 grid: an
 * antenna, a head with rounded corners, two ears, and two eyes.
 */
const BOT_PATH =
  "M12 8V4H8M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM2 14h2M20 14h2M15 13v2M9 13v2";

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
  /** The frame of the bucket around the tree. */
  box: Rect;
  headH: number;
}
interface Card {
  img: Rect;
  nameY: number;
}
interface Portal {
  y0: number;
  chromeH: number;
  pad: number;
  inner: number;
  headY: number;
  headH: number;
  titleSize: number;
  titleY: number[];
  qgis: { x: number; y: number; w: number; h: number; label: string };
  feat: { box: Rect; img: Rect; labelY: number; nameY: number };
  cards: Card[];
  chat: Rect;
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
  cT: number;
  c2: number;
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
  const BOT = new Path2D(BOT_PATH);
  const MONO = C.mono;
  const SANS = C.sans;
  const HEAD = F.head;
  const BODY = F.body;

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
    const lineH = wide ? 16 : 13;
    const nLines = 2;
    // The first station is centered in the first frame.
    const contentH = 42 + (nLines - 1) * lineH + (wide ? 30 : 25) + ch +
      (wide ? 66 : 52) + (wide ? 36 : 30) + ch + (wide ? 26 : 36);
    const top = Math.max(0, Math.round((H - contentH) * 0.42));
    const kick = top + (wide ? 16 : 14);
    const text0 = top + (wide ? 42 : 36);
    const thumbY = Math.round(text0 + (nLines - 1) * lineH + (wide ? 30 : 25));
    const lane = [0, 1, 2, 3].map((i) => Math.round(inset + i * (cw + gx)));
    const src = lane.map((x) => ({ x, y: thumbY, w: cw, h: ch }));
    const boundary = Math.round(thumbY + ch + (wide ? 66 : 52));
    const land = lane.map((x) => ({ x, y: boundary + (wide ? 36 : 30), w: cw, h: ch }));
    const lb = land[0].y + ch;
    const lab = wide ? [lb + 17] : [lb + 15, lb + 31];
    const landBottom = wide ? lb + 26 : lb + 36;

    // The catalog tree under the bucket.
    // The bucket is a frame with a dark head, and the tree is inside it.
    const headH = wide ? 26 : 24;
    const boxTop = Math.round(landBottom + (wide ? 58 : 44));
    const ttop = boxTop + headH + 12;
    const ROW = 22;
    const FROW = wide ? 62 : 48;
    const tw = wide ? 78 : 54;
    const th = tw * A;
    const ox = inset + (wide ? 16 : 10);
    const fold = [0, 1, 2, 3].map((i) => ttop + ROW * 4 + 4 + FROW * i);
    const tree: Tree = {
      top: ttop,
      FROW,
      ox,
      rootBase: ttop + 15,
      trunkX: ox + 6,
      nameX: ox + 22,
      noteX: ox + (wide ? 214 : 140),
      docs: [0, 1, 2].map((k) => ttop + ROW * (k + 1)),
      fold,
      bottom: fold[3] + FROW,
      box: { x: inset, y: boxTop, w: W - 2 * inset, h: fold[3] + FROW + 6 - boxTop },
      headH,
    };
    const foldR = fold.map((y) => ({ x: ox + 22, y: y + Math.round((FROW - 8 - th) / 2), w: tw, h: th }));

    // Camera stops. The camera only ever moves down.
    const c0 = 0;
    const c2 = Math.max(c0, tree.top - 14);
    // Once the plates have dropped, the tree is centered in the frame.
    const cT = Math.min(c2, Math.max(c0, tree.bottom + 16 - H, Math.round((2 * boxTop + tree.box.h - H) / 2)));

    L = {
      wide, cw, kick, text0, lineH, src, boundary, land, lab, landBottom,
      tree, fold: foldR, c0, cT, c2,
      P: portalLayout(wide, c2),
    };
  }

  /**
   * The portal, one frame tall, in world coordinates. It has a head with
   * the title and one button, a featured layer above three smaller
   * layers, and a chat panel. From the wide form the chat panel is a
   * column beside the layers. In the narrow form it is under them.
   */
  function portalLayout(wide: boolean, y0: number): Portal {
    const pad = wide ? 18 : 12;
    const gap = wide ? 16 : 10;
    const inner = wide ? 12 : 9;
    const chromeH = 30;
    const headY = y0 + chromeH;
    const headH = wide ? 54 : 78;
    const titleSize = wide ? 18 : 15;
    const titleY = [wide ? headY + headH / 2 + titleSize * 0.36 : headY + 27];
    // The one button: an icon tile, the label, and an arrow.
    const bfs = wide ? 10.5 : 9.5;
    const label = "OPEN IN QGIS";
    const bh = wide ? 30 : 28;
    const bw = Math.round(bh + 10 + measure(label, bfs, 700, HEAD, 0.4) + 6 + 9 + 10);
    const qgis = wide
      ? { x: W - pad - bw, y: headY + (headH - bh) / 2 - 1, w: bw, h: bh, label }
      : { x: pad, y: headY + 38, w: bw, h: bh, label };

    const top = headY + headH + (wide ? pad : 10);
    const bodyH = y0 + H - (wide ? pad : 10) - top;
    const chatW = wide ? Math.round((W - 2 * pad) * 0.36) : W - 2 * pad;
    const chatH = wide ? bodyH : 126;
    const lw = wide ? W - 2 * pad - gap - chatW : W - 2 * pad;
    const lh = wide ? bodyH : bodyH - chatH - gap;
    // the three small layers
    const sg = wide ? 10 : 8;
    const sw = (lw - 2 * sg) / 3;
    const sih = Math.round(sw * (wide ? 0.62 : 0.56));
    const smallH = sih + (wide ? 36 : 30);
    // the featured layer takes the room that is left
    const featText = wide ? 52 : 40;
    const featH = lh - gap - smallH - 5;
    const fbox = { x: pad, y: top, w: lw, h: featH };
    const fimg = { x: pad, y: top, w: lw, h: featH - featText };
    const sy = top + featH + 5 + gap;
    return {
      y0, chromeH, pad, inner, headY, headH, titleSize, titleY, qgis,
      feat: {
        box: fbox, img: fimg,
        labelY: fimg.y + fimg.h + (wide ? 19 : 15),
        nameY: fimg.y + fimg.h + (wide ? 40 : 31),
      },
      cards: [0, 1, 2].map((k) => {
        const x = pad + k * (sw + sg);
        return {
          img: { x, y: sy, w: sw, h: sih },
          nameY: sy + sih + (wide ? 17 : 14),
        };
      }),
      chat: wide
        ? { x: pad + lw + gap, y: top, w: chatW, h: chatH }
        : { x: pad, y: y0 + H - 10 - chatH, w: chatW, h: chatH },
    };
  }
  const portalImg = (i: number) => (i === 0 ? L.P.feat.img : L.P.cards[i - 1].img);

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
  /** A real thumbnail. It covers its box, cropped about its center. */
  function plate(i: number, r: Rect, a = 1) {
    if (a <= 0.003 || r.w < 1 || r.h < 0.5) return;
    const im = imgs[i];
    if (!im || !im.complete || !im.naturalWidth) return;
    g.globalAlpha = a;
    const x = px(r.x), y = px(r.y), w = px(r.x + r.w) - x, h = px(r.y + r.h) - y;
    const nw = im.naturalWidth, nh = im.naturalHeight;
    const sw = Math.min(nw, (nh * r.w) / r.h);
    const sh = Math.min(nh, (nw * r.h) / r.w);
    g.drawImage(im, (nw - sw) / 2, (nh - sh) / 2, sw, sh, x, y, w, h);
  }
  function typed(s: string, t: number, at: number, cps = 60) {
    if (t < at) return "";
    return s.slice(0, Math.max(1, Math.floor((t - at) * cps)));
  }

  function camAt(t: number) {
    let c = L.c0;
    c = lerp(c, L.cT, inOut(prog(t, T.cat, T.camDur)));
    c = lerp(c, L.c2, inOut(prog(t, T.morph, 1.45)));
    return c;
  }

  /* ------------------------------------------------ 1. the outside world */
  function drawOutside(t: number) {
    const wide = L.wide;
    const x0 = L.src[0].x;
    // The line that every layer crosses. Above it, each system has its own
    // form. Below it, every layer has the same form.
    hline(0, W, L.boundary, C.primary, 1, 2);
    text("Existing systems", x0, L.kick, C.ink3, wide ? 11 : 10.5);
    text("Cloud-optimized files", x0, L.boundary + (wide ? 19 : 17), C.ink3, wide ? 11 : 10.5);
    // empty places below the line, waiting for the data
    for (let i = 0; i < 4; i++) {
      const a = 1 - smooth(0.8, 1, extP(i, t));
      dashRect(L.land[i], C.ink3, a * 0.7);
    }
    for (let i = 0; i < 4; i++) drawSource(i, 0, t);
  }

  /** One existing system, drawn as the thing it is, with its data inside. */
  function drawSource(i: number, off: number, t: number) {
    const c = COL[i], wide = L.wide;
    const r = { ...L.src[i], y: L.src[i].y + off };
    const busy = t >= T.ext[i] && t < T.ext[i] + T.extDur;
    const y0 = off + L.text0;
    text(c.kind, r.x, y0, busy ? C.primaryInk : C.ink, wide ? 14 : 11.5, 1, 650, SANS);
    text(fit(wide ? c.file : c.nfile, L.cw, wide ? 10.5 : 9.5), r.x, y0 + L.lineH, C.ink3, wide ? 10.5 : 9.5);
    if (c.shape === "files") {
      for (let k = SHEETS - 1; k >= 1; k--) {
        const s = { x: r.x + k * 3, y: r.y - k * 3, w: r.w, h: r.h };
        fillRect(s, C.paper);
        rectStroke(s, C.line);
      }
      plate(i, r);
      rectStroke(r, C.line);
    } else if (c.shape === "file") {
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

  /* ------------------------------------------- 2. extract and convert */
  /**
   * Layer i leaves its system and travels straight down its lane. Above
   * the line it is a faint copy with a dashed edge. Below the line it is
   * solid, and it lands with the names of its two formats. The source
   * stays where it is, because the data is copied and not moved.
   */
  function drawExtract(i: number, t: number) {
    const a = T.ext[i];
    if (t < a || t >= T.morph + 1) return;
    const src = L.src[i], dst = L.land[i], wide = L.wide;
    const tp = extP(i, t);
    const dp = dropP(i, t);
    if (dp <= 0) {
      const r = lerpRect(src, dst, inOut(tp));
      if (tp < 1) {
        // the lane, ahead of the plate
        const la = smooth(0, 0.12, tp);
        g.globalAlpha = la * 0.9;
        g.strokeStyle = C.primary;
        g.lineWidth = 1;
        g.setLineDash([3, 3]);
        const lx = Math.round(src.x + src.w / 2) + 0.5;
        if (dst.y - 3 > r.y + r.h + 3) {
          g.beginPath();
          g.moveTo(lx, Math.max(r.y + r.h, src.y + src.h) + 3);
          g.lineTo(lx, dst.y - 3);
          g.stroke();
        }
        g.setLineDash([]);
        const by = L.boundary;
        const above = by - (r.y - 2);
        if (above > 0) {
          g.save();
          g.beginPath();
          g.rect(r.x - 2, r.y - 2, r.w + 4, above);
          g.clip();
          plate(i, r, 0.5);
          dashRect(r, C.primary);
          g.restore();
        }
        const below = r.y + r.h + 2 - by;
        if (below > 0) {
          g.save();
          g.beginPath();
          g.rect(r.x - 2, by, r.w + 4, below);
          g.clip();
          fillRect(r, C.bg);
          plate(i, r);
          rectStroke(r, C.line);
          g.restore();
        }
      } else {
        plate(i, r);
        rectStroke(r, C.line);
      }
    }
    // the two formats, named under the plate once it lands
    const post = smooth(a + T.extDur, a + T.extDur + T.chipDur, t) * (1 - smooth(0, 0.18, dp));
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
        const w = chip("GeoParquet", dst.x, L.lab[0]);
        chip("PMTiles", dst.x + w + 4, L.lab[0]);
      } else {
        chip("GeoParquet", dst.x, L.lab[0]);
        chip("PMTiles", dst.x, L.lab[1]);
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
  /** Where plate i is after it has left its landing place. */
  function travelRect(i: number, t: number) {
    const mp = morphP(i, t);
    if (mp <= 0) return treeRect(i, t);
    return lerpRect(L.fold[i], portalImg(i), inOut(mp));
  }
  function drawTravel(i: number, t: number) {
    if (dropP(i, t) <= 0) return;
    const r = travelRect(i, t);
    plate(i, r);
    // the plate's frame belongs to the tree, the portal's images run clean
    rectStroke(r, C.line, 1 - smooth(0.6, 1, morphP(i, t)));
  }

  function drawTree(t: number) {
    const tr = L.tree, wide = L.wide;
    if (t < T.cat || t > T.morph + 1.6) return;
    const m0 = T.morph;
    // the tree's own lines fade as the portal forms
    const outA = 1 - smooth(m0, m0 + 0.5, t);
    const fs = wide ? 13 : 12, ns = wide ? 11 : 10;
    const rootA = smooth(T.cat, T.cat + 0.3, t);

    // The bucket itself: a frame with a dark head that names it.
    {
      const b = tr.box, a = rootA * outA;
      fillRect(b, C.paper, a);
      fillRect({ x: b.x, y: b.y, w: b.w, h: tr.headH }, C.ink, a);
      const hs = wide ? 11 : 10;
      text("S3 BUCKET", b.x + 10, b.y + tr.headH / 2 + hs * 0.36, C.bg, hs, a, 600, MONO, 0.6);
      const note = "object storage";
      text(note, b.x + b.w - 10 - measure(note, hs), b.y + tr.headH / 2 + hs * 0.36, C.bg, hs, a * 0.75);
      rectStroke(b, C.line, a);
    }

    // root: the bucket. Its name travels into the address bar.
    {
      const mp = prog(t, m0, 0.8), e = inOut(mp);
      const pre = "s3://", name = "your-bucket";
      const x0 = tr.ox, y0 = tr.rootBase;
      const xa = 16, ya = L.P.y0 + 19.5;
      const preW = measure(pre, fs, 600);
      text(pre, x0, y0, C.ink, fs, rootA * (1 - smooth(0, 0.3, mp)), 600);
      if (mp < 1) {
        text(typed(name, t, T.rootAt, 50), lerp(x0 + preW, xa, e), lerp(y0, ya, e), C.ink,
          lerp(fs, 11, e), rootA, mp > 0.5 ? 400 : 600);
      }
      text("/", x0 + preW + measure(name, fs, 600), y0, C.ink, fs, rootA * (1 - smooth(0, 0.3, mp)), 600);
    }

    // trunk: grows to the lowest row present
    let last = -1;
    for (let i = 0; i < 4; i++) if (dropP(i, t) >= 0.85) last = i;
    const docsOn = t >= T.docsAt;
    const lowY = last >= 0 ? tr.fold[last] + tr.FROW / 2 - 4 : docsOn ? tr.docs[2] + 11 : tr.top + 18;
    if (rootA > 0 && (last >= 0 || docsOn)) vline(tr.trunkX, tr.top + 20, lowY + 1, C.ink3, outA * rootA);

    // the three files that make the bucket a catalog
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
      text(typed("GeoParquet + PMTiles", t, at + 0.15, 90), x, mid + (wide ? 15 : 14), C.ink3, ns, outA);
    }
  }

  /* --------------------------------------------------------- 4. portal */
  /**
   * The one button of the head. It has the icon of QGIS on a white tile,
   * a label in capitals, an arrow, and a dark lower edge, so it reads as
   * a thing to press.
   */
  function qgisBtn(a: number) {
    if (a <= 0) return;
    const b = L.P.qgis;
    fillRect({ x: b.x, y: b.y + 2, w: b.w, h: b.h }, CITY.ink, a);
    fillRect({ x: b.x, y: b.y, w: b.w, h: b.h }, CITY.yellow, a);
    fillRect({ x: b.x, y: b.y, w: b.h, h: b.h }, CITY.ground, a);
    const im = imgs[QGIS_ICON];
    if (im && im.complete && im.naturalWidth) {
      const d = b.h - 10;
      g.globalAlpha = a;
      g.drawImage(im, px(b.x + 5), px(b.y + 5), d, d);
    }
    const fs = L.wide ? 10.5 : 9.5;
    const tx = b.x + b.h + 10;
    const tw = text(b.label, tx, b.y + b.h / 2 + fs * 0.36, CITY.ink, fs, a, 700, HEAD, 0.4);
    text("↗", tx + tw + 6, b.y + b.h / 2 + 4.5, CITY.ink, 12, a, 600, MONO);
  }
  /** The link that opens the featured layer on the map. */
  function mapLink(x: number, y: number, a: number) {
    const fs = L.wide ? 11 : 10;
    const w = text("Open map →", x, y, CITY.navy, fs, a, 700, BODY);
    hline(x, x + w, y + 3, CITY.navy, a * 0.5);
  }
  /** A square with an arrow: the layer opens. It sits on a corner. */
  function openTile(x: number, y: number, d: number, a: number) {
    fillRect({ x, y, w: d, h: d }, CITY.navy, a);
    text("↗", x + d / 2 - 3.6, y + d / 2 + 4.2, CITY.ground, 12, a, 600, MONO);
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
    fillRect({ x: 0, y: P.y0 + P.chromeH, w: W, h: (H - P.chromeH) * wp }, CITY.ground);
    fillRect({ x: 0, y: P.headY, w: W * inOut(prog(t, m0 + 0.45, 0.6)), h: P.headH }, CITY.navy);
    // the featured card is ready under its plate before the plate lands
    const a = smooth(0.35, 0.8, morphP(0, t));
    fillRect(P.feat.box, CITY.card, a);
    fillRect({ x: P.feat.box.x, y: P.feat.box.y + P.feat.box.h, w: P.feat.box.w, h: 5 }, CITY.blue, a);
  }

  /** The chat panel: one question about the layers, and one answer. */
  function drawChat(t: number) {
    const P = L.P, c = P.chat, m0 = T.morph, wide = L.wide;
    const a = out3(prog(t, m0 + 1.0, 0.5));
    if (a <= 0) return;
    const hh = wide ? 30 : 24;
    fillRect(c, CITY.ground, a);
    fillRect({ x: c.x, y: c.y, w: c.w, h: hh }, CITY.pale, a);
    text("PhiLLM", c.x + 10, c.y + hh / 2 + 4.5, CITY.navy, wide ? 12.5 : 11.5, a, 700, HEAD, 0.2);
    // a robot, so the panel reads as a chatbot
    {
      const d = wide ? 18 : 16;
      g.save();
      g.globalAlpha = a;
      g.translate(c.x + c.w - 10 - d, c.y + (hh - d) / 2);
      g.scale(d / 24, d / 24);
      g.strokeStyle = CITY.navy;
      g.lineWidth = 2;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.stroke(BOT);
      g.restore();
    }
    rectStroke(c, CITY.rule, a);

    const fs = wide ? 11.5 : 10.5, lh = fs + 5, pad = wide ? 10 : 8, bp = wide ? 8 : 6;
    const maxW = c.w - 2 * pad - 2 * bp - (wide ? 14 : 40);
    let y = c.y + hh + pad;
    // the question, on the side of the person who asks
    const qa = a * out3(prog(t, m0 + 1.4, 0.4));
    const q = wrap("Which zoning districts have the most vacant land?", maxW, 3, fs, 400, BODY);
    const qw = Math.max(...q.map((s) => measure(s, fs, 400, BODY))) + 2 * bp;
    const qh = q.length * lh + 2 * bp - 4;
    fillRect({ x: c.x + c.w - pad - qw, y, w: qw, h: qh }, CITY.navy, qa);
    q.forEach((s, k) => text(s, c.x + c.w - pad - qw + bp, y + bp + fs - 2 + k * lh, CITY.ground, fs, qa, 400, BODY));
    y += qh + pad;
    // the answer names the two layers that it joins
    const ra = a * out3(prog(t, m0 + 1.9, 0.4));
    const r = wrap(
      wide ? "I joined land_use to zoning_basedistricts and summed the vacant area." : "I joined land_use to zoning_basedistricts.",
      maxW, 4, fs, 400, BODY,
    );
    const rw = wide ? c.w - 2 * pad - 14 : Math.max(...r.map((s) => measure(s, fs, 400, BODY))) + 2 * bp;
    const bars = wide ? [["RSA-5", 1], ["RM-1", 0.68], ["ICMX", 0.41]] as [string, number][] : [];
    const rh = r.length * lh + 2 * bp - 4 + bars.length * 17 + (bars.length ? 6 : 0);
    fillRect({ x: c.x + pad, y, w: rw, h: rh }, CITY.card, ra);
    r.forEach((s, k) => text(s, c.x + pad + bp, y + bp + fs - 2 + k * lh, CITY.ink, fs, ra, 400, BODY));
    // a small chart. The district codes are real, the lengths are not data.
    const by = y + bp + r.length * lh + 4;
    const grow = inOut(prog(t, m0 + 2.1, 0.5));
    bars.forEach(([code, f], k) => {
      const ly = by + k * 17;
      text(code, c.x + pad + bp, ly + 9, CITY.ink, 9.5, ra, 400, MONO);
      const x0 = c.x + pad + bp + 40;
      fillRect({ x: x0, y: ly, w: (rw - 2 * bp - 40) * f * grow, h: 11 }, k ? CITY.blue : CITY.yellow, ra);
    });
    // the input
    const ih = wide ? 28 : 24;
    const iy = c.y + c.h - pad - ih;
    rectStroke({ x: c.x + pad, y: iy, w: c.w - 2 * pad - ih - 4, h: ih }, CITY.mid, a);
    text(fit("Ask about these layers", c.w - 2 * pad - ih - 20, fs, 400, BODY), c.x + pad + 8, iy + ih / 2 + 4, CITY.mid, fs, a, 400, BODY);
    fillRect({ x: c.x + c.w - pad - ih, y: iy, w: ih, h: ih }, CITY.electric, a);
    text("→", c.x + c.w - pad - ih / 2 - 4, iy + ih / 2 + 4, CITY.ink, 12, a, 600, MONO);
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
    // the title of the catalog, which catalog.json hands over to
    const ta = smooth(m0 + 0.85, m0 + 1.25, t);
    text("Philadelphia Housing and Land Use", P.pad, P.titleY[0], CITY.ground, P.titleSize, ta, 400, HEAD, 0.4);
    // one button for every layer at once
    qgisBtn(out3(prog(t, m0 + 1.1, 0.5)));

    // the featured layer
    {
      const a = out3(prog(t, morphStart(0) + 0.75, 0.5));
      const f = P.feat, x = f.box.x + P.inner;
      text("FEATURED LAYER", x, f.labelY, CITY.mid, wide ? 9.5 : 9, a, 700, BODY, 0.6);
      text(COL[0].title, x, f.nameY, CITY.navy, wide ? 18 : 14, a, 400, HEAD, 0.3);
      const fs = wide ? 11 : 10;
      mapLink(f.box.x + f.box.w - P.inner - measure("Open map →", fs, 700, BODY), f.nameY, a);
    }
    // the three other layers
    P.cards.forEach((cd, k) => {
      const i = k + 1;
      const a = out3(prog(t, morphStart(i) + 0.75, 0.5));
      if (a <= 0) return;
      const ns = wide ? 12 : 10.5;
      wrap(COL[i].title, cd.img.w, 2, ns, 400, HEAD).forEach((s, n) =>
        text(s, cd.img.x, cd.nameY + n * (ns + 3), CITY.navy, ns, a, 400, HEAD, 0.2));
      const d = wide ? 20 : 18;
      openTile(cd.img.x + cd.img.w - d, cd.img.y + cd.img.h - d, d, a);
    });
    drawChat(t);
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
    // Station one: the existing systems, and the converted files below.
    if (cam < L.landBottom + 20) drawOutside(t);

    for (let i = 0; i < 4; i++) drawExtract(i, t);
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
