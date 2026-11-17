/**
 * Canvas 2D drawing for the homepage hero figure.
 *
 * One frame holds the catalog tree, the two file drawings, the globe
 * outline, and the land points. The tree text draws on the canvas too, so
 * it scales with the device pixel ratio and stays crisp.
 *
 * Ink lines are structure. Blue is the data itself.
 */

import {
  REGIONS,
  ROLL,
  TIP,
  finishAlpha,
  flightEase,
  globeAlpha,
  globeSlide,
  landedAlpha,
  mapWipe,
  noteAlpha,
  planePoint,
  smooth,
  structureAlpha,
  type CogDrawing,
  type ParquetDrawing,
  type Plane,
  type Scene,
  type Stage,
} from "./hero-points";

/** The brand tokens the figure draws with, read from CSS at runtime. */
export interface Palette {
  bg: string;
  primary: string;
  primaryInk: string;
  ink: string;
  ink2: string;
  ink3: string;
  lineSoft: string;
  /** The mono font stack. */
  mono: string;
}

export interface Renderer {
  setScene(scene: Scene, palette: Palette, dpr: number): void;
  draw(stage: Stage): void;
  destroy(): void;
}

/** The tint of each region, shared by the map and its row group. */
const TINTS = [0.12, 0.26, 0.42];

/** Size of the notes and the drawing labels, in CSS pixels. */
const LABEL_PX = 11;

export function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const maybe = canvas.getContext("2d");
  if (!maybe) return null;
  const g: CanvasRenderingContext2D = maybe;

  let scene: Scene | null = null;
  let palette: Palette | null = null;
  let dpr = 1;
  let outlines: Path2D | null = null;

  /** A 1px line on whole pixels. */
  function line(x1: number, y1: number, x2: number, y2: number) {
    g.beginPath();
    g.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
    g.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
    g.stroke();
  }

  function box(x: number, y: number, w: number, h: number) {
    g.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h));
  }

  function text(
    value: string,
    x: number,
    y: number,
    color: string,
    px: number,
    weight = "",
  ) {
    g.font = `${weight}${px}px ${palette!.mono}`;
    g.fillStyle = color;
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillText(value, Math.round(x), Math.round(y));
  }

  function planePath(plane: Plane, u0: number, u1: number) {
    const a = planePoint(plane, u0, 0);
    const b = planePoint(plane, u1, 0);
    const c = planePoint(plane, u1, 1);
    const d = planePoint(plane, u0, 1);
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
    g.lineTo(c[0], c[1]);
    g.lineTo(d[0], d[1]);
    g.closePath();
  }

  /** The connectors and names, drawn from the top down. */
  function drawTree(s: Scene, c: Palette, p: number) {
    const front = ((p - s.treeFrom) / s.treeSpan) * s.height;
    const late = s.wide ? noteAlpha(p) : 1;
    if (front > 0) {
      g.save();
      g.beginPath();
      g.rect(0, 0, s.width, front + s.rowH / 2);
      g.clip();
      g.strokeStyle = c.ink3;
      g.lineWidth = 1;
      for (const trunk of s.trunks) line(trunk.x, trunk.y0, trunk.x, trunk.y1);
      for (const row of s.rows) {
        if (row.depth === 0) continue;
        const mid = row.y + s.rowH / 2;
        line((row.depth - 1) * s.indent + 4, mid, row.x - 4, mid);
      }
      g.restore();
    }
    for (const row of s.rows) {
      const shown = smooth(row.at - 0.02, row.at + 0.04, p);
      if (shown <= 0) continue;
      const strong = row.kind === "root" || row.kind === "dir" || row.kind === "data";
      const color = strong ? c.ink : c.ink2;
      const base = row.y + 13;
      g.globalAlpha = shown;
      text(row.name, row.x, base, color, s.fontPx, strong ? "600 " : "");
      const nameW = g.measureText(row.name).width;
      g.globalAlpha = shown * late;
      if (row.note) {
        text(row.note, Math.max(s.noteX, row.x + nameW + s.noteGap), base, c.ink3, LABEL_PX);
      }
      if (row.format) {
        if (s.wide) text(row.format, row.x, base + 16, c.primaryInk, LABEL_PX);
        else text(row.format, row.x + nameW + s.noteGap, base, c.primaryInk, LABEL_PX);
      }
    }
    g.globalAlpha = 1;
  }

  /**
   * GeoParquet. The map shows land outlines in three regions. Each region
   * is one row group of the table and shares its tint with the geometry
   * chunk of that row group. `geometry` is the one label.
   */
  function drawParquet(d: ParquetDrawing, c: Palette, p: number) {
    const structure = structureAlpha(p);
    const finish = finishAlpha(p);
    const wipe = mapWipe(p);

    if (structure > 0) {
      g.lineWidth = 1;
      d.bands.forEach((y, k) => {
        let x = d.tx;
        d.cols.forEach((w, col) => {
          if (col === 2 && finish > 0) {
            g.globalAlpha = structure * finish * TINTS[k];
            g.fillStyle = c.primary;
            g.fillRect(Math.round(x), Math.round(y), w, d.bandH);
          }
          g.globalAlpha = structure;
          g.strokeStyle = c.ink;
          box(x, y, w, d.bandH);
          x += w;
        });
      });
    }

    if (wipe > 0 && outlines) {
      g.save();
      g.beginPath();
      g.rect(d.mx - 2, d.my - 2, (d.mw + 4) * wipe, d.mh + 4);
      g.clip();
      REGIONS.forEach(([from, to], k) => {
        g.save();
        g.beginPath();
        g.rect(d.mx + from * d.mw, d.my - 2, (to - from) * d.mw, d.mh + 4);
        g.clip();
        g.globalAlpha = TINTS[k];
        g.fillStyle = c.primary;
        g.fill(outlines!, "evenodd");
        g.globalAlpha = 1;
        g.strokeStyle = c.primaryInk;
        g.lineWidth = 1;
        g.lineJoin = "round";
        g.stroke(outlines!);
        g.restore();
      });
      g.restore();
    }

    if (finish > 0) {
      g.globalAlpha = finish;
      const geometryX = d.tx + d.cols[0] + d.cols[1];
      text("geometry", geometryX + 1, d.labelY, c.primaryInk, LABEL_PX);
    }
    g.globalAlpha = 1;
  }

  /**
   * Cloud Optimized GeoTIFF. The same raster at three resolutions as
   * stacked planes. The full resolution plane shows its tile grid. The
   * drawing has no labels.
   */
  function drawCog(d: CogDrawing, c: Palette, p: number) {
    const structure = structureAlpha(p);
    const finish = finishAlpha(p);
    const wipe = mapWipe(p);
    const full = d.planes[0];
    const top = d.planes[d.planes.length - 1];
    g.lineWidth = 1;

    if (structure > 0) {
      g.globalAlpha = structure;
      // Faint pyramid edges through the matching corners.
      g.strokeStyle = c.lineSoft;
      for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const a = planePoint(full, u, v);
        const b = planePoint(top, u, v);
        g.beginPath();
        g.moveTo(a[0], a[1]);
        g.lineTo(b[0], b[1]);
        g.stroke();
      }
    }

    d.planes.forEach((plane, k) => {
      const isFull = k === 0;
      if (structure > 0) {
        g.globalAlpha = structure;
        planePath(plane, 0, 1);
        g.fillStyle = c.bg;
        g.fill();
      }
      // The full resolution pixels follow the points. Overviews come last.
      const landAlpha = isFull ? 1 : finish * structure;
      if (landAlpha > 0 && (!isFull || wipe > 0)) {
        g.save();
        if (isFull && wipe < 1) {
          planePath(plane, 0, wipe);
          g.clip();
        }
        g.globalAlpha = landAlpha * 0.55;
        g.fillStyle = c.primary;
        g.beginPath();
        const { nx, ny, runs } = plane.level;
        for (const [col, row, length] of runs) {
          const a = planePoint(plane, col / nx, row / ny);
          const b = planePoint(plane, (col + length) / nx, row / ny);
          const e = planePoint(plane, (col + length) / nx, (row + 1) / ny);
          const f = planePoint(plane, col / nx, (row + 1) / ny);
          g.moveTo(a[0], a[1]);
          g.lineTo(b[0], b[1]);
          g.lineTo(e[0], e[1]);
          g.lineTo(f[0], f[1]);
          g.closePath();
        }
        g.fill();
        g.restore();
      }
      if (structure > 0) {
        if (isFull) {
          g.globalAlpha = structure * 0.7;
          g.strokeStyle = c.ink3;
          for (let i = 1; i < 8; i++) {
            const a = planePoint(plane, i / 8, 0);
            const b = planePoint(plane, i / 8, 1);
            g.beginPath();
            g.moveTo(a[0], a[1]);
            g.lineTo(b[0], b[1]);
            g.stroke();
          }
          for (let i = 1; i < 3; i++) {
            const a = planePoint(plane, 0, i / 3);
            const b = planePoint(plane, 1, i / 3);
            line(a[0], a[1] - 0.5, b[0], b[1] - 0.5);
          }
        }
        g.globalAlpha = structure;
        g.strokeStyle = c.ink;
        planePath(plane, 0, 1);
        g.stroke();
      }
    });

    g.globalAlpha = 1;
  }

  /** The globe outline, the graticule, and every point that still shows. */
  function drawGlobe(s: Scene, c: Palette, stage: Stage) {
    const { world, globe } = s;
    const p = stage.p;
    const slide = globeSlide(p);
    const cx = globe.cx0 + (globe.cx1 - globe.cx0) * slide;
    const cy = globe.cy;
    const r = globe.r0 + (globe.r1 - globe.r0) * slide;

    const sinLon = Math.sin(-stage.lon);
    const cosLon = Math.cos(-stage.lon);
    const sinTip = Math.sin(TIP);
    const cosTip = Math.cos(TIP);
    const sinRoll = Math.sin(ROLL);
    const cosRoll = Math.cos(ROLL);
    let sx = 0;
    let sy = 0;
    let sz = 0;
    /** Turn, tip, and roll a unit vector, then place it on the figure. */
    const project = (x0: number, y0: number, z0: number) => {
      const x = x0 * cosLon + z0 * sinLon;
      const z = -x0 * sinLon + z0 * cosLon;
      const y = y0 * cosTip - z * sinTip;
      sz = y0 * sinTip + z * cosTip;
      sx = cx + (x * cosRoll - y * sinRoll) * r;
      sy = cy - (x * sinRoll + y * cosRoll) * r;
    };

    const outline = globeAlpha(p, s.wide);
    if (outline > 0) {
      // The whole globe is the primary blue. The graticule is fainter, so
      // the land reads first.
      g.lineWidth = 1;
      g.strokeStyle = c.primary;
      g.globalAlpha = outline * 0.26;
      for (const path of world.graticule) {
        g.beginPath();
        let pen = false;
        for (let k = 0; k < path.length; k += 3) {
          project(path[k], path[k + 1], path[k + 2]);
          if (sz > 0) {
            if (pen) g.lineTo(sx, sy);
            else g.moveTo(sx, sy);
            pen = true;
          } else pen = false;
        }
        g.stroke();
      }
      g.globalAlpha = outline * 0.8;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
    }
    if (p >= 1) {
      g.globalAlpha = 1;
      return;
    }

    g.fillStyle = c.primary;
    const dot = Math.max(1.4, r / 150);
    for (let i = 0; i < world.count; i++) {
      project(world.gx[i], world.gy[i], world.gz[i]);
      const facing = smooth(0, 0.3, sz);
      const share = world.u[i];
      const e = flightEase(p, share);
      let alpha =
        (facing + (1 - facing) * smooth(0, 0.5, e)) * landedAlpha(p, share);
      // A point outside the map window has no place. It fades on the way.
      if (world.v[i] < 0 || world.v[i] > 1) alpha *= 1 - smooth(0.2, 0.9, e);
      // In the stacked form a point shows on the globe or near its place.
      if (!s.wide) alpha *= Math.max(outline * (1 - e), smooth(0.72, 0.95, e));
      if (alpha <= 0.01) continue;
      let x = sx;
      let y = sy;
      if (e > 0) {
        const dx = s.tx[i] - sx;
        const dy = s.ty[i] - sy;
        const bend = Math.sin(e * Math.PI) * 0.07;
        x = sx + dx * e - dy * bend;
        y = sy + dy * e + dx * bend;
      }
      const size = dot + (1.2 - dot) * e;
      g.globalAlpha = alpha * (0.9 - 0.1 * e);
      g.fillRect(x - size / 2, y - size / 2, size, size);
    }
    g.globalAlpha = 1;
  }

  return {
    setScene(next, colors, ratio) {
      scene = next;
      palette = colors;
      dpr = ratio;
      canvas.width = Math.round(next.width * dpr);
      canvas.height = Math.round(next.height * dpr);
      // The outlines as one path, placed on the vector map.
      const d = next.parquet;
      outlines = new Path2D();
      for (const ring of next.world.rings) {
        for (let k = 0; k < ring.length; k += 2) {
          const x = d.mx + ring[k] * d.mw;
          const y = d.my + ring[k + 1] * d.mh;
          if (k === 0) outlines.moveTo(x, y);
          else outlines.lineTo(x, y);
        }
        outlines.closePath();
      }
    },

    draw(stage) {
      if (!scene || !palette) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, scene.width, scene.height);
      if (stage.p > 0) {
        drawTree(scene, palette, stage.p);
        drawParquet(scene.parquet, palette, stage.p);
        drawCog(scene.cog, palette, stage.p);
      }
      drawGlobe(scene, palette, stage);
    },

    destroy() {
      scene = null;
      palette = null;
      outlines = null;
    },
  };
}
