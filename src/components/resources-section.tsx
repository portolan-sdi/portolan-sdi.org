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

// Talks (flip to a pulled quote) and demos (flip to a one-line blurb). The two
// demos are the same live links surfaced in "Why Portolan"; they belong here as
// demos too, and they make the track read denser. Built to take more cards.
const ITEMS = [
  { key: "holmesTalk", href: "https://cholmes.github.io/open-geodag-presentation/", motif: "flow", type: "talk" },
  { key: "nextSdi", href: "https://jatorre.github.io/carto-ogc-helsinki/", motif: "wave", type: "talk" },
  { key: "finlandDemo", href: "https://jatorre.github.io/carto-ogc-helsinki/webapp/", motif: "nodes", type: "demo" },
  { key: "costCalc", href: "https://cholmes.github.io/open-geodag-presentation/calculator.html", motif: "bars", type: "demo" },
] as const;

const FLOW_PATH = "M20 210 C 120 120, 220 300, 380 150";
const SVG_PROPS = {
  viewBox: "0 0 400 500",
  preserveAspectRatio: "xMidYMid slice",
  "aria-hidden": true,
  className: "absolute inset-0 w-full h-full [backface-visibility:hidden]",
} as const;

// Four distinct stroke motifs from the annotated-figure family, one per card:
// flow (marching data path + travelling packet), wave (drifting contours),
// nodes (a floating graph — for the agent demo), bars (pulsing columns — for
// the cost calculator). All animation is disabled under reduced-motion.
function PosterMotif({ motif }: { motif: (typeof ITEMS)[number]["motif"] }) {
  if (motif === "wave") {
    const wave = "M-30 150 q 52 -30 104 0 t 104 0 t 104 0 t 104 0 t 104 0";
    return (
      <svg {...SVG_PROPS}>
        <g className="tk-wave" fill="none" strokeWidth="1.25">
          <path d={wave} stroke={PRIMARY} transform="translate(0 0)" />
          <path d={wave} stroke={PRIMARY_2} transform="translate(0 70)" />
          <path d={wave} stroke={PRIMARY} transform="translate(0 140)" />
          <path d={wave} stroke={PRIMARY_2} transform="translate(0 210)" />
        </g>
      </svg>
    );
  }

  if (motif === "nodes") {
    const n: [number, number][] = [
      [70, 130], [190, 90], [310, 165], [120, 270], [255, 300], [345, 250], [80, 380],
    ];
    const e: [number, number][] = [
      [0, 1], [1, 2], [0, 3], [3, 4], [4, 2], [4, 5], [3, 6], [6, 4], [2, 5],
    ];
    return (
      <svg {...SVG_PROPS}>
        <g className="tk-float">
          {e.map(([a, b], i) => (
            <line key={i} x1={n[a][0]} y1={n[a][1]} x2={n[b][0]} y2={n[b][1]} stroke={PRIMARY_2} strokeWidth="1" />
          ))}
          {n.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 5 : 3.5} fill={i % 2 ? PRIMARY_2 : PRIMARY} />
          ))}
        </g>
      </svg>
    );
  }

  if (motif === "bars") {
    return (
      <svg {...SVG_PROPS}>
        <g>
          {Array.from({ length: 7 }, (_, i) => {
            const x = 34 + i * 52;
            const h = 80 + ((i * 61) % 150);
            return (
              <rect
                key={i}
                className="tk-bar"
                x={x}
                y={430 - h}
                width="24"
                height={h}
                fill={i % 2 ? PRIMARY_2 : PRIMARY}
                style={{ animationDelay: `${(i * 0.22).toFixed(2)}s` }}
              />
            );
          })}
        </g>
      </svg>
    );
  }

  // flow (default)
  return (
    <svg {...SVG_PROPS}>
      <path className="tk-march" d={FLOW_PATH} fill="none" stroke={PRIMARY} strokeWidth="1.5" />
      <path d="M20 260 C 120 180, 240 340, 380 220" fill="none" stroke={PRIMARY_2} strokeWidth="1" />
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
      <div className="max-w-[1440px] mx-auto px-[var(--p-pad-section-x)]">
        <p className="font-mono text-eyebrow text-p-ink-3">{t("eyebrow")}</p>

        {/* Track is left-aligned to the content column (matches the eyebrow);
            it bleeds only past the inline-end edge so cards run off toward the
            scroll direction. */}
        <div
          ref={trackRef}
          onScroll={updateEdges}
          className="mt-8 flex gap-5 overflow-x-auto snap-x snap-mandatory py-2 pe-[var(--p-pad-section-x)] -me-[var(--p-pad-section-x)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ITEMS.map((item) => {
            const isTalk = item.type === "talk";
            const back = isTalk
              ? stripOuterQuotes(t(`items.${item.key}.quote`))
              : t(`items.${item.key}.description`);
            return (
              <a
                key={item.key}
                data-card
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="tk-flip group relative block shrink-0 grow-0 basis-[clamp(280px,78vw,380px)] snap-start"
              >
                <div className="tk-flip__inner relative w-full aspect-[4/5]">
                  {/* Front — poster. Content is positioned AFTER the motif (no
                      z-index) so it paints on top without a stacking context
                      that could bleed through when flipped. */}
                  <div
                    dir="ltr"
                    className="tk-flip__face absolute inset-0 overflow-hidden border border-p-line"
                    style={POSTER_WASH}
                  >
                    <PosterMotif motif={item.motif} />
                    <div className="absolute inset-0 flex flex-col p-[18px]">
                      <p className="font-mono text-micro text-p-ink-3 tracking-[0.02em]">
                        <Ltr>{t(`items.${item.key}.attribution`)}</Ltr>
                      </p>
                      <h3 className="mt-auto text-card-title-lg font-bold tracking-[-0.01em] leading-[1.12] text-p-ink">
                        <Ltr>{t(`items.${item.key}.title`)}</Ltr>
                      </h3>
                    </div>
                  </div>
                  {/* Back — inverts to solid blue with a large pulled quote
                      (talk) or blurb (demo). */}
                  <div className="tk-flip__back tk-flip__face absolute inset-0 flex flex-col border border-p-line bg-p-primary p-6 text-p-on-primary">
                    <p className="font-mono text-micro tracking-[0.02em] text-p-on-primary/70">
                      <Ltr>{t(`items.${item.key}.attribution`)}</Ltr>
                    </p>
                    <div className="flex flex-1 items-center py-3">
                      {isTalk ? (
                        <blockquote className="text-feature font-bold leading-[1.12] text-p-on-primary">
                          <span className="text-p-on-primary/55">“</span>
                          {back}
                          <span className="text-p-on-primary/55">”</span>
                        </blockquote>
                      ) : (
                        <p className="text-feature font-bold leading-[1.12] text-p-on-primary">
                          {back}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-2 font-mono text-micro uppercase tracking-[0.06em] rtl:tracking-normal text-p-on-primary group-hover:gap-3 transition-all">
                      {isTalk ? t("watch") : t("openDemo")}{" "}
                      <DirArrow kind="external" />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Scroller — bottom-end, aligned to the content column */}
        <div className="mt-8 flex justify-end">
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
      </div>
    </section>
  );
}
