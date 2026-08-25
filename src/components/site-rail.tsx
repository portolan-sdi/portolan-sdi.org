"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PortolanLogo } from "./portolan-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { SiteFooter } from "./site-footer";
import { DirArrow } from "./ui";

// Primary navigation lives in a left rail (replaces the old minimal header +
// footer nav). On md+ the rail is permanently pinned and the page is inset by
// --p-rail. Below md the rail is an off-canvas drawer opened from a mono
// "Index" button. Section labels reuse the existing section eyebrows so copy
// stays in one place.

const DOCS_URL = "https://portolan-sdi.github.io/portolan-cli";
const GITHUB_URL = "https://github.com/portolan-sdi";

// In-page anchors, in document order. `label` is the translation key to read.
const SECTIONS = [
  { id: "why", label: "nav.why" },
  { id: "who", label: "nav.who" },
  { id: "how", label: "howItWorks.eyebrow" },
  { id: "ecosystem", label: "ecosystem.eyebrow" },
  { id: "resources", label: "resources.title" },
  { id: "involved", label: "getInvolved.title" },
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Desktop only. The rail holds eight links in 264px, which is 18% of a
  // 1440px viewport, so the reader can give that width back to the content.
  const [collapsed, setCollapsed] = useState(false);

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

        {/* Locale control and the collapse button share the foot row. */}
        <div className="border-t border-p-line px-[22px] py-3.5 flex items-center justify-between gap-2">
          <LocaleSwitcher />
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label={t("nav.collapse")}
            title={t("nav.collapse")}
            className="hidden md:inline-flex items-center justify-center h-8 px-2 font-mono text-small text-p-ink-3 transition-colors hover:bg-p-bg-soft hover:text-p-ink"
          >
            {/* No rtl: variant. U+00AB is a bidi-mirrored character, so the
                engine already flips it on an RTL page; swapping it by hand
                mirrored it twice and pointed the arrow the wrong way. */}
            <span aria-hidden="true">&#171;</span>
          </button>
        </div>
      </nav>

      {/* Restore handle. Sits where the rail's edge was, and only exists once
          the rail is off-canvas on desktop. */}
      {isDesktop && collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="fixed top-5 start-0 z-40 hidden md:inline-flex items-center gap-1.5 border border-s-0 border-p-line bg-p-bg px-3 py-1.5 font-mono text-eyebrow uppercase tracking-[0.1em] rtl:tracking-normal text-p-ink hover:bg-p-bg-soft"
        >
          <span aria-hidden="true">&#187;</span>
          {t("nav.expand")}
        </button>
      )}

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

      <div className="site-main">
        <main>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
