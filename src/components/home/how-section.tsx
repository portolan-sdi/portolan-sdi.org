"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PostCodeBlock } from "@/components/blog/post-code-block";
import { DirArrow } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { FORMAT_TAGS } from "./format-tags";

const proseLink =
  "text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink";


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
        {/* Two columns. The quickstart takes the wide side and the steps take
            the narrow one. The steps name the pipeline, and the prompt shows
            how little it takes to start one. */}
        <div className="mt-10 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,55fr)_minmax(0,45fr)] xl:gap-8">
          {/* `scroll-mt` keeps the sticky mobile top bar off the heading when
              a link jumps here. `min-w-0` lets the code block shrink with the
              column on a phone. */}
          <div id="quickstart" className="min-w-0 scroll-mt-[76px]">
            <h3 className="text-card-title font-bold">
              {t("howItWorks.quickstart.title")}
            </h3>
            <p className="mt-3 text-body leading-relaxed text-p-ink-2 text-pretty">
              {t.rich("howItWorks.quickstart.body", TOOL_TAGS)}
            </p>
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
      </div>
    </section>
  );
}
