"use client";

import { useTranslations } from "next-intl";
import { DirArrow, Ltr, SectionHead, monoChunk } from "./ui";

// The Portolan projects — and only these. Interoperable tools (query engines,
// desktop GIS, libraries, STAC tooling) are NOT part of Portolan and live in
// the How-it-works section instead. Project names are proper nouns and stay
// Latin in every locale; the one-line role on the card back is translated
// (ecosystem.projects.<slug>). Cards flip name -> role on hover/focus.
const projects = [
  { slug: "spec", name: "portolan-spec", href: "https://github.com/portolan-sdi/portolan-spec" },
  { slug: "reis", name: "reis", href: "https://github.com/portolan-sdi/reis" },
  { slug: "cli", name: "portolan-cli", href: "https://github.com/portolan-sdi/portolan-cli" },
  { slug: "registry", name: "portolan-registry", href: "https://github.com/portolan-sdi/portolan-registry" },
  { slug: "browser", name: "portolan-browser", href: "https://github.com/portolan-sdi/portolan-browser" },
  { slug: "skills", name: "portolan-skills", href: "https://github.com/portolan-sdi/portolan-skills" },
] as const;

export function EcosystemSection() {
  const t = useTranslations("ecosystem");

  return (
    <section
      id="ecosystem"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        <SectionHead
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t.rich("subtitle", { m: monoChunk })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <a
              key={project.slug}
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ec-card block h-[132px]"
            >
              <div className="ec-card__inner">
                <div className="ec-card__face ec-card__front flex items-center justify-center border border-p-line bg-p-paper p-4">
                  <span className="font-mono text-body text-p-primary">
                    <Ltr>{project.name}</Ltr>
                  </span>
                </div>
                <div className="ec-card__back flex flex-col justify-between border border-p-ink bg-p-ink text-p-bg p-4">
                  <p className="text-body leading-snug">
                    {t(`projects.${project.slug}`)}
                  </p>
                  <span className="font-mono text-micro opacity-80">
                    <Ltr>{project.name}</Ltr> <DirArrow kind="external" />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
