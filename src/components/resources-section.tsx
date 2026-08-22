"use client";

import { useTranslations } from "next-intl";
import { useRevealed } from "@/hooks/use-revealed";
import { DirArrow, Ltr, monoChunk } from "./ui";

// Talks & demos as a source wall: white paper cards, ruled in black, carrying a
// real screenshot of the thing they link to. Every card shares one frame and
// one crop, screenshot first. Every second column drops by a single fixed
// step, so the stagger is regular rather than per-card. That step is applied as
// a margin pair that cancels out, which keeps the offset from opening a gap
// under the column beside it. A solid primary band runs behind the wall, and
// blue otherwise appears only on the title arrow and the focus ring. Hovering
// lifts a card off the page.

type Item = {
  key: string;
  href: string;
  src: string;
};

const ITEMS: Item[] = [
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

function Shot({ item, alt }: { item: Item; alt: string }) {
  return (
    <div className="aspect-[16/7.5] overflow-hidden border-b border-p-line bg-p-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-top"
      />
    </div>
  );
}

export function ResourcesSection() {
  const t = useTranslations("resources");
  const { ref, revealed } = useRevealed<HTMLElement>();

  return (
    <section
      id="resources"
      ref={ref}
      data-in={revealed}
      className="tk-wall relative isolate overflow-hidden border-y border-p-line px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]"
    >
      {/* The band is positioned as a share of the section, so it keeps
          sitting behind the wall as translations change the header height. */}
      <div
        aria-hidden
        className="tk-band absolute inset-x-0 top-[44%] -z-10 h-[clamp(150px,16vw,210px)] bg-p-primary"
      />

      <div className="mx-auto max-w-[1240px]">
        <header className="mb-[clamp(2.5rem,5vw,4rem)]">
          <h2 className="text-section font-extrabold leading-[1.05] tracking-[-0.03em]">
            {t("title")}
          </h2>
        </header>

        <div style={{ "--tk-step": "clamp(36px,5vw,72px)" } as React.CSSProperties}
          className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 sm:pb-[var(--tk-step)] xl:grid-cols-5">
          {ITEMS.map((item, i) => {
            const alt = t(`items.${item.key}.alt`);
            return (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ animationDelay: `${i * 0.09}s` }}
                className={`tk-card group flex flex-col border border-p-line bg-p-paper text-p-ink focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-p-primary ${
                  i % 2 === 1
                    ? "sm:mt-[var(--tk-step)] sm:mb-[calc(var(--tk-step)*-1)]"
                    : ""
                }`}
              >
                <Shot item={item} alt={alt} />

                <div className="p-5">
                  <p className="mb-4 font-mono text-small text-p-ink-3">
                    <Ltr>{t(`items.${item.key}.attribution`)}</Ltr>
                  </p>

                  {/* The card is the link, so the mark rides the title. */}
                  <h3 className="text-card-title font-bold leading-[1.2] tracking-[-0.02em] text-pretty">
                    <Ltr>{t(`items.${item.key}.title`)}</Ltr>{" "}
                    <span className="inline-block text-p-primary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0">
                      <DirArrow kind="external" />
                    </span>
                  </h3>

                  <p className="mt-3 text-small leading-[1.55] text-p-ink-2 text-pretty">
                    {t.rich(`items.${item.key}.description`, { m: monoChunk })}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
