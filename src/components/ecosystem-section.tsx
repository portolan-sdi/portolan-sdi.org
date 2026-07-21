import { useTranslations } from "next-intl";
import { DirArrow, Ltr } from "./ui";

// The Portolan projects — and only these. Interoperable tools (query engines,
// desktop GIS, libraries) are NOT part of Portolan and live in How-it-works.
// Each card: a small symbolic icon, the project name, what it is, its license,
// and a link to the repo. Names and SPDX license ids stay Latin in every
// locale; the one-line role is translated (ecosystem.projects.<slug>).
// `core` = first-party Portolan project (filled marker). The hollow
// "community" state is the open, still-empty tier that `submitHref` invites —
// the two together are what "Built to grow." means. All six are core today.
const projects = [
  { slug: "spec", name: "portolan-spec", license: "Apache-2.0", core: true, href: "https://github.com/portolan-sdi/portolan-spec" },
  { slug: "reis", name: "reis", license: "Apache-2.0", core: true, href: "https://github.com/portolan-sdi/reis" },
  { slug: "cli", name: "portolan-cli", license: "Apache-2.0", core: true, href: "https://github.com/portolan-sdi/portolan-cli" },
  { slug: "registry", name: "portolan-registry", license: "Apache-2.0", core: true, href: "https://github.com/portolan-sdi/portolan-registry" },
  { slug: "browser", name: "portolan-browser", license: "ISC", core: true, href: "https://github.com/portolan-sdi/portolan-browser" },
  { slug: "skills", name: "portolan-skills", license: null, core: true, href: "https://github.com/portolan-sdi/portolan-skills" },
] as const;

// TODO(nlebovits): confirm the real destination for "submit a tool". The org
// landing is a real, non-dead target for now — swap for a dedicated
// contribute/awesome-list page or issue template once one exists.
const submitHref = "https://github.com/portolan-sdi";

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
        {/* Header: eyebrow + title on the start side, a live count readout on
            the end side (mirrors the design's space-between header row). */}
        <div className="flex items-end justify-between gap-6 mb-[clamp(2.5rem,5vw,4rem)]">
          <div>
            <p className="font-mono text-eyebrow text-p-ink-3 tracking-[0.04em]">
              {t("eyebrow")}
            </p>
            <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05] mt-3">
              {t("title")}
            </h2>
          </div>
          <p className="font-mono text-eyebrow text-p-ink-3 whitespace-nowrap">
            {t("count", { count: projects.length })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project, i) => (
            <a
              key={project.slug}
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ec-card group flex flex-col gap-2.5 border border-p-line bg-p-paper p-[18px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-9 h-9 shrink-0 border border-p-line bg-[color-mix(in_srgb,var(--p-primary)_8%,var(--p-paper))] text-p-primary transition-colors group-hover:border-p-primary">
                  <ProjectIcon slug={project.slug} />
                </span>
                <span className="font-mono text-body text-p-primary">
                  <Ltr>{project.name}</Ltr>
                </span>
                {/* Square status marker with a staggered pulse ring — the
                    editorial, square-cornered take on the design's blip dot.
                    Filled = core, hollow = community (see the legend below). */}
                <span className="ms-auto relative inline-block w-[7px] h-[7px] shrink-0">
                  <span
                    className={`absolute inset-0 ${
                      project.core ? "bg-p-primary" : "border border-p-primary"
                    }`}
                  />
                  <span
                    className="ec-ping absolute inset-0 border border-p-primary"
                    style={{ animationDelay: `${(i * 0.35).toFixed(2)}s` }}
                  />
                </span>
              </div>
              <p className="text-body text-p-ink-2 leading-snug flex-1">
                {t(`projects.${project.slug}`)}
              </p>
              <div className="mt-auto flex items-center gap-3 font-mono text-micro text-p-ink-3">
                {project.license && (
                  <span>
                    <Ltr>{project.license}</Ltr>
                  </span>
                )}
                <span className="ms-auto text-p-primary opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 rtl:translate-x-1 rtl:group-hover:translate-x-0">
                  <DirArrow kind="external" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Legend for the two marker states + the open invitation to grow. */}
        <div className="mt-[18px] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-eyebrow">
          <span className="inline-flex items-center gap-2 text-p-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-[7px] h-[7px] bg-p-primary" />
              {t("legendCore")}
            </span>
            <span aria-hidden className="text-p-ink-3">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-[7px] h-[7px] border border-p-primary" />
              {t("legendCommunity")}
            </span>
          </span>
          <a
            href={submitHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-p-primary transition-colors hover:text-p-ink hover:underline"
          >
            {t("submit")} <DirArrow kind="external" />
          </a>
        </div>
      </div>
    </section>
  );
}
