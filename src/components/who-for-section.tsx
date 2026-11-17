"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRevealed } from "@/hooks/use-revealed";
import { Ltr } from "./ui";

const COST_CALCULATOR =
  "https://cholmes.github.io/open-geodag-presentation/calculator.html";
const INLINE_LINK =
  "text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink";

// The <cost> tag in the caption is part of the message contract and carries
// the same text span in every locale.
function costLink(chunks: ReactNode) {
  return (
    <a
      href={COST_CALCULATOR}
      target="_blank"
      rel="noopener noreferrer"
      className={INLINE_LINK}
    >
      {chunks}
    </a>
  );
}

// Who it's for — three user stories, one per group Portolan serves.
//
// Each story runs as two paragraphs. The first sets in the muted tier and
// the second in full ink, so the turn reads without a label.
//
// Equal columns keep the three rules the same width and aligned at the top.
//
// The rules wipe in from their inline-start edge and the stories rise under
// them, once, when the section scrolls into view. Hovering a story lifts it,
// doubles the weight of its rule, and turns its title blue. Keyframes
// (wf-rule-in / wf-story-in) live in globals.css and stop under
// prefers-reduced-motion.
//
// One figure closes the section. It sets three monthly costs on the graph
// wash, with the source and the exclusions in the caption row.
const STORIES = ["large", "small", "users"] as const;
const COSTS = ["municipality", "province", "national"] as const;

export function WhoForSection() {
  const t = useTranslations("whoFor");
  const { ref, revealed } = useRevealed<HTMLElement>();

  return (
    <section
      id="who"
      ref={ref}
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* No eyebrow: the title names the section on its own. */}
        <h2 className="text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-balance">
          {t("title")}
        </h2>

        <div
          // Body copy sets at 15px, so the three columns need a tighter
          // gutter to hold a measure near 45 characters at 1440px.
          className="wf-set mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 items-start gap-[clamp(2.25rem,4vw,3.5rem)] md:grid-cols-3 md:gap-[clamp(1.5rem,2.4vw,2.25rem)]"
          data-in={revealed}
        >
          {STORIES.map((key, i) => (
            <div
              key={key}
              className="wf-story group [will-change:transform] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
            >
              {/* The rule carries the hover weight, so it grows downward from
                  a fixed top edge and the title never shifts. */}
              <div
                aria-hidden
                className="wf-rule h-px w-full origin-top bg-p-primary transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-[2] motion-reduce:transition-none motion-reduce:group-hover:scale-y-100"
                style={{ animationDelay: `${i * 90}ms` }}
              />
              <div
                className="wf-body"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                <h3 className="mt-[22px] text-feature font-bold tracking-[-0.03em] leading-[1.05] transition-colors duration-300 group-hover:text-p-primary-ink">
                  {t(`stories.${key}.title`)}
                </h3>
                <p className="mt-[18px] text-body leading-[1.7] text-p-ink-2 text-pretty">
                  {t(`stories.${key}.first`)}
                </p>
                <p className="mt-4 text-body leading-[1.7] text-p-ink text-pretty">
                  {t(`stories.${key}.second`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <figure className="m-0 mt-[clamp(2.5rem,5vw,4rem)] border border-p-line">
          <div className="graph-wash grid grid-cols-1 bg-p-bg md:grid-cols-3">
            {COSTS.map((key) => (
              <div
                key={key}
                className="px-[clamp(1.25rem,2.4vw,2rem)] py-[clamp(1.5rem,2.6vw,2.25rem)]"
              >
                {/* Digits and the currency mark stay Latin and in order in
                    every locale. */}
                <p className="font-mono text-feature leading-[1.05] text-p-primary-ink">
                  <Ltr>{t(`costs.${key}.figure`)}</Ltr>
                </p>
                <p className="mt-3 text-body font-bold text-p-ink">
                  {t(`costs.${key}.label`)}
                </p>
                <p className="mt-1 text-small leading-relaxed text-p-ink-2">
                  {t(`costs.${key}.line`)}
                </p>
              </div>
            ))}
          </div>
          <figcaption className="border-t border-p-line px-[clamp(1.25rem,2.4vw,2rem)] py-3 font-mono text-eyebrow leading-relaxed text-p-ink-2">
            {t.rich("costs.caption", { cost: costLink })}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
