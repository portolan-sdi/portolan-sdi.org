"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { COMMUNITY_LINKS, SPEC_URL } from "@/lib/site";
import { PageHero } from "./page-hero";
import { FAQ_ITEMS as ITEMS } from "@/lib/faq";
import { AWAY_ITEMS, SiteShell } from "./site-rail";
import { monoChunk } from "./ui";

// Frequently asked questions.
//
// Eight objections, one disclosure row each. Native <details> carrying a
// shared `name`, so the browser opens one at a time with no JavaScript and
// every answer stays in the DOM for in-page search, print, and crawlers.
//
// The page spends its whole motion budget on the disclosure itself. There is
// no scroll reveal: the homepage already authors entrances, and a second
// generic one here would be decoration rather than a moment.
//
// The rail keeps the site index and highlights its own FAQ entry. Listing the
// eight questions there restated the page and told the reader nothing the page
// did not already show.

const RASHID_URL = "https://github.com/portolan-sdi/rashid";

const KEYS = new Set<string>(ITEMS.map((item) => item.key));

// Inline links inside translated prose. The tags are part of the message
// contract and carry the same span in every locale.
function inlineLink(href: string, mono = false) {
  return function link(chunks: ReactNode) {
    return (
      <a
        href={href}
        className={`text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink ${
          mono ? "font-mono" : ""
        }`}
      >
        {chunks}
      </a>
    );
  };
}

// Plus that becomes a minus. Drawn from two rules in the page's own ink rather
// than set as a glyph, so it carries the same weight as the row rules and can
// animate the vertical stroke away on open.
function DisclosureMark() {
  return (
    <svg
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
      className="mt-[7px] h-3.5 w-3.5 shrink-0 text-p-ink-3 transition-colors duration-200 group-hover/row:text-p-primary group-open/row:text-p-primary"
    >
      <line
        x1="0"
        y1="7"
        x2="14"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="7"
        y1="0"
        x2="7"
        y2="14"
        stroke="currentColor"
        strokeWidth="1.5"
        className="origin-center transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-open/row:scale-y-0 motion-reduce:transition-none"
      />
    </svg>
  );
}

export function FaqPage() {
  const t = useTranslations("faq");
  // The first answer is open on arrival, so the page opens as a page rather
  // than as a list of closed rows. It is also the question that frames the
  // rest: what Portolan adds on top of the standards it builds on.
  const [openId, setOpenId] = useState<string | null>(ITEMS[0].key);

  // A link to /faq#lockIn, from the rail or from anywhere else, opens that
  // answer and scrolls to it. `hashchange` covers later clicks; the first run
  // covers arriving with the hash already set.
  const pendingScroll = useRef<{ id: string; smooth: boolean } | null>(null);
  // The row the reader arrived on. It opens without the height animation, so
  // the page has its final height before the scroll measures it. Animating it
  // instead left the scroll 54px down a page that had not grown yet, because
  // the document can only scroll as far as its collapsed height allows.
  const [arrivalId, setArrivalId] = useState<string | null>(null);

  useEffect(() => {
    // An arrival is instant: the reader followed a link to this answer and
    // expects to be there already. A later run is a click from the rail, where
    // the movement shows the reader where the page went, so that one animates.
    let smooth = false;
    const apply = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (KEYS.has(id)) {
        pendingScroll.current = { id, smooth };
        if (!smooth) setArrivalId(id);
        setOpenId(id);
      }
      smooth = true;
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  // Scrolling waits for the row to be open, so it measures the expanded
  // height. Running it inside the hash handler instead put the scroll before
  // React committed, and the router's own scroll restoration then undid it.
  useEffect(() => {
    const pending = pendingScroll.current;
    if (!pending || openId !== pending.id) return;
    pendingScroll.current = null;
    // Two frames: the first commits the open row, the second measures a page
    // that has already grown by its height.
    const outer = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        document.getElementById(pending.id)?.scrollIntoView({
          behavior: pending.smooth && !reduced ? "smooth" : "auto",
          block: "start",
        });
        // Hand the row back its animation now that the scroll has landed.
        setArrivalId(null);
      });
    });
    return () => cancelAnimationFrame(outer);
  }, [openId]);

  const handleToggle = useCallback(
    (key: string) => (event: React.SyntheticEvent<HTMLDetailsElement>) => {
      const isOpen = event.currentTarget.open;
      // The shared `name` makes the browser close the previous row, which
      // fires a second toggle. The functional form keeps that late close from
      // clearing the row the reader just opened.
      setOpenId((prev) => (isOpen ? key : prev === key ? null : prev));

      // A row closed by hand while the hash still names it would swallow the
      // next click on its own rail link, because the hash would not change.
      if (!isOpen && window.location.hash.slice(1) === key) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
    },
    [],
  );

  return (
    <SiteShell navItems={AWAY_ITEMS} activeId="faq">
      <PageHero title={t("title")} />

      <section className="px-[var(--p-pad-section-x)] pb-[var(--p-pad-section-y)] pt-[clamp(28px,3.5vw,48px)]">
        <div className="mx-auto max-w-[1240px]">
          {/* The rows run the full content column, like every other section
              on the site. */}
          <div className="border-t border-p-line">
            {ITEMS.map(({ key, paras }) => (
              <details
                key={key}
                id={key}
                name="faq"
                open={openId === key}
                onToggle={handleToggle(key)}
                data-instant={arrivalId === key ? "true" : undefined}
                className="faq-row group/row scroll-mt-[76px] border-b border-p-line md:scroll-mt-6"
              >
                <summary
                  className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--p-primary)_4%,var(--p-paper))] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-p-primary"
                >
                  <h2 className="text-card-title font-bold leading-[1.3] tracking-[-0.02em] text-pretty transition-colors duration-200 group-hover/row:text-p-primary-ink group-open/row:text-p-primary-ink">
                    {t(`items.${key}.q`)}
                  </h2>
                  <DisclosureMark />
                </summary>

                <div className="pb-8">
                  {Array.from({ length: paras }, (_, i) => (
                    <p
                      key={i}
                      className={`text-body leading-[1.7] text-p-ink-2 text-pretty ${
                        i === 0 ? "" : "mt-4"
                      }`}
                    >
                      {t.rich(`items.${key}.p${i + 1}`, {
                        m: monoChunk,
                        spec: inlineLink(SPEC_URL),
                        rashid: inlineLink(RASHID_URL, true),
                        roadmap: inlineLink(COMMUNITY_LINKS.roadmap),
                      })}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
