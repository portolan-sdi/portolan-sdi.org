"use client";

import { useTranslations } from "next-intl";
import { monoChunk } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { SPEC_URL } from "@/lib/site";
import { HeroFigure } from "./hero-figure";

const proseLink =
  "text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink";

/**
 * The homepage hero. From `lg` up it has two columns. The headline and the
 * lead fill the inline-start column. The hero has no buttons. The animated
 * figure is in the inline-end column, centered on the text. The figure
 * column has a fixed width that steps up at `2xl`, and the text takes the
 * rest. Below `lg` the hero is one column, the text first and the figure
 * under it.
 *
 * The section has the `graph-wash` grid, and the figure draws straight on
 * it with no frame.
 *
 * The figure sets its own height from its own width, in CSS alone, so the
 * page does not shift when the baked world arrives. It needs a column of
 * 520px or more to put its tree beside its drawings. A narrower figure
 * stacks them, which is the form a phone gets.
 *
 * The headline steps down to `text-section` between `md` and `xl`, where
 * the text column is too narrow for `text-hero`. Arabic keeps
 * `text-section` at `xl` too. Cairo sets wider and taller than the Latin
 * face, and `text-hero` would wrap it to too many lines.
 *
 * The section draws no bottom rule. Every following section has its own
 * top rule, so a rule here would stack with it and draw 2px.
 *
 * `scroll-mt` keeps the sticky top bar off the headline on a jump to `#top`.
 */
export function HeroSection() {
  const t = useTranslations();

  return (
    <section
      id="top"
      className="graph-wash relative overflow-hidden scroll-mt-[76px]"
    >
      <div className="px-[var(--p-pad-section-x)] py-[clamp(40px,5vw,72px)]">
        <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:items-center lg:gap-x-12 xl:gap-x-16 2xl:grid-cols-[minmax(0,1fr)_580px]">
          <div className="min-w-0">
            <h1 className="text-hero md:text-section xl:text-hero xl:rtl:text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance wrap-break-word">
              {t("hero.title")}
            </h1>
            {/* The sentence names two things, so it carries two links.
                "specification" goes to the spec repository and opens a new
                tab. "toolkit" goes to the Ecosystem section. That link is a
                plain `a`, because the section sits on this page and the
                browser reaches it without the router. */}
            <p className="mt-[clamp(1.25rem,2.5vw,2rem)] text-lead leading-relaxed max-w-[52ch]">
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
                  <Link href="/quickstart" className={proseLink}>
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
          <HeroFigure className="w-full max-w-[580px] lg:max-w-none" />
        </div>
      </div>
    </section>
  );
}
