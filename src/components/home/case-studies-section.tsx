"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CASE_STUDIES } from "@/lib/case-studies";
import { getDirection } from "@/i18n/direction";
import { DirArrow } from "../ui";

// Case studies on the homepage.
//
// The row is the list of case studies, from `src/lib/case-studies.ts`. It
// has no card of its own. A study that merges adds its card, and nothing
// here changes. While the site has no study, the section does not render.
//
// The cards set in one row of equal cards that scrolls on the inline axis,
// by the owner's choice. Each card is one link to its study, and every card
// is `--p-ink`. A study is English only, so the card text is English in
// every locale, as on the case study index.
//
// Screenshots capture LTR interfaces, so each frame pins `dir="ltr"`.

// A solid `--p-ink` block, by the owner's choice. The text takes `--p-bg`,
// as on the "Portolan in practice" band.
// Each card has one fixed width. The row runs past the content column to
// the edge of the window, so a cut card shows that the row scrolls.
const CARD =
  "group flex shrink-0 snap-start flex-col p-[clamp(18px,1.8vw,26px)] no-underline w-[min(84vw,384px)]";

/** Square, mono controls for the row. */
const STEP_BTN =
  "cursor-pointer p-1 text-section leading-none text-p-ink transition-colors hover:text-p-primary disabled:cursor-default disabled:opacity-30 disabled:hover:text-p-ink";

export function CaseStudiesSection() {
  const t = useTranslations("cases");
  const dir = getDirection(useLocale());
  const row = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const [overflow, setOverflow] = useState(false);

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
    // The arrows show only when the row has more cards than fit.
    setOverflow(el.scrollWidth > el.clientWidth + 4);
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

  // No study, no section. The page goes from the section before to the
  // section after.
  if (CASE_STUDIES.length === 0) return null;

  return (
    <section
      id="cases"
      className="overflow-x-clip px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* No eyebrow: the title names the section on its own. The two
            buttons step the row. */}
        <div className="flex items-end justify-between gap-6">
          <h2 className="text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance">
            {t("title")}
          </h2>
          <div className={`shrink-0 gap-5 pb-1 ${overflow ? "flex" : "hidden"}`}>
            <button
              type="button"
              onClick={() => step(false)}
              disabled={edge.start}
              aria-label={t("previous")}
              className={STEP_BTN}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="square"
                className="block h-[0.6em] w-[0.6em] rtl:-scale-x-100"
              >
                <path d="M20 12H4M11 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => step(true)}
              disabled={edge.end}
              aria-label={t("next")}
              className={STEP_BTN}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="square"
                className="block h-[0.6em] w-[0.6em] rtl:-scale-x-100"
              >
                <path d="M4 12h16M13 5l7 7-7 7" />
              </svg>
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
          {CASE_STUDIES.map((study) => (
            <Link
              key={study.slug}
              href={`/case-studies/${study.slug}`}
              data-track={`case-${study.slug}`}
              className={`${CARD} bg-p-ink`}
            >
              {/* One fixed window for each card. The picture shows whole,
                  scaled to fit, on the card's own ink. A wider file leaves
                  a band of card color, never a band of white. A hard blue
                  block sits behind the image. */}
              <div
                dir="ltr"
                className="flex aspect-[16/10.2] items-center justify-start pb-2 pr-2"
              >
                {/* A plain img. Each file is a static picture. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={study.image}
                  alt={study.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="block h-auto max-h-full w-auto max-w-full border border-p-bg shadow-[8px_8px_0_0_var(--p-primary)]"
                />
              </div>
              {/* The mark of the publisher, in the text color of the card.
                  The filter makes any mark one light color, so a study
                  needs no second file. `cardLogo` replaces the mark when
                  the filter gives a poor shape. The mark never mirrors. */}
              <span dir="ltr" className="mt-[26px] flex h-7 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={study.cardLogo ?? study.logo}
                  alt={study.title}
                  loading="lazy"
                  decoding="async"
                  className="block h-full w-auto max-w-[70%] object-contain object-left brightness-0 invert"
                />
              </span>
              <h3
                dir="ltr"
                className="mt-4 text-feature font-bold tracking-[-0.025em] leading-[1.15] text-p-bg text-balance"
              >
                {study.cardTitle ?? study.subtitle}
              </h3>
              <p dir="ltr" className="mt-3.5 text-body leading-[1.7] text-p-bg/85">
                {study.summary}
              </p>
              <span className="mt-auto pt-7">
                <span className="inline-flex items-center gap-2 border-b-2 border-p-bg pb-1 font-sans text-body font-semibold leading-snug text-p-bg transition-colors group-hover:border-p-primary group-hover:text-p-primary group-focus-visible:border-p-primary group-focus-visible:text-p-primary">
                  {t("readStudy")}
                  <DirArrow />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
