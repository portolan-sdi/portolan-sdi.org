"use client";

import { useTranslations } from "next-intl";
import { Ltr } from "./ui";

// Credibility strip directly under the hero. Logos render as flat monochrome
// grey via CSS mask-image (see .logo-mono) so the whole row is one colour.
// `aspect` = intrinsic width/height; `h` sets the on-screen height in px and
// width follows. Radiant Earth has no wordmark asset yet, so it renders as a
// grey text wordmark until one lands. Org list is a draft pending confirmation.
const orgs = [
  { name: "CARTO", file: "carto.png", h: 22, aspect: 2.554 },
  { name: "Planet", file: "planet.svg", h: 26, aspect: 2.047 },
  { name: "Radiant Earth", text: true },
  { name: "Source Cooperative", file: "source-coop.svg", h: 19, aspect: 3.284 },
  { name: "WRI", file: "wri.svg", h: 30, aspect: 2.85 },
] as const;

export function InvolvedSection() {
  const t = useTranslations("involved");

  return (
    <section
      id="involved"
      className="px-[var(--p-pad-section-x)] py-[clamp(2rem,4vw,3.5rem)]"
    >
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row md:items-center gap-x-12 gap-y-5">
        <span className="font-mono text-eyebrow text-p-ink-3 tracking-[0.04em] shrink-0">
          {t("label")}
        </span>
        <div className="flex flex-wrap items-center gap-x-[clamp(1.75rem,4vw,3.5rem)] gap-y-5">
          {orgs.map((org) =>
            "text" in org ? (
              <span
                key={org.name}
                className="text-body-lg font-bold tracking-[-0.02em] text-p-ink-3"
              >
                <Ltr>{org.name}</Ltr>
              </span>
            ) : (
              <span
                key={org.name}
                role="img"
                aria-label={org.name}
                className="logo-mono shrink-0"
                style={{
                  height: `${org.h}px`,
                  width: `${Math.round(org.h * org.aspect)}px`,
                  WebkitMaskImage: `url(/logos/${org.file})`,
                  maskImage: `url(/logos/${org.file})`,
                }}
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
