"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DitherMap } from "./dither-map";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { QuickstartSection } from "./quickstart-section";
import { ResourcesSection } from "./resources-section";
import { EcosystemSection } from "./ecosystem-section";
import { InvolvedSection } from "./involved-section";
import { PipelineFigure } from "./pipeline-figure";
import { Btn, DirArrow, Ltr, SectionHead, monoChunk } from "./ui";
import { CatalogCard } from "./registry/catalog-card";
import type { Catalog } from "@/lib/catalogs";
import { getValidationTier } from "@/lib/catalogs";

type SubmitState = "idle" | "submitting" | "success" | "error";

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

// External references linked inline from the "why" cards. Keyed by card key;
// cards without an entry render their description as plain text.
const whyCardLinks: Record<string, string> = {
  aiFirst: "https://jatorre.github.io/carto-ogc-helsinki/webapp/",
  lowCost: "https://cholmes.github.io/open-geodag-presentation/calculator.html",
};

export function HomePage({ catalogs = [] }: HomePageProps) {
  const t = useTranslations();
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [validationFilter, setValidationFilter] = useState<"all" | "unvalidated" | "basic" | "full">("all");
  const [bboxFilter, setBboxFilter] = useState<{ west: string; south: string; east: string; north: string }>({
    west: "", south: "", east: "", north: ""
  });
  const [showBboxFilter, setShowBboxFilter] = useState(false);
  const [registryView, setRegistryView] = useState<"cards" | "map">("map");

  const [submitUrl, setSubmitUrl] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitPrUrl, setSubmitPrUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isValidSubmitUrl = submitUrl.trim().endsWith("catalog.json");

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

  const allTags = useMemo(() => {
    return Array.from(new Set(catalogs.flatMap((c) => c.keywords ?? []))).sort();
  }, [catalogs]);

  const parsedBbox = useMemo(() => {
    const { west, south, east, north } = bboxFilter;
    if (!west && !south && !east && !north) return null;
    const w = parseFloat(west);
    const s = parseFloat(south);
    const e = parseFloat(east);
    const n = parseFloat(north);
    if ([w, s, e, n].some(isNaN)) return null;
    return { west: w, south: s, east: e, north: n };
  }, [bboxFilter]);

  const filteredCatalogs = useMemo(() => {
    return catalogs.filter((catalog) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        query === "" ||
        catalog.title.toLowerCase().includes(query) ||
        catalog.description.toLowerCase().includes(query);

      const catalogKeywords = catalog.keywords ?? [];
      const matchesTags =
        selectedTags.size === 0 ||
        catalogKeywords.some((keyword) => selectedTags.has(keyword));

      const tier = getValidationTier(catalog.validation);
      const matchesValidation =
        validationFilter === "all" || tier === validationFilter;

      let matchesBbox = true;
      if (parsedBbox && catalog.bbox) {
        const [catWest, catSouth, catEast, catNorth] = catalog.bbox;
        matchesBbox =
          catEast >= parsedBbox.west &&
          catWest <= parsedBbox.east &&
          catNorth >= parsedBbox.south &&
          catSouth <= parsedBbox.north;
      }

      return matchesSearch && matchesTags && matchesValidation && matchesBbox;
    });
  }, [catalogs, searchQuery, selectedTags, validationFilter, parsedBbox]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedTags(new Set());
    setValidationFilter("all");
    setBboxFilter({ west: "", south: "", east: "", north: "" });
  };

  const hasActiveFilters = searchQuery !== "" || selectedTags.size > 0 || validationFilter !== "all" || parsedBbox !== null;

  const handleSubmitCatalog = async () => {
    if (!isValidSubmitUrl || submitState === "submitting") return;

    setSubmitState("submitting");
    setSubmitError(null);

    try {
      const res = await fetch("/api/submit-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: submitUrl.trim() }),
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
    setSubmitState("idle");
    setSubmitPrUrl(null);
    setSubmitError(null);
  };

  // `tag` is deliberately ragged: only some cards carry a bottom mono tag so
  // the grid doesn't read as a uniform template.
  const whyCards = [
    { key: "open", tag: true },
    { key: "aiFirst", tag: false },
    { key: "easy", tag: false },
    { key: "scalable", tag: false },
    { key: "lowCost", tag: true },
    { key: "sovereign", tag: true },
  ] as const;

  const howSteps = [
    "convert",
    "catalog",
    "publish",
    "browse",
  ] as const;

  return (
    <div className="bg-p-bg min-h-full font-sans">
      {/* Header */}
      <SiteHeader />

      {/* Hero */}
      <section className="relative border-b border-p-line overflow-hidden">
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
                <Link href="/#quickstart">
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
                      <Ltr>{stat.value}</Ltr> {t(`hero.stats.${stat.key}`)}
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
          <SectionHead
            eyebrow={t("why.eyebrow")}
            title={t("why.title")}
            subtitle={t("why.subtitle")}
          />
          <div className="border-t border-p-line-strong">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {whyCards.map((card) => (
                <div
                  key={card.key}
                  className="grid content-start gap-3 py-7 border-b border-p-line
                    sm:border-s sm:border-p-line
                    sm:[&:nth-child(2n+1)]:border-s-0
                    lg:[&:nth-child(3n+1)]:border-s-0
                    lg:[&:nth-child(3n+2)]:border-s
                    lg:[&:nth-child(3n)]:border-s
                    sm:px-[clamp(1rem,2.5vw,2.5rem)]
                    sm:[&:nth-child(2n+1)]:ps-0
                    lg:[&:nth-child(3n+1)]:ps-0
                    lg:[&:nth-child(3n+2)]:ps-[clamp(1rem,2.5vw,2.5rem)]
                    lg:[&:nth-child(3n)]:ps-[clamp(1rem,2.5vw,2.5rem)]"
                >
                  <h3 className="text-card-title-lg font-bold tracking-[-0.02em]">
                    {t(`why.cards.${card.key}.title`)}
                  </h3>
                  <p className="text-body leading-relaxed">
                    {t.rich(`why.cards.${card.key}.description`, {
                      m: monoChunk,
                      link: (chunks) =>
                        whyCardLinks[card.key] ? (
                          <a
                            href={whyCardLinks[card.key]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-p-primary border-b border-p-primary/35 hover:border-p-primary"
                          >
                            {chunks}
                          </a>
                        ) : (
                          <>{chunks}</>
                        ),
                    })}
                  </p>
                  {card.tag && (
                    <span className="font-mono text-micro text-p-ink-3 mt-1">
                      {t(`why.cards.${card.key}.tag`)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line">
        <div className="max-w-[1240px] mx-auto">
          <SectionHead
            eyebrow={t("howItWorks.eyebrow")}
            title={t("howItWorks.title")}
            subtitle={t("howItWorks.subtitle")}
          />
          <div className="mb-[var(--p-pad-lg)]">
            <PipelineFigure />
          </div>
          <div className="border-t border-p-line-strong">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {howSteps.map((step) => (
                <div
                  key={step}
                  className="grid content-start gap-3 py-7 border-b border-p-line
                    sm:border-s sm:border-p-line
                    sm:[&:nth-child(2n+1)]:border-s-0
                    lg:[&:nth-child(4n+1)]:border-s-0
                    lg:[&:nth-child(4n+2)]:border-s
                    lg:[&:nth-child(4n+3)]:border-s
                    lg:[&:nth-child(4n)]:border-s
                    sm:px-[clamp(1rem,2.5vw,2rem)]
                    sm:[&:nth-child(2n+1)]:ps-0
                    lg:[&:nth-child(4n+1)]:ps-0
                    lg:[&:nth-child(4n+2)]:ps-[clamp(1rem,2.5vw,2rem)]
                    lg:[&:nth-child(4n+3)]:ps-[clamp(1rem,2.5vw,2rem)]
                    lg:[&:nth-child(4n)]:ps-[clamp(1rem,2.5vw,2rem)]"
                >
                  <span className="font-mono text-eyebrow text-p-primary tracking-[0.04em]">
                    {t(`howItWorks.steps.${step}.id`)}
                  </span>
                  <h3 className="text-card-title font-bold tracking-[-0.02em]">
                    {t(`howItWorks.steps.${step}.title`)}
                  </h3>
                  <p className="text-body leading-relaxed">
                    {t.rich(`howItWorks.steps.${step}.description`, {
                      m: monoChunk,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem — the Portolan projects plus the wider format ecosystem */}
      <EcosystemSection />

      {/* Quickstart */}
      <QuickstartSection />

      {/* Talks & demos */}
      <ResourcesSection />

      {/* Registry — the living proof, deliberately the last section */}
      {catalogs.length > 0 && (
        <section id="registry" className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)]">
          <div className="max-w-[1240px] mx-auto">
            <SectionHead
              eyebrow={t("registry.eyebrow")}
              title={t("registry.title", { count: catalogs.length })}
              subtitle={t("registry.description")}
            />

            {/* Filters */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("registry.search.placeholder")}
                  className="flex-1 bg-p-paper border border-p-line rounded-[var(--p-r-md)] px-4 py-2.5 text-body text-p-ink placeholder:text-p-ink-3 focus:outline-none focus:border-p-primary transition-colors"
                />
                <div className="relative">
                  <select
                    value={validationFilter}
                    onChange={(e) => setValidationFilter(e.target.value as typeof validationFilter)}
                    className="appearance-none bg-p-paper border border-p-line rounded-[var(--p-r-md)] pl-3 pr-8 py-2.5 text-body text-p-ink focus:outline-none focus:border-p-primary transition-colors cursor-pointer"
                    aria-label={t("registry.filters.validation")}
                  >
                    <option value="all">{t("registry.filters.all")}</option>
                    <option value="unvalidated">{t("registry.validation.unvalidated")}</option>
                    <option value="basic">{t("registry.validation.basic")}</option>
                    <option value="full">{t("registry.validation.full")}</option>
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-p-ink-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBboxFilter(!showBboxFilter)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-body border rounded-[var(--p-r-md)] transition-colors ${
                    showBboxFilter || parsedBbox
                      ? "bg-[color-mix(in_oklab,var(--p-primary)_10%,transparent)] border-[color-mix(in_oklab,var(--p-primary)_25%,transparent)] text-p-primary-ink"
                      : "bg-p-paper border-p-line text-p-ink hover:border-p-ink-3"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {t("registry.filters.bbox")}
                </button>

                {/* Cards | Map view toggle */}
                <div className="flex items-stretch border border-p-line rounded-[var(--p-r-md)] overflow-hidden self-start sm:self-auto sm:ms-auto">
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

              {showBboxFilter && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-p-paper border border-p-line rounded-[var(--p-r-md)]">
                  <span className="text-micro text-p-ink-3 font-mono w-full sm:w-auto">{t("registry.filters.bboxLabel")}</span>
                  <div className="flex flex-wrap gap-2">
                    {(["west", "south", "east", "north"] as const).map((dir) => (
                      <div key={dir} className="flex items-center gap-1">
                        <label className="text-micro text-p-ink-3 uppercase w-6">{t(`registry.compass.${dir}`)}</label>
                        <input
                          type="number"
                          step="any"
                          value={bboxFilter[dir]}
                          onChange={(e) => setBboxFilter((prev) => ({ ...prev, [dir]: e.target.value }))}
                          placeholder={dir === "west" || dir === "east" ? t("registry.filters.lonPlaceholder") : t("registry.filters.latPlaceholder")}
                          className="w-20 px-2 py-1.5 text-micro bg-p-bg border border-p-line rounded-[var(--p-r-sm)] text-p-ink placeholder:text-p-ink-3 focus:outline-none focus:border-p-primary"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const isSelected = selectedTags.has(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className={`text-micro font-mono px-3 py-1.5 rounded-[var(--p-r-sm)] border transition-colors ${
                          isSelected
                            ? "bg-[color-mix(in_oklab,var(--p-primary)_12%,transparent)] text-p-primary-ink border-[color-mix(in_oklab,var(--p-primary)_25%,transparent)]"
                            : "bg-p-bg text-p-ink-3 border-p-line hover:bg-p-line hover:text-p-ink-2"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}

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
              <CatalogMap catalogs={filteredCatalogs} />
            ) : filteredCatalogs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCatalogs.map((catalog) => (
                  <CatalogCard
                    key={catalog.id}
                    catalog={catalog}
                    onTagClick={handleTagToggle}
                  />
                ))}
              </div>
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

            {/* Annotation row: same anatomy as a figure caption */}
            <div className="flex justify-between gap-3 pt-2 border-t border-p-line-soft font-mono text-eyebrow text-p-ink-3">
              <span className="text-p-primary">{t("registry.caption")}</span>
              <span>
                {t("registry.captionNote", { count: filteredCatalogs.length })}
              </span>
            </div>

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
                  <div className="flex flex-col sm:flex-row gap-2 md:w-auto w-full">
                    <div className="flex-1 sm:min-w-[300px]">
                      <input
                        type="url"
                        value={submitUrl}
                        onChange={(e) => setSubmitUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && isValidSubmitUrl && handleSubmitCatalog()}
                        placeholder="https://...catalog.json"
                        disabled={submitState === "submitting"}
                        className={`w-full bg-p-bg border rounded-[var(--p-r-md)] px-4 py-2.5 text-body text-p-ink placeholder:text-p-ink-3 focus:outline-none transition-colors disabled:opacity-50 ${
                          submitUrl && !isValidSubmitUrl ? "border-red-400" : "border-p-line focus:border-p-primary"
                        }`}
                      />
                      {submitUrl && !isValidSubmitUrl && (
                        <p className="text-micro text-red-500 mt-1">{t("registry.submit.urlError")}</p>
                      )}
                      {submitError && (
                        <p className="text-micro text-red-500 mt-1">{submitError}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmitCatalog}
                      disabled={!isValidSubmitUrl || submitState === "submitting"}
                      className={`px-5 py-2.5 rounded-[var(--p-r-md)] text-body font-semibold transition-colors whitespace-nowrap ${
                        isValidSubmitUrl && submitState !== "submitting"
                          ? "bg-p-primary text-p-on-primary hover:bg-p-primary-ink"
                          : "bg-p-line text-p-ink-3 cursor-not-allowed"
                      }`}
                    >
                      {submitState === "submitting" ? t("registry.submit.submitting") : t("registry.submit.submit")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
