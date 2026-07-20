"use client";

import { useTranslations } from "next-intl";
import { Ltr } from "./ui";

// Credibility strip directly under the hero. Placeholder wordmarks until real
// logo assets land (single-color SVGs per the visual system). Org list is a
// draft pending confirmation with each org.
const orgs = [
  "CARTO",
  "Radiant Earth",
  "Planet",
  "WRI",
  "Ayuntamiento de Madrid",
] as const;

export function InvolvedSection() {
  const t = useTranslations("involved");

  return (
    <section
      id="involved"
      className="px-[var(--p-pad-section-x)] py-[clamp(2rem,4vw,3.5rem)]"
    >
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row md:items-baseline gap-x-12 gap-y-5">
        <span className="font-mono text-eyebrow text-p-ink-3 tracking-[0.04em] shrink-0">
          {t("label")}
        </span>
        <div className="flex flex-wrap items-baseline gap-x-[clamp(1.75rem,4vw,3.5rem)] gap-y-4">
          {orgs.map((org) => (
            <span
              key={org}
              className="text-card-title font-bold tracking-[-0.02em] text-p-ink-3"
            >
              <Ltr>{org}</Ltr>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
