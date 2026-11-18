"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { VideoFigure } from "@/components/video-figure";
import { FORMAT_TAGS } from "./format-tags";

const proseLink =
  "text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink";

/** Aspect ratio of the encoded catalog-build recording, 1454x1118. It
 *  reserves the box before metadata loads, so the poster does not shift the
 *  page when it paints. */
const DEMO_ONE_RATIO = "1454 / 1118";

/** Rich-text tag that links the recording's caption to the catalog it built. */
const CATALOG_TAGS = {
  catalog: (chunks: ReactNode) => (
    <a
      href="https://source.coop/nlebovits/phl-housing-demo"
      className={proseLink}
    >
      {chunks}
    </a>
  ),
};

/** Rich-text tags for the two ways to run the pipeline. */
export const TOOL_TAGS = {
  cli: (chunks: ReactNode) => (
    <a href="https://cli.portolan-sdi.org/" className={proseLink}>
      {chunks}
    </a>
  ),
  skills: (chunks: ReactNode) => (
    <a
      href="https://github.com/portolan-sdi/portolan-skills"
      className={proseLink}
    >
      {chunks}
    </a>
  ),
};

const HOW_STEPS = ["convert", "catalog", "publish", "use"] as const;

/**
 * The recorded catalog build beside the four steps it carries out. The
 * `/how-it-works` page renders it under the page header band, so each step
 * title is an `h2`.
 */
export function HowSteps() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 items-center gap-10 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-12">
      {/* The run leads on the wide column, because it carries the
          section. `min-w-0` lets the frame shrink with the column on a
          phone. */}
      <VideoFigure
        src="/video/portolan-demo-one.mp4"
        poster="/video/portolan-demo-one.jpg"
        ratio={DEMO_ONE_RATIO}
        className="min-w-0"
        description={t("demo.transcriptPhiladelphia")}
        caption={t.rich("demo.captionPhiladelphia", CATALOG_TAGS)}
      />

      {/* One spine, four stops. A single rule carries the order: the
          numbers sit on the line and the text hangs off it. No box, no
          offset, and no hover state, because none of this is clickable.
          The numbers stay because the pipeline runs in this order.

          The rule is the near-black structural ink, not the soft
          interior tier, because nothing encloses this list. */}
      <ol className="relative ms-[13px] border-s border-p-line">
        {HOW_STEPS.map((step) => (
          <li key={step} className="relative ps-7 pb-9 last:pb-0 sm:ps-8">
            {/* Pulled back over the rule by half its own width, with the
                page ground behind it, so the line reads as broken by the
                number and not crossed out by it. */}
            <span className="absolute start-0 top-[4px] -ms-[13px] bg-p-bg px-1.5 text-small leading-none text-p-primary">
              {t(`howItWorks.steps.${step}.id`)}
            </span>
            <h2 className="text-card-title font-bold tracking-[-0.02em] leading-none">
              {t(`howItWorks.steps.${step}.title`)}
            </h2>
            <p className="text-body text-p-ink-2 leading-relaxed text-pretty mt-3">
              {t.rich(`howItWorks.steps.${step}.description`, FORMAT_TAGS)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
