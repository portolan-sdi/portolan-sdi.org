"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { DirArrow } from "../ui";

// A live web page inside a post, a tutorial, or a case study, such as a map
// explorer.
//
// The figure has the layout of every other figure: the width of the text,
// with the caption beside it. `span` makes the figure as wide as the page
// column from 1024px, and the frame then takes that share of the row. The
// live page renders at least `width` by `height`, and the figure scales the
// whole page down to fit a smaller frame. So the page keeps its desktop
// layout, and its panels keep their share of the map. A larger frame shows
// the page at its real size, with no scale.
//
// Two square controls sit in the top-left corner of the frame, in the style
// of the buttons on the homepage registry map. One shows the page at its
// real size on the whole screen. It shows only where the browser can do
// that. The other opens the page itself in a new tab.

interface PostEmbedProps {
  /** Figure number, written by the post author. */
  n: number;
  caption: string;
  /** The URL of the live page. */
  src: string;
  /** The title of the iframe, for a screen reader. */
  title: string;
  /** The name of the link to the page itself, such as "Open the explorer". */
  linkLabel: string;
  /** The URL that the link opens. The default is `src`. */
  href?: string;
  /** The share of the page column for the frame, from 1024px. */
  span?: "2/3" | "3/4";
  /** The smallest size in CSS pixels at which the page renders. */
  width?: number;
  height?: number;
}

const CONTROL =
  "flex h-9 w-9 items-center justify-center border border-p-line bg-p-paper text-p-ink-2 transition-colors hover:bg-p-bg-soft hover:text-p-ink";

const noSubscribe = () => () => {};

function onFullscreenChange(callback: () => void) {
  document.addEventListener("fullscreenchange", callback);
  return () => document.removeEventListener("fullscreenchange", callback);
}

export function PostEmbed({
  n,
  caption,
  src,
  title,
  linkLabel,
  href = src,
  span,
  width = 1200,
  height = 800,
}: PostEmbedProps) {
  const t = useTranslations("blog");
  const frame = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  // The width of the frame. The text column is about 612px wide, so the
  // first render starts near it. The observer then sets the exact value.
  const [box, setBox] = useState(612);
  const scale = Math.min(1, box / width);
  const pageWidth = Math.max(box, width);
  const pageHeight = (pageWidth * height) / width;

  // An iPhone has no full screen for an element. The button then stays out,
  // and the link remains. The server renders no button.
  const canFull = useSyncExternalStore(
    noSubscribe,
    () => document.fullscreenEnabled === true,
    () => false,
  );
  const full = useSyncExternalStore(
    onFullscreenChange,
    () => frame.current !== null && document.fullscreenElement === frame.current,
    () => false,
  );

  useEffect(() => {
    const el = view.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.current?.requestFullscreen();
  }, []);

  const fullLabel = full ? t("embed.exitFullScreen") : t("embed.fullScreen");
  const spanClass = span ? ` post-embed-span-${span === "2/3" ? "2-3" : "3-4"}` : "";

  return (
    <figure dir="ltr" className={`post-figure my-10${spanClass}`}>
      <div
        ref={frame}
        className="post-media-frame relative overflow-hidden border border-p-line bg-p-bg"
      >
        <div
          ref={view}
          className={full ? "relative h-full" : "relative overflow-hidden"}
          style={full ? undefined : { aspectRatio: `${width} / ${height}` }}
        >
          <iframe
            src={src}
            title={title}
            loading="lazy"
            allow="fullscreen"
            allowFullScreen
            className="absolute left-0 top-0 block border-0"
            style={
              full
                ? { width: "100%", height: "100%" }
                : {
                    width: pageWidth,
                    height: pageHeight,
                    transform: `scale(${scale})`,
                    transformOrigin: "0 0",
                  }
            }
          />
        </div>
        <div className="absolute left-3 top-3 z-10 flex gap-2">
          {canFull && (
            <button
              type="button"
              onClick={toggleFull}
              aria-label={fullLabel}
              title={fullLabel}
              className={`${CONTROL} cursor-pointer`}
            >
              {/* Four square corners. They point out to enter the full
                  screen and in to leave it. */}
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              >
                <path
                  d={
                    full
                      ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
                      : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                  }
                />
              </svg>
            </button>
          )}
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={linkLabel}
            title={linkLabel}
            className={`${CONTROL} text-body`}
          >
            <DirArrow kind="external" />
          </a>
        </div>
      </div>

      <figcaption className="flex items-baseline gap-3 border border-p-line px-4 py-3">
        <span className="shrink-0 text-small text-p-ink-3">
          {t("figureLabel", { n })}
        </span>
        <span className="text-small leading-[1.55] text-p-ink-2 text-pretty">
          {caption}
        </span>
      </figcaption>
    </figure>
  );
}
