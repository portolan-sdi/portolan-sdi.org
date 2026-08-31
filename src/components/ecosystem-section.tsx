"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { DirArrow, Ltr, monoChunk } from "./ui";
import {
  ECOSYSTEM_PAGE_SIZE,
  ECOSYSTEM_SUBMIT_HREF,
  ECOSYSTEM_TIERS,
  entriesInFilter,
  type EcosystemFilter,
  type EcosystemTier,
} from "@/lib/ecosystem";

// The Portolan projects — and only these. Interoperable tools (query engines,
// desktop GIS, libraries) are NOT part of Portolan and live in How-it-works.
// Each card: a small symbolic icon, the project name, what it is, its license,
// and a link to the repo. Names and SPDX license ids stay Latin in every
// locale; the one-line role is translated (ecosystem.projects.<slug>).
// Entries live in `src/lib/ecosystem.ts`, so this file owns presentation only.
//
// Three tiers: `core` = first-party Portolan project (filled blue marker);
// `community` = third-party open tool, the still-empty tier that the submit
// link invites (hollow marker); `commercial` = a product a company sells on
// the open core (filled ink marker). Commercial entries name no license and
// link to the vendor. CARTO SDI links to carto.com until its own page exists.
//
// The list grows in three directions at once, so the section filters and
// paginates rather than printing every entry. The filter row absorbed the old
// legend: each tier chip carries its own marker, so the swatch that decodes
// the cards and the control that isolates them are now the same object.
// A tier with no entries stays clickable and explains itself, because the
// empty community tier is an invitation, not a defect.
//
// The grid stays uniform. Varying the card widths was tried and reverted:
// every description is one short sentence, so a double-width cell left a band
// of empty paper and stranded the status marker at the far edge. Sibling
// projects are a list, and a list reads as one. The ragged-anatomy rule in
// AGENTS.md targets decorative sameness on unrelated content, not an index.

// Marker per tier. Core and commercial are both filled so they read as
// "maintained products"; the ink fill separates the paid tier without
// adding a color the palette does not have.
const tierMarker: Record<EcosystemTier, string> = {
  core: "bg-p-primary",
  community: "border border-p-primary",
  commercial: "bg-p-ink",
};

// Tiny symbolic marks — spec = document, rashid = check (validator), cli =
// terminal prompt, registry = index rows, browser = window, skills = spark,
// cartosdi = layered stack (an infrastructure on top of the standard).
function ProjectIcon({ slug }: { slug: string }) {
  const p =
    slug === "cartosdi" ? (
      <>
        <path d="M12 3l8 4.5-8 4.5-8-4.5z" />
        <path d="M4 12l8 4.5 8-4.5" />
        <path d="M4 16.5L12 21l8-4.5" />
      </>
    ) : slug === "spec" ? (
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

const FILTERS: readonly EcosystemFilter[] = ["all", ...ECOSYSTEM_TIERS];

export function EcosystemSection() {
  const t = useTranslations("ecosystem");
  const [filter, setFilter] = useState<EcosystemFilter>("all");
  const [page, setPage] = useState(1);

  const matches = useMemo(() => entriesInFilter(filter), [filter]);
  const pageCount = Math.max(1, Math.ceil(matches.length / ECOSYSTEM_PAGE_SIZE));
  // Clamp rather than reset in an effect: a filter change already sends the
  // reader back to page 1, and clamping keeps the render correct if the entry
  // list ever shrinks under a page number the state still holds.
  const current = Math.min(page, pageCount);
  const visible = matches.slice(
    (current - 1) * ECOSYSTEM_PAGE_SIZE,
    current * ECOSYSTEM_PAGE_SIZE,
  );

  return (
    <section
      id="ecosystem"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* No eyebrow: the title is the section label, so a kicker would
            repeat it. The rail still reads `ecosystem.eyebrow` for its own
            list. */}
        <div className="mb-[clamp(2rem,4vw,3rem)]">
          <h2 className="text-section font-extrabold tracking-[-0.03em] leading-[1.05]">
            {t("title")}
          </h2>
          {/* The intro runs the full container width. A `ch` cap wrapped it
              mid-page, which read as a broken column beside the full-width
              card grid below. */}
          <p className="mt-5 text-lead leading-relaxed text-p-ink-2">
            {t("intro")}
          </p>
        </div>

        {/* Filter row and legend in one object. Each tier chip prints the
            marker its cards carry, so the reader decodes the grid and
            narrows it with the same control. Chips are square and flat, and
            the active one takes the ghost-button bottom rule. */}
        <div
          role="group"
          aria-label={t("filterLabel")}
          className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-p-line pb-3 font-mono text-eyebrow"
        >
          {FILTERS.map((key) => {
            const active = key === filter;
            const count = entriesInFilter(key).length;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(key);
                  setPage(1);
                }}
                // `min-h-[24px]` and the vertical padding carry the WCAG 2.2
                // target-size floor. The 11px mono label alone measured 15px
                // tall, which axe reports as a serious violation.
                className={`inline-flex min-h-[24px] items-center gap-1.5 border-b-2 pt-1 pb-1.5 transition-colors ${
                  active
                    ? "border-p-primary text-p-ink"
                    : "border-transparent text-p-ink-3 hover:text-p-ink"
                }`}
              >
                {key !== "all" && (
                  <span
                    aria-hidden
                    className={`inline-block w-[7px] h-[7px] shrink-0 ${tierMarker[key]}`}
                  />
                )}
                {t(`filters.${key}`)}
                <span className="text-p-ink-3">{count}</span>
              </button>
            );
          })}
        </div>

        {/* `auto-rows-fr` keeps every row the same height. Without it each
            row sizes to its own tallest card, so the row holding `rashid`
            (whose description runs to three lines) stood 14px taller than
            the row below it. */}
        <div aria-live="polite" className="mt-5">
          {visible.length === 0 ? (
            // An empty tier says what belongs there. It carries no submit
            // link of its own: the row below already holds that link, and
            // printing it twice put the same call to action on screen twice.
            <p className="border border-p-line bg-p-paper p-5 text-body text-p-ink-2">
              {t("empty")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-5">
              {visible.map((project) => (
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
                    {/* Square status marker, one state per tier. The filter
                        row above prints the same marker beside each tier
                        name, which is where the reader decodes it. */}
                    <span
                      className={`inline-block w-[7px] h-[7px] shrink-0 ${tierMarker[project.tier]}`}
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
                    {project.tier === "commercial" && <span>{t("proprietary")}</span>}
                    <span className="ms-auto text-p-primary opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 rtl:translate-x-1 rtl:group-hover:translate-x-0">
                      <DirArrow kind="external" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Pager on the start edge, the invitation to grow on the end edge.
            The pager prints only when the current filter overflows one page,
            so a short list carries no dead control. */}
        <div className="mt-[18px] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-eyebrow">
          {pageCount > 1 ? (
            <nav aria-label={t("pagination.label")} className="inline-flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPage(current - 1)}
                disabled={current === 1}
                aria-label={t("pagination.previous")}
                className="inline-flex min-h-[24px] min-w-[24px] items-center justify-center text-p-ink-3 transition-colors hover:text-p-ink disabled:opacity-40 disabled:hover:text-p-ink-3"
              >
                <span aria-hidden className="inline-block rtl:-scale-x-100">
                  ‹
                </span>
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  aria-label={t("pagination.page", { page: n })}
                  aria-current={n === current ? "page" : undefined}
                  className={`inline-flex min-h-[24px] min-w-[24px] items-center justify-center transition-colors ${
                    n === current
                      ? "text-p-ink underline underline-offset-4"
                      : "text-p-ink-3 hover:text-p-ink"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(current + 1)}
                disabled={current === pageCount}
                aria-label={t("pagination.next")}
                className="inline-flex min-h-[24px] min-w-[24px] items-center justify-center text-p-ink-3 transition-colors hover:text-p-ink disabled:opacity-40 disabled:hover:text-p-ink-3"
              >
                <span aria-hidden className="inline-block rtl:-scale-x-100">
                  ›
                </span>
              </button>
            </nav>
          ) : (
            <span />
          )}
          <a
            href={ECOSYSTEM_SUBMIT_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[24px] items-center gap-1 text-p-primary transition-colors hover:text-p-ink hover:underline"
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
        {/* The split waits for `lg`. At `md` the pinned rail already takes
            264px, which leaves the body column 59px and pushes the text past
            the viewport edge. The section stacks instead until there is room
            for both columns. */}
        <div className="mt-[clamp(2.5rem,5vw,4rem)] grid grid-cols-1 gap-2 border-t border-p-line pt-7 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-12">
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
