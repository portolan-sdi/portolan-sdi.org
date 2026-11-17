"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBrowserUrl } from "@/lib/catalogs";
import { DirArrow } from "./ui";

/**
 * The network section: the registry's coverage map, one featured catalog, and
 * three short stories about catalogs people built.
 *
 * The section reads no registry data. The map loads its own baked cells and
 * the stories are written copy, so the section renders, and the `#coverage`
 * anchor exists, even when the registry returns nothing.
 */

/** The map's own ratio. It holds the box until the map chunk loads. */
const MAP_RATIO = "1600/779";

const PERGAMINO_CATALOG =
  "https://data.source.coop/nlebovits/pergamino-ide/catalog.json";
const FTW_CATALOG = "https://data.source.coop/ftw/global-data/catalog.json";

/** The registry's link style: it underlines on hover, not at rest. */
const storyLink =
  "inline-flex items-baseline gap-2 text-body text-p-primary hover:underline";

function MapSkeleton() {
  return <div className="w-full" style={{ aspectRatio: MAP_RATIO }} />;
}

const CoverageFlat = dynamic(() => import("./registry/coverage-flat"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

/**
 * The stories with a screenshot, in order. Both link to a page on this site.
 * The sizes are the files' own pixels, so the browser holds the box before
 * the image loads.
 */
const ILLUSTRATED_STORIES = [
  {
    key: "trimet",
    src: "/video/trimet-browser.webp",
    width: 1224,
    height: 632,
    href: "/blog/building-portolan-trimet",
  },
  {
    key: "eastHampton",
    src: "/video/east-hampton-browser.webp",
    width: 1280,
    height: 994,
    href: "/tutorials/mirroring-east-hampton",
  },
] as const;

export function CoverageSection() {
  const t = useTranslations("coverage");

  return (
    <section
      id="coverage"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        <div className="grid grid-cols-1 items-start gap-x-16 gap-y-7 lg:grid-cols-2">
          <h2 className="text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance">
            {t("title")}
          </h2>
          <div>
            <p className="max-w-[60ch] text-lead leading-relaxed">
              {t("lead")}
            </p>
            <Link href="/registry" className={`mt-4 ${storyLink}`}>
              {t("cta")} <DirArrow />
            </Link>
          </div>
        </div>
      </div>

      {/* Full bleed. The negative inline margin cancels the section padding,
          so the block spans the content area and never exceeds it. The map
          and the feature below it share one rule. */}
      <div className="-mx-[var(--p-pad-section-x)] mt-[clamp(2.5rem,5vw,4rem)]">
        {/* The map component owns its caption. The caption takes the section
            inset here so it does not touch the edge of the page. The frame
            keeps the drawing's ratio at every width, because nothing beside
            it sets a height to fill. */}
        <div className="border-t border-p-line [&_figcaption]:px-[var(--p-pad-section-x)] [&_figcaption]:pb-4 [&_figure>div]:aspect-[1600/779]">
          <CoverageFlat />
        </div>

        <article className="grid grid-cols-1 border-y border-p-line lg:grid-cols-[minmax(0,57fr)_minmax(0,43fr)]">
          {/* A screenshot. It does not mirror in RTL. */}
          <div dir="ltr" className="min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/home/pergamino-categories.webp"
              alt={t("pergamino.alt")}
              width={1719}
              height={930}
              loading="lazy"
              decoding="async"
              className="block h-auto w-full object-cover object-left-top lg:h-full lg:min-h-[280px]"
            />
          </div>
          <div className="flex min-w-0 flex-col justify-center border-t border-p-line p-[clamp(24px,4vw,40px)] lg:border-t-0 lg:border-s">
            <h3 className="text-feature font-bold">{t("pergamino.title")}</h3>
            <p className="mt-3 text-body text-p-ink-2">
              {t("pergamino.body")}
            </p>
            {/* TODO: add the statement from the Municipality of Pergamino here when it arrives. */}
            <a
              href={getBrowserUrl(PERGAMINO_CATALOG)}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-5 self-start ${storyLink}`}
            >
              {t("pergamino.link")} <DirArrow kind="external" />
            </a>
          </div>
        </article>
      </div>

      <div className="max-w-[1240px] mx-auto">
        {/* Two stories carry a screenshot and the third is text under a rule.
            The uneven anatomy is deliberate. */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 items-start gap-x-8 gap-y-10 md:grid-cols-3">
          {ILLUSTRATED_STORIES.map((story) => (
            <article key={story.key} className="min-w-0">
              <div dir="ltr" className="border border-p-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={story.src}
                  alt={t(`stories.${story.key}.alt`)}
                  width={story.width}
                  height={story.height}
                  loading="lazy"
                  decoding="async"
                  className="block aspect-[16/10] h-auto w-full object-cover object-left-top"
                />
              </div>
              <h3 className="mt-5 text-card-title font-bold">
                {t(`stories.${story.key}.title`)}
              </h3>
              <p className="mt-3 text-body text-p-ink-2">
                {t(`stories.${story.key}.body`)}
              </p>
              <Link href={story.href} className={`mt-4 ${storyLink}`}>
                {t(`stories.${story.key}.link`)} <DirArrow />
              </Link>
            </article>
          ))}

          <article className="min-w-0 border-t border-p-line pt-5">
            <h3 className="text-card-title font-bold">
              {t("stories.ftw.title")}
            </h3>
            <p className="mt-3 text-body text-p-ink-2">
              {t("stories.ftw.body")}
            </p>
            <a
              href={getBrowserUrl(FTW_CATALOG)}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-4 ${storyLink}`}
            >
              {t("stories.ftw.link")} <DirArrow kind="external" />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
