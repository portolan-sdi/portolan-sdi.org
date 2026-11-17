"use client";

import { useTranslations } from "next-intl";
import { Btn, DirArrow, monoChunk } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { SPEC_URL } from "@/lib/site";
import { HeroFigure } from "./hero-figure";

const proseLink =
  "text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink";

/**
 * The homepage hero. The headline and the lead with its two actions sit in a
 * two-column head from `lg` up. The animated point map runs under the head at
 * the full width of the section, so the map is the largest thing on the
 * screen. Below `lg` the head stacks and the map follows it.
 *
 * The section carries the `graph-wash` grid, and the map draws straight on
 * it with no frame.
 *
 * The figure's height comes from CSS alone, so the page does not shift when
 * the map data arrives.
 *
 * The section draws no bottom rule. Every following section carries its own
 * top rule, so a rule here would stack with it and draw 2px.
 *
 * `scroll-mt` keeps the sticky mobile top bar off the headline when the rail
 * jumps to `#top`.
 */
export function HeroSection() {
  const t = useTranslations();

  return (
    <section
      id="top"
      className="graph-wash relative overflow-hidden scroll-mt-[76px]"
    >
      <div className="px-[var(--p-pad-section-x)] pt-[clamp(48px,6vw,88px)]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:items-end">
          <h1 className="text-hero font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance wrap-break-word">
            {t("hero.title")}
          </h1>
          <div className="min-w-0">
          {/* The sentence names two things, so it carries two links.
              "specification" goes to the spec repository and opens a new
              tab. "toolkit" goes to the Ecosystem section. That link is a
              plain `a`, because the section sits on this page and the
              browser reaches it without the router. */}
          <p className="text-lead leading-relaxed max-w-[60ch]">
            {t.rich("hero.description", {
              m: monoChunk,
              spec: (chunks) => (
                <a
                  href={SPEC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={proseLink}
                >
                  {chunks}
                </a>
              ),
              eco: (chunks) => (
                <a href="#ecosystem" className={proseLink}>
                  {chunks}
                </a>
              ),
            })}
          </p>
          {/* The gap before this row is the largest in the column. The
              reader stops reading and starts acting here. Both boxes share
              the column's inline-start edge. Do not pull the filled button
              start-ward to line up its label. */}
          <div className="flex flex-col items-start gap-4 mt-[clamp(1.5rem,3vw,2.25rem)] sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            {/* A plain anchor with a hash target. A router `Link` to `/#how`
                asks the router for the page already open, and the router
                holds the scroll position on a same-route move. */}
            <Btn asChild variant="primary" size="lg">
              <a href="#how" data-track="hero-how">
                {t("hero.howItWorks")} <DirArrow />
              </a>
            </Btn>
            {/* The registry is a separate route, so this is a locale `Link`. */}
            <Btn asChild variant="ghost" size="lg">
              <Link href="/registry" data-track="hero-registry">
                {t("hero.browseRegistry")} <DirArrow />
              </Link>
            </Btn>
          </div>
          </div>
        </div>
      </div>
      <HeroFigure className="mt-[clamp(8px,2vw,24px)] aspect-[6/5] w-full sm:aspect-[16/10] lg:aspect-[2/1] lg:max-h-[min(640px,72vh)]" />
    </section>
  );
}
