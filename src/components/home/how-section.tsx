"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PostCodeBlock } from "@/components/blog/post-code-block";
import { DirArrow } from "@/components/ui";
import { VideoFigure } from "@/components/video-figure";
import { Link } from "@/i18n/navigation";
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
const TOOL_TAGS = {
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

/**
 * The message that started the East Hampton catalog, word for word.
 *
 * It quotes src/content/tutorials/mirroring-east-hampton.mdx. A quotation is
 * not translated, so it lives here and not in messages. Keep the two in step.
 */
const QUICKSTART_PROMPT = `I want to use the bootstrap skill from Portolan to make a mirror of these data from the town of East Hampton in New York:
https://eh-gis.ehamptonny.gov/arcgis/rest/services/MapServiceForOpenGov/MapServer

Please make sure that we publish this as a git-backed catalog with really nice thumbnails, and that we publish it to Source Cooperative. Let me know what further info you end up needing from me.`;

const HOW_STEPS = ["convert", "catalog", "publish", "use"] as const;

export function HowSection() {
  const t = useTranslations();

  return (
    <section
      id="how"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* Title with the intro beneath it, matching the ecosystem header. */}
        <div className="mb-[clamp(2.5rem,5vw,4rem)]">
          <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05]">
            {t("howItWorks.title")}
          </h2>
          {/* No `max-w` line-measure cap here: this intro is one sentence
              and sets on a single line at full column width. */}
          <p className="mt-5 text-lead leading-relaxed text-p-ink-2">
            {t.rich("howItWorks.intro", TOOL_TAGS)}
          </p>
        </div>
        {/* Two rows on one pair of columns, so the media stacks on the wide
            side and the prose on the narrow one. The first row is the
            recorded run beside the steps it carries out. The second row is
            the prompt that starts such a run, beside the text that explains
            it. Below `xl` everything is one column and the run keeps the
            full width. */}
        <div className="mt-10 grid grid-cols-1 items-center gap-10 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-12">
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
                <span className="absolute start-0 top-[4px] -ms-[13px] bg-p-bg px-1.5 font-mono text-eyebrow leading-none text-p-primary">
                  {t(`howItWorks.steps.${step}.id`)}
                </span>
                <h3 className="text-card-title font-bold tracking-[-0.02em] leading-none">
                  {t(`howItWorks.steps.${step}.title`)}
                </h3>
                <p className="text-body text-p-ink-2 leading-relaxed text-pretty mt-3">
                  {t.rich(`howItWorks.steps.${step}.description`, FORMAT_TAGS)}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {/* The page sets `scroll-padding-top` for the sticky top bar.
            `scroll-mt` adds a small gap under the bar when a link jumps
            here. A rule separates the quickstart from the run above it. */}
        <div
          id="quickstart"
          className="mt-[clamp(2.5rem,5vw,4rem)] grid min-w-0 scroll-mt-5 grid-cols-1 items-start gap-x-12 gap-y-2 border-t border-p-line pt-[clamp(2rem,4vw,3rem)] xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
        >
          {/* The text stays first in the DOM, so a narrow screen reads what
              the prompt is before it meets the prompt. From `xl` the order
              flips and the prompt sits under the run. */}
          <div className="min-w-0 xl:order-2">
            <h3 className="text-card-title font-bold">
              {t("howItWorks.quickstart.title")}
            </h3>
            <p className="mt-3 text-body leading-relaxed text-p-ink-2 text-pretty">
              {t.rich("howItWorks.quickstart.body", TOOL_TAGS)}
            </p>
          </div>

          {/* The code block brings its own top margin. From `xl` the column
              pulls it back so the block starts level with the heading. */}
          <div className="min-w-0 xl:order-1 xl:-mt-6">
            {/* A prompt, not a terminal. It carries no window chrome and no
                prompt character. The block wraps long lines and stays LTR. */}
            <PostCodeBlock>
              <code>{QUICKSTART_PROMPT}</code>
            </PostCodeBlock>
            <p className="mt-3 text-small text-p-ink-2">
              {t("howItWorks.quickstart.caption")}{" "}
              <Link
                href="/tutorials/mirroring-east-hampton"
                className="inline-flex items-baseline gap-1 text-p-primary hover:underline"
              >
                {t("howItWorks.quickstart.guide")} <DirArrow />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
