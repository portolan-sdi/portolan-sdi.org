"use client";

import { useTranslations } from "next-intl";
import { DirArrow, Ltr, SectionHead, monoChunk } from "./ui";

// Project and tool names are proper nouns and stay in Latin in every locale,
// so they live here rather than in the messages files. Group labels are
// translated. Third-party list is a draft pending an editorial pass.
const portolanProjects = [
  { name: "portolan-spec", href: "https://github.com/portolan-sdi/portolan-spec" },
  { name: "reis", href: "https://github.com/portolan-sdi/reis" },
  { name: "portolan-cli", href: "https://github.com/portolan-sdi/portolan-cli" },
  { name: "portolan-registry", href: "https://github.com/portolan-sdi/portolan-registry" },
  { name: "portolan-browser", href: "https://github.com/portolan-sdi/portolan-browser" },
  { name: "portolan-skills", href: "https://github.com/portolan-sdi/portolan-skills" },
] as const;

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
          subtitle={t.rich("subtitle", { m: monoChunk })}
        />
        <div className="border-t border-p-line-strong">
          <div className="grid grid-cols-1 sm:grid-cols-[220px_minmax(0,1fr)] gap-x-8 gap-y-1 py-5 border-b border-p-line">
            <span className="font-mono text-micro text-p-ink-3">
              {t("groups.portolan")}
            </span>
            <p className="text-body leading-relaxed">
              {portolanProjects.map((project, i) => (
                <span key={project.name}>
                  {i > 0 && " · "}
                  <a
                    href={project.href}
                    className="text-p-primary hover:underline"
                  >
                    <Ltr>{project.name}</Ltr> <DirArrow kind="external" />
                  </a>
                </span>
              ))}
            </p>
          </div>
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
