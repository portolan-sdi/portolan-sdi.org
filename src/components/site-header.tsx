"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PortolanLogo } from "./portolan-logo";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { DirArrow } from "./ui";

// "GitHub" is a product name and stays Latin in every locale, so it carries a
// literal label instead of a translation key.
const navLinks = [
  { href: "/#registry", key: "registry" },
  {
    href: "https://portolan-sdi.github.io/portolan-cli",
    key: "docs",
    external: true,
  },
  {
    href: "https://github.com/portolan-sdi",
    label: "GitHub",
    external: true,
  },
] as const;

type NavLink = (typeof navLinks)[number];

export function SiteHeader() {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function linkLabel(link: NavLink) {
    return "label" in link ? link.label : t(`nav.${link.key}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-p-line bg-p-bg">
      <div className="flex items-center justify-between px-[var(--p-pad-section-x)] py-4">
        <Link href="/" aria-label={t("nav.homeAria")}>
          <PortolanLogo size={28} />
        </Link>
        <nav className="hidden md:flex gap-7 text-small text-p-ink-2">
          {navLinks.map((link) => {
            const isExternal = "external" in link && link.external;
            const className = "text-inherit hover:text-p-ink transition-colors";
            const content = (
              <>
                {linkLabel(link)}
                {isExternal ? <> <DirArrow kind="external" /></> : null}
              </>
            );
            return isExternal ? (
              <a key={link.href} href={link.href} className={className}>
                {content}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className={className}>
                {content}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          <button
            type="button"
            aria-label={t("nav.menuAria")}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-[var(--p-r-md)] text-p-ink-2 transition-colors hover:bg-p-bg-soft hover:text-p-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>
      <nav
          id="mobile-nav"
          className={`md:hidden flex-col px-[var(--p-pad-section-x)] pb-4 gap-1 border-t border-p-line-soft bg-p-bg ${open ? "flex" : "hidden"}`}
        >
          {navLinks.map((link) => {
            const isExternal = "external" in link && link.external;
            const className =
              "py-2.5 text-body-lg text-p-ink-2 hover:text-p-ink transition-colors";
            const content = (
              <>
                {linkLabel(link)}
                {isExternal ? <> <DirArrow kind="external" /></> : null}
              </>
            );
            return isExternal ? (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={className}
              >
                {content}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </nav>
    </header>
  );
}
