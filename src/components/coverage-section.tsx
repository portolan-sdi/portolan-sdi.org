"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Catalog } from "@/lib/catalogs";
import { formatCount, getBrowserUrl } from "@/lib/catalogs";
import { DirArrow } from "./ui";

/**
 * The registry teaser: three catalogs to open, and where the data sits.
 *
 * One invitation in two halves. The call to action leads, the examples sit
 * under it, and the map beside them shows the geographic breadth those
 * examples come from. The section carries no heading of its own, because the
 * call to action is the heading.
 *
 * The section is deliberately wider than it is tall. It teases the registry
 * rather than standing in for it. Search, filters, and totals belong on
 * /registry, so nothing here duplicates them.
 */

/**
 * The catalogs the section puts forward, in order.
 *
 * Editorial, not derived. A ranking by collection count would lead with the
 * largest mirrors, which shows size rather than what a Portolan catalog looks
 * like. These three span the range instead: a research consortium publishing
 * worldwide, a national government, and a city transit agency. Each one also
 * carries a logo, which a ranking cannot promise.
 *
 * An id that leaves the registry drops out, and the remaining slots fill from
 * the rest of the list. A filler catalog has no written preview, so the row
 * falls back to the title the registry reports.
 */
const FEATURED = ["global-data", "portolan-nl", "trimet"] as const;

const FEATURED_COUNT = 3;

/** The map's own ratio. The panel height follows from the column width. */
const MAP_RATIO = "1600/779";

function MapSkeleton() {
  return <div className="w-full" style={{ aspectRatio: MAP_RATIO }} />;
}

const CoverageFlat = dynamic(() => import("./registry/coverage-flat"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

/** Resolve the featured ids, then fill any empty slot from the rest. */
function pickFeatured(catalogs: Catalog[]): Catalog[] {
  const byId = new Map(catalogs.map((catalog) => [catalog.id, catalog]));
  const picked: Catalog[] = [];
  const taken = new Set<string>();

  for (const id of FEATURED) {
    const catalog = byId.get(id);
    if (catalog) {
      picked.push(catalog);
      taken.add(catalog.id);
    }
  }
  for (const catalog of catalogs) {
    if (picked.length >= FEATURED_COUNT) break;
    if (taken.has(catalog.id)) continue;
    picked.push(catalog);
    taken.add(catalog.id);
  }
  return picked.slice(0, FEATURED_COUNT);
}

/**
 * The logo band: a fixed box every logo is drawn to fit inside.
 *
 * Publishers hand the registry whatever mark they own. The set on this page
 * runs from a 1:2 vertical wordmark to a 2.6:1 horizontal one, so a square box
 * renders one of them at a third of the size of the next. A fixed height with
 * a width cap draws each mark as large as its own ratio allows, and the box
 * holds its width whether the logo loads or not, so every title starts at the
 * same edge.
 */
function LogoBand({ logo }: { logo: Catalog["logo"] }) {
  return (
    <span className="mt-[2px] flex h-8 w-[60px] shrink-0 items-center justify-start">
      {logo && (
        // Decorative: the title beside it already names the catalog. A plain
        // <img> for the same reason CatalogHeader uses one. Logos come from
        // whatever host the catalog lives on, so there is no finite allowlist
        // to give next/image's remotePatterns, and the optimizer would become
        // an open proxy. onError covers a logo that later rots.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo.href}
          alt=""
          className="max-h-full max-w-full object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}

/**
 * One catalog as a written preview: what it holds, who publishes it, and the
 * two facts that place and size it.
 *
 * The title is written here rather than read from the catalog. A registry
 * title has to be unambiguous among fourteen entries, so it carries the
 * publisher, the hosting, and the format inside it. Three of those stacked
 * beside a map read as a list of near-identical strings. The written title
 * says what the data is, and the publisher line under it says who stands
 * behind it.
 *
 * The registry's own CatalogCard is a 260px flip card built for a
 * three-across grid. Three of those do not fit beside a map this short, so the
 * teaser keeps its own row and leaves that card alone. The row does borrow the
 * ecosystem card's rest and hover states, through `ec-card`, so the two card
 * sets on the page move the same way.
 */
function FeaturedRow({ catalog }: { catalog: Catalog }) {
  const t = useTranslations("coverage");
  const tRegistry = useTranslations("registry");
  const locale = useLocale();

  const previewKey = `featured.${catalog.id}`;
  const hasPreview = t.has(`${previewKey}.title`);

  const title = hasPreview ? t(`${previewKey}.title`) : catalog.title;
  const publisher = hasPreview ? t(`${previewKey}.publisher`) : null;
  const place = hasPreview ? t(`${previewKey}.place`) : null;
  const collections = tRegistry("card.collections", {
    count: formatCount(catalog.collection_count, locale),
  });

  return (
    <a
      href={getBrowserUrl(catalog.url)}
      target="_blank"
      rel="noopener noreferrer"
      className="ec-card group flex min-h-0 flex-1 items-start gap-4 border border-p-line bg-p-paper px-4 py-4"
    >
      <LogoBand logo={catalog.logo} />
      <span className="min-w-0 flex-1">
        <span className="block text-body font-bold leading-snug tracking-[-0.01em] text-p-ink">
          {title}
        </span>
        {publisher && (
          <span className="mt-1 block text-small leading-snug text-p-ink-2">
            {publisher}
          </span>
        )}
        <span className="mt-2 block font-mono text-eyebrow text-p-ink-3">
          {place && (
            <>
              {place} <span aria-hidden="true">·</span>{" "}
            </>
          )}
          {collections}
        </span>
      </span>
      {/* The section runs two arrows on one rule: "→" moves to a page on this
          site, "↗" leaves it. A card opens the publisher's own browser, so it
          takes the external mark. It arrives on hover, the way the ecosystem
          cards reveal theirs. */}
      <span className="mt-[3px] shrink-0 text-small text-p-primary opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 rtl:translate-x-1 rtl:group-hover:translate-x-0">
        <DirArrow kind="external" />
      </span>
    </a>
  );
}

interface CoverageSectionProps {
  catalogs: Catalog[];
}

export function CoverageSection({ catalogs }: CoverageSectionProps) {
  const t = useTranslations("coverage");
  const featured = pickFeatured(catalogs);

  return (
    <section
      id="coverage"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* The title matches every other section title on the page. The line
            under it stays plain, and the short link below it carries the
            action. Three ranks read faster than a sentence that ends in a
            link.
            The link takes the registry's own style, which underlines on hover
            rather than at rest. All three sit on their own row rather than
            inside the start column, because inside it the cards began lower
            than the map by the height of these lines. */}
        <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05]">
          {t("title")}
        </h2>
        <p className="mt-4 text-lead leading-relaxed text-p-ink-2">
          {t("blurb")}
        </p>
        <Link
          href="/registry"
          className="mt-3 inline-flex items-baseline gap-2 text-body text-p-primary hover:underline"
        >
          {t("cta")} <DirArrow />
        </Link>

        <div className="mt-10 grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] xl:gap-8">
          {/* The map leads on one column, because it carries the section. */}
          <div className="order-2 flex flex-col xl:order-1">
            <p className="mb-3 font-mono text-eyebrow text-p-ink-3">
              {t("featuredLabel")}
            </p>
            <div className="flex flex-1 flex-col gap-4">
              {featured.map((catalog) => (
                <FeaturedRow key={catalog.id} catalog={catalog} />
              ))}
            </div>
          </div>

          {/* The map takes the height the cards set and fills it, rather than
              sizing itself from its own ratio and leaving the column short. */}
          <div className="order-1 flex flex-col xl:order-2">
            <CoverageFlat />
          </div>
        </div>
      </div>
    </section>
  );
}
