"use client";

import { useEffect, useRef, useState } from "react";
import { createGlyphScene, createGlyphOrthographicCamera } from "glyphcss";

interface GlyphMapCanvasProps {
  className?: string;
  /** Drift speed in CSS pixels per second. Ignored when `still` is set. */
  pxPerSecond?: number;
  /**
   * Hold the map still. The page header band uses this: the homepage carries
   * the one moving element on the site, and repeating that drift above every
   * other page would make the motion ordinary rather than a moment.
   */
  still?: boolean;
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
 * Elevation ramp. The band index is a height.
 *
 * Band 0 alone is water. It holds 67.8 percent of the cells and its mean
 * elevation is 0.0002, against 0.0016 and up for every other band. Bands 1 to
 * 8 are land and together they hold 32.2 percent, which matches the real land
 * fraction. Bands 1 and 2 are lowland and they alone carry 58 percent of the
 * land, so painting them as water erases most of every continent.
 *
 * Water sits just off the page colour, the way the reference map sets its sea
 * just off its own near-black page. Land then darkens with height.
 *
 * The ramp runs the full range on purpose. A band set of mid tints gives the
 * map nothing to anchor on and it reads as flat. Lowland starts at a clear
 * blue and the peaks land near navy, so the coastline has an edge and the
 * relief has somewhere to travel.
 */
const BAND_COLORS = [
  "#dfe6f5",
  "#93a6e4",
  "#7b8fdb",
  "#6478d2",
  "#5064c6",
  "#3f53b6",
  "#3244a1",
  "#26358a",
  "#1b2870",
];

/**
 * Camera and light settings, from the reference glyphcss flat map.
 *
 * These match the reference exactly. The shaded render carries almost no glyph
 * variety, and it is not supposed to: a capture of the reference returns 30,770
 * `@` out of about 34,000 cells and only six distinct characters in total.
 * Colour carries the shading and the glyph is a uniform fill. Driving the light
 * down to spread the character ramp instead only adds noise.
 */
const ROT_X = 40;
const ROT_Y = 0;
const ZOOM = 550;
const RELIEF = 0.2;
const DENSITY = 2;
const LIGHT_AZ = 50;
const LIGHT_EL = 50;
const LIGHT_INTENSITY = 1.15;
const AMBIENT_INTENSITY = 0.4;

/** Glyph cell size in pixels before the density divisor. */
const BASE_FONT_PX = 13;

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
 * Drift speed.
 *
 * The supporter logo marquee below the hero moves a 1405 px track in 42 s, so
 * 33.45 px/s. The map ran at that same rate and the two strips then read as one
 * coupled mechanism, because nothing separated them. The map is the layer
 * behind, so it travels slower. The ratio is deliberately not a simple
 * fraction, so the two never settle into step.
 */
const MARQUEE_PX_PER_SECOND = 1405 / 42;
const DEFAULT_PX_PER_SECOND = MARQUEE_PX_PER_SECOND * 0.38;

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
  still = false,
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
        charMode: "ascii",
        useColors: true,
        glyphPalette: "default",
        // Rasterize at 2x and average down. The map is drawn once and then
        // translated, so the documented N-squared cost lands on a single
        // frame at load and buys smoother coastlines for the whole session.
        supersample: 2,
        directionalLight: {
          direction: lightDirection(LIGHT_AZ, LIGHT_EL),
          intensity: LIGHT_INTENSITY,
        },
        ambientLight: { intensity: AMBIENT_INTENSITY },
      });
      scene.output.style.fontSize = `${BASE_FONT_PX / DENSITY}px`;
      scene.output.style.fontFamily = "var(--p-mono)";
      // Cells butt against each other, so any leading between rows shows up as
      // banding across the map.
      scene.output.style.lineHeight = "1";
      scene.fit();
      scene.add(buildPolygons(grid), { scale: [1, 1, RELIEF] });
      scene.rerender();

      // One tile per world, plus one so the trailing edge never enters view
      // at the end of a loop.
      const width = frame.getBoundingClientRect().width || WORLD_PX;
      const tiles = Math.ceil(width / WORLD_PX) + (still ? 0 : 1);
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
      track.dataset.drifting = reducedMotion || still ? "false" : "true";
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
  }, [pxPerSecond, still]);

  if (failed) return null;

  // The map is a raster of text glyphs, so a right-to-left page reverses every
  // glyph row and flips the tile order. The frame stays LTR in every locale,
  // the same way a terminal block does.
  return (
    <div
      ref={frameRef}
      dir="ltr"
      className={`relative overflow-hidden pointer-events-none transition-opacity duration-700 ${
        ready ? "opacity-100" : "opacity-0"
      } ${className}`}
      aria-hidden="true"
    >
      <div ref={trackRef} className="glyph-drift" />
    </div>
  );
}
