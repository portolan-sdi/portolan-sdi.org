"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { COMMUNITY_LINKS } from "@/lib/site";
import { LogoLink, type Org } from "../involved-section";

/**
 * The organizations that contribute, with Radiant Earth first. `aspect` is
 * the intrinsic width over height, and `h` is the height in px. Each file
 * is a one-color mask, so each logo shows in the same gray.
 */
const CONTRIBUTORS: readonly Org[] = [
  { name: "Radiant Earth", href: "https://radiant.earth/", file: "radiant-earth.svg", h: 15, aspect: 7.24 },
  { name: "CARTO", href: "https://carto.com/", file: "carto.png", h: 26, aspect: 2.554 },
  { name: "Planet", href: "https://www.planet.com/", file: "planet.svg", h: 27, aspect: 2.047 },
  { name: "Development Seed", href: "https://developmentseed.org/", file: "development-seed.png", h: 20, aspect: 5.854 },
  { name: "Taylor Geospatial", href: "https://taylorgeospatial.org/", file: "taylor-geospatial.png", h: 26, aspect: 4.018 },
  { name: "moreGeo", href: "https://www.moregeo.it/", file: "moregeo.png", h: 32, aspect: 1.313 },
  { name: "Walkthru Earth", href: "https://walkthru.earth/", file: "logo-wte.svg", h: 29, aspect: 4.5 },
  { name: "Lincoln Institute of Land Policy", href: "https://www.lincolninst.edu/", file: "lincoln-institute.png", h: 27, aspect: 4.36 },
];

/**
 * "About", the last homepage section before the footer. The section is
 * centered. The heading is two sentences, one on each line from `lg`. The
 * words "Join us on Slack" in the heading are the link to the Slack
 * channel, and that link is the one call to action of the site. The section
 * has no button. The logos show who contributes, in one quiet row.
 */
export function AboutSection() {
  const t = useTranslations("about");

  return (
    <section
      id="about"
      className="border-t-4 border-p-line px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]"
    >
      <div className="mx-auto max-w-[1240px] text-center">
        {/* The third homepage eyebrow, by the owner's choice. */}
        <p className="font-mono rtl:font-sans! text-eyebrow text-p-ink-3">
          {t("title")}
        </p>
        <h2 className="mt-5 text-section font-bold leading-[1.15] rtl:leading-[1.35] tracking-[-0.03em] rtl:tracking-normal text-p-ink">
          {t.rich("lead", {
            line: (chunks: ReactNode) => (
              <span className="lg:block">{chunks} </span>
            ),
            slack: (chunks: ReactNode) => (
              <a
                href={COMMUNITY_LINKS.slack}
                target="_blank"
                rel="noopener noreferrer"
                data-track="about-slack"
                className="text-p-primary underline decoration-[0.07em] underline-offset-[0.14em] transition-colors hover:text-p-primary-ink"
              >
                {chunks}
              </a>
            ),
          })}
        </h2>

        {/* The label says what the logos mean. The logos never mirror.
            Each one links to its organization. */}
        <p
          id="about-logos"
          className="mt-[clamp(56px,7vw,104px)] font-mono rtl:font-sans! text-eyebrow text-p-ink-3"
        >
          {t("logosLabel")}
        </p>
        <ul
          aria-labelledby="about-logos"
          className="m-0 mt-7 flex list-none flex-wrap items-center justify-center gap-x-[clamp(28px,3.6vw,52px)] gap-y-7 p-0"
        >
          {CONTRIBUTORS.map((org) => (
            <li key={org.name} className="flex">
              <LogoLink org={org} clone={false} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
