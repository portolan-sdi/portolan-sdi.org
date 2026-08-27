"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Ltr } from "./ui";

// Native language names are always shown in their own language, so they are not
// translated. Order follows routing.locales (en, es, ar).
const NATIVE_NAMES: Record<Locale, string> = {
  en: "English",
  es: "Español",
  ar: "العربية",
};

export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const buttonId = "locale-switcher-button";
  const menuId = "locale-switcher-menu";

  useEffect(() => {
    if (!open) return;

    const currentIndex = routing.locales.indexOf(locale);
    const initialIndex = currentIndex >= 0 ? currentIndex : 0;
    // The menu mounts with the open state. Move focus into it after the links
    // exist, as the menu keyboard pattern requires.
    const frame = window.requestAnimationFrame(() => {
      setFocusedIndex(initialIndex);
      itemRefs.current[initialIndex]?.focus();
    });

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, locale]);

  const focusItem = (index: number) => {
    const next = (index + routing.locales.length) % routing.locales.length;
    setFocusedIndex(next);
    itemRefs.current[next]?.focus();
  };

  const onItemKeyDown = (e: ReactKeyboardEvent<HTMLAnchorElement>, index: number) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusItem(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusItem(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(routing.locales.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        // Tab leaves a menu. Do not trap it, but close the popup as it exits.
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-label={t("nav.languageAria")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 h-8 px-2 rounded-[var(--p-r-md)] text-small text-p-ink-2 transition-colors hover:bg-p-bg-soft hover:text-p-ink"
      >
        {/* No globe. Nav items in the rail carry no icons, and this control
            sits among eight of them. The locale code names it. */}
        <Ltr>{locale.toUpperCase()}</Ltr>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={open ? "transition-transform rotate-180" : "transition-transform"}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          className="absolute start-0 bottom-full mb-2 min-w-40 py-1 rounded-[var(--p-r-md)] border border-p-line-soft bg-p-bg shadow-[var(--p-shadow-md)] text-small z-50"
        >
          {routing.locales.map((loc, index) => {
            const isActive = loc === locale;
            return (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                role="menuitem"
                tabIndex={focusedIndex === index ? 0 : -1}
                aria-current={isActive ? "true" : undefined}
                dir={loc === "ar" ? "rtl" : "ltr"}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                onKeyDown={(e) => onItemKeyDown(e, index)}
                onClick={() => setOpen(false)}
                className={
                  "flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-p-bg-soft " +
                  (isActive ? "text-p-ink" : "text-p-ink-2 hover:text-p-ink")
                }
              >
                <span>{NATIVE_NAMES[loc]}</span>
                {isActive ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
