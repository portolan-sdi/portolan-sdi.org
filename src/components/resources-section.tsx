"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getDirection } from "@/i18n/direction";
import { DirArrow, Ltr } from "./ui";

// Talks & demos as an animated poster carousel (horizontal scroll-snap). Each
// card carries a blue graph-paper wash + a stroke motif from the annotated-
// figure family (marching data-flow / drifting contours), disabled under
// prefers-reduced-motion. The track appends cleanly as talks/demos grow.
// Motifs never mirror (dir="ltr"); the arrow controls are direction-aware.

const PRIMARY = "var(--p-primary)";
const PRIMARY_2 = "color-mix(in srgb, var(--p-primary) 50%, var(--p-bg))";

const POSTER_WASH: React.CSSProperties = {
  background: `
    repeating-linear-gradient(0deg, color-mix(in srgb, var(--p-primary) 10%, transparent) 0 1px, transparent 1px 26px),
    repeating-linear-gradient(90deg, color-mix(in srgb, var(--p-primary) 10%, transparent) 0 1px, transparent 1px 26px),
    color-mix(in srgb, var(--p-primary) 6%, var(--p-paper))
  `,
};

// Exactly two talks today. The demos, the cost calculator, and the example
// catalogs are linked from inside these decks — the track is built to take more
// cards later, but resist padding it with filler.
const TALKS = [
  { key: "holmesTalk", href: "https://cholmes.github.io/open-geodag-presentation/", motif: "flow" },
  { key: "nextSdi", href: "https://jatorre.github.io/carto-ogc-helsinki/", motif: "wave" },
] as const;

const FLOW_PATH = "M20 210 C 120 120, 220 300, 380 150";

function PosterMotif({ motif }: { motif: (typeof TALKS)[number]["motif"] }) {
  if (motif === "wave") {
    const wave = "M-30 150 q 52 -30 104 0 t 104 0 t 104 0 t 104 0 t 104 0";
    return (
      <svg
        viewBox="0 0 400 500"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full"
      >
        <g className="tk-wave" fill="none" strokeWidth="1.25">
          <path d={wave} stroke={PRIMARY} transform="translate(0 0)" />
          <path d={wave} stroke={PRIMARY_2} transform="translate(0 70)" />
          <path d={wave} stroke={PRIMARY} transform="translate(0 140)" />
          <path d={wave} stroke={PRIMARY_2} transform="translate(0 210)" />
        </g>
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 w-full h-full"
    >
      <path
        className="tk-march"
        d={FLOW_PATH}
        fill="none"
        stroke={PRIMARY}
        strokeWidth="1.5"
      />
      <path
        d="M20 260 C 120 180, 240 340, 380 220"
        fill="none"
        stroke={PRIMARY_2}
        strokeWidth="1"
      />
      <circle
        className="tk-packet"
        r="5"
        fill={PRIMARY}
        style={{ offsetPath: `path('${FLOW_PATH}')`, offsetDistance: "0%" }}
      />
    </svg>
  );
}

// Strip the outer quote marks so we can re-render them accent-colored.
function stripOuterQuotes(s: string) {
  return s.replace(/^[“”«»"']+|[“”«»"']+$/g, "");
}

export function ResourcesSection() {
  const t = useTranslations("resources");
  const locale = useLocale();
  const rtl = getDirection(locale) === "rtl";

  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 2;
    const x = Math.abs(el.scrollLeft);
    setAtStart(x <= 2);
    setAtEnd(x >= max);
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, [updateEdges]);

  const scrollByCard = useCallback(
    (forward: boolean) => {
      const el = trackRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>("[data-card]");
      const step = card ? card.getBoundingClientRect().width + 20 : 400;
      const sign = (forward ? 1 : -1) * (rtl ? -1 : 1);
      el.scrollBy({ left: step * sign, behavior: "smooth" });
    },
    [rtl],
  );

  return (
    <section
      id="resources"
      className="py-[var(--p-pad-section-y)] bg-p-bg-soft border-y border-p-line"
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="px-[var(--p-pad-section-x)] flex items-center justify-between gap-6">
          <p className="font-mono text-eyebrow text-p-ink-3">{t("eyebrow")}</p>
          <div className="flex border border-p-line" role="group" aria-label={t("eyebrow")}>
            <button
              type="button"
              onClick={() => scrollByCard(false)}
              disabled={atStart}
              aria-label={t("scrollPrev")}
              className="w-11 h-11 grid place-items-center border-e border-p-line text-p-ink hover:bg-p-ink hover:text-p-bg disabled:text-p-ink-3 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:-scale-x-100">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(true)}
              disabled={atEnd}
              aria-label={t("scrollNext")}
              className="w-11 h-11 grid place-items-center text-p-ink hover:bg-p-ink hover:text-p-bg disabled:text-p-ink-3 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:-scale-x-100">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={updateEdges}
          className="mt-11 flex gap-5 overflow-x-auto snap-x snap-mandatory px-[var(--p-pad-section-x)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TALKS.map((talk) => {
            const quote = stripOuterQuotes(t(`items.${talk.key}.quote`));
            return (
              <a
                key={talk.key}
                data-card
                href={talk.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group snap-start shrink-0 grow-0 basis-[clamp(280px,78vw,400px)] border border-p-line bg-p-paper flex flex-col"
              >
                <div
                  dir="ltr"
                  className="relative aspect-[4/5] overflow-hidden border-b border-p-line"
                  style={POSTER_WASH}
                >
                  <PosterMotif motif={talk.motif} />
                  <h3 className="absolute bottom-4 inset-x-4 z-[2] text-card-title-lg font-bold tracking-[-0.01em] leading-[1.12] text-p-ink">
                    <Ltr>{t(`items.${talk.key}.title`)}</Ltr>
                  </h3>
                </div>
                <div className="p-[18px] flex flex-col gap-3 flex-1">
                  <p className="font-mono text-micro text-p-ink-3 tracking-[0.02em]">
                    <Ltr>{t(`items.${talk.key}.attribution`)}</Ltr>
                  </p>
                  <blockquote className="text-body-lg font-medium leading-[1.4] text-p-ink-2">
                    <span className="text-p-primary">“</span>
                    {quote}
                    <span className="text-p-primary">”</span>
                  </blockquote>
                  <span className="mt-auto inline-flex items-center gap-2 font-mono text-micro uppercase tracking-[0.06em] rtl:tracking-normal text-p-primary group-hover:gap-3 transition-all">
                    {t("watch")} <DirArrow kind="external" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
