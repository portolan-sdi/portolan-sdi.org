"use client";

import { useTranslations } from "next-intl";
import { useRevealed } from "@/hooks/use-revealed";

// Who it's for — three user stories, one per group Portolan serves.
//
// Each story runs as two paragraphs. The first states how the work goes
// today and sets in the muted tier. The second states what changes with
// Portolan and sets in full ink, so the turn reads without a label.
//
// Equal columns keep the three rules the same width and aligned at the top.
//
// The rules wipe in from their inline-start edge and the stories rise under
// them, once, when the section scrolls into view. Hovering a story lifts it,
// doubles the weight of its rule, and turns its title blue. Keyframes
// (wf-rule-in / wf-story-in) live in globals.css and stop under
// prefers-reduced-motion.
const STORIES = ["large", "small", "users"] as const;

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
        <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05] text-balance">
          {t("title")}
        </h2>

        <div
          className="wf-set mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 items-start gap-[clamp(2.25rem,4vw,3.5rem)] md:grid-cols-3 md:gap-[clamp(1.75rem,3.4vw,3rem)]"
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
                  {t(`stories.${key}.today`)}
                </p>
                <p className="mt-4 text-body leading-[1.7] text-p-ink text-pretty">
                  {t(`stories.${key}.change`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
