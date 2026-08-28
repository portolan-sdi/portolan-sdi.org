import { useTranslations } from "next-intl";
import { DirArrow, Ltr, monoChunk } from "./ui";

// The Portolan projects — and only these. Interoperable tools (query engines,
// desktop GIS, libraries) are NOT part of Portolan and live in How-it-works.
// Each card: a small symbolic icon, the project name, what it is, its license,
// and a link to the repo. Names and SPDX license ids stay Latin in every
// locale; the one-line role is translated (ecosystem.projects.<slug>).
// `core` = first-party Portolan project (filled marker). The hollow
// "community" state is the open, still-empty tier that `submitHref` invites.
// All six are core today.
// The grid stays uniform. Varying the card widths was tried and reverted:
// every description is one short sentence, so a double-width cell left a band
// of empty paper and stranded the status marker at the far edge. Six sibling
// projects are a list, and a list reads as one. The ragged-anatomy rule in
// AGENTS.md targets decorative sameness on unrelated content, not an index.
const projects = [
  { slug: "spec", name: "portolan-spec", license: "Apache-2.0", core: true, href: "https://github.com/portolan-sdi/portolan-spec" },
  { slug: "rashid", name: "rashid", license: "Apache-2.0", core: true, href: "https://github.com/portolan-sdi/rashid" },
  { slug: "cli", name: "portolan-cli", license: "Apache-2.0", core: true, href: "https://github.com/portolan-sdi/portolan-cli" },
  { slug: "registry", name: "portolan-registry", license: "Apache-2.0", core: true, href: "https://github.com/portolan-sdi/portolan-registry" },
  { slug: "browser", name: "portolan-browser", license: "ISC", core: true, href: "https://github.com/portolan-sdi/portolan-browser" },
  { slug: "skills", name: "portolan-skills", license: null, core: true, href: "https://github.com/portolan-sdi/portolan-skills" },
] as const;

// TODO(nlebovits): confirm the real destination for "submit a tool". The org
// landing is a real, non-dead target for now — swap for a dedicated
// contribute/awesome-list page or issue template once one exists.
const submitHref = "https://github.com/portolan-sdi";

// Tiny symbolic marks — spec = document, rashid = check (validator), cli =
// terminal prompt, registry = index rows, browser = window, skills = spark.
function ProjectIcon({ slug }: { slug: string }) {
  const p =
    slug === "spec" ? (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4" />
        <path d="M9 13h6M9 16.5h6" />
      </>
    ) : slug === "rashid" ? (
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
        {/* Header: title + intro on the start side, a live count readout on
            the end side (mirrors the design's space-between header row). No
            eyebrow: the title is the section label, so a kicker would repeat
            it. The rail still reads `ecosystem.eyebrow` for its own list. */}
        {/* The count moved down to the legend row. Beside a 46px headline an
            11px grey line read as debris, and it was the only section header
            on the page carrying a right-hand element. */}
        <div className="mb-[clamp(2.5rem,5vw,4rem)]">
          <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05]">
            {t("title")}
          </h2>
          <p className="mt-5 text-lead leading-relaxed text-p-ink-2 max-w-[54ch]">
            {t("intro")}
          </p>
        </div>

        {/* `auto-rows-fr` keeps every row the same height. Without it each
            row sizes to its own tallest card, so the row holding `rashid`
            (whose description runs to three lines) stood 14px taller than
            the row below it. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-5">
          {projects.map((project) => (
            <a
              key={project.slug}
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ec-card group flex flex-col gap-2.5 border border-p-line bg-p-paper p-5"
            >
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-9 h-9 shrink-0 border border-p-line bg-[color-mix(in_srgb,var(--p-primary)_8%,var(--p-paper))] text-p-primary transition-colors group-hover:border-p-primary">
                  <ProjectIcon slug={project.slug} />
                </span>
                <span className="font-mono text-body text-p-primary">
                  <Ltr>{project.name}</Ltr>
                </span>
                {/* Square status marker. Filled = core, hollow = community
                    (see the legend below). The pulse ring is gone: every
                    project is core today, so six synchronized rings marked no
                    distinction and drew the eye off the names. It returns
                    when a community entry gives it something to contrast. */}
                <span
                  className={`inline-block w-[7px] h-[7px] shrink-0 ${
                    project.core ? "bg-p-primary" : "border border-p-primary"
                  }`}
                />
              </div>
              <p className="text-body text-p-ink-2 leading-snug flex-1">
                {t(`projects.${project.slug}`)}
              </p>
              <div className="mt-auto flex items-center gap-3 font-mono text-small text-p-ink-3">
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
            <span>{t("count", { count: projects.length })}</span>
            <span aria-hidden className="text-p-ink-3">
              ·
            </span>
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

        {/* The commercial layer. The grid above is the open core; this row
            names what the standard deliberately leaves to vendors, and the
            first vendor building it. Anatomy mirrors the "Why Portolan"
            ledger rows (narrow title column, wide body), so the page does
            not gain a third card grid. The lock-in sentence restates the
            FAQ answer: the catalog outlives any product that manages it. */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 gap-2 border-t border-p-line pt-7 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-12">
          <h3 className="text-card-title font-bold tracking-[-0.02em]">
            {t("commercial.title")}
          </h3>
          <p className="text-body text-p-ink-2 leading-relaxed text-pretty max-w-[72ch]">
            {t.rich("commercial.body", {
              m: monoChunk,
              carto: (chunks) => (
                <a
                  href="https://carto.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
