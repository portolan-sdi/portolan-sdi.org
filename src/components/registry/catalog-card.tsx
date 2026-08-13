"use client";

import { Fragment, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Tag, DirArrow, Ltr } from "../ui";
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

interface CatalogProps {
  catalog: Catalog;
}

// Dot-separated run of facts. Anything the crawl did not report is dropped
// rather than printed as "unknown", so every line reads as a fact about that
// catalog.
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

/** Logo, title, and any exception badge. Shared by the card front and the map panel. */
export function CatalogHeader({ catalog }: CatalogProps) {
  const t = useTranslations("registry");
  const [logoBroken, setLogoBroken] = useState(false);
  const logo = logoBroken ? null : catalog.logo;
  const tier = getValidationTier(catalog.validation);

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
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-card-title font-semibold line-clamp-3">{catalog.title}</h3>
        {/* Badge the exceptions only. A tag that reads the same on every card
            is chrome, not information. */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {catalog.kind && <Tag tone="primary">{t(`kind.${catalog.kind}`)}</Tag>}
          {catalog.stale_since && <Tag tone="accent">{t("status.stale")}</Tag>}
          {tier === "unvalidated" && <Tag>{t("validation.unvalidated")}</Tag>}
        </div>
      </div>
    </>
  );
}

/** Everything the crawl measured. Shared by the card back and the map panel. */
export function CatalogFacts({ catalog }: CatalogProps) {
  const t = useTranslations("registry");
  const locale = useLocale();

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
      <MetaRow>
        {collectionLabel(catalog, t, locale)}
        {contents}
        {size}
      </MetaRow>
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
    </>
  );
}

/**
 * Copy the address, or open the catalog in the browser. `tabbable` is false on
 * a card face that is turned away, so its controls leave the tab order while
 * they are invisible.
 */
export function CatalogActions({
  catalog,
  tabbable = true,
}: CatalogProps & { tabbable?: boolean }) {
  const t = useTranslations("registry");
  const tabIndex = tabbable ? 0 : -1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <CopyUrlButton url={catalog.url} tabIndex={tabIndex} />
      <a
        href={getBrowserUrl(catalog.url)}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={tabIndex}
        className="text-small text-p-primary hover:underline"
      >
        {t("card.viewCatalog")} <DirArrow />
      </a>
    </div>
  );
}

function collectionLabel(
  catalog: Catalog,
  t: ReturnType<typeof useTranslations<"registry">>,
  locale: string
) {
  return catalog.collection_count === 1
    ? t("card.collection")
    : t("card.collections", { count: formatCount(catalog.collection_count, locale) });
}

// The front carries identity and the primary action, the back carries the
// measurements. Both faces stay in the accessibility tree, so a screen reader
// reads the whole card without turning it. The hidden face's controls leave
// the tab order, which keeps invisible buttons unreachable.
//
// Height is fixed rather than derived from content. The faces are absolutely
// positioned, so the card needs a height, and a uniform grid keeps the page
// from reflowing as cards turn.
export function CatalogCard({ catalog }: CatalogProps) {
  const t = useTranslations("registry");
  const locale = useLocale();
  const [flipped, setFlipped] = useState(false);
  const updated = formatDate(catalog.updated, locale);

  // The same link on both faces. Only the face you can see is tabbable.
  const viewCatalog = (tabIndex: number) => (
    <a
      href={getBrowserUrl(catalog.url)}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={tabIndex}
      className="text-small text-p-primary hover:underline"
    >
      {t("card.viewCatalog")} <DirArrow />
    </a>
  );

  return (
    <div
      className="tk-flip tk-flip--manual"
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFlipped(false);
      }}
    >
      <div className="tk-flip__inner relative h-[260px] w-full" data-flipped={flipped}>
        <div className="tk-flip__face absolute inset-0 flex flex-col gap-3 border border-p-line bg-p-paper p-5">
          <CatalogHeader catalog={catalog} />
          <MetaRow>
            {collectionLabel(catalog, t, locale)}
            {updated && t("card.updated", { date: updated })}
          </MetaRow>

          {/* Anchored to the same corner as the back's copy of this link. The
              card turns as the pointer arrives, and the target does not move. */}
          <div className="mt-auto flex justify-end">{viewCatalog(flipped ? -1 : 0)}</div>

          {/* Turns the card where there is no pointer to hover with. Sits under
              the action row so it never swallows a tap meant for the link. */}
          <button
            type="button"
            aria-expanded={flipped}
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setFlipped(true)}
            className="absolute inset-x-0 top-0 bottom-14 cursor-pointer"
          />

          {/* Keyboard-only route to the back. Invisible until focused, so
              pointer users never see a control they do not need. */}
          <button
            type="button"
            aria-expanded={flipped}
            onFocus={() => setFlipped(true)}
            onClick={() => setFlipped(true)}
            className="sr-only focus:not-sr-only focus:absolute focus:bottom-5 focus:start-5 focus:z-10 focus:border focus:border-p-line focus:bg-p-paper focus:px-2 focus:py-1 focus:font-mono focus:text-micro"
          >
            {t("card.showDetails")}
          </button>
        </div>

        <div className="tk-flip__back tk-flip__face absolute inset-0 flex flex-col gap-2 border border-p-line bg-p-bg-soft p-5">
          <CatalogFacts catalog={catalog} />

          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <CopyUrlButton url={catalog.url} tabIndex={flipped ? 0 : -1} />
            {viewCatalog(flipped ? 0 : -1)}
          </div>

          {/* Only devices without hover need a way back. A pointer just leaves. */}
          <button
            type="button"
            onClick={() => setFlipped(false)}
            tabIndex={flipped ? 0 : -1}
            className="absolute top-3 end-3 hidden text-p-ink-3 transition-colors hover:text-p-ink cursor-pointer [@media(hover:none)]:block"
            aria-label={t("card.hideDetails")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
