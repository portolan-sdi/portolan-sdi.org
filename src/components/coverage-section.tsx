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
 * One invitation in two halves. The call to action leads, examples sit under
 * it, and the map beside them shows the geographic breadth those examples come
 * from. It carries no heading of its own, because the call to action is the
 * heading.
 *
 * The section is deliberately wider than it is tall. It teases the registry
 * rather than standing in for it.
 */

/**
 * The catalogs the section puts forward, in order.
 *
 * Editorial, not derived. A ranking by collection count would lead with the
 * largest mirrors, which shows size rather than what a Portolan catalog looks
 * like. An id that leaves the registry drops out, and the remaining slots fill
 * from the rest of the list.
 */
const FEATURED = ["portolan-nl", "pergamino-ide", "global-data"] as const;

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
 * A catalog in one row: mark, title, and the one fact that sizes it.
 *
 * The registry's own CatalogCard is a 260px flip card built for a three-across
 * grid. Three of those do not fit beside a map this short, so the teaser keeps
 * its own compact row and leaves that card alone.
 */
function FeaturedRow({ catalog }: { catalog: Catalog }) {
  const t = useTranslations("registry");
  const locale = useLocale();

  return (
    <a
      href={getBrowserUrl(catalog.url)}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-0 flex-1 items-center gap-3 border border-p-line bg-p-paper px-4 py-4 transition-colors hover:border-p-primary hover:bg-p-bg-soft"
    >
      {catalog.logo && (
        // Decorative: the title beside it already names the catalog. A plain
        // <img> for the same reason CatalogHeader uses one. Logos come from
        // whatever host the catalog lives on, so there is no finite allowlist
        // to give next/image's remotePatterns, and the optimizer would become
        // an open proxy. onError covers a logo that later rots.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={catalog.logo.href}
          alt=""
          className="h-7 w-7 shrink-0 self-start object-contain"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-body font-bold leading-snug tracking-[-0.01em] text-p-ink line-clamp-2">
          {catalog.title}
        </span>
        <span className="mt-1 block font-mono text-eyebrow text-p-ink-3">
          {t("card.collections", {
            count: formatCount(catalog.collection_count, locale),
          })}
        </span>
      </span>
      <DirArrow />
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
        {/* The call to action sits on its own row rather than inside the start
            column. Inside it, the cards began lower than the map by the height
            of this line, and the two halves did not line up. */}
        <Link
          href="/#registry"
          className="inline-flex items-baseline gap-2 text-feature font-extrabold tracking-[-0.03em] leading-[1.05] text-p-ink transition-colors hover:text-p-primary"
        >
          {t("cta")} <DirArrow />
        </Link>

        <div className="mt-6 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] lg:gap-8">
          {/* The map leads on one column, because it carries the section. */}
          <div className="order-2 flex flex-col gap-4 lg:order-1">
            {featured.map((catalog) => (
              <FeaturedRow key={catalog.id} catalog={catalog} />
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <CoverageFlat />
          </div>
        </div>
      </div>
    </section>
  );
}
