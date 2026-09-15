"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// A short screen recording that loops, inside the frame PostFigure draws.
//
// These figures start as GIF captures. An MP4 and WebM pair carries the same
// picture for about a tenth of the bytes. The pair also keeps the one property
// a GIF has: it runs as soon as the reader reaches it. The element carries no
// audio track and stays muted, which is what lets a browser start it.
//
// VideoFigure (src/components/video-figure.tsx) is the other player on the
// site. It stays separate because it holds the opposite contract. It plays a
// long recording that the reader starts, scrubs, and takes full screen. A loop
// here has no controls and no sound.
//
// The file loads when the figure nears the viewport, not when the page loads.
// A reader who stops at the third paragraph downloads no video. The loop also
// pauses when it leaves the viewport.
//
// A reader who asks for reduced motion gets the poster frame and a play
// button. The button also appears when a browser refuses to start the video.

interface PostLoopFigureProps {
  /** Figure number, written by the post author. */
  n: number;
  caption: string;
  /** Path to the WebM under `public/video/`. Chrome and Firefox take this. */
  webm: string;
  /** Path to the MP4 under `public/video/`. Safari takes this. */
  mp4: string;
  /** Poster frame. It paints before the video loads. */
  poster: string;
  /** CSS aspect-ratio for the frame. It reserves the box before the load. */
  ratio: string;
  /** A text equivalent of the recording, for readers who cannot see it. */
  description: string;
}

export function PostLoopFigure({
  n,
  caption,
  webm,
  mp4,
  poster,
  ratio,
  description,
}: PostLoopFigureProps) {
  const t = useTranslations("blog");
  const tDemo = useTranslations("demo");
  const descriptionId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const figureRef = useRef<HTMLElement>(null);

  // The server renders the paused state. The effect below starts the video, so
  // the markup never claims a state the browser has not reached.
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const figure = figureRef.current;
    if (!video || !figure) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!still.matches) void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(figure);

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      observer.disconnect();
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  return (
    <figure ref={figureRef} dir="ltr" className="post-figure my-10">
      <div className="post-media-frame relative overflow-hidden border border-p-line bg-p-paper">
        <video
          ref={videoRef}
          loop
          muted
          playsInline
          preload="none"
          poster={poster}
          aria-describedby={descriptionId}
          className="block w-full"
          style={{ aspectRatio: ratio, objectFit: "cover" }}
        >
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" />
        </video>

        {!playing && (
          <button
            type="button"
            onClick={() => void videoRef.current?.play().catch(() => {})}
            aria-label={tDemo("play")}
            className="absolute inset-0 flex items-center justify-center group cursor-pointer"
          >
            <span className="flex items-center justify-center bg-p-primary text-p-on-primary w-16 h-16 transition-colors duration-150 group-hover:bg-p-primary-ink">
              <svg width="22" height="22" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2 1 L13 7 L2 13 Z" fill="currentColor" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <figcaption className="flex items-baseline gap-3 border border-p-line px-4 py-3">
        <span className="shrink-0 font-mono text-eyebrow uppercase tracking-[0.08em] text-p-ink-3">
          {t("figureLabel", { n })}
        </span>
        <span className="text-small leading-[1.55] text-p-ink-2 text-pretty">
          {caption}
        </span>
      </figcaption>

      <p id={descriptionId} className="sr-only">
        {description}
      </p>
    </figure>
  );
}
