"use client";

import { useTranslations } from "next-intl";

// Who it's for — three user stories, told on the page's one reversed surface.
// The inversion is the point: every other section sits on cream, so flipping
// to ink here marks the section a visitor is meant to stop and read.
//
// Each story runs as two paragraphs. The first states how the work goes
// today and sets in the muted tier. The second states what changes with
// Portolan and sets in the bright tier, so the turn reads without a label.
//
// Columns are unequal and staggered on purpose. Three equal columns would
// rebuild the card grid this section exists to avoid.
const STORIES = ["large", "small", "users"] as const;

export function WhoForSection() {
  const t = useTranslations("whoFor");

  return (
    <section
      id="who"
      className="bg-p-ink px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* No eyebrow: the title names the section on its own. */}
        <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05] text-balance text-p-on-ink">
          {t("title")}
        </h2>
        <p className="mt-5 max-w-[54ch] text-body-lg leading-relaxed text-p-on-ink-2">
          {t("lead")}
        </p>

        <div className="mt-[clamp(2.5rem,5vw,4.25rem)] grid grid-cols-1 gap-[clamp(2.25rem,4vw,3.5rem)] md:grid-cols-[1.05fr_0.85fr_1.15fr] md:gap-[clamp(1.75rem,3.4vw,3.25rem)]">
          {STORIES.map((key, i) => (
            <div
              key={key}
              className={
                i === 1 ? "md:pt-9" : i === 2 ? "md:pt-4" : undefined
              }
            >
              <div aria-hidden className="h-px w-full bg-p-primary-lift" />
              <h3 className="mt-[22px] max-w-[9ch] text-feature font-bold tracking-[-0.03em] leading-[1.05] text-p-on-ink">
                {t(`stories.${key}.title`)}
              </h3>
              <p className="mt-[18px] max-w-[46ch] text-body leading-[1.7] text-p-on-ink-2 text-pretty">
                {t(`stories.${key}.today`)}
              </p>
              <p className="mt-4 max-w-[46ch] text-body leading-[1.7] text-p-on-ink text-pretty">
                {t(`stories.${key}.change`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
