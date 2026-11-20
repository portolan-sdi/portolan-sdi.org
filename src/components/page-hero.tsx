"use client";

import type { ReactNode } from "react";

// The header of every page that is not the homepage.
//
// It is a picture band, with the same treatment as the "Why Portolan" band
// of the homepage. A grayscale night photograph of Buenos Aires sits on
// `--p-ink`, and a `--p-primary` layer multiplies over it. So the city
// lights are blue, the dark stays ink, and no pixel is lighter than
// `--p-primary`. White text on `--p-primary` is 5.3:1, so the text clears
// 4.5:1 over every part of the picture. The picture is decorative, and it
// never mirrors in RTL. Its credit is in README.md.
//
// Everything in the band is `--p-on-primary`. A page passes a lead, a
// note, or a link as children with the colors of the page ground, so the
// band sets the color of every descendant. A link in the band is
// underlined on hover, because it cannot change color.
//
// The header owns the page's <h1>. Do not set a second one in the body
// below.

const BAND_IMAGE = "/img/home/buenos-aires-night.webp";

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
    <section className="relative isolate overflow-hidden border-b border-p-line bg-p-ink text-p-on-primary [&_*]:text-p-on-primary! [&_a:hover]:underline [&_a]:underline-offset-4 [&_a]:outline-p-on-primary">
      {/* The header is at the top of the page, so the picture loads with
          the page and not lazily. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BAND_IMAGE}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-p-primary mix-blend-multiply"
      />
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
