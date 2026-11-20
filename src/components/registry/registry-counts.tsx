"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatBytes, formatCount, formatDate, registryTotals } from "@/lib/catalogs";
import type { CoverageIndex } from "@/lib/collection-points";
import { offMapCount, type CountedCatalog } from "@/lib/registry-view";

interface RegistryCountsProps {
  /** The catalogs the line counts. Its sums follow this list. */
  catalogs: CountedCatalog[];
  /** True when the map view leaves some catalogs out. */
  geoActive: boolean;
  /** The coverage index, or null before it arrives. */
  index: CoverageIndex | null;
  /** The registry crawl date comes from this list. */
  all: CountedCatalog[];
  /** On an ink band, every part of the line is `--p-on-primary`. */
  onInk?: boolean;
  className?: string;
}

/**
 * The count line under a registry map. It names the catalogs in the view,
 * with the global ones in parentheses. Then it names their collections,
 * features, and bytes, and the day the registry last read the catalogs. The
 * `/registry` page and the homepage registry section both use it.
 *
 * A global catalog has no point on the map. The parentheses count only the
 * global catalogs in `catalogs`, so the number never exceeds the count.
 */
export function RegistryCounts({
  catalogs,
  geoActive,
  index,
  all,
  onInk = false,
  className = "",
}: RegistryCountsProps) {
  const t = useTranslations("registry");
  const locale = useLocale();

  const totals = registryTotals(catalogs);
  const size = formatBytes(totals.bytes, locale);
  const crawledAt = formatDate(all[0]?.last_crawled ?? null, locale);
  const offMap = index ? offMapCount(catalogs, index) : 0;

  return (
    <p
      className={`flex flex-wrap items-center gap-x-1.5 text-small ${
        onInk ? "text-p-on-primary" : "text-p-ink-3"
      } ${className}`}
    >
      <span className={onInk ? undefined : "text-p-primary"}>
        {geoActive
          ? t("results.inView", { count: totals.catalogs })
          : t("results.all", { count: totals.catalogs })}
        {offMap > 0 && ` (${t("results.global", { count: offMap })})`}
      </span>
      {totals.catalogs > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <span>{t("card.collections", { count: formatCount(totals.collections, locale) })}</span>
          <span aria-hidden="true">·</span>
          <span>{t("card.features", { count: formatCount(totals.features, locale) })}</span>
          {size && (
            <>
              <span aria-hidden="true">·</span>
              <span>{size}</span>
            </>
          )}
        </>
      )}
      {crawledAt && (
        <>
          <span aria-hidden="true">·</span>
          <span>{t("lastChecked", { date: crawledAt })}</span>
        </>
      )}
    </p>
  );
}
