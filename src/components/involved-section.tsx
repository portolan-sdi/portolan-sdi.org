"use client";

import { useTranslations } from "next-intl";
import { Ltr } from "./ui";

// Placeholder wordmarks until real logo assets land (single-color SVGs per the
// visual system). Org list is a draft pending confirmation with each org.
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
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        <div className="font-mono text-eyebrow text-p-ink-3 tracking-[0.04em]">
          {t("eyebrow")}
        </div>
        <p className="text-body text-p-ink-2 mt-3">{t("label")}</p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-[clamp(2rem,5vw,4rem)] gap-y-5">
          {orgs.map((org) => (
            <span
              key={org}
              className="text-card-title-lg font-bold tracking-[-0.02em] text-p-ink-3"
            >
              <Ltr>{org}</Ltr>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
