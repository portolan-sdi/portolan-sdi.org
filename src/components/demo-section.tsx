"use client";

import { useTranslations } from "next-intl";
import { SectionHead } from "./ui";

/**
 * The launch demo: one recorded run, from a source portal to a published
 * catalog.
 *
 * It sits directly under the hero because it is the shortest answer to the
 * question the hero raises. The hero says what Portolan does. This shows it
 * happening, before the page spends three sections explaining it.
 *
 * The recording runs 73 seconds and carries no audio, so the element needs no
 * volume affordance and no captions track. It does not autoplay. A reader who
 * scrolls past downloads the poster and nothing else, which is what
 * `preload="none"` buys: the video itself is 7.1 MB and only the reader who
 * presses play pays for it.
 *
 * The poster is the frame at 64 seconds, where the browser lists the finished
 * catalog. The recording opens on a terminal, but the still that stands under
 * the hero is the result rather than the process.
 */

/** Aspect ratio of the source recording, 1454x1314. Reserves the box before
 *  metadata loads, so the poster does not shift the page when it paints. */
const DEMO_RATIO = "1454 / 1314";

export function DemoSection() {
  const t = useTranslations("demo");

  return (
    <section
      id="demo"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        <SectionHead eyebrow={t("eyebrow")} title={t("title")} />

        {/* The recording is a screen capture of an LTR interface. It must not
            mirror on the Arabic page, so the figure pins itself, exactly as
            PipelineFigure does. The caption below sits outside the pin and
            follows the page direction. */}
        <figure className="m-0 max-w-[900px]">
          <video
            dir="ltr"
            controls
            playsInline
            preload="none"
            poster="/video/portolan-demo-one.jpg"
            style={{ aspectRatio: DEMO_RATIO }}
            className="block w-full h-auto border border-p-line bg-p-paper"
          >
            <source src="/video/portolan-demo-one.mp4" type="video/mp4" />
          </video>

          {/* Not the mono eyebrow the map caption uses. That one is a two-word
              label. This is a sentence carrying two links, and mono eyebrow
              sets it as fine print. */}
          <figcaption className="mt-4 text-small leading-relaxed text-p-ink-2 text-pretty">
            {t.rich("caption", {
              catalog: (chunks) => (
                <a
                  href="https://source.coop/nlebovits/phl-housing-demo"
                  className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                >
                  {chunks}
                </a>
              ),
              sc: (chunks) => (
                <a
                  href="https://source.coop/"
                  className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                >
                  {chunks}
                </a>
              ),
            })}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
