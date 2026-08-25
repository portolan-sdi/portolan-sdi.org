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
}

type Vec3 = [number, number, number];

/**
 * Elevation ramp. One neutral grey gradient, palest at the sea floor and
 * darkest at the peaks, so the map reads as a single ink on cream paper.
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
  "#eeeeea",
  "#e8e8e3",
  "#e1e1dc",
  "#8d8d85",
  "#7c7c74",
  "#6a6a63",
  "#575751",
  "#464640",
  "#35352f",
];

/** Camera and light settings, from the reference glyphcss flat map. */
const ROT_X = 40;
const ROT_Y = 0;
const ZOOM = 535.797293;
const RELIEF = 0.2;
const DENSITY = 1.6;
const LIGHT_AZ = 50;
const LIGHT_EL = 50;
const LIGHT_INTENSITY = 1.15;
const AMBIENT_INTENSITY = 0.4;

/** Glyph cell size in pixels before the density divisor. */
const BASE_FONT_PX = 13;

/**
 * Character encoding. The reference map runs the ASCII ramp on a black page,
 * where a sparse bright mark carries plenty of contrast. This page is cream,
 * and an ASCII mark inks only a fraction of its cell, so the same ramp renders
 * the continents as a pale wash whatever colour they carry. Half-block cells
 * fill, so the land reads as land.
 */
const CHAR_MODE = "halfblock" as const;

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

/** Expand the grid into one quad per cell. */
function buildPolygons(grid: WorldRelief) {
  const { n, x, y, z, b } = grid;
  const w = n + 1;
  const polygons = new Array(n * n);
  for (let iy = 0; iy < n; iy++) {
    for (let ix = 0; ix < n; ix++) {
      polygons[iy * n + ix] = {
        vertices: [
          [x[ix], y[iy], z[iy * w + ix]],
          [x[ix + 1], y[iy], z[iy * w + ix + 1]],
          [x[ix + 1], y[iy + 1], z[(iy + 1) * w + ix + 1]],
          [x[ix], y[iy + 1], z[(iy + 1) * w + ix]],
        ] as Vec3[],
        color: BAND_COLORS[b[iy * n + ix]] ?? BAND_COLORS[0],
      };
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
        mode: "solid",
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
      // Half-block cells fill their box, so any leading between rows shows up
      // as white banding across the map.
      scene.output.style.lineHeight = "1";
      scene.fit();
      scene.add(buildPolygons(grid), { scale: [1, 1, RELIEF] });
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
