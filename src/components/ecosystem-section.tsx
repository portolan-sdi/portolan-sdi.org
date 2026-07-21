import { useTranslations } from "next-intl";
import { DirArrow, Ltr } from "./ui";

// The Portolan projects — and only these. Interoperable tools (query engines,
// desktop GIS, libraries, STAC tooling) are NOT part of Portolan and live in
// the How-it-works section. Each card states the project name, what it is, its
// license, and links to the repo. Names and SPDX license ids are proper
// identifiers and stay Latin in every locale; the one-line role is translated
// (ecosystem.projects.<slug>). Licenses vary — some projects may be commercial.
const projects = [
  { slug: "spec", name: "portolan-spec", license: "Apache-2.0", href: "https://github.com/portolan-sdi/portolan-spec" },
  { slug: "reis", name: "reis", license: "Apache-2.0", href: "https://github.com/portolan-sdi/reis" },
  { slug: "cli", name: "portolan-cli", license: "Apache-2.0", href: "https://github.com/portolan-sdi/portolan-cli" },
  { slug: "registry", name: "portolan-registry", license: "Apache-2.0", href: "https://github.com/portolan-sdi/portolan-registry" },
  { slug: "browser", name: "portolan-browser", license: "ISC", href: "https://github.com/portolan-sdi/portolan-browser" },
  { slug: "skills", name: "portolan-skills", license: null, href: "https://github.com/portolan-sdi/portolan-skills" },
] as const;

export function EcosystemSection() {
  const t = useTranslations("ecosystem");

  return (
    <section
      id="ecosystem"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        <p className="font-mono text-eyebrow text-p-ink-3 tracking-[0.04em] mb-[clamp(2.5rem,5vw,4rem)]">
          {t("eyebrow")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <a
              key={project.slug}
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ec-lift group flex flex-col gap-3 border border-p-line bg-p-paper p-5 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-1 hover:border-p-primary hover:bg-[color-mix(in_srgb,var(--p-primary)_6%,var(--p-paper))]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-body text-p-primary">
                  <Ltr>{project.name}</Ltr>
                </span>
                <span className="text-p-ink-3 transition-colors group-hover:text-p-primary">
                  <DirArrow kind="external" />
                </span>
              </div>
              <p className="text-body text-p-ink-2 leading-snug flex-1">
                {t(`projects.${project.slug}`)}
              </p>
              {project.license && (
                <span className="font-mono text-micro text-p-ink-3">
                  <Ltr>{project.license}</Ltr>
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
