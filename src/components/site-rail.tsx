"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { PortolanLogo } from "./portolan-logo";
import { LocaleSwitcher } from "./locale-switcher";
import { SiteFooter } from "./site-footer";

// Primary navigation lives in a left rail (replaces the old minimal header).
// On md+ the rail is permanently pinned and the page is inset by --p-rail.
// Below md the rail is an off-canvas drawer opened from a mono "Index"
// button. Section labels reuse the existing section eyebrows so copy stays in
// one place.
//
// The rail indexes the site. Every destination that leaves the site (docs,
// GitHub, roadmap, issues) lives in SiteFooter instead.
//
// There are three kinds of item. An item with no `href` is an in-page anchor.
// An item with one is a route, and routes use the locale-aware Link so /es and
// /ar keep their prefix. An item with `children` is a group, which renders a
// disclosure arrow over an indented child list.
//
// A group may also carry an `href`, and Overview does. That row holds two hit
// targets: the arrow opens the group, the label goes to the homepage.
//
// A group with neither an `href` nor a page of its own takes `alwaysOpen`, and
// Resources does. It reads as a heading over its children and it takes no
// click. As a toggle it looked like the two link rows around it and went
// nowhere, and on /faq and /talks a click shut the group and hid the link to
// the page the reader had open.
//
// A group that indexes the page the reader is on takes `anchor` as well. Its
// `href` is the route to that page, which is the page already open, so the
// click is a same-route navigation and Next.js holds the scroll position. The
// reader then clicks Overview from inside Ecosystem and nothing moves. The
// `anchor` gives that row an element on this page to reach instead.
//
// The item list is a prop so a standalone page can index its own contents
// instead of the homepage's.

export type RailItem = {
  /** Element id on the current page, and the React key. */
  id: string;
  /** Translation key to read for the label. */
  label: string;
  /** Set for a route. Omit for an in-page anchor. */
  href?: string;
  /**
   * Element id to reach when this group indexes the current page. It wins
   * over `href` there, because `href` points at the page already open.
   */
  anchor?: string;
  /**
   * Keeps a group open and takes the toggle off its row. Set it on a group
   * that names its children and has no page of its own.
   */
  alwaysOpen?: boolean;
  /** Set to render the item as a group. */
  children?: RailItem[];
};

// The homepage sections, in document order.
const OVERVIEW_CHILDREN: RailItem[] = [
  { id: "demo", label: "demo.navLabel" },
  { id: "why", label: "nav.why" },
  { id: "who", label: "nav.who" },
  { id: "how", label: "howItWorks.eyebrow" },
  { id: "coverage", label: "nav.coverage" },
  { id: "ecosystem", label: "ecosystem.eyebrow" },
  { id: "involved", label: "getInvolved.title" },
];

// The site index. Three rows shut, which is why the homepage sections nest
// rather than sit flat.
const HOME_ITEMS: RailItem[] = [
  {
    id: "overview",
    label: "nav.overview",
    href: "/",
    // The homepage hero. It is the section the other seven anchors sit under,
    // so Overview reaches the top of the page from anywhere on it.
    anchor: "top",
    children: OVERVIEW_CHILDREN,
  },
  {
    id: "resources",
    label: "nav.resources",
    // Two children and no page behind the row, so it stays open on every page.
    alwaysOpen: true,
    children: [
      { id: "blog", label: "nav.blog", href: "/blog" },
      { id: "talks", label: "nav.talks", href: "/talks" },
      { id: "faq", label: "nav.faq", href: "/faq" },
    ],
  },
  { id: "registry", label: "nav.registry", href: "/registry" },
];

/**
 * The same index for a page that is not the homepage. Every section anchor
 * becomes a route to the homepage's copy of it, because a bare `#why` on
 * /faq points at an element that does not exist there. A group keeps whatever
 * `href` it has, so Resources stays a label rather than becoming `/#resources`.
 *
 * A group loses its `anchor`, because that id names an element on the homepage
 * and this page does not hold it. The `href` route carries the reader there.
 */
const toAway = (item: RailItem): RailItem =>
  item.children
    ? { ...item, anchor: undefined, children: item.children.map(toAway) }
    : { ...item, href: item.href ?? `/#${item.id}` };

export const AWAY_ITEMS: RailItem[] = HOME_ITEMS.map(toAway);

/** Every item in the tree, parents included. */
const flatten = (items: RailItem[]): RailItem[] =>
  items.flatMap((item) => [
    item,
    ...(item.children ? flatten(item.children) : []),
  ]);

interface SiteShellProps {
  children: React.ReactNode;
  /** Defaults to the homepage index. Pass AWAY_ITEMS from another page. */
  navItems?: RailItem[];
  /**
   * Highlights this id and turns the scroll spy off. A page with no observable
   * sections of its own names its own rail entry instead.
   */
  activeId?: string | null;
}

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

export function SiteShell({
  children,
  navItems = HOME_ITEMS,
  activeId: activeIdProp,
}: SiteShellProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const isDesktop = useIsDesktop();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [spiedId, setSpiedId] = useState<string | null>(null);
  // Desktop only. The rail takes 264px, which is 18% of a 1440px viewport, so
  // the reader can give that width back to the content.
  const [collapsed, setCollapsed] = useState(false);
  // A group the reader opened or shut by hand. Absent means the group follows
  // the route. The choice survives client navigation on purpose.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const drawerRef = useRef<HTMLElement>(null);
  const drawerTriggerRef = useRef<HTMLButtonElement>(null);
  const collapseButtonRef = useRef<HTMLButtonElement>(null);
  const restoreButtonRef = useRef<HTMLButtonElement>(null);
  const previousCollapsed = useRef(false);

  const closeDrawer = useCallback((restoreFocus = false) => {
    setDrawerOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => drawerTriggerRef.current?.focus());
    }
  }, []);

  const spyOn = activeIdProp === undefined;
  const activeId = spyOn ? spiedId : activeIdProp;

  // Which group the reader is inside. A group of in-page anchors can only be
  // the homepage's own, so it opens whenever the rail is showing anchors.
  const openByRoute = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const item of navItems) {
      if (!item.children) continue;
      map[item.id] = item.children.some(
        (child) => !child.href || child.href === pathname,
      );
    }
    return map;
  }, [navItems, pathname]);

  // A group whose children are in-page anchors indexes this very page. It stays
  // open, because shutting it would hide the index of the page the reader is
  // on. On the homepage that group is Overview.
  const isLocked = (item: RailItem) =>
    item.alwaysOpen === true ||
    !!item.children?.some((child) => !child.href);

  const isOpen = (id: string) => toggled[id] ?? openByRoute[id] ?? false;
  // Read the previous value out of the updater argument, not the closure, so
  // two clicks batched into one render still land on the right state.
  const toggle = (id: string) =>
    setToggled((state) => ({
      ...state,
      [id]: !(state[id] ?? openByRoute[id] ?? false),
    }));

  // Highlight the section currently in view. Anchors only: a route has no
  // element on this page to observe. Read the whole tree, because the anchors
  // sit one level down under Overview.
  const anchorKey = flatten(navItems)
    .filter((item) => !item.href && !item.children)
    .map((item) => item.id)
    .join(",");

  useEffect(() => {
    if (!spyOn) return;
    const els = anchorKey
      .split(",")
      .filter(Boolean)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setSpiedId(visible.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [anchorKey, spyOn]);

  // The mobile rail behaves as a modal navigation surface. Move focus into
  // it on open, keep Tab within it, and return focus to its trigger on close.
  useEffect(() => {
    if (!drawerOpen) return;
    const drawer = drawerRef.current;
    if (!drawer) return;

    const getFocusable = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hidden && element.getClientRects().length > 0);

    const frame = window.requestAnimationFrame(() => getFocusable()[0]?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer(true);
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!drawer.contains(active)) {
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
  }, [drawerOpen, closeDrawer]);

  // A desktop collapse removes the focused control from the rail. Transfer
  // focus to the newly visible restore handle, and back to the collapse button.
  useEffect(() => {
    if (isDesktop && collapsed && !previousCollapsed.current) {
      window.requestAnimationFrame(() => restoreButtonRef.current?.focus());
    } else if (isDesktop && !collapsed && previousCollapsed.current) {
      window.requestAnimationFrame(() => collapseButtonRef.current?.focus());
    }
    previousCollapsed.current = collapsed;
  }, [collapsed, isDesktop]);

  // The mobile drawer should not remain open across a breakpoint change.
  useEffect(() => {
    if (!isDesktop || !drawerOpen) return;
    const frame = window.requestAnimationFrame(() => setDrawerOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [isDesktop, drawerOpen]);

  const railOffCanvas = isDesktop ? collapsed : !drawerOpen;
  const railStateClass = isDesktop
    ? collapsed
      ? "is-collapsed"
      : ""
    : drawerOpen
      ? "is-open"
      : "";

  // No `gap-*` here. A row that needs one sets it, because two gap utilities on
  // one element resolve by stylesheet order, not by the order they are written.
  const rowBase =
    "flex items-center justify-between py-[9px] text-body transition-colors";
  // The arrow gutter is w-3 plus gap-1.5. A top-level row without an arrow
  // pads by the same amount so Registry lines up with Overview and Resources.
  const leafRow = `${rowBase} ps-[18px]`;
  const childRowBase =
    "flex items-center justify-between py-[7px] text-small transition-colors";
  const tone = (active: boolean) =>
    active ? "text-p-primary" : "text-p-ink hover:text-p-primary";

  // U+25BE points down, which reads the same in both directions, so only the
  // shut state needs an RTL variant.
  const arrow = (open: boolean) => (
    <span
      aria-hidden="true"
      className={`text-[9px] leading-none transition-transform duration-200 ${
        open ? "" : "-rotate-90 rtl:rotate-90"
      }`}
    >
      &#9662;
    </span>
  );

  const renderLeaf = (item: RailItem, base: string) => {
    const active = activeId === item.id;
    const className = `${base} ${tone(active)}`;
    return item.href ? (
      <Link
        href={item.href}
        onClick={() => closeDrawer()}
        aria-current={active ? "page" : undefined}
        className={className}
      >
        {t(item.label)}
      </Link>
    ) : (
      <a
        href={`#${item.id}`}
        onClick={() => closeDrawer()}
        aria-current={active ? "true" : undefined}
        className={className}
      >
        {t(item.label)}
      </a>
    );
  };

  const gutter = "inline-flex h-6 w-3 shrink-0 items-center justify-center";

  const renderGroup = (item: RailItem) => {
    const locked = isLocked(item);
    const open = locked || isOpen(item.id);
    const listId = `rail-group-${item.id}`;
    const active = activeId === item.id;
    const children = item.children ?? [];

    return (
      <>
        {locked ? (
          // The arrow still marks the group and its open state. It is a plain
          // span, not a button, because this group does not shut.
          <div className="flex items-center gap-1.5">
            <span className={`${gutter} text-p-ink-3`}>{arrow(true)}</span>
            {item.anchor ? (
              // This group indexes the open page, so the row is an in-page
              // anchor like its own children. Its route `href` cannot move the
              // reader here, because it names the page they are already on.
              <a
                href={`#${item.anchor}`}
                onClick={() => closeDrawer()}
                aria-current={active ? "true" : undefined}
                className={`flex-1 ${rowBase} ${tone(active)}`}
              >
                {t(item.label)}
              </a>
            ) : item.href ? (
              <Link
                href={item.href}
                onClick={() => closeDrawer()}
                aria-current={active ? "page" : undefined}
                className={`flex-1 ${rowBase} ${tone(active)}`}
              >
                {t(item.label)}
              </Link>
            ) : (
              <span className={`flex-1 ${rowBase} ${tone(false)}`}>
                {t(item.label)}
              </span>
            )}
          </div>
        ) : item.href ? (
          // Two hit targets. The arrow opens the group, the label navigates.
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={open}
              aria-controls={listId}
              aria-label={t("nav.toggleGroup", { section: t(item.label) })}
              className={`${gutter} text-p-ink-3 transition-colors hover:text-p-primary`}
            >
              {arrow(open)}
            </button>
            <Link
              href={item.href}
              onClick={() => closeDrawer()}
              aria-current={active ? "page" : undefined}
              className={`flex-1 ${rowBase} ${tone(active)}`}
            >
              {t(item.label)}
            </Link>
          </div>
        ) : (
          // Label only, so the whole row toggles.
          <button
            type="button"
            onClick={() => toggle(item.id)}
            aria-expanded={open}
            aria-controls={listId}
            className={`w-full gap-1.5 text-start ${rowBase} ${tone(false)}`}
          >
            <span className={`${gutter} text-p-ink-3`}>
              {arrow(open)}
            </span>
            <span className="flex-1">{t(item.label)}</span>
          </button>
        )}

        {/* Rendered while shut so aria-controls always resolves. */}
        <ul
          id={listId}
          hidden={!open}
          className="ms-[6px] border-s border-dashed border-p-line-soft ps-[22px]"
        >
          {children.map((child) => (
            <li key={child.id}>{renderLeaf(child, childRowBase)}</li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-p-bg font-sans">
      {/* Mobile drawer scrim */}
      <div
        onClick={() => closeDrawer(true)}
        aria-hidden="true"
        className={`fixed inset-0 z-[39] bg-[rgba(22,23,15,0.32)] transition-opacity md:hidden ${
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* The rail */}
      <nav
        id="site-rail"
        ref={drawerRef}
        aria-label={t("nav.homeAria")}
        inert={railOffCanvas || undefined}
        className={`site-rail ${railStateClass} fixed inset-y-0 start-0 z-40 flex flex-col w-[min(86vw,320px)] md:w-[var(--p-rail)] bg-p-bg border-e border-p-line`}
      >
        <Link
          href="/"
          aria-label={t("nav.homeAria")}
          onClick={() => closeDrawer()}
          className="flex items-center px-[22px] py-5 border-b border-p-line"
        >
          <PortolanLogo size={26} />
        </Link>

        <div className="flex-1 overflow-y-auto py-3.5">
          <ul className="px-[22px]">
            {navItems.map((item) => (
              <li key={item.id}>
                {item.children ? renderGroup(item) : renderLeaf(item, leafRow)}
              </li>
            ))}
          </ul>
        </div>

        {/* Locale control and the collapse button share the foot row. */}
        <div className="border-t border-p-line px-[22px] py-3.5 flex items-center justify-between gap-2">
          <LocaleSwitcher />
          <button
            ref={collapseButtonRef}
            type="button"
            onClick={() => setCollapsed(true)}
            aria-controls="site-rail"
            aria-expanded={!collapsed}
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
          ref={restoreButtonRef}
          type="button"
          onClick={() => setCollapsed(false)}
          aria-controls="site-rail"
          aria-expanded={false}
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
          ref={drawerTriggerRef}
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-controls="site-rail"
          aria-expanded={drawerOpen}
          className="font-mono text-eyebrow uppercase tracking-[0.1em] border border-p-line px-3 py-1.5 text-p-ink hover:bg-p-bg-soft"
        >
          {t("nav.index")}
        </button>
      </div>

      <div className="site-main" inert={drawerOpen || undefined}>
        <main>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
