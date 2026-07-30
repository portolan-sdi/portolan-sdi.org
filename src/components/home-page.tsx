"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DitherMap } from "./dither-map";
import { SiteShell } from "./site-rail";
import { PublishPaths } from "./quickstart-section";
import { ResourcesSection } from "./resources-section";
import { EcosystemSection } from "./ecosystem-section";
import { InvolvedSection } from "./involved-section";
import { PipelineFigure } from "./pipeline-figure";
import { Btn, DirArrow, SectionHead, monoChunk } from "./ui";
import { CatalogCard } from "./registry/catalog-card";
import type { Catalog } from "@/lib/catalogs";
import { getBrowserUrl, getValidationTier } from "@/lib/catalogs";

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

// Three real catalogs named in the hero, as evidence that a Portolan catalog is
// a thing you can open rather than a claim. Labels live in messages/ and are
// ours, not the registry titles: one listed catalog has a null title, one is 64
// characters of Spanish, one carries an em dash. Matched by URL against the live
// export so a catalog that leaves the registry drops out of the hero instead of
// linking somewhere dead. Hand-curated on purpose — three named datasets carry
// more weight than a count while the registry is small, and when it grows this
// row should become the count instead.
const featuredCatalogUrls = [
  { key: "dutch", url: "https://data.source.coop/cholmes/portolan-nl/catalog.json" },
  { key: "jrc", url: "https://data.source.coop/nlebovits/jrc-glofas/catalog.json" },
  { key: "ign", url: "https://data.source.coop/nlebovits/ign-argentina/catalog.json" },
] as const;

// External references linked inline from the "why" cards. Keyed by card key;
// cards without an entry render their description as plain text.
const whyCardLinks: Record<string, string> = {
  peopleAndAgents: "https://jatorre.github.io/carto-ogc-helsinki/webapp/",
  lowCost: "https://cholmes.github.io/open-geodag-presentation/calculator.html",
};

export function HomePage({ catalogs = [] }: HomePageProps) {
  const t = useTranslations();

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

  // One error region, so the field's aria-describedby always points at exactly
  // one node: a malformed URL is worth saying before a stale server error.
  const submitFieldError =
    submitUrl && !isValidSubmitUrl ? t("registry.submit.urlError") : submitError;

  // Only name a hero catalog the registry still lists.
  const featuredCatalogs = useMemo(() => {
    const listed = new Set(catalogs.map((c) => c.url));
    return featuredCatalogUrls.filter((f) => listed.has(f.url));
  }, [catalogs]);

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
  // Six principles, one ledger row each — title · body · mono tag. Order is
  // deliberate, not ranked (no numbers, no bullets).
  const whyCards = [
    "open",
    "peopleAndAgents",
    "easy",
    "scalable",
    "lowCost",
    "sovereign",
  ] as const;

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
        <DitherMap className="absolute inset-0 w-full h-full opacity-80" />
        <div className="absolute inset-0" style={{ background: "var(--hero-scrim)" }} />
        <div className="relative z-10 px-[var(--p-pad-section-x)] pt-[clamp(56px,9vw,120px)] pb-[clamp(40px,6vw,72px)]">
          <div className="max-w-[1240px] mx-auto">
            {/* One sentence, one ink. No hard break: a fixed break point cannot
                serve three languages at three different word lengths, so
                text-balance sets the lines. */}
            <h1 className="text-hero font-extrabold tracking-[-0.035em] text-balance">
              {t("hero.title")}
            </h1>
            <div className="mt-[clamp(2rem,4vw,3rem)]">
              <p className="text-lead leading-relaxed max-w-[56ch]">
                {t.rich("hero.description", { m: monoChunk })}
              </p>
              {/* One primary act, one plain link. Two lg buttons side by side
                  ranked nothing, and the filled one only scrolled. */}
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mt-9">
                <Link href="/#registry">
                  <Btn variant="primary" size="lg">
                    {t("hero.browseCatalogs")} <DirArrow />
                  </Btn>
                </Link>
                <Link
                  href="/#how"
                  className="font-mono text-small text-p-primary hover:underline"
                >
                  {t("hero.publishYourOwn")} <DirArrow />
                </Link>
              </div>
              {/* Evidence, not a claim: every name here opens a real catalog in
                  the browser, so a visitor can check "plain files in a bucket"
                  before committing to anything. Each link is also a rehearsal
                  of the primary act above it. */}
              {featuredCatalogs.length > 0 && (
                <div className="mt-10 border-t border-p-line-soft pt-4">
                  {/* ink-2, not ink-3: at text-micro over the dither ground the
                      lighter tier drops under the 4.5:1 floor. */}
                  <p className="font-mono text-micro text-p-ink-2">
                    {t("hero.featured.intro")}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-6">
                    {featuredCatalogs.map((featured) => (
                      <li key={featured.key}>
                        <a
                          href={getBrowserUrl(featured.url)}
                          className="font-mono text-micro text-p-primary hover:underline"
                        >
                          {t(`hero.featured.${featured.key}`)}{" "}
                          <DirArrow kind="external" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
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
          {/* Ledger: six principles, one row each. Near-black top rule, soft
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
                  {t.rich(`why.cards.${key}.description`, {
                    m: monoChunk,
                    link: (chunks) =>
                      whyCardLinks[key] ? (
                        <a
                          href={whyCardLinks[key]}
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
        <section id="registry" className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line">
          <div className="max-w-[1240px] mx-auto">
            {/* No eyebrow: the title ("Browse N catalogs") already names the section. */}
            <SectionHead
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
                  aria-expanded={showBboxFilter}
                  aria-controls="registry-bbox-filter"
                  className={`inline-flex items-center justify-center font-mono text-small px-4 py-2.5 border rounded-[var(--p-r-md)] transition-colors ${
                    showBboxFilter || parsedBbox
                      ? "bg-[color-mix(in_oklab,var(--p-primary)_12%,transparent)] border-[color-mix(in_oklab,var(--p-primary)_25%,transparent)] text-p-primary-ink"
                      : "bg-p-paper border-p-line text-p-ink-3 hover:text-p-ink-2"
                  }`}
                >
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
                <div id="registry-bbox-filter" className="flex flex-wrap items-center gap-3 p-4 bg-p-paper border border-p-line rounded-[var(--p-r-md)]">
                  <span className="text-micro text-p-ink-3 font-mono w-full sm:w-auto">{t("registry.filters.bboxLabel")}</span>
                  <div className="flex flex-wrap gap-2">
                    {(["west", "south", "east", "north"] as const).map((dir) => (
                      <div key={dir} className="flex items-center gap-1">
                        <label
                          htmlFor={`bbox-${dir}`}
                          className="font-mono text-micro text-p-ink-3 w-5 shrink-0"
                        >
                          {t(`registry.compass.${dir}`)}
                        </label>
                        <input
                          id={`bbox-${dir}`}
                          type="number"
                          step="any"
                          value={bboxFilter[dir]}
                          onChange={(e) => setBboxFilter((prev) => ({ ...prev, [dir]: e.target.value }))}
                          placeholder={dir === "west" || dir === "east" ? t("registry.filters.lonPlaceholder") : t("registry.filters.latPlaceholder")}
                          className="w-20 px-2 py-1.5 font-mono text-micro bg-p-bg border border-p-line rounded-[var(--p-r-sm)] text-p-ink placeholder:text-p-ink-3 focus:outline-none focus:border-p-primary"
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
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-3 pt-2 border-t border-p-line-soft font-mono text-eyebrow text-p-ink-3">
              <span className="text-p-primary">{t("registry.caption")}</span>
              <span>
                {t("registry.captionNote", { count: filteredCatalogs.length })}
              </span>
            </div>

            {/* Inline Submit. Separated by a rule, not boxed: the page reserves
                bordered blocks for discrete records, not for page furniture. */}
            <div className="mt-10 border-t border-p-line-strong pt-6">
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
                          submitUrl && !isValidSubmitUrl ? "border-p-error" : "border-p-line focus:border-p-primary"
                        }`}
                        aria-invalid={submitUrl !== "" && !isValidSubmitUrl}
                        aria-describedby={submitFieldError ? "submit-url-error" : undefined}
                      />
                      {submitFieldError && (
                        <p id="submit-url-error" role="alert" className="text-micro text-p-error mt-1">
                          {submitFieldError}
                        </p>
                      )}
                    </div>
                    <Btn
                      type="button"
                      onClick={handleSubmitCatalog}
                      disabled={!isValidSubmitUrl || submitState === "submitting"}
                    >
                      {submitState === "submitting" ? t("registry.submit.submitting") : t("registry.submit.submit")}
                    </Btn>
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
