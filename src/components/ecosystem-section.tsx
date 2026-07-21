import { useTranslations } from "next-intl";
import { DirArrow, Ltr } from "./ui";

// The Portolan projects — and only these. Interoperable tools (query engines,
// desktop GIS, libraries) are NOT part of Portolan and live in How-it-works.
// Each card: a small symbolic icon, the project name, what it is, its license,
// and a link to the repo. Names and SPDX license ids stay Latin in every
// locale; the one-line role is translated (ecosystem.projects.<slug>).
const projects = [
  { slug: "spec", name: "portolan-spec", license: "Apache-2.0", href: "https://github.com/portolan-sdi/portolan-spec" },
  { slug: "reis", name: "reis", license: "Apache-2.0", href: "https://github.com/portolan-sdi/reis" },
  { slug: "cli", name: "portolan-cli", license: "Apache-2.0", href: "https://github.com/portolan-sdi/portolan-cli" },
  { slug: "registry", name: "portolan-registry", license: "Apache-2.0", href: "https://github.com/portolan-sdi/portolan-registry" },
  { slug: "browser", name: "portolan-browser", license: "ISC", href: "https://github.com/portolan-sdi/portolan-browser" },
  { slug: "skills", name: "portolan-skills", license: null, href: "https://github.com/portolan-sdi/portolan-skills" },
] as const;

// Tiny symbolic marks — spec = document, reis = check (validator), cli =
// terminal prompt, registry = index rows, browser = window, skills = spark.
function ProjectIcon({ slug }: { slug: string }) {
  const p =
    slug === "spec" ? (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4" />
        <path d="M9 13h6M9 16.5h6" />
      </>
    ) : slug === "reis" ? (
      <polyline points="4 13 9 18 20 6" />
    ) : slug === "cli" ? (
      <>
        <polyline points="5 8 9 12 5 16" />
        <line x1="12" y1="16" x2="18" y2="16" />
      </>
    ) : slug === "registry" ? (
      <>
        <line x1="5" y1="7" x2="19" y2="7" />
        <line x1="5" y1="12" x2="19" y2="12" />
        <line x1="5" y1="17" x2="13" y2="17" />
      </>
    ) : slug === "browser" ? (
      <>
        <rect x="4" y="5" width="16" height="14" />
        <line x1="4" y1="9" x2="20" y2="9" />
      </>
    ) : (
      <path d="M12 4l1.7 5.1L19 11l-5.3 1.9L12 18l-1.7-5.1L5 11l5.3-1.9z" />
    );
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {p}
    </svg>
  );
}

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
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-9 h-9 shrink-0 border border-p-line bg-[color-mix(in_srgb,var(--p-primary)_8%,var(--p-paper))] text-p-primary transition-colors group-hover:border-p-primary">
                  <ProjectIcon slug={project.slug} />
                </span>
                <span className="font-mono text-body text-p-primary">
                  <Ltr>{project.name}</Ltr>
                </span>
                <span className="ms-auto text-p-ink-3 transition-colors group-hover:text-p-primary">
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
