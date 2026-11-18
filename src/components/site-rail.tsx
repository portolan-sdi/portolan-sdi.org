"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { NAV_GROUPS, type NavGroup } from "@/lib/nav";
import { PortolanLogo } from "./portolan-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { SiteFooter } from "./site-footer";
import { DirArrow, Ltr } from "./ui";

// Primary navigation is one bar across the top of every page. It shows the
// four groups of the site map in `src/lib/nav.ts`: Docs, Stories, Registry,
// and Community. The footer shows the same groups with the same links.
//
// From md up the groups are at the inline-end side of the bar, beside the
// locale control. A group with links is a button that opens a menu under
// it. The menu opens when the pointer comes over the group, and on a click
// or a key press. It fades in over 120ms. Registry is one link, so it is a
// plain link. One menu is open at a time. A press outside, the Escape key,
// or a click on a link shuts it.
//
// Below md the bar holds the logo and one button with three lines. The
// button opens one panel under the bar, with each group as a head above
// its links. The panel has no menus inside it, because everything in it
// shows at once.
//
// The groups and the locale control render once. The same element is the
// row on a wide screen and the panel on a narrow one, so there is one list
// to keep in order and one locale control in the document.
//
// The bar is sticky, and `scroll-padding-top` on `html` (see globals.css)
// keeps an anchor jump from landing under it. Both read `--p-bar`.

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

const MENU_ID = "site-menu";

interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  const t = useTranslations();
  // Locale-free, so /es/blog reads as /blog here.
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // The key of the group whose menu is open in the wide bar, or null.
  const [openGroup, setOpenGroup] = useState<NavGroup["key"] | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // A short wait before a menu shuts, so the pointer can cross the small
  // space between a button and its menu.
  const leaveTimer = useRef<number | undefined>(undefined);
  const hoverOpen = (key: NavGroup["key"]) => {
    window.clearTimeout(leaveTimer.current);
    setOpenGroup(key);
  };
  const hoverShut = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setOpenGroup(null), 140);
  };

  const closeMenu = useCallback((restoreFocus = false) => {
    setMenuOpen(false);
    setOpenGroup(null);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  // A page marks its own link, and so does anything under it: a post at
  // /blog/<slug> marks Blog.
  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  // A group is current when the page is one of its own links.
  const groupIsCurrent = (group: NavGroup) =>
    group.items.some((item) => !item.external && isCurrent(item.href));

  // A menu in the wide bar shuts on Escape and on a press outside the bar.
  // Escape puts focus back on the button that opened the menu.
  useEffect(() => {
    if (!openGroup) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      navRef.current
        ?.querySelector<HTMLElement>(`[data-group="${openGroup}"]`)
        ?.focus();
      setOpenGroup(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenGroup(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openGroup]);

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

  // The panel should not remain open across the breakpoint. From md up the
  // groups are a row, and an open panel would leave the page inert under it.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="min-h-screen bg-p-bg font-sans">
      {/* Scrim under the open panel. Below md only. */}
      <div
        onClick={() => closeMenu(true)}
        aria-hidden="true"
        className={`fixed inset-0 z-[39] bg-[rgba(22,23,15,0.32)] transition-opacity md:hidden ${
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

          {/* Three lines open the panel. They become a cross while the
              panel is open. The lines have square ends, as the corners of
              the site do. */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
            aria-controls={MENU_ID}
            aria-expanded={menuOpen}
            aria-label={t("nav.index")}
            className="ms-auto flex h-10 w-10 items-center justify-center text-p-ink hover:text-p-primary md:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              aria-hidden="true"
            >
              <path d={menuOpen ? "M5 5l14 14M19 5L5 19" : "M3 6h18M3 12h18M3 18h18"} />
            </svg>
          </button>

          {/* The groups and the locale control. A panel under the bar
              below md, the rest of the row from md up. */}
          <div
            id={MENU_ID}
            ref={menuRef}
            className={`${
              menuOpen ? "flex" : "hidden"
            } absolute inset-x-0 top-full max-h-[calc(100dvh-var(--p-bar))] flex-col overflow-y-auto border-y border-p-line bg-p-bg px-[var(--p-pad-section-x)] py-2 md:static md:ms-auto md:flex md:max-h-none md:min-w-0 md:flex-row md:items-center md:gap-3 md:overflow-visible md:border-0 md:p-0`}
          >
            <ul className="flex flex-col md:flex-row md:items-center md:gap-1">
              {NAV_GROUPS.map((group) => {
                const label = t(`nav.${group.label}`);

                // A group that is one link.
                if (group.href) {
                  const current = isCurrent(group.href);
                  return (
                    <li key={group.key} className="border-t border-p-line-soft py-1 first:border-0 md:border-0 md:py-0">
                      <Link
                        href={group.href}
                        onClick={() => closeMenu()}
                        aria-current={current ? "page" : undefined}
                        className={`flex h-11 items-center whitespace-nowrap text-body font-semibold transition-colors md:h-10 md:px-3 md:font-normal ${
                          current
                            ? "text-p-primary"
                            : "text-p-ink hover:text-p-primary"
                        }`}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                }

                const open = openGroup === group.key;
                const current = groupIsCurrent(group);
                const listId = `nav-${group.key}`;
                const last = group.key === NAV_GROUPS[NAV_GROUPS.length - 1].key;
                return (
                  <li
                    key={group.key}
                    onMouseEnter={() => hoverOpen(group.key)}
                    onMouseLeave={hoverShut}
                    className="relative border-t border-p-line-soft py-1 first:border-0 md:border-0 md:py-0"
                  >
                    {/* The head of the group in the panel. From md the
                        button below takes its place. */}
                    <p className="flex h-9 items-end pb-1 text-small text-p-ink-3 md:hidden">
                      {label}
                    </p>
                    <button
                      type="button"
                      data-group={group.key}
                      aria-expanded={open}
                      aria-controls={listId}
                      // A pointer click opens the menu and never shuts it,
                      // because the pointer already opened it on the way in.
                      // A key press has `detail` 0, and it opens and shuts.
                      onClick={(e) =>
                        setOpenGroup(e.detail === 0 && open ? null : group.key)
                      }
                      className={`hidden h-10 cursor-pointer items-center gap-1.5 whitespace-nowrap px-3 text-body transition-colors md:flex ${
                        current || open
                          ? "text-p-primary"
                          : "text-p-ink hover:text-p-primary"
                      }`}
                    >
                      {label}
                      {/* The same mark as on the locale control. It says
                          that the word opens a menu. */}
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="square"
                        aria-hidden="true"
                        className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {/* In the panel the list always shows. From md it is a
                        menu under the bar. It starts at the rule of the bar,
                        so the two read as one piece. It is square, with one
                        ink border, and it fades in. The last menu opens from
                        its inline-end edge, so it stays in the column. */}
                    <ul
                      id={listId}
                      className={`flex flex-col md:absolute md:top-[calc(100%+(var(--p-bar)-2.5rem)/2)] md:z-50 md:min-w-56 md:border md:border-t-0 md:border-p-line md:bg-p-bg md:p-2 md:transition-[opacity,transform,visibility] md:duration-150 ${
                        last ? "md:end-0" : "md:start-0"
                      } ${
                        open
                          ? "md:visible md:translate-y-0 md:opacity-100"
                          : "md:invisible md:-translate-y-1 md:opacity-0"
                      }`}
                    >
                      {group.items.map((item) => {
                        const itemCurrent = !item.external && isCurrent(item.href);
                        const className = `flex h-11 items-center gap-2 whitespace-nowrap text-body transition-colors md:h-10 md:px-3 md:hover:bg-p-bg-soft ${
                          itemCurrent
                            ? "text-p-primary"
                            : "text-p-ink hover:text-p-primary"
                        }`;
                        const text = item.latin ? (
                          <Ltr>{t(`nav.${item.label}`)}</Ltr>
                        ) : (
                          t(`nav.${item.label}`)
                        );
                        return (
                          <li key={item.href}>
                            {item.external ? (
                              <a
                                href={item.href}
                                {...external}
                                onClick={() => closeMenu()}
                                className={className}
                              >
                                {text}
                                <DirArrow kind="external" />
                              </a>
                            ) : (
                              <Link
                                href={item.href}
                                onClick={() => closeMenu()}
                                aria-current={itemCurrent ? "page" : undefined}
                                className={className}
                              >
                                {text}
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 border-t border-p-line-soft py-2 md:mt-0 md:border-0 md:py-0">
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
