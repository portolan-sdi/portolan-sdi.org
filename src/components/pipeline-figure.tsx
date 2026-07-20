"use client";

import { useTranslations } from "next-intl";

// Animated technical figure (ported from the "exploded portolan map" design
// handoff): legacy sources stream into portolan-cli, standardized output is
// pushed to a bucket, and consumers read the files directly. Semantic
// language: solid curves with traveling packets = writes; dashed marching
// lines = reads. Keyframes (pd-src / pd-flow / pd-march / pd-glow) live in
// globals.css and are disabled under prefers-reduced-motion.
//
// Format and tool names inside the figure stay Latin in every locale, and the
// diagram never mirrors (dir="ltr"). Canvas geometry is the handoff's fixed
// 1480x430 grid; the SVG scales with the page and gains a horizontal scroll
// on narrow screens instead of shrinking below legibility.

const INK = "var(--p-primary)";
const TEXT = "var(--p-primary-ink)";
const FAINT = "color-mix(in srgb, var(--p-primary) 45%, transparent)";

// Source boxes: five rows on a 46px rhythm. The last row is a live endpoint
// (broadcast icon); the rest are files (document icon).
const SOURCES = [
  { label: "geotiff", top: 48, live: false },
  { label: "netcdf", top: 94, live: false },
  { label: "shapefile", top: 140, live: false },
  { label: "gpkg", top: 186, live: false },
  { label: "wfs / arcgis", top: 232, live: true },
] as const;

const CURVES = [
  "M250 66 C340 66 390 150 490 152",
  "M250 112 C340 112 390 157 490 158",
  "M250 158 C340 158 390 163 490 164",
  "M250 204 C340 204 390 169 490 169",
  "M250 250 C340 250 390 175 490 174",
] as const;

const CONSUMERS = [
  { label: "DUCKDB", y: 95, read: "M1150 130 L1300 92", delay: "0s" },
  { label: "BROWSER", y: 185, read: "M1158 178 L1300 180", delay: "0.3s" },
  { label: "AGENT", y: 273, read: "M1150 226 L1300 268", delay: "0.6s" },
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
    <figure dir="ltr" className="m-0 border border-p-line bg-p-paper p-4 pb-2">
      <div
        className="overflow-x-auto"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--p-primary) 25%, transparent) 1px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      >
        <svg
          viewBox="0 18 1480 300"
          role="img"
          aria-label={t("figCaption")}
          className="block w-full h-auto min-w-[960px] font-mono"
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
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}

          {/* source boxes */}
          {SOURCES.map((src) => (
            <g key={src.label}>
              <rect
                x="60"
                y={src.top}
                width="190"
                height="36"
                fill="var(--p-paper)"
                stroke={INK}
                strokeWidth="1"
              />
              {src.live ? (
                <BroadcastIcon x={74} y={src.top + 11} />
              ) : (
                <DocIcon x={74} y={src.top + 11} />
              )}
              <text
                x="96"
                y={src.top + 22.5}
                fontSize="12"
                letterSpacing="1"
                fill={TEXT}
              >
                {src.label}
              </text>
            </g>
          ))}

          {/* cli box with arrival glow */}
          <rect
            x="485.5"
            y="123.5"
            width="309"
            height="109"
            fill="none"
            stroke={INK}
            strokeWidth="5"
            opacity="0"
            className="pd-glow"
          />
          <rect
            x="490"
            y="128"
            width="300"
            height="100"
            fill="color-mix(in srgb, var(--p-primary) 6%, var(--p-paper))"
            stroke={INK}
            strokeWidth="1.5"
          />
          <text
            x="640"
            y="174"
            textAnchor="middle"
            fontSize="15"
            fontWeight="600"
            letterSpacing="1.5"
            fill={TEXT}
          >
            portolan-cli
          </text>
          <text
            x="640"
            y="197"
            textAnchor="middle"
            fontSize="11"
            letterSpacing="2"
            fill={FAINT}
          >
            ingest · convert · push
          </text>

          {/* push stream (uniform, standardized output) */}
          <path
            d="M790 168 H944"
            fill="none"
            stroke={INK}
            strokeWidth="2"
            strokeDasharray="5 9"
            className="pd-flow"
          />
          <path d="M948 162 L962 168 L948 174 Z" fill={INK} />
          <text
            x="869"
            y="150"
            textAnchor="middle"
            fontSize="10"
            letterSpacing="1.5"
            fill={INK}
          >
            cloud-optimized
          </text>

          {/* s3 bucket */}
          <path
            d="M965 105 L978 245 Q1060 263 1142 245 L1155 105"
            fill="var(--p-paper)"
            stroke={INK}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <ellipse
            cx="1060"
            cy="105"
            rx="95"
            ry="16"
            fill="var(--p-paper)"
            stroke={INK}
            strokeWidth="1.5"
          />
          <text
            x="1060"
            y="162"
            textAnchor="middle"
            fontSize="13"
            letterSpacing="1"
            fill={TEXT}
          >
            s3://any-bucket
          </text>
          <text
            x="1060"
            y="185"
            textAnchor="middle"
            fontSize="11"
            fill={FAINT}
          >
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
              <text x="1312" y={c.y} fontSize="13" letterSpacing="2" fill={INK}>
                {c.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="flex justify-between gap-3 mt-3 pt-2 px-1 border-t border-p-line-soft font-mono text-eyebrow text-p-ink-3">
        <span className="text-p-primary">{t("figCaption")}</span>
        <span>{t("figNote")}</span>
      </figcaption>
    </figure>
  );
}
