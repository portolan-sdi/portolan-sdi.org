"use client";

import { useTranslations } from "next-intl";
import { Ltr, SectionHead } from "./ui";

// Tool names are proper nouns and stay in Latin in every locale, so they live
// here rather than in the messages files. Group labels are translated.
// Draft list pending an editorial pass — trim or extend freely.
const groups = [
  { key: "query", tools: ["DuckDB", "BigQuery", "Snowflake", "Apache Sedona"] },
  { key: "gis", tools: ["QGIS", "ArcGIS Pro", "Felt"] },
  { key: "libraries", tools: ["GDAL", "GeoPandas", "rasterio", "loaders.gl"] },
  { key: "stac", tools: ["STAC Browser", "stac-geoparquet", "pystac"] },
] as const;

export function EcosystemSection() {
  const t = useTranslations("ecosystem");

  return (
    <section
      id="ecosystem"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        <SectionHead
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="border-t border-p-line-strong">
          {groups.map((group) => (
            <div
              key={group.key}
              className="grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)] gap-x-8 gap-y-1 py-5 border-b border-p-line"
            >
              <span className="font-mono text-micro text-p-ink-3">
                {t(`groups.${group.key}`)}
              </span>
              <p className="text-body leading-relaxed">
                {group.tools.map((tool, i) => (
                  <span key={tool}>
                    {i > 0 && " · "}
                    <Ltr>{tool}</Ltr>
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
