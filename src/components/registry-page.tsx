"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { AWAY_ITEMS, SiteShell } from "./site-rail";
import { DirArrow, Ltr, SectionHead } from "./ui";
import { CatalogCard } from "./registry/catalog-card";
import type { Catalog, CatalogKind } from "@/lib/catalogs";
import { formatDate, getCoverageTier } from "@/lib/catalogs";

// The registry, on its own route.
//
// The homepage keeps the coverage map, which shows where the data sits, and
// links here. This page holds the map of catalog extents, the card grid, the
// filters, and the submission form.
//
// The rail keeps the site index and highlights its own registry entry.

type SubmitState = "idle" | "submitting" | "success" | "error";

// Two rows of three on a wide screen. Small enough that the control is real
// at the registry's current size rather than appearing only after it doubles.
const CARDS_PER_PAGE = 6;

// The global block sits under the map and stays one row on a wide screen.
const GLOBAL_PER_PAGE = 3;

// Page control shared by the card grid and the global block. Mirrors the arrows
// on the talks row rather than introducing a second pagination idiom.
function Pager({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
}) {
  const t = useTranslations("registry.pagination");
  if (pageCount <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-end gap-4">
      <span className="font-mono text-small text-p-ink-3">
        {t("status", { page: String(page + 1), total: String(pageCount) })}
      </span>
      <div className="flex border border-p-line">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 0}
          aria-label={t("prev")}
          className="px-3 py-1.5 text-p-ink transition-colors hover:bg-p-bg-soft disabled:text-p-ink-3 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
        >
          {/* U+2039 is bidi-mirrored, so the engine flips it on an RTL page.
              The old rtl: swap mirrored it a second time, which made prev and
              next render as the same glyph in Arabic. */}
          <span aria-hidden="true">&#8249;</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label={t("next")}
          className="border-s border-p-line px-3 py-1.5 text-p-ink transition-colors hover:bg-p-bg-soft disabled:text-p-ink-3 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
        >
          <span aria-hidden="true">&#8250;</span>
        </button>
      </div>
    </div>
  );
}

// Placeholder shown while the deck.gl/maplibre chunk loads on first map view.
function MapSkeleton() {
  const t = useTranslations("registry");
  return (
    <div className="h-[440px] md:h-[520px] border border-p-line bg-p-bg-soft animate-pulse flex items-center justify-center">
      <span className="text-small text-p-ink-3 font-mono">{t("map.loading")}</span>
    </div>
  );
}

// registry-page is already a Client Component, so ssr:false is legal here. The
// chunk only loads the first time the map view renders.
const CatalogMap = dynamic(() => import("./registry/catalog-map"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface RegistryPageProps {
  catalogs?: Catalog[];
}

export function RegistryPage({ catalogs = [] }: RegistryPageProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | CatalogKind>("all");
  const [registryView, setRegistryView] = useState<"cards" | "map">("map");
  const [rawPage, setPage] = useState(0);
  const [rawGlobalPage, setGlobalPage] = useState(0);

  const [submitUrl, setSubmitUrl] = useState("");
  const [submitEmail, setSubmitEmail] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitPrUrl, setSubmitPrUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isValidSubmitUrl = submitUrl.trim().endsWith("catalog.json");
  // Same shape the API enforces. The registry writes to this address when a
  // catalog stops validating, so an entry without one is rejected at its gate.
  const isValidSubmitEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitEmail.trim());
  const canSubmit = isValidSubmitUrl && isValidSubmitEmail;

  // The registry does not export whether a catalog is the official copy or a
  // mirror yet, so every entry reports null and this set stays empty. The
  // control appears on its own once the export carries the field.
  const availableKinds = useMemo(() => {
    return Array.from(
      new Set(catalogs.map((c) => c.kind).filter((k): k is CatalogKind => k !== null))
    );
  }, [catalogs]);

  const filteredCatalogs = useMemo(() => {
    return catalogs.filter((catalog) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === "" ||
        catalog.title.toLowerCase().includes(query) ||
        catalog.id.toLowerCase().includes(query) ||
        Object.keys(catalog.licenses).some((id) => id.toLowerCase().includes(query));

      const matchesKind = kindFilter === "all" || catalog.kind === kindFilter;

      return matchesSearch && matchesKind;
    });
  }, [catalogs, searchQuery, kindFilter]);

  // A catalog claiming most of the globe would cover every located one beneath
  // it and drag the initial map fit out to the whole world. Those get their own
  // block under the map, where their titles are readable.
  const { mappableCatalogs, globalCatalogs } = useMemo(() => {
    const mappable: Catalog[] = [];
    const global: Catalog[] = [];
    for (const catalog of filteredCatalogs) {
      (getCoverageTier(catalog.bbox) === "global" ? global : mappable).push(catalog);
    }
    return { mappableCatalogs: mappable, globalCatalogs: global };
  }, [filteredCatalogs]);

  const pageCount = Math.max(1, Math.ceil(filteredCatalogs.length / CARDS_PER_PAGE));
  // Filtering can shrink the list under the current page.
  const page = Math.min(rawPage, pageCount - 1);
  const pagedCatalogs = filteredCatalogs.slice(
    page * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE + CARDS_PER_PAGE
  );

  const globalPageCount = Math.max(1, Math.ceil(globalCatalogs.length / GLOBAL_PER_PAGE));
  const globalPage = Math.min(rawGlobalPage, globalPageCount - 1);
  const pagedGlobalCatalogs = globalCatalogs.slice(
    globalPage * GLOBAL_PER_PAGE,
    globalPage * GLOBAL_PER_PAGE + GLOBAL_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setKindFilter("all");
    setPage(0);
  };

  const hasActiveFilters = searchQuery !== "" || kindFilter !== "all";

  const crawledAt = formatDate(catalogs[0]?.last_crawled ?? null, locale);

  const handleSubmitCatalog = async () => {
    if (!canSubmit || submitState === "submitting") return;

    setSubmitState("submitting");
    setSubmitError(null);

    try {
      const res = await fetch("/api/submit-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: submitUrl.trim(),
          submitterEmail: submitEmail.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("registry.submit.failedError"));
      }

      setSubmitPrUrl(data.pr_url);
      setSubmitState("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("registry.submit.genericError"));
      setSubmitState("error");
    }
  };

  const handleResetSubmit = () => {
    setSubmitUrl("");
    setSubmitEmail("");
    setSubmitState("idle");
    setSubmitPrUrl(null);
    setSubmitError(null);
  };

  return (
    <SiteShell navItems={AWAY_ITEMS} activeId="registry">
      {/* Registry — the living proof, deliberately the last section */}
      {catalogs.length > 0 && (
        <section id="registry" className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]">
          <div className="max-w-[1240px] mx-auto">
            {/* No eyebrow and no subtitle: the title ("Browse N catalogs")
                already names the section. */}
            <SectionHead title={t("registry.title", { count: catalogs.length })} wide />

            {/* Where the listing comes from and when it was last read. */}
            <p className="-mt-[clamp(1.5rem,3vw,2.5rem)] mb-8 flex flex-wrap items-center gap-x-1.5 font-mono text-eyebrow text-p-ink-3">
              <a
                href="https://github.com/portolan-sdi/portolan-registry"
                target="_blank"
                rel="noopener noreferrer"
                className="text-p-primary hover:underline"
              >
                <Ltr>portolan-registry</Ltr> ↗
              </a>
              {crawledAt && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{t("registry.lastChecked", { date: crawledAt })}</span>
                </>
              )}
            </p>

            {/* Filters */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("registry.search.placeholder")}
                  className="flex-1 bg-p-paper border border-p-line px-4 py-2.5 text-body text-p-ink placeholder:text-p-ink-3 focus:outline-none focus:border-p-primary transition-colors"
                />
                {/* Only rendered once the export distinguishes official copies
                    from mirrors. A control with one option filters nothing. */}
                {availableKinds.length > 1 && (
                  <div className="relative">
                    <select
                      value={kindFilter}
                      onChange={(e) => setKindFilter(e.target.value as typeof kindFilter)}
                      className="appearance-none bg-p-paper border border-p-line ps-3 pe-8 py-2.5 text-body text-p-ink focus:outline-none focus:border-p-primary transition-colors cursor-pointer"
                      aria-label={t("registry.filters.kind")}
                    >
                      <option value="all">{t("registry.filters.allKinds")}</option>
                      {availableKinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {t(`registry.kind.${kind}`)}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute end-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-p-ink-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                )}

                {/* Cards | Map view toggle */}
                <div className="flex items-stretch border border-p-line overflow-hidden self-start sm:self-auto sm:ms-auto">
                  {(["cards", "map"] as const).map((view, i) => {
                    const isActive = registryView === view;
                    return (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setRegistryView(view)}
                        aria-pressed={isActive}
                        className={`inline-flex items-center justify-center font-mono text-small px-4 py-2.5 transition-colors ${
                          i > 0 ? "border-s border-p-line" : ""
                        } ${
                          isActive
                            ? "bg-[color-mix(in_oklab,var(--p-primary)_12%,transparent)] text-p-primary-ink"
                            : "bg-p-paper text-p-ink-3 hover:text-p-ink-2"
                        }`}
                      >
                        {t(`registry.view.${view}`)}
                      </button>
                    );
                  })}
                </div>
              </div>


              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-small text-p-ink-3 hover:text-p-ink-2 underline underline-offset-2"
                >
                  {t("registry.search.clearFilters")}
                </button>
              )}
            </div>

            {/* Catalog view: map or grid */}
            {registryView === "map" ? (
              <>
                <CatalogMap catalogs={mappableCatalogs} />
                {globalCatalogs.length > 0 && (
                  <div className="mt-10 border-t border-p-line pt-8">
                    <h3 className="text-feature font-semibold">
                      {t("registry.global.title")}
                    </h3>
                    {/* One row on a wide screen. Three cards in two columns
                        wrap to two rows at md, so that height is reserved
                        instead. */}
                    <div
                      className={`mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${
                        globalPageCount > 1 ? "md:min-h-[540px] lg:min-h-[260px]" : ""
                      }`}
                    >
                      {pagedGlobalCatalogs.map((catalog) => (
                        <CatalogCard key={catalog.id} catalog={catalog} />
                      ))}
                    </div>
                    <Pager
                      page={globalPage}
                      pageCount={globalPageCount}
                      onChange={setGlobalPage}
                    />
                  </div>
                )}
              </>
            ) : filteredCatalogs.length > 0 ? (
              <>
                {/* A short last page must not shrink the grid, or everything
                    below it jumps when you change page. Cards are 260px with a
                    20px gap, so two rows reserve 540 and three reserve 820.
                    Single-column screens are left alone: reserving six rows
                    there would leave a screenful of blank under a short page,
                    and the whole grid is taller than the viewport anyway. */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${
                    pageCount > 1 ? "md:min-h-[820px] lg:min-h-[540px]" : ""
                  }`}
                >
                  {pagedCatalogs.map((catalog) => (
                    <CatalogCard key={catalog.id} catalog={catalog} />
                  ))}
                </div>
                <Pager page={page} pageCount={pageCount} onChange={setPage} />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-body text-p-ink-2">{t("registry.search.noResults")}</p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-3 text-small text-p-primary hover:underline"
                >
                  {t("registry.search.clearFilters")}
                </button>
              </div>
            )}

            {/* Inline Submit */}
            <div className="mt-10 bg-p-paper border border-p-line rounded-[var(--p-r-lg)] p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-card-title font-semibold text-p-ink">{t("registry.cta.title")}</h3>
                  <p className="text-body text-p-ink-2 mt-1">{t("registry.cta.description")}</p>
                </div>
                {submitState === "success" ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-body text-[var(--p-success)]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t("registry.submit.successTitle")}
                    </div>
                    {submitPrUrl && (
                      <a
                        href={submitPrUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-small text-p-primary hover:underline"
                      >
                        {t("registry.submit.viewPr")} <DirArrow />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleResetSubmit}
                      className="text-small text-p-ink-3 hover:text-p-ink-2 underline"
                    >
                      {t("registry.submit.submitAnother")}
                    </button>
                  </div>
                ) : (
                  <div className="md:w-auto w-full">
                    <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 sm:min-w-[260px]">
                      <input
                        type="url"
                        value={submitUrl}
                        onChange={(e) => setSubmitUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmitCatalog()}
                        placeholder="https://...catalog.json"
                        disabled={submitState === "submitting"}
                        className={`w-full bg-p-bg border rounded-[var(--p-r-md)] px-4 py-2.5 text-body text-p-ink placeholder:text-p-ink-3 focus:outline-none transition-colors disabled:opacity-50 ${
                          submitUrl && !isValidSubmitUrl ? "border-p-danger" : "border-p-line focus:border-p-primary"
                        }`}
                      />
                      {submitUrl && !isValidSubmitUrl && (
                        <p className="text-small text-p-danger mt-1">{t("registry.submit.urlError")}</p>
                      )}
                    </div>
                    <div className="sm:w-[200px]">
                      <input
                        type="email"
                        value={submitEmail}
                        onChange={(e) => setSubmitEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmitCatalog()}
                        placeholder={t("registry.submit.emailPlaceholder")}
                        aria-label={t("registry.submit.emailLabel")}
                        title={t("registry.submit.emailLabel")}
                        disabled={submitState === "submitting"}
                        className={`w-full bg-p-bg border rounded-[var(--p-r-md)] px-4 py-2.5 text-body text-p-ink placeholder:text-p-ink-3 focus:outline-none transition-colors disabled:opacity-50 ${
                          submitEmail && !isValidSubmitEmail ? "border-p-danger" : "border-p-line focus:border-p-primary"
                        }`}
                      />
                      {submitEmail && !isValidSubmitEmail && (
                        <p className="text-small text-p-danger mt-1">{t("registry.submit.emailError")}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmitCatalog}
                      disabled={!canSubmit || submitState === "submitting"}
                      className={`px-5 py-2.5 rounded-[var(--p-r-md)] text-body font-semibold transition-colors whitespace-nowrap sm:self-start ${
                        canSubmit && submitState !== "submitting"
                          ? "bg-p-primary text-p-on-primary hover:bg-p-primary-ink"
                          : "bg-p-line text-p-ink-3 cursor-not-allowed"
                      }`}
                    >
                      {submitState === "submitting" ? t("registry.submit.submitting") : t("registry.submit.submit")}
                    </button>
                    </div>
                    {submitError && (
                      <p className="text-small text-p-danger mt-1">{submitError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
