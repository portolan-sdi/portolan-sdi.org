"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getBrowserUrl } from "@/lib/catalogs";
import { getDirection } from "@/i18n/direction";
import { DirArrow } from "../ui";

// Case studies. Three catalogs that people built, then what such a catalog
// costs each month.
//
// The cases set in one row of equal cards that scrolls on the inline axis,
// by the owner's choice. Each card is one link. Five cards are `--p-ink`
// and the registry card is `--p-primary`. The cost scale closes the section on the graph
// wash, with the source and the exclusions in its caption row.
//
// Screenshots capture LTR interfaces, so each frame pins `dir="ltr"`.

const PERGAMINO_CATALOG =
  "https://data.source.coop/nlebovits/pergamino-ide/catalog.json";
const FTW_CATALOG = "https://data.source.coop/ftw/global-data/catalog.json";
// A solid `--p-ink` block, by the owner's choice. The text takes `--p-bg`,
// as on the "Portolan in practice" band.
// Each card has one fixed width. The row runs past the content column to
// the edge of the window, so a cut card shows that the row scrolls.
const CARD =
  "group flex shrink-0 snap-start flex-col p-[clamp(18px,1.8vw,26px)] no-underline w-[min(84vw,384px)]";

/** Square, mono controls for the row. */
const STEP_BTN =
  "inline-flex h-10 w-10 items-center justify-center border border-p-line bg-p-bg font-mono text-body text-p-ink transition-colors hover:bg-p-ink hover:text-p-bg disabled:opacity-35 disabled:hover:bg-p-bg disabled:hover:text-p-ink";

const FIRMS_EXPLORER = "https://portolan-mirrors.github.io/firms-catalog/";
const CARTO_SDI = "https://carto.com/spatial-data-infrastructure/";

/**
 * The cases, in scroll order. The sizes are the files' own pixels. The
 * registry is the last card, and it is the one `--p-primary` card.
 */
const CASES = [
  {
    key: "pergamino",
    logo: { file: "pergamino.svg", aspect: 2.734, name: "Municipalidad de Pergamino", label: null },
    src: "/img/home/pergamino-categories.webp",
    width: 1800,
    height: 1125,
    href: getBrowserUrl(PERGAMINO_CATALOG),
    internal: false,
  },
  {
    key: "trimet",
    logo: { file: "trimet.png", aspect: 1.027, name: "TriMet", label: "TriMet" },
    src: "/video/trimet-browser.webp",
    width: 1224,
    height: 632,
    href: "/blog/building-portolan-trimet",
    internal: true,
  },
  {
    key: "ftw",
    logo: { file: "ftw.svg", aspect: 2.609, name: "Fields of The World", label: null },
    src: "/img/home/ftw-explorer.webp",
    width: 1600,
    height: 1000,
    href: getBrowserUrl(FTW_CATALOG),
    internal: false,
  },
  {
    key: "firms",
    logo: { file: "nasa.svg", aspect: 3.586, name: "NASA", label: null },
    src: "/video/firms-explorer.webp",
    width: 1448,
    height: 720,
    href: FIRMS_EXPLORER,
    internal: false,
  },
  {
    key: "carto",
    logo: { file: "carto.png", aspect: 2.554, name: "CARTO", label: null },
    src: "/img/home/carto-sdi.webp",
    width: 1600,
    height: 1000,
    href: CARTO_SDI,
    internal: false,
  },
  {
    key: "registry",
    logo: { file: "../logo-mark.svg", aspect: 1, name: "Portolan", label: "Portolan" },
    src: "/img/home/registry-map.webp",
    width: 1200,
    height: 750,
    href: "/registry",
    internal: true,
  },
] as const;

/** The card is one link, so a tag inside its text renders as plain text. */
const PLAIN_TAGS = {
  carto: (chunks: ReactNode) => <>{chunks}</>,
  m: (chunks: ReactNode) => <>{chunks}</>,
};

export function CaseStudiesSection() {
  const t = useTranslations("cases");
  const dir = getDirection(useLocale());
  const row = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  // The row scrolls on its own with touch, a trackpad, or the keyboard. The
  // two buttons move it by one card. `scrollLeft` is negative in RTL, so
  // the test uses its size.
  const sync = useCallback(() => {
    const el = row.current;
    if (!el) return;
    const at = Math.abs(el.scrollLeft);
    setEdge({
      start: at < 4,
      end: at > el.scrollWidth - el.clientWidth - 4,
    });
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const step = (forward: boolean) => {
    const el = row.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const sign = (forward ? 1 : -1) * (dir === "rtl" ? -1 : 1);
    el.scrollBy({ left: sign * (card.offsetWidth + 20), behavior: "smooth" });
  };

  return (
    <section
      id="cases"
      className="overflow-x-clip px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t-4 border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* No eyebrow: the title names the section on its own. The two
            buttons step the row. */}
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance">
            {t("title")}
          </h2>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => step(false)}
              disabled={edge.start}
              aria-label={t("previous")}
              className={STEP_BTN}
            >
              <span aria-hidden className="inline-block rtl:-scale-x-100">
                ←
              </span>
            </button>
            <button
              type="button"
              onClick={() => step(true)}
              disabled={edge.end}
              aria-label={t("next")}
              className={STEP_BTN}
            >
              <span aria-hidden className="inline-block rtl:-scale-x-100">
                →
              </span>
            </button>
          </div>
        </div>

        {/* One row that scrolls on the inline axis and snaps to a card.
            Each card is one link. The cards stretch to one height, and each
            label holds the bottom edge, so the labels align. The row takes
            keyboard focus, so the arrow keys scroll it. */}
        <div
          ref={row}
          onScroll={sync}
          role="region"
          aria-label={t("title")}
          tabIndex={0}
          className="mt-[clamp(2rem,3.5vw,3rem)] flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 me-[calc((100%_-_100vw)/2)] pe-[var(--p-pad-section-x)] [scrollbar-width:thin] [scrollbar-color:var(--p-ink)_transparent]"
        >
          {CASES.map((item) => {
            const cardClass = `${CARD} ${
              item.key === "registry" ? "bg-p-primary" : "bg-p-ink"
            }`;
            const inner = (
              <>
                {/* One fixed window for each card. The screenshot shows
                    whole, scaled to fit, on the card's own ink. A wider
                    file leaves a band of card color, never a band of
                    white. A hard blue block sits behind the image. */}
                <div
                  dir="ltr"
                  className="flex aspect-[16/10.2] items-center justify-start pb-2 pr-2"
                >
                  {/* A plain img. Each file is a static screenshot. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt={t(`items.${item.key}.alt`)}
                    width={item.width}
                    height={item.height}
                    loading="lazy"
                    decoding="async"
                    className={`block h-auto max-h-full w-auto max-w-full border border-p-bg ${item.key === "registry" ? "shadow-[8px_8px_0_0_var(--p-ink)]" : "shadow-[8px_8px_0_0_var(--p-primary)]"}`}
                  />
                </div>
                {/* The mark of the publisher, in the text color of the
                    card. A mark with no name in it takes the name as
                    text. The mark never mirrors. */}
                <span className="mt-[26px] flex">
                <span dir="ltr" className="flex h-7 items-center gap-2.5">
                  <span
                    role="img"
                    aria-label={item.logo.name}
                    className="block h-full bg-p-bg"
                    style={{
                      aspectRatio: item.logo.aspect,
                      WebkitMask: `url(/logos/${item.logo.file}) center / contain no-repeat`,
                      mask: `url(/logos/${item.logo.file}) center / contain no-repeat`,
                    }}
                  />
                  {item.logo.label && (
                    <span aria-hidden className="font-sans text-lead font-bold tracking-[-0.015em] text-p-bg">
                      {item.logo.label}
                    </span>
                  )}
                </span>
                </span>
                <h3 className="mt-4 text-feature font-bold tracking-[-0.025em] rtl:tracking-normal leading-[1.15] rtl:leading-[1.3] text-p-bg text-balance">
                  {t(`items.${item.key}.title`)}
                </h3>
                <p className={`mt-3.5 text-body leading-[1.7] ${item.key === "registry" ? "text-p-on-primary" : "text-p-bg/85"}`}>
                  {t.rich(`items.${item.key}.body`, PLAIN_TAGS)}
                </p>
                {/* TODO: add the statement from the Municipality of Pergamino to its card when it arrives. */}
                <span className="mt-auto pt-7">
                  <span className={`inline-flex items-center gap-2.5 px-4 py-[11px] font-mono text-small font-medium uppercase leading-[1.2] tracking-[0.08em] rtl:tracking-normal transition-colors group-hover:bg-p-bg group-hover:text-p-ink group-focus-visible:bg-p-bg group-focus-visible:text-p-ink ${item.key === "registry" ? "bg-p-ink text-p-bg" : "bg-p-primary text-p-on-primary"}`}>
                    {t(`items.${item.key}.link`)}
                    <DirArrow kind={item.internal ? "forward" : "external"} />
                  </span>
                </span>
              </>
            );
            return item.internal ? (
              <Link
                key={item.key}
                href={item.href}
                data-track={`case-${item.key}`}
                className={cardClass}
              >
                {inner}
              </Link>
            ) : (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                data-track={`case-${item.key}`}
                className={cardClass}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
