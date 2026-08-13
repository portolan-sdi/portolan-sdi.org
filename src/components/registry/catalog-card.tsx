"use client";

import { Fragment, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, Tag, DirArrow, Ltr } from "../ui";
import type { Catalog } from "@/lib/catalogs";
import {
  formatBytes,
  formatCount,
  formatDate,
  getBrowserUrl,
  getLicenseSummary,
  getValidationTier,
} from "@/lib/catalogs";
import { CopyUrlButton } from "./copy-url-button";

interface CatalogCardProps {
  catalog: Catalog;
}

// Dot-separated run of facts. Anything the crawl did not report is dropped
// rather than printed as "unknown", so cards stay ragged and every line on a
// card is a fact about that catalog.
function MetaRow({ children }: { children: ReactNode[] }) {
  const items = children.filter(Boolean);
  if (items.length === 0) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-micro text-p-ink-3 font-mono">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden="true">·</span>}
          <span>{item}</span>
        </Fragment>
      ))}
    </p>
  );
}

/** Card contents without the surrounding chrome, so the map panel can reuse it. */
export function CatalogCardBody({ catalog }: CatalogCardProps) {
  const t = useTranslations("registry");
  const locale = useLocale();
  const [logoBroken, setLogoBroken] = useState(false);

  const logo = logoBroken ? null : catalog.logo;
  const tier = getValidationTier(catalog.validation);
  const license = getLicenseSummary(catalog.licenses);
  const size = formatBytes(catalog.total_size_bytes, locale);
  const updated = formatDate(catalog.updated, locale);

  // A catalog holds either vector features or raster items, rarely both worth
  // naming. Lead with whichever the crawl actually counted.
  const contents =
    catalog.feature_count > 0
      ? t("card.features", { count: formatCount(catalog.feature_count, locale) })
      : catalog.item_count > 0
        ? t("card.items", { count: formatCount(catalog.item_count, locale) })
        : null;

  return (
    <>
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
        {/* Badge the exceptions only. A tag that reads the same on every card
            is chrome, not information. */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {catalog.kind && <Tag tone="primary">{t(`kind.${catalog.kind}`)}</Tag>}
          {catalog.stale_since && <Tag tone="accent">{t("status.stale")}</Tag>}
          {tier === "unvalidated" && <Tag>{t("validation.unvalidated")}</Tag>}
        </div>
      </div>

      <div className="space-y-1">
        {/* What the catalog holds. */}
        <MetaRow>
          {catalog.collection_count === 1
            ? t("card.collection")
            : t("card.collections", {
                count: formatCount(catalog.collection_count, locale),
              })}
          {contents}
          {size}
        </MetaRow>

        {/* How it is published, and how current it is. */}
        <MetaRow>
          {catalog.spec_version && (
            <Ltr>{t("card.specVersion", { version: catalog.spec_version })}</Ltr>
          )}
          {updated && t("card.updated", { date: updated })}
          {license &&
            (license.kind === "single" ? (
              <Ltr>{license.id}</Ltr>
            ) : (
              t("card.licenses", { count: String(license.count) })
            ))}
          {!catalog.bbox && t("card.noLocation")}
        </MetaRow>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
        <CopyUrlButton url={catalog.url} />
        <a
          href={getBrowserUrl(catalog.url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-small text-p-primary hover:underline"
        >
          {t("card.viewCatalog")} <DirArrow />
        </a>
      </div>
    </>
  );
}

export function CatalogCard({ catalog }: CatalogCardProps) {
  return (
    <Card className="flex flex-col gap-3">
      <CatalogCardBody catalog={catalog} />
    </Card>
  );
}
