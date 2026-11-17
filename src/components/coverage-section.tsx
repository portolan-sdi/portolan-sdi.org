"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBrowserUrl } from "@/lib/catalogs";
import { RegistryMapEmbed } from "./registry/registry-map-embed";
import { Btn, DirArrow } from "./ui";

/**
 * The network section: the registry map, one featured catalog, and three
 * short stories about catalogs people built.
 *
 * The section takes no registry data from the server. The map fetches its
 * own coverage in the browser, as it does on the registry page, and the
 * stories are written copy. The section renders, and the `#coverage` anchor
 * exists, even when the registry returns nothing.
 */

const PERGAMINO_CATALOG =
  "https://data.source.coop/nlebovits/pergamino-ide/catalog.json";
const FTW_CATALOG = "https://data.source.coop/ftw/global-data/catalog.json";

/** The registry's link style: it underlines on hover, not at rest. */
const storyLink =
  "inline-flex items-baseline gap-2 text-body text-p-primary hover:underline";

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
          <div className="flex min-w-0 flex-col items-start gap-6">
            <p className="max-w-[60ch] text-lead leading-relaxed">{t("lead")}</p>
            {/* The one way from the section to the whole registry. It is
                under the lead, above the map, so it takes no row of its
                own. */}
            <Btn asChild variant="primary">
              <Link href="/registry" data-track="coverage-registry">
                {t("registryLink")} <DirArrow />
              </Link>
            </Btn>
          </div>
        </div>
      </div>

      {/* Full bleed. The negative inline margin cancels the section padding,
          so the block spans the content area and never exceeds it. Each
          block draws its own top rule and the last one closes the stack. */}
      <div className="-mx-[var(--p-pad-section-x)] mt-[clamp(2.5rem,5vw,4rem)]">
        {/* The registry map alone, with no search and no cards. The map sets
            `dir="ltr"` on its own frame and never mirrors. */}
        <RegistryMapEmbed />

        {/* The text runs above the screenshot, so the screenshot takes the
            full width of the block and shows whole at every width. */}
        <article className="border-y border-p-line">
          <div className="px-[var(--p-pad-section-x)] py-[clamp(24px,4vw,40px)]">
            <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-start gap-x-16 gap-y-4 lg:grid-cols-2">
              <h3 className="text-feature font-bold text-balance">
                {t("pergamino.title")}
              </h3>
              <div className="flex min-w-0 flex-col items-start">
                <p className="text-body text-p-ink-2">{t("pergamino.body")}</p>
                {/* TODO: add the statement from the Municipality of Pergamino here when it arrives. */}
                <a
                  href={getBrowserUrl(PERGAMINO_CATALOG)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-4 ${storyLink}`}
                >
                  {t("pergamino.link")} <DirArrow kind="external" />
                </a>
              </div>
            </div>
          </div>
          {/* A screenshot. It does not mirror in RTL. The width drives the
              height, so the file's own 1800 by 1125 ratio holds and nothing
              is cropped. The cap is the file's pixel width, so it never
              scales up. */}
          <div dir="ltr" className="border-t border-p-line bg-p-paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/home/pergamino-categories.webp"
              alt={t("pergamino.alt")}
              width={1800}
              height={1125}
              loading="lazy"
              decoding="async"
              className="mx-auto block h-auto w-full max-w-[1800px]"
            />
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
