"use client";

import { useTranslations } from "next-intl";

// Annotated technical figure: source formats converge on the CLI, land in a
// bucket, and are read directly by clients. Drawn in the primary blue with
// mono labels — format and tool names stay Latin in every locale, and the
// diagram itself never mirrors (dir="ltr").
export function PipelineFigure() {
  const t = useTranslations("howItWorks");

  const label = { fill: "var(--p-primary-ink)" };
  const dim = { fill: "var(--p-ink-3)" };

  return (
    <figure
      dir="ltr"
      className="m-0 border border-p-line bg-p-paper p-4 pb-2"
      style={{
        backgroundImage:
          "linear-gradient(color-mix(in srgb, var(--p-primary) 6%, transparent) 1px, transparent 1px)," +
          "linear-gradient(90deg, color-mix(in srgb, var(--p-primary) 6%, transparent) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <svg
        viewBox="0 0 880 190"
        role="img"
        aria-label={t("figCaption")}
        className="block w-full h-auto font-mono [&_text]:tracking-[0.08em]"
        style={{ fontSize: "9px" }}
      >
        {/* source formats */}
        <g stroke="var(--p-primary)" strokeWidth="1.2" fill="var(--p-paper)">
          <rect x="16" y="22" width="118" height="26" />
          <rect x="16" y="58" width="118" height="26" />
          <rect x="16" y="94" width="118" height="26" />
          <rect x="16" y="130" width="118" height="26" />
        </g>
        <text x="28" y="39" style={label}>shapefile</text>
        <text x="28" y="75" style={label}>geotiff</text>
        <text x="28" y="111" style={label}>wfs / gpkg</text>
        <text x="28" y="147" style={label}>arcgis fs</text>
        {/* converge on the CLI */}
        <g stroke="var(--p-primary)" strokeWidth="0.8" fill="none">
          <path d="M134 35 C 210 35, 220 88, 288 88" />
          <path d="M134 71 C 200 71, 214 88, 288 88" />
          <path d="M134 107 C 200 107, 214 90, 288 90" />
          <path d="M134 143 C 210 143, 220 92, 288 92" />
        </g>
        {/* cli box */}
        <rect
          x="288"
          y="58"
          width="182"
          height="62"
          fill="color-mix(in srgb, var(--p-primary) 6%, transparent)"
          stroke="var(--p-primary)"
          strokeWidth="1.5"
        />
        <text x="306" y="84" style={{ ...label, fontSize: "10.5px", fontWeight: 700 }}>
          portolan-cli
        </text>
        <text x="302" y="102" style={dim}>convert · catalog · check</text>
        {/* push arrow */}
        <g stroke="var(--p-primary)" strokeWidth="1" fill="none">
          <path d="M470 89 L560 89" />
          <path d="M552 84 L562 89 L552 94" fill="var(--p-primary)" stroke="none" />
        </g>
        <text x="480" y="80" style={dim}>push</text>
        {/* bucket */}
        <path
          d="M576 52 L688 52 L680 142 L584 142 Z"
          fill="var(--p-paper)"
          stroke="var(--p-primary)"
          strokeWidth="1.5"
        />
        <ellipse
          cx="632"
          cy="52"
          rx="56"
          ry="9"
          fill="var(--p-paper)"
          stroke="var(--p-primary)"
          strokeWidth="1.5"
        />
        <text x="600" y="92" style={label}>s3://…</text>
        <text x="596" y="110" style={dim}>catalog.json</text>
        {/* readers */}
        <g stroke="var(--p-primary)" strokeWidth="0.8" strokeDasharray="3 3" fill="none">
          <path d="M688 70 L760 40 L790 40" />
          <path d="M690 97 L790 97" />
          <path d="M688 124 L760 154 L790 154" />
        </g>
        <text x="796" y="44" style={dim}>DUCKDB</text>
        <text x="796" y="101" style={dim}>BROWSER</text>
        <text x="796" y="158" style={dim}>AGENT</text>
      </svg>
      <figcaption className="flex justify-between gap-3 mt-3 pt-2 px-1 border-t border-p-line-soft font-mono text-eyebrow text-p-ink-3">
        <span className="text-p-primary">{t("figCaption")}</span>
        <span>{t("figNote")}</span>
      </figcaption>
    </figure>
  );
}
