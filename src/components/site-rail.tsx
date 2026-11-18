"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { CASE_STUDIES } from "@/lib/case-studies";
import { PortolanLogo } from "./portolan-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { SiteFooter } from "./site-footer";

// Primary navigation is one bar across the top of every page. It replaced
// the left side rail, and it lists pages only: the homepage sections are
// reached by scrolling or by `#hash` links in the page itself.
//
// From xl up the bar holds the logo, the page links, and the locale control
// on one row. Below xl it holds the logo and a mono "Index" button, which
// opens the same links and the locale control as a panel under the bar.
//
// The links and the locale control render once. The same element is the row
// on a wide screen and the panel on a narrow one, so there is one list to
// keep in order and one locale control in the document.
//
// The bar is sticky, and `scroll-padding-top` on `html` (see globals.css)
// keeps an anchor jump from landing under it. Both read `--p-bar`.
//
// Every destination that leaves the site (docs, GitHub, roadmap, issues)
// lives in SiteFooter instead.

type NavPage = {
  /** Locale-free route. The locale-aware Link adds /es or /ar. */
  href: string;
  /** Translation key to read for the label. */
  label: string;
};

const ALL_PAGES: NavPage[] = [
  { href: "/blog", label: "nav.blog" },
  { href: "/case-studies", label: "nav.caseStudies" },
  { href: "/tutorials", label: "nav.tutorials" },
  { href: "/talks", label: "nav.talks" },
  { href: "/ecosystem", label: "nav.ecosystem" },
  { href: "/faq", label: "nav.faq" },
  { href: "/registry", label: "nav.registry" },
];

// The case study link shows only when the site has a case study, so the
// bar never opens an empty list.
const PAGES = ALL_PAGES.filter(
  (page) => page.href !== "/case-studies" || CASE_STUDIES.length > 0,
);

const MENU_ID = "site-menu";

interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  const t = useTranslations();
  // Locale-free, so /es/blog reads as /blog here.
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  // A page marks its own link, and so does anything under it: a post at
  // /blog/<slug> marks Blog.
  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // The open panel behaves as a modal navigation surface. Move focus into
  // it on open, keep Tab within the bar and the panel, and return focus to
  // the trigger on close.
  useEffect(() => {
    if (!menuOpen) return;
    const nav = navRef.current;
    const menu = menuRef.current;
    if (!nav || !menu) return;

    const getFocusable = (root: HTMLElement) =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter(
        (element) => !element.hidden && element.getClientRects().length > 0,
      );

    const frame = window.requestAnimationFrame(() =>
      getFocusable(menu)[0]?.focus(),
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // The locale menu handles its own Escape first and prevents the
        // default. That press shuts the menu, not the whole panel.
        if (e.defaultPrevented) return;
        e.preventDefault();
        closeMenu(true);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable(nav);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!nav.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  // The panel should not remain open across the breakpoint. From xl up the
  // links are a row, and an open panel would leave the page inert under it.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="min-h-screen bg-p-bg font-sans">
      {/* Scrim under the open panel. Below xl only. */}
      <div
        onClick={() => closeMenu(true)}
        aria-hidden="true"
        className={`fixed inset-0 z-[39] bg-[rgba(22,23,15,0.32)] transition-opacity xl:hidden ${
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* The bar. Solid page color over a black rule, no blur and no shadow.
          The header is the positioned box the panel hangs from, so the panel
          spans the viewport while the row keeps the 1240px content column. */}
      <header className="sticky top-0 z-40 h-[var(--p-bar)] border-b border-p-line bg-p-bg px-[var(--p-pad-section-x)]">
        <nav
          ref={navRef}
          aria-label={t("nav.mainAria")}
          className="mx-auto flex h-full max-w-[1240px] items-center"
        >
          <Link
            href="/"
            aria-label={t("nav.homeAria")}
            onClick={() => closeMenu()}
            className="flex h-10 shrink-0 items-center"
          >
            <PortolanLogo size={24} />
          </Link>

          {/* The word, never a hamburger icon. */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
            aria-controls={MENU_ID}
            aria-expanded={menuOpen}
            className="ms-auto border border-p-line px-3 py-1.5 text-small text-p-ink hover:bg-p-bg-soft xl:hidden"
          >
            {t("nav.index")}
          </button>

          {/* The page links and the locale control. A panel under the bar
              below xl, the rest of the row from xl up. */}
          <div
            id={MENU_ID}
            ref={menuRef}
            className={`${
              menuOpen ? "flex" : "hidden"
            } absolute inset-x-0 top-full max-h-[calc(100dvh-var(--p-bar))] flex-col overflow-y-auto border-y border-p-line bg-p-bg px-[var(--p-pad-section-x)] py-2 xl:static xl:ms-8 xl:flex xl:max-h-none xl:min-w-0 xl:flex-1 xl:flex-row xl:items-center xl:overflow-visible xl:border-0 xl:p-0`}
          >
            <ul className="flex flex-col xl:flex-row xl:items-center xl:gap-1">
              {PAGES.map(({ href, label }) => {
                const current = isCurrent(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => closeMenu()}
                      aria-current={current ? "page" : undefined}
                      className={`flex h-11 items-center whitespace-nowrap text-body transition-colors xl:h-10 xl:px-3 xl:text-body ${
                        current
                          ? "text-p-primary"
                          : "text-p-ink hover:text-p-primary"
                      }`}
                    >
                      {t(label)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 border-t border-p-line-soft py-2 xl:ms-auto xl:mt-0 xl:border-0 xl:py-0">
              <LocaleSwitcher />
            </div>
          </div>
        </nav>
      </header>

      <div inert={menuOpen || undefined}>
        <main>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
