import { useTranslations } from "next-intl";
import type React from "react";
import { monoChunk } from "@/components/ui";
import { FORMAT_LINKS } from "@/lib/site";

const BLOCKS = ["standards", "docs", "sovereign"] as const;

// The picture behind the band. The file is grayscale, and the blend below
// supplies the color. The credit is in README.md.
const BAND_IMAGE = "/img/home/taiwan-fields.webp";

const onBand =
  "text-p-on-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-on-primary";

/**
 * "Why Portolan". Three short reasons on a satellite image band. The band
 * uses the same treatment as the footer. A grayscale photograph multiplies
 * over `--p-primary`, so no pixel is lighter than `--p-primary`, and
 * `--p-on-primary` text stays above 4.5:1. The image is decorative and it
 * never mirrors in RTL. The blocks were in the solution section before.
 */
export function WhySection() {
  const t = useTranslations("solution");

  // On the band a format name is a plain white link, because the blue link
  // color does not show on blue.
  const link = (href: string) => {
    const Tag = (chunks: React.ReactNode) => (
      <a href={href} className={onBand}>
        {chunks}
      </a>
    );
    return Tag;
  };

  return (
    <section
      id="why"
      className="relative isolate overflow-hidden border-t-4 border-p-line bg-p-primary px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] text-p-on-primary"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BAND_IMAGE}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover mix-blend-multiply"
      />
      <div className="mx-auto max-w-[1240px]">
        <h2 className="text-section font-extrabold tracking-[-0.03em] rtl:tracking-normal leading-[1.05] rtl:leading-[1.25] text-p-on-primary">
          {t("blocksTitle")}
        </h2>
        <div className="mt-[clamp(32px,4vw,56px)] grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-3">
          {BLOCKS.map((key) => (
            <div key={key} className="border-t border-p-on-primary pt-5">
              <h3 className="text-card-title font-bold text-p-on-primary">
                {t(`blocks.${key}.title`)}
              </h3>
              <p className="mt-3 text-body text-p-on-primary">
                {t.rich(`blocks.${key}.body`, {
                  geoparquet: link(FORMAT_LINKS.geoParquet),
                  pmtiles: link(FORMAT_LINKS.pmtiles),
                  cog: link(FORMAT_LINKS.cog),
                  stac: link(FORMAT_LINKS.stac),
                  m: monoChunk,
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
