"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DitherMap } from "./dither-map";
import { SiteShell } from "./site-rail";
import { PublishPaths } from "./quickstart-section";
import { ResourcesSection } from "./resources-section";
import { EcosystemSection } from "./ecosystem-section";
import { InvolvedSection } from "./involved-section";
import { PipelineFigure } from "./pipeline-figure";
import { Btn, DirArrow, Ltr, SectionHead, monoChunk } from "./ui";
import { CatalogCard } from "./registry/catalog-card";
import type { Catalog, CatalogKind } from "@/lib/catalogs";
import { formatDate, getCoverageTier } from "@/lib/catalogs";

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
      <span className="font-mono text-micro text-p-ink-3">
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
          <span aria-hidden="true" className="rtl:hidden">&#8249;</span>
          <span aria-hidden="true" className="hidden rtl:inline">&#8250;</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label={t("next")}
          className="border-s border-p-line px-3 py-1.5 text-p-ink transition-colors hover:bg-p-bg-soft disabled:text-p-ink-3 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
        >
          <span aria-hidden="true" className="rtl:hidden">&#8250;</span>
          <span aria-hidden="true" className="hidden rtl:inline">&#8249;</span>
        </button>
      </div>
    </div>
  );
}

// Placeholder shown while the deck.gl/maplibre chunk loads on first map view.
function MapSkeleton() {
  const t = useTranslations("registry");
  return (
    <div className="h-[520px] md:h-[600px] rounded-[var(--p-r-lg)] border border-p-line bg-p-bg-soft animate-pulse flex items-center justify-center">
      <span className="text-micro text-p-ink-3 font-mono">{t("map.loading")}</span>
    </div>
  );
}

// home-page is already a Client Component, so ssr:false is legal here. The
// chunk only loads the first time the map view renders.
const CatalogMap = dynamic(() => import("./registry/catalog-map"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface HomePageProps {
  catalogs?: Catalog[];
}

export function HomePage({ catalogs = [] }: HomePageProps) {
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

  // Live registry totals shown in the hero stats row. Latin digits in every
  // locale per the translation contract.
  const heroStats = useMemo(() => {
    if (catalogs.length === 0) return null;
    const format = new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
    return [
      { key: "catalogs", value: format.format(catalogs.length) },
      {
        key: "collections",
        value: format.format(catalogs.reduce((sum, c) => sum + (c.collection_count ?? 0), 0)),
      },
      {
        key: "features",
        value: format.format(catalogs.reduce((sum, c) => sum + (c.feature_count ?? 0), 0)),
      },
    ];
  }, [catalogs, locale]);

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

  // Four principles, one ledger row each: title, body, mono tag. Order is
  // deliberate, not ranked (no numbers, no bullets).
  const whyCards = ["open", "agents", "simple", "sovereign"] as const;

  const howSteps = [
    "convert",
    "catalog",
    "publish",
    "browse",
  ] as const;

  return (
    <SiteShell>
      {/* Hero */}
      <section id="top" className="relative border-b border-p-line overflow-hidden">
        <DitherMap className="absolute inset-0 w-full h-full opacity-80 dark:opacity-60" />
        <div className="absolute inset-0" style={{ background: "var(--hero-scrim)" }} />
        <div className="relative z-10 px-[var(--p-pad-section-x)] pt-[clamp(56px,9vw,120px)] pb-[clamp(40px,6vw,72px)]">
          <div className="max-w-[1240px] mx-auto">
            <h1 className="text-hero font-extrabold tracking-[-0.035em] text-balance">
              {t("hero.title")} <br />
              <span className="text-p-primary">{t("hero.titleAccent")}</span>
            </h1>
            <div className="mt-[clamp(2rem,4vw,3rem)]">
              <p className="text-lead leading-relaxed max-w-[56ch]">
                {t.rich("hero.description", { m: monoChunk })}
              </p>
              <div className="flex gap-6 items-center flex-wrap mt-9">
                <Link href="/#how">
                  <Btn variant="primary" size="lg">
                    {t("hero.quickstart")} <DirArrow />
                  </Btn>
                </Link>
                <a href="https://browser.portolan-sdi.org/">
                  <Btn variant="ghost" size="lg">
                    {t("hero.browseCatalogs")} <DirArrow />
                  </Btn>
                </a>
              </div>
              {heroStats && (
                <p className="mt-10 font-mono text-micro text-p-ink-3">
                  {heroStats.map((stat) => (
                    <span key={stat.key}>
                      <span className="text-p-primary">
                        <Ltr>{stat.value}</Ltr>
                      </span>{" "}
                      {t(`hero.stats.${stat.key}`)}
                      {" · "}
                    </span>
                  ))}
                  {t("hero.stats.live")}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Who's involved — credibility strip; placeholder wordmarks until logo assets land */}
      <InvolvedSection />

      {/* Why Portolan */}
      <section id="why" className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line">
        <div className="max-w-[1240px] mx-auto">
          {/* No eyebrow: the title already states the problem this section is about. */}
          <SectionHead title={t("why.title")} wide />
          {/* Ledger: four principles, one row each. Near-black top rule, soft
              interior rules. Rows nudge start-ward + tint faintly on hover. */}
          <div className="border-t border-p-line-strong overflow-clip">
            {whyCards.map((key) => (
              <div
                key={key}
                className="group grid grid-cols-1 gap-2 border-b border-p-line px-2 py-6 [will-change:transform] transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[color-mix(in_srgb,var(--p-primary)_4%,var(--p-paper))] hover:translate-x-2 rtl:hover:-translate-x-2 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)_minmax(0,200px)] md:items-baseline md:gap-8 md:py-[26px]"
              >
                <h3 className="text-card-title font-bold tracking-[-0.02em]">
                  {t(`why.cards.${key}.title`)}
                </h3>
                <p className="text-body text-p-ink-2 leading-relaxed text-pretty">
                  {t.rich(`why.cards.${key}.description`, { m: monoChunk })}
                </p>
                <span className="font-mono text-micro text-p-primary md:justify-self-end md:text-end">
                  {t(`why.cards.${key}.tag`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line">
        <div className="max-w-[1240px] mx-auto">
          <SectionHead
            eyebrow={t("howItWorks.eyebrow")}
            title={t("howItWorks.title")}
          />
          <div className="mb-[var(--p-pad-lg)]">
            <PipelineFigure />
          </div>
          {/* Stepper strip: four cells in one near-black frame, soft interior
              dividers (wrap-aware for the 1/2/4-col responsive steps), faint
              tint on hover. Number badge (mono, reversed) + title + a
              reading-forward arrow on every cell but the last. */}
          <div className="border border-p-line-strong grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {howSteps.map((step, i) => (
              <div
                key={step}
                className="group p-6 border-p-line transition-colors duration-300
                  border-b [&:last-child]:border-b-0
                  sm:[&:nth-child(2n)]:border-s
                  sm:[&:nth-child(n+3)]:border-b-0
                  lg:border-b-0
                  lg:[&:not(:first-child)]:border-s
                  hover:bg-[color-mix(in_srgb,var(--p-primary)_4%,var(--p-paper))]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-eyebrow text-p-bg bg-p-primary px-1.5 py-0.5 leading-none tracking-[0.04em] rtl:tracking-normal">
                    {t(`howItWorks.steps.${step}.id`)}
                  </span>
                  <h3 className="text-card-title font-bold tracking-[-0.02em]">
                    {t(`howItWorks.steps.${step}.title`)}
                  </h3>
                  {i < howSteps.length - 1 && (
                    <span aria-hidden className="ms-auto text-p-ink-3">
                      <DirArrow />
                    </span>
                  )}
                </div>
                <p className="text-body text-p-ink-2 leading-relaxed text-pretty mt-3">
                  {t.rich(`howItWorks.steps.${step}.description`, {
                    m: monoChunk,
                  })}
                </p>
              </div>
            ))}
          </div>
          <PublishPaths />
        </div>
      </section>

      {/* Ecosystem — the Portolan projects plus the wider format ecosystem */}
      <EcosystemSection />

      {/* Talks & demos */}
      <ResourcesSection />

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
                  className="text-micro text-p-ink-3 hover:text-p-ink-2 underline underline-offset-2"
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
                    <h3 className="text-card-title-lg font-semibold">
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
                      className="text-micro text-p-ink-3 hover:text-p-ink-2 underline"
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
                          submitUrl && !isValidSubmitUrl ? "border-red-400" : "border-p-line focus:border-p-primary"
                        }`}
                      />
                      {submitUrl && !isValidSubmitUrl && (
                        <p className="text-micro text-red-500 mt-1">{t("registry.submit.urlError")}</p>
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
                          submitEmail && !isValidSubmitEmail ? "border-red-400" : "border-p-line focus:border-p-primary"
                        }`}
                      />
                      {submitEmail && !isValidSubmitEmail && (
                        <p className="text-micro text-red-500 mt-1">{t("registry.submit.emailError")}</p>
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
                      <p className="text-micro text-red-500 mt-1">{submitError}</p>
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
