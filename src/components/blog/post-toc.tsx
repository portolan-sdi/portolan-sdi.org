"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Heading } from "@/lib/headings";

// "In this article": the post's `##` sections, pinned in the margin beside
// the body from `xl` up, with the section in view marked.
//
// It shares the margin column with figure captions, at the same 18rem width,
// and sits above them. Its backing is the page color at 90%, so a caption
// scrolling past reads as passing behind it. The column that holds it spans
// the whole body and lets clicks through, so only the list takes the pointer.
//
// The parent must be the body's measure with `position: relative`. The box
// hangs off that column's inline-end edge.

interface PostTocProps {
  sections: Heading[];
}

export function PostToc({ sections }: PostTocProps) {
  const t = useTranslations("blog");
  const [current, setCurrent] = useState<string | null>(null);
  const key = sections.map((s) => s.id).join(",");

  // The current section is the last heading above 40% of the viewport.
  useEffect(() => {
    const els = key
      .split(",")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      const passed = els.filter((el) => el.getBoundingClientRect().top <= line);
      setCurrent(passed.length ? passed[passed.length - 1].id : null);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [key]);

  if (sections.length < 2) return null;

  return (
    <div className="pointer-events-none absolute inset-y-0 start-full z-10 ms-6 hidden w-72 xl:block">
      <nav
        aria-label={t("inThisArticle")}
        className="pointer-events-auto sticky top-8 bg-p-bg/90 py-3"
      >
        <p className="font-mono text-eyebrow text-p-ink-3">
          {t("inThisArticle")}
        </p>
        {/* The headings are English, like the body, so the list stays
            left to right in every locale. */}
        <ul dir="ltr" className="mt-3 border-s border-p-line-soft">
          {sections.map(({ id, text }) => {
            const active = id === current;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  aria-current={active ? "location" : undefined}
                  className={`-ms-px block border-s-2 py-1 ps-3 text-small leading-snug text-pretty transition-colors ${
                    active
                      ? "border-p-primary text-p-primary"
                      : "border-transparent text-p-ink-3 hover:text-p-ink"
                  }`}
                >
                  {text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
