"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * The coverage map: A5 cells on an Equal Earth projection.
 *
 * The cells are the map. They trace the inhabited world on their own, so there
 * is no basemap under them and no frame around them. The map sits on the page.
 *
 * scripts/bake-a5-coverage.mjs projects every cell and writes it as a path, so
 * this component draws paths and does no geographic maths. It is a teaser: the
 * whole world is on screen, and the only interaction is reading one cell.
 */

const DATA_URL = "/data/a5-coverage-r4.json";

const FILL_MIN_ALPHA = 0.16;
const FILL_MAX_ALPHA = 0.85;

/** The drawing's ratio, used to hold the box before the paths arrive. */
const MAP_RATIO = "1600/779";

interface BakedCell {
  count: number;
  d: string;
}

interface BakedCoverage {
  max: number;
  width: number;
  height: number;
  cells: BakedCell[];
}

interface Reading {
  index: number;
  count: number;
  /** Where to put the label, in percent of the frame. */
  x: number;
  y: number;
}

export default function CoverageFlat() {
  const t = useTranslations("coverage");
  const frameRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<BakedCoverage | null>(null);
  const [hover, setHover] = useState<Reading | null>(null);
  const [pinned, setPinned] = useState<Reading | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((loaded: BakedCoverage) => {
        if (!cancelled) setData(loaded);
      })
      .catch((err) => console.error("coverage map failed to load", err));
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Shade by the rank of a count, not by its distance from the largest.
   *
   * The counts are bunched. Five catalogs are worldwide, so about three
   * quarters of the cells carry exactly five and the rest run from one to
   * eight. Spread linearly, nearly every cell takes the same tone. Ranking the
   * distinct counts and stepping evenly through the ramp keeps them apart.
   */
  const alphaByCount = useMemo(() => {
    const table = new Map<number, number>();
    const distinct = [
      ...new Set((data?.cells ?? []).map((cell) => cell.count)),
    ].sort((a, b) => a - b);
    const last = Math.max(1, distinct.length - 1);
    distinct.forEach((count, i) => {
      table.set(
        count,
        FILL_MIN_ALPHA + ((FILL_MAX_ALPHA - FILL_MIN_ALPHA) * i) / last,
      );
    });
    return table;
  }, [data]);

  // Built once. Nothing here reads the hover state, so moving the pointer never
  // re-renders the grid.
  const cellPaths = useMemo(
    () =>
      (data?.cells ?? []).map((cell, index) => (
        <path
          key={index}
          data-i={index}
          data-c={cell.count}
          d={cell.d}
          fill="var(--p-primary)"
          fillOpacity={alphaByCount.get(cell.count) ?? FILL_MAX_ALPHA}
        />
      )),
    [data, alphaByCount],
  );

  const legend = useMemo(
    () =>
      [...alphaByCount.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([count, alpha]) => ({ count, alpha })),
    [alphaByCount],
  );

  const shown = pinned ?? hover;
  const shownCell = shown && data ? data.cells[shown.index] : null;

  const readAt = (event: React.MouseEvent): Reading | null => {
    const frame = frameRef.current;
    const target = event.target as SVGElement;
    const index = target.dataset?.i;
    if (!frame || index === undefined) return null;
    const box = frame.getBoundingClientRect();
    return {
      index: Number(index),
      count: Number(target.dataset.c),
      x: ((event.clientX - box.left) / box.width) * 100,
      y: ((event.clientY - box.top) / box.height) * 100,
    };
  };

  if (!data) {
    return <div className="w-full" style={{ aspectRatio: MAP_RATIO }} />;
  }

  return (
    <figure className="m-0">
      {/* A picture of the world. It does not mirror, for the same reason the
          hero map does not. The caption below it does follow the page. */}
      <div ref={frameRef} dir="ltr" className="relative w-full">
        <svg
          viewBox={`0 0 ${data.width} ${data.height}`}
          className="block h-auto w-full"
          role="img"
          aria-label={t("about")}
          onMouseMove={(event) => setHover(readAt(event))}
          onMouseLeave={() => setHover(null)}
          onClick={(event) => {
            const reading = readAt(event);
            setPinned((current) =>
              current && reading && current.index === reading.index
                ? null
                : reading,
            );
          }}
        >
          <title>{t("about")}</title>
          <g className="cursor-pointer">{cellPaths}</g>

          {shownCell && (
            // Drawn over the grid rather than as a state every cell reads.
            <path
              d={shownCell.d}
              fill="var(--p-primary)"
              fillOpacity={FILL_MAX_ALPHA}
              stroke="var(--p-ink)"
              strokeWidth={2}
              pointerEvents="none"
            />
          )}
        </svg>

        {shown && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full border border-p-line bg-p-paper px-2 py-1 font-mono text-eyebrow text-p-ink"
            style={{ left: `${shown.x}%`, top: `calc(${shown.y}% - 8px)` }}
          >
            {t("cell.catalogs", { count: shown.count })}
          </div>
        )}
      </div>

      <figcaption className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-eyebrow text-p-ink-3">
        <span>{t("caption")}</span>
        <span className="flex items-center gap-2">
          <span>{t("legend")}</span>
          <span className="flex items-center gap-1">
            <span>{legend[0]?.count}</span>
            <span className="flex">
              {legend.map((step) => (
                <span
                  key={step.count}
                  aria-hidden="true"
                  className="inline-block h-3 w-4 border-s border-p-bg first:border-s-0"
                  style={{
                    backgroundColor: "var(--p-primary)",
                    opacity: step.alpha,
                  }}
                />
              ))}
            </span>
            <span>{legend[legend.length - 1]?.count}</span>
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
