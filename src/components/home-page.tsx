"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GlyphMap } from "./glyph-map";
import { SiteShell } from "./site-rail";
import { DemoSection } from "./demo-section";
import { VideoFigure } from "./video-figure";
import { EcosystemSection } from "./ecosystem-section";
import { InvolvedSection } from "./involved-section";
import { GetInvolvedSection } from "./get-involved-section";
import { WhoForSection } from "./who-for-section";
import { CoverageSection } from "./coverage-section";
import { Btn, DirArrow, monoChunk } from "./ui";
import type { Catalog } from "@/lib/catalogs";
import { FORMAT_LINKS } from "@/lib/site";

/** Aspect ratio of the encoded catalog-build recording, 1454x1118. It
 *  reserves the box before metadata loads, so the poster does not shift the
 *  page when it paints. */
const DEMO_ONE_RATIO = "1454 / 1118";

interface HomePageProps {
  catalogs?: Catalog[];
}

export function HomePage({ catalogs = [] }: HomePageProps) {
  const t = useTranslations();

  // Four principles, one ledger row each: title, body, mono tag. Order is
  // deliberate, not ranked (no numbers, no bullets).
  const whyCards = ["agents", "open", "cost", "sovereign"] as const;

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
                <Btn asChild variant="primary" size="lg">
                  <Link href="/#how">
                    {t("hero.howItWorks")} <DirArrow />
                  </Link>
                </Btn>
                {/* The catalogs section on this page, not the registry.
                    Both hero buttons now point into the page, in the order
                    the page runs: how it works, then the catalogs that come
                    out of it. That section carries the link onward to the
                    registry, so the reader meets the examples before the
                    full list. */}
                <Btn asChild variant="ghost" size="lg">
                  <Link href="/#coverage">
                    {t("hero.exploreCatalogs")} <DirArrow />
                  </Link>
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The recorded demo. It answers the hero before the page explains
          itself: one run that reads published Portolan data and measures
          flood risk with it. The companion run, which builds the catalog,
          plays inside "How it works" below. */}
      <DemoSection />

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
                  {t.rich(`why.cards.${key}.description`, {
                    m: monoChunk,
                    geoparquet: (chunks) => (
                      <a
                        href={FORMAT_LINKS.geoParquet}
                        className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                      >
                        {chunks}
                      </a>
                    ),
                    pmtiles: (chunks) => (
                      <a
                        href={FORMAT_LINKS.pmtiles}
                        className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                      >
                        {chunks}
                      </a>
                    ),
                    cog: (chunks) => (
                      <a
                        href={FORMAT_LINKS.cog}
                        className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                      >
                        {chunks}
                      </a>
                    ),
                    stac: (chunks) => (
                      <a
                        href={FORMAT_LINKS.stac}
                        className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                      >
                        {chunks}
                      </a>
                    ),
                  })}
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
          {/* Two columns, mirroring "Explore catalogs" below: the media takes
              the wide side and the list takes the narrow one, with the sides
              swapped so the two sections do not stack the same way twice.

              The steps name the pipeline and the run shows it. Side by side,
              the reader reads a step and sees it happen without scrolling
              between the two. */}
          <div className="mt-10 grid grid-cols-1 items-center gap-6 xl:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] xl:gap-8">
            {/* The run leads on the wide column, because it carries the
                section. */}
            <VideoFigure
              src="/video/portolan-demo-one.mp4"
              poster="/video/portolan-demo-one.jpg"
              ratio={DEMO_ONE_RATIO}
              description={t("demo.transcriptPhiladelphia")}
              caption={t.rich("demo.captionPhiladelphia", {
                catalog: (chunks) => (
                  <a
                    href="https://source.coop/nlebovits/phl-housing-demo"
                    className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                  >
                    {chunks}
                  </a>
                ),
              })}
            />

            {/* One spine, four stops. The steps were four bordered cards,
                which put a third card grid on a page that already runs two,
                and made a sequence read as four peer objects. A single rule
                carries the order instead: the numbers sit on the line and the
                text hangs off it. No box, no offset, and no hover state,
                because none of this is clickable. The numbers stay because
                the pipeline runs in this order and the reader needs it.

                The rule is the near-black structural ink, not the soft
                interior tier, because nothing encloses this list. */}
            <ol className="relative ms-[13px] border-s border-p-line">
              {howSteps.map((step) => (
                <li key={step} className="relative ps-7 pb-9 last:pb-0 sm:ps-8">
                  {/* Pulled back over the rule by half its own width, with the
                      page ground behind it, so the line reads as broken by the
                      number rather than crossed out by it. */}
                  <span className="absolute start-0 top-[4px] -ms-[13px] bg-p-bg px-1.5 font-mono text-eyebrow leading-none text-p-primary">
                    {t(`howItWorks.steps.${step}.id`)}
                  </span>
                  <h3 className="text-card-title font-bold tracking-[-0.02em] leading-none">
                    {t(`howItWorks.steps.${step}.title`)}
                  </h3>
                  <p className="text-body text-p-ink-2 leading-relaxed text-pretty mt-3">
                    {t.rich(`howItWorks.steps.${step}.description`, {
                      m: monoChunk,
                    })}
                  </p>
                </li>
              ))}
            </ol>
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

      {/* Community contribution paths */}
      <GetInvolvedSection />
    </SiteShell>
  );
}
