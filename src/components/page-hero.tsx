"use client";

import type { ReactNode } from "react";
import { GlyphMap } from "./glyph-map";

// The header band on every page that is not the homepage.
//
// It is the homepage hero, shortened and held still. The same glyph relief
// map, the same scrim, the same headline treatment. Two things differ. The
// band is shorter, because a secondary page has to show its content sooner.
// And the map does not drift, because the homepage carries the one moving
// element on the site.
//
// The band owns the page's <h1>. Do not set a second one in the body below.

interface PageHeroProps {
  title: ReactNode;
  /** Second line of a two-part headline, set lighter and one step down. */
  subtitle?: ReactNode;
  /** Mono line above the title, such as a date. */
  eyebrow?: ReactNode;
  /** Anything that follows the headline inside the band. */
  children?: ReactNode;
}

export function PageHero({ title, subtitle, eyebrow, children }: PageHeroProps) {
  return (
    <section className="relative isolate overflow-hidden border-b border-p-line">
      <GlyphMap className="absolute inset-0 h-full w-full" still />
      <div
        className="absolute inset-0"
        style={{ background: "var(--hero-scrim)" }}
      />

      <div className="relative z-10 px-[var(--p-pad-section-x)] pb-[clamp(32px,4vw,56px)] pt-[clamp(40px,5vw,72px)]">
        <div className="mx-auto max-w-[1240px]">
          {eyebrow && (
            <div className="mb-3 font-mono text-eyebrow uppercase tracking-[0.06em] text-p-ink-3">
              {eyebrow}
            </div>
          )}

          {/* The subtitle sits inside the h1 so it inherits the heading font
              and differs only in weight and size. */}
          <h1 className="text-section leading-[1.05] tracking-[-0.03em] rtl:tracking-normal text-balance">
            <span className="block font-extrabold">{title}</span>
            {subtitle && (
              <span className="mt-3 block text-feature font-normal leading-[1.2] text-p-ink-2">
                {subtitle}
              </span>
            )}
          </h1>

          {children}
        </div>
      </div>
    </section>
  );
}
