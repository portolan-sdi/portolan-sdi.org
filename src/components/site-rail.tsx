"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PortolanLogo } from "./portolan-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { DirArrow } from "./ui";

// Primary navigation lives in a collapsible left rail (replaces the old minimal
// header + footer nav). On md+ the rail is pinned and the page is inset by
// --p-rail; "Collapse" slides it away and a "» Index" handle brings it back.
// Below md the rail is an off-canvas drawer opened from a mono "Index" button.
// Section labels reuse the existing section eyebrows so copy stays in one place.

const DOCS_URL = "https://portolan-sdi.github.io/portolan-cli";
const GITHUB_URL = "https://github.com/portolan-sdi";

// In-page anchors, in document order. `label` is the translation key to read.
const SECTIONS = [
  { id: "why", label: "why.eyebrow" },
  { id: "how", label: "howItWorks.eyebrow" },
  { id: "ecosystem", label: "ecosystem.eyebrow" },
  { id: "quickstart", label: "quickstart.eyebrow" },
  { id: "resources", label: "resources.eyebrow" },
  { id: "registry", label: "nav.registry" },
] as const;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  const isDesktop = useIsDesktop();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Highlight the section currently in view.
  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  const railOffCanvas = isDesktop ? collapsed : !drawerOpen;
  const railStateClass = isDesktop
    ? collapsed
      ? "is-collapsed"
      : ""
    : drawerOpen
      ? "is-open"
      : "";

  const navLinkBase =
    "flex items-center justify-between gap-2 py-[9px] text-body transition-colors";

  return (
    <div className="min-h-screen bg-p-bg font-sans">
      {/* Desktop re-open handle (only when collapsed) */}
      {isDesktop && collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="fixed top-3.5 start-3.5 z-[45] hidden md:inline-flex items-center gap-2 h-9 px-3 bg-p-bg border border-p-line font-mono text-eyebrow uppercase tracking-[0.08em] text-p-ink-2 hover:text-p-ink"
        >
          <span aria-hidden="true">»</span> {t("nav.index")}
        </button>
      )}

      {/* Mobile drawer scrim */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={`fixed inset-0 z-[39] bg-[rgba(22,23,15,0.32)] transition-opacity md:hidden ${
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* The rail */}
      <nav
        aria-label={t("nav.homeAria")}
        inert={railOffCanvas || undefined}
        className={`site-rail ${railStateClass} fixed inset-y-0 start-0 z-40 flex flex-col w-[min(86vw,320px)] md:w-[var(--p-rail)] bg-p-bg border-e border-p-line`}
      >
        <Link
          href="/"
          aria-label={t("nav.homeAria")}
          onClick={closeDrawer}
          className="flex items-center px-[22px] py-5 border-b border-p-line"
        >
          <PortolanLogo size={26} />
        </Link>

        <div className="flex-1 overflow-y-auto py-3.5">
          <ul className="px-[22px]">
            {SECTIONS.map((s) => {
              const active = activeId === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={closeDrawer}
                    aria-current={active ? "true" : undefined}
                    className={`${navLinkBase} ${
                      active
                        ? "text-p-primary"
                        : "text-p-ink hover:text-p-primary"
                    }`}
                  >
                    {t(s.label)}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="px-[22px] pt-4 pb-1.5 font-mono text-eyebrow tracking-[0.04em] text-p-ink-3">
            {t("nav.external")}
          </div>
          <ul className="px-[22px]">
            <li>
              <a
                href={DOCS_URL}
                className={`${navLinkBase} text-p-ink hover:text-p-primary`}
              >
                {t("nav.docs")} <DirArrow kind="external" />
              </a>
            </li>
            <li>
              <a
                href={GITHUB_URL}
                className={`${navLinkBase} text-p-ink hover:text-p-primary`}
              >
                GitHub <DirArrow kind="external" />
              </a>
            </li>
          </ul>
        </div>

        <div className="border-t border-p-line px-[22px] pt-3.5 pb-[18px] flex flex-col gap-3.5">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="hidden md:inline-flex self-start items-center gap-1.5 font-mono text-eyebrow uppercase tracking-[0.06em] text-p-ink-3 hover:text-p-ink"
          >
            <span aria-hidden="true">«</span> {t("nav.collapse")}
          </button>
          <LocaleSwitcher />
          <p className="font-mono text-micro text-p-ink-3 m-0">
            {t("nav.tagline")}
          </p>
        </div>
      </nav>

      {/* Mobile top bar (logo + drawer trigger) */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-p-line bg-p-bg px-[var(--p-pad-section-x)] py-3">
        <Link href="/" aria-label={t("nav.homeAria")}>
          <PortolanLogo size={24} />
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          className="font-mono text-eyebrow uppercase tracking-[0.1em] border border-p-line px-3 py-1.5 text-p-ink hover:bg-p-bg-soft"
        >
          {t("nav.index")}
        </button>
      </div>

      <main className={`site-main ${isDesktop && collapsed ? "is-collapsed" : ""}`}>
        {children}
      </main>
    </div>
  );
}
