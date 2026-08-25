"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GlyphMap } from "./glyph-map";
import { SiteShell } from "./site-rail";
import { ResourcesSection } from "./resources-section";
import { EcosystemSection } from "./ecosystem-section";
import { InvolvedSection } from "./involved-section";
import { GetInvolvedSection } from "./get-involved-section";
import { WhoForSection } from "./who-for-section";
import { CoverageSection } from "./coverage-section";
import { PipelineFigure } from "./pipeline-figure";
import { Btn, DirArrow, monoChunk } from "./ui";
import type { Catalog } from "@/lib/catalogs";

interface HomePageProps {
  catalogs?: Catalog[];
}

export function HomePage({ catalogs = [] }: HomePageProps) {
  const t = useTranslations();

  // Four principles, one ledger row each: title, body, mono tag. Order is
  // deliberate, not ranked (no numbers, no bullets).
  const whyCards = ["open", "simple", "agents"] as const;

  const howSteps = ["convert", "catalog", "publish", "use"] as const;

  return (
    <SiteShell>
      {/* Hero */}
      {/* No bottom rule. Every following section carries its own top rule, so
          a bottom rule here would stack with it and draw 2px where the rest of
          the page draws 1px. */}
      <section id="top" className="relative overflow-hidden">
        <GlyphMap className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0" style={{ background: "var(--hero-scrim)" }} />
        <div className="relative z-10 px-[var(--p-pad-section-x)] pt-[clamp(56px,9vw,120px)] pb-[clamp(40px,6vw,72px)]">
          <div className="max-w-[1240px] mx-auto">
            <h1 className="text-hero font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] text-balance">
              {t("hero.title")} <br />
              {t("hero.titleAccent")}
            </h1>
            <div className="mt-[clamp(2rem,4vw,3rem)]">
              {/* 72ch tracks the h1 measure: the paragraph runs to about 85%
                  of the widest headline line instead of stopping at 66%, which
                  read as truncated. It stays inside the 75ch readability bound.
                  80ch and wider leaves the Arabic paragraph a 49px stub on its
                  last line. */}
              <p className="text-lead leading-relaxed max-w-[72ch]">
                {t.rich("hero.description", { m: monoChunk })}
              </p>
              {/* The gap before this row is the largest in the hero, wider
                  than the h1-to-lead gap above it. The reader stops reading
                  and starts acting here, so the action block gets the most
                  air. A tighter value inverts that: the prose gets more space
                  than the buttons, and the row reads as cramped.

                  Every element in this column shares one inline-start edge:
                  the h1, the lead, and both CTA boxes. The filled variant
                  keeps its px-6, so its label sits inset inside the block.
                  That is the block's own padding, not a misalignment. Do not
                  pull the box start-ward to make the label line up. The blue
                  block edge is the alignment signal the eye reads, and a
                  negative margin makes it overhang the column. */}
              <div className="flex flex-col items-start gap-4 mt-[clamp(2.25rem,4vw,3.25rem)] sm:flex-row sm:items-center sm:gap-6">
                <Link href="/#how">
                  <Btn variant="primary" size="lg">
                    {t("hero.howItWorks")} <DirArrow />
                  </Btn>
                </Link>
                {/* The catalogs section on this page, not the registry.
                    Both hero buttons now point into the page, in the order
                    the page runs: how it works, then the catalogs that come
                    out of it. That section carries the link onward to the
                    registry, so the reader meets the examples before the
                    full list. */}
                <Link href="/#coverage">
                  <Btn variant="ghost" size="lg">
                    {t("hero.exploreCatalogs")} <DirArrow />
                  </Btn>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Portolan */}
      <section id="why" className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line">
        <div className="max-w-[1240px] mx-auto">
          {/* The heading fills the band between the section rule and the
              ledger rule. Left empty, those two rules sit in the same ink
              with the section padding stranded between them, and the ledger
              reads as a table that arrived without a title. */}
          <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05] mb-[clamp(2.5rem,5vw,4rem)]">
            {t("nav.why")}
          </h2>
          {/* Ledger: three principles, one row each. Near-black top rule, soft
              interior rules. Rows nudge start-ward + tint faintly on hover. */}
          <div className="border-t border-p-line overflow-clip">
            {whyCards.map((key) => (
              <div
                key={key}
                // No horizontal padding: every other section starts its text
                // on the column edge, and an 8px inset here broke that edge
                // for three rows only.
                className="group grid grid-cols-1 gap-2 border-b border-p-line py-6 [will-change:transform] transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[color-mix(in_srgb,var(--p-primary)_4%,var(--p-paper))] hover:translate-x-2 rtl:hover:-translate-x-2 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-baseline md:gap-12 md:py-[26px]"
              >
                <h3 className="text-card-title font-bold tracking-[-0.02em]">
                  {t(`why.cards.${key}.title`)}
                </h3>
                <p className="text-body text-p-ink-2 leading-relaxed text-pretty">
                  {t.rich(`why.cards.${key}.description`, { m: monoChunk })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for — the page's one reversed surface */}
      <WhoForSection />

      {/* Users and supporters. Placed against "Who it's for" so the reader
          meets the audience and then the organizations without a label saying
          which logo is which. Some build on Portolan and some publish with it,
          and the strip carries no heading that would separate the two. */}
      <InvolvedSection />

      {/* How it works */}
      <section id="how" className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line">
        <div className="max-w-[1240px] mx-auto">
          {/* Title with the intro beneath it, matching the ecosystem header.
              No eyebrow: the rail labels this section from
              `howItWorks.eyebrow`, but printing it above an identical title
              would just repeat the headline. */}
          <div className="mb-[clamp(2.5rem,5vw,4rem)]">
            <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05]">
              {t("howItWorks.title")}
            </h2>
            {/* No `max-w` line-measure cap here: this intro is one sentence
                and sets on a single line at full column width. */}
            <p className="mt-5 text-lead leading-relaxed text-p-ink-2">
              {t.rich("howItWorks.intro", {
                cli: (chunks) => (
                  <a
                    href="https://cli.portolan-sdi.org/"
                    className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                  >
                    {chunks}
                  </a>
                ),
                skills: (chunks) => (
                  <a
                    href="https://github.com/portolan-sdi/portolan-skills"
                    className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                  >
                    {chunks}
                  </a>
                ),
              })}
            </p>
          </div>
          <div className="mb-[var(--p-pad-lg)]">
            <PipelineFigure />
          </div>
          {/* Stepper strip: four cells in one near-black frame, soft interior
              dividers (wrap-aware for the 1/2/4-col responsive steps), faint
              tint on hover. Number badge (mono, reversed) + title + a
              reading-forward arrow on every cell but the last. */}
          <div className="border border-p-line grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {howSteps.map((step, i) => (
              <div
                key={step}
                className="group p-6 border-p-line transition-colors duration-300
                  border-b [&:last-child]:border-b-0
                  sm:[&:nth-child(2n)]:border-s
                  sm:[&:nth-child(n+3)]:border-b-0
                  lg:border-b-0
                  lg:[&:not(:first-child)]:border-s
                  hover:bg-[color-mix(in_srgb,var(--p-primary)_4%,var(--p-paper))]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-eyebrow text-p-bg bg-p-primary px-1.5 py-0.5 leading-none tracking-[0.04em] rtl:tracking-normal">
                    {t(`howItWorks.steps.${step}.id`)}
                  </span>
                  <h3 className="text-card-title font-bold tracking-[-0.02em]">
                    {t(`howItWorks.steps.${step}.title`)}
                  </h3>
                  {i < howSteps.length - 1 && (
                    <span aria-hidden className="ms-auto text-p-ink-3">
                      <DirArrow />
                    </span>
                  )}
                </div>
                <p className="text-body text-p-ink-2 leading-relaxed text-pretty mt-3">
                  {t.rich(`howItWorks.steps.${step}.description`, {
                    m: monoChunk,
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured catalogs and their coverage, binned from collection bboxes.
          It follows "How it works" because it is that pipeline's output: the
          reader has just seen how a catalog gets built, and these are
          catalogs people built that way. Placed earlier it shows catalogs
          before the page says what one is. Placed last it lands after "Get
          involved", so two calls to action sit side by side and the stronger
          one reaches the fewest readers. */}
      {catalogs.length > 0 && <CoverageSection catalogs={catalogs} />}

      {/* Ecosystem — the Portolan projects plus the wider format ecosystem */}
      <EcosystemSection />

      {/* Talks & demos */}
      <ResourcesSection />

      {/* Community contribution paths */}
      <GetInvolvedSection />
    </SiteShell>
  );
}
