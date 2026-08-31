"use client";

import { Fragment, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Tag, DirArrow, Ltr } from "../ui";
import type { Catalog, CatalogKind, CatalogParty } from "@/lib/catalogs";
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
    <p className="flex flex-wrap items-center gap-x-1.5 text-small text-p-ink-3 font-mono">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span aria-hidden="true">·</span>}
          <span>{item}</span>
        </Fragment>
      ))}
    </p>
  );
}

/** Logo, title, and any exception badge. */
function CatalogHeader({ catalog, onSelect }: CatalogProps & { onSelect?: () => void }) {
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
        {/* The title doubles as the selection control, so the card needs no
            extra button to point the map at this catalog. */}
        <h3 className="text-card-title font-semibold line-clamp-3">
          {onSelect ? (
            <button
              type="button"
              onClick={onSelect}
              className="text-start hover:text-p-primary transition-colors cursor-pointer"
            >
              {catalog.title}
            </button>
          ) : (
            catalog.title
          )}
        </h3>
        {/* Badge the exceptions only. A tag that reads the same on every card
            is chrome, not information. */}
        <div className="flex shrink-0 flex-col items-end gap-1">
          {catalog.kind && <Tag tone="primary">{t(`kind.${catalog.kind}`)}</Tag>}
          {catalog.stale_since && <Tag tone="warn">{t("status.stale")}</Tag>}
          {tier === "unvalidated" && <Tag>{t("validation.unvalidated")}</Tag>}
        </div>
      </div>
    </>
  );
}

/** One labelled row of the detail panel. */
function CreditRow({
  label,
  value,
  first = false,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  return (
    <>
      <span
        className={`block text-p-ink-3 ${first ? "" : "mt-2 border-t border-p-line-soft pt-2"}`}
      >
        {label}
      </span>
      <span className="block text-p-ink">
        <Ltr>{value}</Ltr>
      </span>
    </>
  );
}

// Who made the data, from the `producer` role on the catalog's own STAC
// providers. Its own line rather than a run of facts: an agency name can be
// longer than the two dotted rows below hold, and this is attribution, not
// measurement.
//
// Names stay Latin-ordered on the Arabic page, the way format and license
// names do. Two registered catalogs name no producer, and they print nothing.
function CatalogCredit({
  producers,
  processors,
  host,
  kind,
}: {
  producers: CatalogParty[];
  processors: CatalogParty[];
  host: CatalogParty | null;
  kind: CatalogKind | null;
}) {
  const t = useTranslations("registry");
  const [first, ...rest] = producers;
  if (!first) return null;

  // The face of the card names one party. The rest of the provenance opens on
  // hover or focus, under labels that say which role each party holds.
  //
  // A panel rather than more lines on the face. Naming the producer answers
  // "whose data is this", which is the question a card has room for. The other
  // two roles matter once a reader is already interested, and 14 of the 19
  // catalogs are mirrors, so more visible lines would land on most cards and
  // flatten the grid.
  //
  // The host line appears for a mirror only. On an official catalog the host
  // is the producer, so the line would repeat the one above it. `kind` decides
  // that, not a comparison of the two names: planet-disasterdata is official
  // and writes its producer "Planet Labs PBC" against its host "Planet Crisis
  // Response Program", so the names differ where the organization does not.
  //
  // "Hosted by", not "maintained by", although the specification defines the
  // host as the party that maintains the copy. Seven of the fourteen mirrors
  // put a storage vendor in that field instead, which core.md forbids by name,
  // so today the value answers "who serves this" and not "who runs this".
  const serves = kind === "mirror" ? host : null;

  // A processor already named as the producer or the host is dropped: the row
  // would repeat a row beside it. What survives is the party a catalog names
  // nowhere else, which is who actually built the copy. Four catalogs are in
  // that position, catalog-1781203130384 among them, where the producer is an
  // Argentine agency, the host is a storage platform, and only the processor
  // names the person who converted the data.
  const named = new Set(
    [...producers, ...(host ? [host] : [])].map((p) => p.name.trim().toLowerCase())
  );
  const derived = processors.filter((p) => !named.has(p.name.trim().toLowerCase()));

  const hasDetail = rest.length > 0 || derived.length > 0 || serves !== null;

  return (
    <p className="group/credit relative text-small text-p-ink-3 font-mono">
      {/* Focusable so the detail is reachable without a pointer. */}
      <span tabIndex={hasDetail ? 0 : undefined} className="outline-p-primary">
        {t("card.dataSourceProducer")}{" "}
        {/* The name takes the darker ink so the eye splits it from the label. */}
        <span className="text-p-ink">
          <Ltr>{first.name}</Ltr>
          {rest.length > 0 && ` ${t("card.moreProducers", { count: String(rest.length) })}`}
        </span>
      </span>
      {hasDetail && (
        // Flat paper on a black rule, square, no shadow, the way every other
        // surface on the site reads. It opens toward the inline start so it
        // mirrors with the page instead of running off the edge in Arabic.
        <span
          role="tooltip"
          className="pointer-events-none absolute start-0 top-full z-30 mt-1 hidden w-max max-w-[17rem] border border-p-line bg-p-paper p-2 text-start group-hover/credit:block group-focus-within/credit:block"
        >
          <CreditRow
            first
            label={t("card.dataSourceProducer")}
            value={producers.map((p) => p.name).join(", ")}
          />
          {derived.length > 0 && (
            <CreditRow
              label={t("card.processedBy")}
              value={derived.map((p) => p.name).join(", ")}
            />
          )}
          {serves && <CreditRow label={t("card.hostedBy")} value={serves.name} />}
        </span>
      )}
    </p>
  );
}

/** Everything the crawl measured. */
function CatalogFacts({ catalog }: CatalogProps) {
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

/** Copy the address, or open the catalog in the browser. */
function CatalogActions({ catalog }: CatalogProps) {
  const t = useTranslations("registry");

  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-1">
      <CopyUrlButton url={catalog.url} />
      {/* The arrow arrives on hover, the way the landing page's catalog and
          ecosystem cards reveal theirs. The card opens the publisher's own
          browser, so it takes the external mark. */}
      <a
        href={getBrowserUrl(catalog.url)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-small text-p-primary hover:underline"
      >
        {t("card.viewCatalog")}
        <span className="opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 rtl:translate-x-1 rtl:group-hover:translate-x-0">
          <DirArrow kind="external" />
        </span>
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

// One face. The card carries identity, every measurement the crawl made, and
// both actions at once. Nothing is hidden, so nothing has to leave the tab
// order and nothing has to animate to be read.
//
// Selecting a card tells the map which points to highlight. The title is the
// control, so the card gains no chrome to say so.
export function CatalogCard({
  catalog,
  selected = false,
  onSelect,
}: CatalogProps & { selected?: boolean; onSelect?: (id: string) => void }) {
  const select = onSelect ? () => onSelect(catalog.id) : undefined;

  return (
    <article
      data-catalog-id={catalog.id}
      aria-current={selected ? "true" : undefined}
      // `.ec-card` carries a transform, which opens a stacking context and
      // traps the credit detail behind whichever card follows in the DOM. The
      // hovered card rises so its own overlay wins. Grid items take z-index
      // without needing `position`.
      className={`ec-card group relative flex h-full flex-col gap-3 border border-p-line bg-p-paper p-5 hover:z-20 focus-within:z-20 ${
        selected ? "outline outline-2 -outline-offset-2 outline-p-primary" : ""
      }`}
    >
      <CatalogHeader catalog={catalog} onSelect={select} />
      <CatalogCredit
        producers={catalog.producers}
        processors={catalog.processors}
        host={catalog.host}
        kind={catalog.kind}
      />
      <CatalogFacts catalog={catalog} />
      <CatalogActions catalog={catalog} />
    </article>
  );
}
