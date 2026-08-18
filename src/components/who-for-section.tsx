"use client";

import { useTranslations } from "next-intl";

// Who it's for — three user stories, one per group Portolan serves.
//
// Each story runs as two paragraphs. The first states how the work goes
// today and sets in the muted tier. The second states what changes with
// Portolan and sets in full ink, so the turn reads without a label.
//
// Equal columns keep the three rules the same width and aligned at the top.
const STORIES = ["large", "small", "users"] as const;

export function WhoForSection() {
  const t = useTranslations("whoFor");

  return (
    <section
      id="who"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* No eyebrow: the title names the section on its own. */}
        <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05] text-balance">
          {t("title")}
        </h2>

        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 items-start gap-[clamp(2.25rem,4vw,3.5rem)] md:grid-cols-3 md:gap-[clamp(1.75rem,3.4vw,3rem)]">
          {STORIES.map((key) => (
            <div key={key}>
              <div aria-hidden className="h-px w-full bg-p-primary" />
              <h3 className="mt-[22px] text-feature font-bold tracking-[-0.03em] leading-[1.05]">
                {t(`stories.${key}.title`)}
              </h3>
              <p className="mt-[18px] text-body leading-[1.7] text-p-ink-2 text-pretty">
                {t(`stories.${key}.today`)}
              </p>
              <p className="mt-4 text-body leading-[1.7] text-p-ink text-pretty">
                {t(`stories.${key}.change`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
