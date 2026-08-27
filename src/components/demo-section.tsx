"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { VideoFigure } from "./video-figure";

/**
 * The flood risk demo: one recorded run that reads published Portolan data and
 * answers a question with it.
 *
 * It sits directly under the hero because it is the shortest answer to the
 * question the hero raises. The hero says what Portolan does. This shows what
 * the data is for, before the page spends three sections explaining it. The
 * companion recording, which builds a catalog, plays inside "How it works".
 *
 * The section carried no heading until the second demo landed. That worked
 * while the one recording showed a catalog being built, because the hero
 * above it had already named the act. This run argues something the hero does
 * not: that an agent can answer a real question against published data on its
 * own. A dark terminal poster cannot say that, so the section says it.
 *
 * The run takes the start column and the text takes the end column. "How it
 * works" runs the same way round, so the page reads media-then-prose twice
 * before "Explore catalogs" reverses it.
 *
 * The run measures 41 seconds and 2.8 MB. The poster is the last frame, where
 * the terminal holds the ranked hotspots and the recommended planning order.
 * The screen carries text edge to edge there. Earlier frames leave a wide gap
 * between the code block and the results.
 */

/** Aspect ratio of the encoded file, 1194x1078. The source recording stands
 *  1920x1080 and carries the dark desktop in a wide gutter on each side.
 *  `cropdetect` reports `1194:1078:362:0` for every frame, so the encode cuts
 *  the gutters away and this ratio holds the terminal and nothing else. */
const DEMO_RATIO = "1194 / 1078";

export function DemoSection() {
  const t = useTranslations("demo");

  return (
    <section
      id="demo"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="mx-auto max-w-[1240px]">
        {/* 52/48 with a tighter gap, not 58/42. The video caps at 620px and
              does not grow, so the wider share was spending the extra width on
              blank paper while the text column set a narrow measure beside a
              684px frame.

              Centered, not top-aligned. Top alignment hangs a short text block
              off the frame's top edge and leaves the rest of the column empty
              below it. Centered, the text sits against the middle of the run
              and the gaps above and below read as margin. */}
          <div className="grid grid-cols-1 items-center gap-10 xl:grid-cols-[minmax(0,52fr)_minmax(0,48fr)] xl:gap-10">
          {/* The text stays first in the DOM so a narrow screen reads the
              claim before it meets a 340px player, and so the keyboard
              reaches the two links before the video controls. From xl the
              order flips and the run takes the start column. */}
          <div className="xl:order-2">
            <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05] text-balance">
              {t("title")}
            </h2>
            {/* `text-balance` evens the line lengths instead of leaving a
                short last line, and the 48ch cap keeps the measure readable
                in a column this narrow.

                The one link carries the section's only colour and takes
                the reader where the section points, which is the registry. */}
            <p className="mt-6 max-w-[52ch] text-lead leading-relaxed text-p-ink-2 text-balance">
              {t.rich("blurb", {
                registry: (chunks) => (
                  <Link
                    href="/registry"
                    className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>

          <VideoFigure
            src="/video/portolan-demo-two.mp4"
            poster="/video/portolan-demo-two.jpg"
            ratio={DEMO_RATIO}
            className="w-full max-w-[620px] justify-self-center xl:order-1 xl:justify-self-start"
          />
        </div>
      </div>
    </section>
  );
}
