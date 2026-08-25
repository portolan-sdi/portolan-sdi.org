"use client";

import { useEffect, useRef, useState } from "react";
import { createGlyphScene, createGlyphOrthographicCamera } from "glyphcss";

interface GlyphMapCanvasProps {
  className?: string;
  /** Drift speed in CSS pixels per second. */
  pxPerSecond?: number;
}

/** The baked elevation grid written by scripts/bake-world-map.mjs. */
interface WorldRelief {
  n: number;
  x: number[];
  y: number[];
  z: number[];
  b: number[];
  /** Band contours. `s` runs six numbers to a segment. */
  wire: { b: number; s: number[] }[];
}

type Vec3 = [number, number, number];

/**
 * Contour ramp. One blue gradient in the accent hue from globals.css, so the
 * map reads as a single ink on cream paper.
 *
 * The index is a band, not a height ramp. Band 1 is the coastline and it holds
 * 1,625 of the 3,201 segments, so it carries the shape of the map and takes
 * --p-primary at full strength. Bands 3 to 8 are elevation contours. They step
 * from a lighter tint up to --p-primary-ink, so relief reads without competing
 * with the shoreline. Bands 0 and 2 carry no segments.
 *
 * Water covers about 68 percent of the grid, so bands 0 to 2 stay near the
 * page background. A strong tone over that much area buries the headline.
 *
 * Land starts at a mid grey rather than a pale one. Bands 3 to 5 hold 15.7
 * percent of the cells and bands 6 to 8 hold only 1.5 percent, so a ramp that
 * darkens evenly across all six renders nearly every continent in its palest
 * step.
 */
const BAND_COLORS = [
  "#8fa2e2",
  "#4163cc",
  "#8fa2e2",
  "#8fa2e2",
  "#7288d8",
  "#5f78d0",
  "#4e69c8",
  "#3c57b6",
  "#2d4aa8",
];

/** Camera and light settings, from the reference glyphcss flat map. */
const ROT_X = 40;
const ROT_Y = 0;
const ZOOM = 474.716401;
const RELIEF = 0.2;
const DENSITY = 2.4;
const LIGHT_AZ = 50;
const LIGHT_EL = 50;
const LIGHT_INTENSITY = 1.15;
const AMBIENT_INTENSITY = 0.4;

/** Glyph cell size in pixels before the density divisor. */
const BASE_FONT_PX = 13;

/**
 * Character encoding. Braille cells carry a 2 by 4 dot grid, so a contour runs
 * as a continuous curve instead of a staircase of box-drawing rules. The
 * junction pass and the half-block cells are documented no-ops here, because
 * both belong to the ASCII wireframe path and to solid mode.
 */
const CHAR_MODE = "braille" as const;

/**
 * Width of one world, in CSS pixels.
 *
 * The orthographic camera projects one world unit to exactly `zoom` pixels,
 * and the plane spans -1 to 1, so a whole world is twice the zoom. Measured
 * against the renderer at three configurations (host 1200 px, host 2400 px,
 * and a 6.5 px cell) the projected width held at 534 to 539 px per unit, so
 * the figure does not depend on the host size or the type metrics.
 *
 * Rendering into a host of exactly this width therefore fills the raster with
 * one world and no margin, which is what lets a copy of it tile.
 *
 * Rounded to a whole pixel. Flex lays out fractional widths inconsistently and
 * leaves a hairline between tiles. The rounding shifts the join by less than
 * half a pixel, which no join can show.
 */
const WORLD_PX = Math.round(ZOOM * 2);

/**
 * Drift speed, matched to the supporter logo marquee below the hero. That
 * marquee moves one 1405 px track in 42 s. The two strips sit close together
 * and a mismatch reads as a mistake.
 */
const DEFAULT_PX_PER_SECOND = 1405 / 42;

/** Unit vector toward the light, from azimuth and elevation in degrees. */
function lightDirection(azDeg: number, elDeg: number): Vec3 {
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  return [
    Math.cos(el) * Math.cos(az),
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
  ];
}

/**
 * Turn the band contours into drawable lines.
 *
 * The renderer takes polygons, so each segment becomes a degenerate triangle
 * that runs out to its far end and back. Band 1 is the coastline. Bands 3 to 8
 * are elevation contours, and each takes a darker step of the ramp.
 */
function buildContours(grid: WorldRelief) {
  const polygons = [];
  for (const band of grid.wire) {
    const color = BAND_COLORS[band.b] ?? BAND_COLORS[0];
    const s = band.s;
    for (let i = 0; i + 5 < s.length; i += 6) {
      const from: Vec3 = [s[i], s[i + 1], s[i + 2]];
      const to: Vec3 = [s[i + 3], s[i + 4], s[i + 5]];
      polygons.push({ vertices: [from, to, from], color });
    }
  }
  return polygons;
}

export default function GlyphMapCanvas({
  className = "",
  pxPerSecond = DEFAULT_PX_PER_SECOND,
}: GlyphMapCanvasProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const track = trackRef.current;
    if (!frame || !track) return;

    let disposed = false;
    let scene: ReturnType<typeof createGlyphScene> | null = null;
    let resizeTimer: number | undefined;
    let stopObserving = () => {};

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /**
     * Rasterize one world, then repeat it across the track.
     *
     * The map never re-rasterizes while it drifts. A character cell is about
     * 6.5 px wide and the drift covers about 33 px per second, so a re-render
     * loop would advance the image only five times a second whatever the frame
     * rate. Translating the finished raster keeps the motion on the compositor
     * and off the main thread.
     *
     * A tile carries the world from one antimeridian to the other, so abutting
     * two tiles joins the map along the same meridian and the seam closes.
     */
    function build(grid: WorldRelief) {
      if (disposed || !frame || !track) return;

      scene?.destroy();
      track.replaceChildren();

      const height = frame.getBoundingClientRect().height || 1;
      const stage = document.createElement("div");
      stage.style.cssText =
        `position:absolute;left:0;top:0;width:${WORLD_PX}px;` +
        `height:${height}px;visibility:hidden`;
      frame.appendChild(stage);

      const camera = createGlyphOrthographicCamera({
        rotX: ROT_X,
        rotY: ROT_Y,
        zoom: ZOOM,
      });
      camera.target = [0, 0, 0];

      scene = createGlyphScene(stage, {
        camera,
        autoSize: true,
        mode: "wireframe",
        charMode: CHAR_MODE,
        useColors: true,
        glyphPalette: "default",
        directionalLight: {
          direction: lightDirection(LIGHT_AZ, LIGHT_EL),
          intensity: LIGHT_INTENSITY,
        },
        ambientLight: { intensity: AMBIENT_INTENSITY },
      });
      scene.output.style.fontSize = `${BASE_FONT_PX / DENSITY}px`;
      scene.output.style.fontFamily = "var(--p-mono)";
      // Braille dots are hairlines at this cell size. Weight carries the
      // contour on a cream page, where a thin line disappears.
      scene.output.style.fontWeight = "700";
      // Cells butt against each other, so any leading between rows shows up as
      // banding across the map.
      scene.output.style.lineHeight = "1";
      scene.fit();
      scene.add(buildContours(grid), { scale: [1, 1, RELIEF] });
      scene.rerender();

      // One tile per world, plus one so the trailing edge never enters view
      // at the end of a loop.
      const width = frame.getBoundingClientRect().width || WORLD_PX;
      const tiles = Math.ceil(width / WORLD_PX) + 1;
      const source = scene.output;
      source.style.margin = "0";

      stage.remove();
      for (let i = 0; i < tiles; i++) {
        const tile = document.createElement("div");
        tile.style.cssText =
          `flex:0 0 auto;width:${WORLD_PX}px;height:100%;overflow:hidden`;
        tile.appendChild(i === 0 ? source : (source.cloneNode(true) as Node));
        track.appendChild(tile);
      }

      track.style.setProperty("--glyph-drift-distance", `${WORLD_PX}px`);
      track.style.setProperty(
        "--glyph-drift-duration",
        `${(WORLD_PX / pxPerSecond).toFixed(2)}s`
      );
      track.dataset.drifting = reducedMotion ? "false" : "true";
    }

    async function start() {
      let grid: WorldRelief;
      try {
        const res = await fetch("/data/world-relief.json");
        if (!res.ok) throw new Error(`relief fetch failed: ${res.status}`);
        grid = await res.json();
      } catch (err) {
        console.error("Glyph map terrain failed to load:", err);
        if (!disposed) setFailed(true);
        return;
      }
      if (disposed || !frame) return;

      try {
        build(grid);
      } catch (err) {
        console.error("Glyph map failed to start:", err);
        if (!disposed) setFailed(true);
        return;
      }
      if (!disposed) setReady(true);

      // The rail collapse resizes the column without a window resize event, so
      // the frame is observed directly. Only the tile count and the raster
      // height depend on the frame, so a rebuild is cheap and rare.
      let last = frame.getBoundingClientRect();
      const observer = new ResizeObserver(() => {
        const now = frame.getBoundingClientRect();
        if (
          Math.abs(now.width - last.width) < 8 &&
          Math.abs(now.height - last.height) < 8
        ) {
          return;
        }
        last = now;
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          if (disposed) return;
          try {
            build(grid);
          } catch (err) {
            console.error("Glyph map failed to rebuild:", err);
          }
        }, 220);
      });
      observer.observe(frame);
      stopObserving = () => observer.disconnect();
    }

    void start();

    return () => {
      disposed = true;
      window.clearTimeout(resizeTimer);
      stopObserving();
      scene?.destroy();
    };
  }, [pxPerSecond]);

  if (failed) return null;

  return (
    <div
      ref={frameRef}
      className={`relative overflow-hidden pointer-events-none transition-opacity duration-700 ${
        ready ? "opacity-100" : "opacity-0"
      } ${className}`}
      aria-hidden="true"
    >
      <div ref={trackRef} className="glyph-drift" />
    </div>
  );
}
