"use client";

import { useTranslations } from "next-intl";

// Animated technical figure for the "Get started" section: existing sources
// stream into portolan-cli, cloud-optimized output is pushed to a bucket, and
// consumers read the files directly. Semantic language: solid curves with
// traveling packets = writes; dashed marching lines = reads. Keyframes
// (pd-src / pd-flow / pd-march) live in globals.css and are disabled under
// prefers-reduced-motion.
//
// The figure mirrors the four steps below it and stops there. It names one
// input group per step-1 example, one destination, and three consumers, so a
// reader can take it in at a glance instead of decoding it.
//
// Format and tool names inside the figure stay Latin in every locale, and the
// diagram never mirrors (dir="ltr"). Canvas geometry is a fixed 1200x240 grid;
// the SVG scales with the page and gains a horizontal scroll on narrow screens
// instead of shrinking below legibility.

const INK = "var(--p-primary)";
const TEXT = "var(--p-primary-ink)";
const FAINT = "color-mix(in srgb, var(--p-primary) 45%, transparent)";

// One row per input kind named in step 1. The last row is a live endpoint
// (broadcast icon); the rest are files (document icon).
const SOURCES = [
  { label: "shapefile / gpkg", top: 38, live: false },
  { label: "geotiff", top: 98, live: false },
  { label: "wfs / arcgis", top: 158, live: true },
] as const;

const CURVES = [
  "M220 55 C300 55 350 120 420 120",
  "M220 115 C300 115 350 120 420 120",
  "M220 175 C300 175 350 120 420 120",
] as const;

const CONSUMERS = [
  { label: "QGIS", y: 78, read: "M966 100 L1072 74", delay: "0s" },
  { label: "PYTHON", y: 134, read: "M980 130 L1072 130", delay: "0.3s" },
  { label: "AGENT", y: 192, read: "M966 160 L1072 188", delay: "0.6s" },
] as const;

function DocIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke={INK} strokeWidth="1" fill="none">
      <path d="M1 1h6l4 4v8H1Z" />
      <path d="M7 1v4h4" />
    </g>
  );
}

function BroadcastIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="7" cy="7" r="1.6" fill={INK} />
      <path
        d="M3.2 3.2a5.4 5.4 0 0 1 7.6 0M3.2 10.8a5.4 5.4 0 0 0 7.6 0"
        fill="none"
        stroke={INK}
        strokeWidth="1"
      />
    </g>
  );
}

export function PipelineFigure() {
  const t = useTranslations("howItWorks");

  return (
    <figure dir="ltr" className="m-0 border border-p-line bg-p-paper p-4">
      <div
        className="overflow-x-auto"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--p-primary) 25%, transparent) 1px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      >
        <svg
          viewBox="0 20 1200 200"
          role="img"
          aria-label={t("figAlt")}
          className="block w-full h-auto min-w-[720px] font-mono"
        >
          {/* source curves (base) */}
          {CURVES.map((d) => (
            <path key={d} d={d} fill="none" stroke={FAINT} strokeWidth="1" />
          ))}
          {/* source packets (writes) */}
          {CURVES.map((d, i) => (
            <path
              key={`pk-${d}`}
              d={d}
              pathLength={100}
              fill="none"
              stroke={INK}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="10 100"
              className="pd-src"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}

          {/* source boxes */}
          {SOURCES.map((src) => (
            <g key={src.label}>
              <rect
                x="40"
                y={src.top}
                width="180"
                height="34"
                fill="var(--p-paper)"
                stroke={INK}
                strokeWidth="1"
              />
              {src.live ? (
                <BroadcastIcon x={54} y={src.top + 10} />
              ) : (
                <DocIcon x={54} y={src.top + 10} />
              )}
              <text
                x="76"
                y={src.top + 21.5}
                fontSize="12"
                letterSpacing="1"
                fill={TEXT}
              >
                {src.label}
              </text>
            </g>
          ))}

          {/* cli box */}
          <rect
            x="420"
            y="86"
            width="260"
            height="68"
            fill="color-mix(in srgb, var(--p-primary) 6%, var(--p-paper))"
            stroke={INK}
            strokeWidth="1.5"
          />
          <text
            x="550"
            y="116"
            textAnchor="middle"
            fontSize="15"
            fontWeight="600"
            letterSpacing="1.5"
            fill={TEXT}
          >
            portolan-cli
          </text>
          <text
            x="550"
            y="137"
            textAnchor="middle"
            fontSize="11"
            letterSpacing="2"
            fill={FAINT}
          >
            convert · catalog
          </text>

          {/* push stream (cloud-optimized output) */}
          <path
            d="M680 120 H776"
            fill="none"
            stroke={INK}
            strokeWidth="2"
            strokeDasharray="5 9"
            className="pd-flow"
          />
          <path d="M780 114 L794 120 L780 126 Z" fill={INK} />

          {/* s3 bucket */}
          <path
            d="M802 72 L814 186 Q890 202 966 186 L978 72"
            fill="var(--p-paper)"
            stroke={INK}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <ellipse
            cx="890"
            cy="72"
            rx="88"
            ry="15"
            fill="var(--p-paper)"
            stroke={INK}
            strokeWidth="1.5"
          />
          <text
            x="890"
            y="126"
            textAnchor="middle"
            fontSize="13"
            letterSpacing="1"
            fill={TEXT}
          >
            s3://any-bucket
          </text>
          <text x="890" y="147" textAnchor="middle" fontSize="11" fill={FAINT}>
            catalog.json
          </text>

          {/* consumer reads (pulls) */}
          {CONSUMERS.map((c) => (
            <g key={c.label}>
              <path
                d={c.read}
                fill="none"
                stroke={FAINT}
                strokeWidth="1.2"
                strokeDasharray="5 6"
                className="pd-march"
                style={{ animationDelay: c.delay }}
              />
              <text x="1084" y={c.y} fontSize="13" letterSpacing="2" fill={INK}>
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}
