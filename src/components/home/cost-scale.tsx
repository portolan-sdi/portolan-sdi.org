"use client";

import type { CSSProperties, ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getDirection } from "@/i18n/direction";

const COST_CALCULATOR =
  "https://cholmes.github.io/open-geodag-presentation/calculator.html";

/** Decades on the cost axis. Currency and digits are Latin in every locale. */
const TICKS = ["€0.10", "€1", "€10", "€100", "€1,000", "€10,000"] as const;
const inlineLink =
  "text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink";

/**
 * Each cost with its place on the axis, which is (log10(euros) + 1) / 5 for
 * 0.47, 75, and 6,006. Change a place when its figure in `messages` changes.
 */
const COSTS = [
  { key: "municipality", f: 0.1344, side: "" },
  { key: "province", f: 0.575, side: "cost-mark-flip" },
  { key: "national", f: 0.9557, side: "cost-mark-flip cost-mark-end" },
] as const;

// The <cost> tag in the caption is part of the message contract and carries
// the same text span in every locale.
function costLink(chunks: ReactNode) {
  return (
    <a
      href={COST_CALCULATOR}
      target="_blank"
      rel="noopener noreferrer"
      className={inlineLink}
    >
      {chunks}
    </a>
  );
}

/**
 * The cost scale, a log axis with three real monthly costs. It is a paper
 * panel on the "Why Portolan" band. The axis and its marks are LTR in every
 * locale, and each label takes the page direction for its own text. The
 * layout is in `globals.css` under `.cost-scale`. The strings are under
 * `cases.costs`.
 */
export function CostScale() {
  const t = useTranslations("cases");
  const dir = getDirection(useLocale());

  return (
    <figure className="m-0 mt-[clamp(40px,5vw,64px)] border border-p-line bg-p-bg">
      <div className="cost-scale" dir="ltr">
        <div className="cost-axis" aria-hidden>
          {TICKS.map((tick, i) => (
            <div
              key={tick}
              className="cost-tick"
              style={{ "--f": i / (TICKS.length - 1) } as CSSProperties}
            >
              <span className="font-mono text-eyebrow text-p-primary-ink">
                {tick}
              </span>
            </div>
          ))}
        </div>
        {COSTS.map((cost) => (
          <div
            key={cost.key}
            className={`cost-mark ${cost.side}`}
            style={{ "--f": cost.f } as CSSProperties}
          >
            <p className="cost-lab m-0">
              <span className="block font-sans text-section font-extrabold leading-none tracking-[-0.035em] text-p-primary-ink tabular-nums">
                {t(`costs.${cost.key}.figure`)}
              </span>
              <span dir={dir} className="mt-2.5 block text-body font-bold leading-[1.35] text-p-ink">
                {t(`costs.${cost.key}.label`)}
              </span>
              <span dir={dir} className="mt-0.5 block text-body leading-normal text-p-ink-2">
                {t(`costs.${cost.key}.line`)}
              </span>
            </p>
          </div>
        ))}
      </div>
      <figcaption className="border-t border-p-line bg-p-bg px-[clamp(16px,3vw,40px)] py-3.5 font-mono text-small leading-relaxed text-p-ink-2">
        {t.rich("costs.caption", { cost: costLink })}
      </figcaption>
    </figure>
  );
}
