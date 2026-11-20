"use client";

import { useTranslations } from "next-intl";
import { PageHero } from "./page-hero";
import { SiteShell } from "./site-rail";
import { DirArrow, Ltr, monoChunk } from "./ui";

// Talks and demos, laid out as the blog index is laid out: a grid of cards,
// 1 column, then 2 from `sm`, then 3 from `lg`. Each card has a whole screenshot of
// the thing it links to, the title, the description where a post has its
// subtitle, and one line with the speaker and the event where a post has its
// byline. Every card leaves the site, so the title takes the external arrow.
// The page header band above carries the h1.

type Item = {
  key: string;
  href: string;
  src: string;
};

const ITEMS: Item[] = [
  {
    key: "bolzanoTalk",
    href: "https://cayetanobv.github.io/ogc-metadata-summit-bolzano/",
    src: "/img/talks/ogc-bolzano.png",
  },
  {
    key: "yharbyTalk",
    href: "https://yharby.github.io/cng-japan-2026/#/1",
    src: "/img/talks/cng-japan.png",
  },
  {
    key: "holmesTalk",
    href: "https://cholmes.github.io/open-geodag-presentation/",
    src: "/img/talks/open-geodag.png",
  },
  {
    key: "nextSdi",
    href: "https://jatorre.github.io/carto-ogc-helsinki/",
    src: "/img/talks/next-sdi.jpg",
  },
  {
    key: "finlandDemo",
    href: "https://jatorre.github.io/carto-ogc-helsinki/webapp/",
    src: "/img/talks/finland-sdi.png",
  },
  {
    key: "costCalc",
    href: "https://cholmes.github.io/open-geodag-presentation/calculator.html",
    src: "/img/talks/cost-calculator.png",
  },
];

export function TalksPage() {
  const t = useTranslations("talks");

  return (
    <SiteShell>
      <PageHero title={t("title")} />

      <section className="px-[var(--p-pad-section-x)] pb-[var(--p-pad-section-y)] pt-[clamp(28px,3.5vw,48px)]">
        <div className="mx-auto max-w-[1240px]">
          <ul className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {ITEMS.map((item) => (
              <li key={item.key} className="group relative flex min-w-0 flex-col">
                {/* The screenshots are 16:9 slides and 16:10 pages. The
                    frame is 16:10 and the image is contained, so no slide
                    loses its edges. A 16:9 slide gets thin ink bars. */}
                <div className="aspect-[16/10] overflow-hidden border border-p-line bg-p-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={t(`items.${item.key}.alt`)}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                </div>

                {/* The link covers the whole card, so the picture and the
                    text are one hit target. */}
                <h2 className="mt-5 text-card-title leading-[1.2] tracking-[-0.02em] text-pretty rtl:tracking-normal">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-p-ink transition-colors after:absolute after:inset-0 group-hover:text-p-primary"
                  >
                    <span className="block font-bold">
                      <Ltr>{t(`items.${item.key}.title`)}</Ltr>{" "}
                      <DirArrow kind="external" />
                    </span>
                  </a>
                </h2>

                <p className="mt-2 text-body leading-[1.55] text-p-ink-2 text-pretty">
                  {t.rich(`items.${item.key}.description`, { m: monoChunk })}
                </p>

                {/* The speaker and the event are Latin, so they hold their
                    order inside Arabic. */}
                <p className="mt-3 text-small text-p-ink-3">
                  <Ltr>{t(`items.${item.key}.attribution`)}</Ltr>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
