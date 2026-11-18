"use client";

import type { ReactNode } from "react";

// The header of every page that is not the homepage.
//
// It is not a color band. The title and the text under it are on the page
// ground, and one `--p-line` rule closes the block. The top bar closes with
// the same rule, so the title sits between two rules. The ink bands are for
// the homepage only.
//
// The header owns the page's <h1>. Do not set a second one in the body
// below.

interface PageHeroProps {
  title: ReactNode;
  /** Second line of a two-part headline, set lighter and one step down. */
  subtitle?: ReactNode;
  /** Small line above the title, such as a date. */
  eyebrow?: ReactNode;
  /** Anything that follows the headline inside the band. */
  children?: ReactNode;
}

export function PageHero({ title, subtitle, eyebrow, children }: PageHeroProps) {
  return (
    <section className="border-b border-p-line">
      <div className="px-[var(--p-pad-section-x)] pb-[clamp(32px,4vw,56px)] pt-[clamp(40px,5vw,72px)]">
        <div className="mx-auto max-w-[1240px]">
          {eyebrow && (
            <div className="mb-3 text-small text-p-ink-3">
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
