"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, Tag, DirArrow, Ltr } from "../ui";
import type { Catalog } from "@/lib/catalogs";
import { getBrowserUrl, getLicenseSummary, getValidationTier } from "@/lib/catalogs";

interface CatalogCardProps {
  catalog: Catalog;
}

function getRegionFromBbox(bbox: [number, number, number, number] | null) {
  if (!bbox) return null;
  const [west, south, east, north] = bbox;
  const centerLat = (south + north) / 2;
  const centerLon = (west + east) / 2;

  return {
    lat: Math.abs(centerLat).toFixed(0),
    latDir: centerLat >= 0 ? ("north" as const) : ("south" as const),
    lon: Math.abs(centerLon).toFixed(0),
    lonDir: centerLon >= 0 ? ("east" as const) : ("west" as const),
  };
}

export function CatalogCard({ catalog }: CatalogCardProps) {
  const t = useTranslations("registry");
  const [logoBroken, setLogoBroken] = useState(false);
  const tier = getValidationTier(catalog.validation);
  const region = getRegionFromBbox(catalog.bbox);
  const license = getLicenseSummary(catalog.licenses);
  const logo = logoBroken ? null : catalog.logo;

  return (
    <Card className="flex flex-col gap-3">
      {logo && (
        // Logos come from whatever host the catalog lives on, so there is no
        // finite allowlist to give next/image's remotePatterns. A plain <img>
        // keeps the optimizer from becoming an open proxy. The registry checks
        // the image resolves at crawl time; onError covers later rot.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.href}
          alt={logo.title ?? catalog.title}
          onError={() => setLogoBroken(true)}
          loading="lazy"
          className="h-8 w-auto max-w-[160px] self-start object-contain"
        />
      )}

      <div className="flex justify-between items-start gap-2">
        <h3 className="text-card-title font-semibold line-clamp-2">{catalog.title}</h3>
        <Tag
          tone={tier === "full" ? "accent" : tier === "basic" ? "primary" : "default"}
          className="shrink-0"
        >
          {t(`validation.${tier}`)}
        </Tag>
      </div>

      <div className="flex flex-wrap gap-2 text-micro text-p-ink-3 font-mono">
        <span>{t("card.collections", { count: catalog.collection_count })}</span>
        {catalog.stac_version && (
          <>
            <span>·</span>
            <span>STAC {catalog.stac_version}</span>
          </>
        )}
        {license && (
          <>
            <span>·</span>
            <span>
              {license.kind === "single" ? (
                <Ltr>{license.id}</Ltr>
              ) : (
                t("card.licenses", { count: license.count })
              )}
            </span>
          </>
        )}
        {region && (
          <>
            <span>·</span>
            <span>
              {region.lat}
              {t(`compass.${region.latDir}`)}, {region.lon}
              {t(`compass.${region.lonDir}`)}
            </span>
          </>
        )}
      </div>

      <a
        href={getBrowserUrl(catalog.url)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto text-small text-p-primary hover:underline"
      >
        {t("card.viewCatalog")} <DirArrow />
      </a>
    </Card>
  );
}
