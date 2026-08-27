"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * A recorded run, framed and captioned. The site plays two of them, so the
 * player lives here and each call site brings its own file, poster, shape and
 * caption.
 *
 * The player is ours rather than the browser's. Native `controls` paint a
 * rounded translucent bar with a pill scrubber and a volume slider. The volume
 * slider is the plain error, because neither recording carries audio. The rest
 * fights every rule this site keeps: square corners, flat surfaces, black
 * rules, mono labels. So the element runs without `controls` and the bar below
 * it is built from the same parts as the rest of the page.
 *
 * The bar sits under the image rather than over it. An overlay needs a
 * gradient scrim to stay readable, and a scrim is the glassy surface the
 * design system bans.
 *
 * Nothing autoplays. A reader who scrolls past downloads the poster and
 * nothing else, which is what `preload="none"` buys: only the reader who
 * presses play pays for the video.
 *
 * The aria labels come from the shared `demo` block, so both players name
 * their controls the same way in all three locales.
 */

interface VideoFigureProps {
  /** Path to the MP4 under `public/video/`. */
  src: string;
  /** Path to the poster frame. It paints before the reader presses play. */
  poster: string;
  /**
   * The encoded aspect ratio, as a CSS `aspect-ratio` value. It reserves the
   * box before metadata loads, so the poster does not shift the page when it
   * paints. It rides a custom property rather than an inline style, so the
   * full-screen rules in `globals.css` can override it by normal specificity.
   */
  ratio: string;
  /**
   * The caption under the frame, rendered by the caller from its own key.
   * Optional: a figure whose surrounding copy already names what the run
   * shows needs no line under it repeating the same thing.
   */
  caption?: ReactNode;
  /**
   * A text equivalent for the video-only recording. It is exposed in a
   * disclosure so readers can follow the terminal session without sight of
   * the video.
   */
  description?: ReactNode;
  /**
   * Classes on the `figure`. The caller owns the width and the gaps, because
   * one player centers at a fixed 620px and the other fills a grid column.
   */
  className?: string;
}

/** mm:ss. Neither demo runs past a minute and a half, so no hour field. */
function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function VideoFigure({
  src,
  poster,
  ratio,
  caption,
  description,
  className = "",
}: VideoFigureProps) {
  const t = useTranslations("demo");
  const descriptionId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [full, setFull] = useState(false);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setStarted(true);
      void video.play();
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setTime(value);
  }, []);

  const fullscreen = useCallback(() => {
    // The wrapper, not the video: full screen on the element keeps our own bar
    // on screen. Full screen on the video hands control back to the browser.
    // The frame then has to fit the picture itself, which globals.css does.
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }
    const frame = frameRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void })
      | null;
    if (!frame) return;
    if (frame.requestFullscreen) void frame.requestFullscreen();
    else frame.webkitRequestFullscreen?.();
  }, []);

  // The reader can also leave full screen with Escape or the browser's own
  // control, so the button label follows the document rather than the click.
  // Two players share the document, so the check names this frame.
  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // The element is the source of truth. It also changes state on its own, from
  // the keyboard, from the media keys, or when the file ends.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setStarted(true);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onTime = () => setTime(video.currentTime);
    const onMeta = () => setDuration(video.duration);
    const onEnded = () => {
      setPlaying(false);
      setStarted(false);
      video.currentTime = 0;
      setTime(0);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("ended", onEnded);
    };
  }, []);

  const progress = duration > 0 ? (time / duration) * 100 : 0;

  return (
    // No width of its own. Both sources are near-square, so a player that
    // filled the 1240px column would stand about 1120px tall and push the
    // caption off screen. Each call site caps it instead.
    <figure className={`m-0 ${className}`}>
      {/* Both recordings capture an LTR interface, and so does the bar that
          controls them: a scrub track that ran end-to-start would read against
          the picture above it. The whole frame pins LTR. The caption below
          sits outside the pin and follows the page. */}
      <div
        ref={frameRef}
        dir="ltr"
        className="demo-frame border border-p-line bg-p-paper"
      >
        <div className="demo-stage relative">
          <video
            ref={videoRef}
            playsInline
            preload="none"
            poster={poster}
            onClick={toggle}
            style={{ "--demo-ratio": ratio } as CSSProperties}
            aria-describedby={description ? descriptionId : undefined}
            className="demo-media block w-full h-auto cursor-pointer bg-p-paper"
          >
            <source src={src} type="video/mp4" />
          </video>

          {/* One square block on the poster, and nothing at all once the
              video runs. A persistent overlay would sit on top of the
              content the reader pressed play to see. */}
          {!started && (
            <button
              type="button"
              onClick={toggle}
              aria-label={t("play")}
              className="absolute inset-0 flex items-center justify-center group cursor-pointer"
            >
              {/* The glyph alone. A label here says what the triangle
                  already says, in a second typeface, over the picture. */}
              <span className="flex items-center justify-center bg-p-primary text-p-on-primary w-16 h-16 transition-colors duration-150 group-hover:bg-p-primary-ink">
                <PlayGlyph size={22} />
              </span>
            </button>
          )}
        </div>

        {/* The bar appears with the first press. Before that there is no
            position to show and nothing to pause. */}
        {started && (
          <div className="flex items-center gap-3 border-t border-p-line px-3 py-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? t("pause") : t("play")}
              className="shrink-0 text-p-ink transition-colors duration-150 hover:text-p-primary cursor-pointer"
            >
              {playing ? <PauseGlyph /> : <PlayGlyph />}
            </button>

            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.05}
              value={time}
              onChange={(event) => seek(Number(event.target.value))}
              aria-label={t("seek")}
              className="demo-scrub w-full min-w-0 flex-1"
              style={{
                background: `linear-gradient(to right, var(--p-primary) ${progress}%, var(--p-line-soft) ${progress}%) center / 100% 2px no-repeat`,
              }}
            />

            {/* Tabular figures so the row does not twitch every second. */}
            <span className="shrink-0 font-mono text-eyebrow text-p-ink-3 tabular-nums">
              {clock(time)} / {clock(duration)}
            </span>

            <button
              type="button"
              onClick={fullscreen}
              aria-label={full ? t("exitFullscreen") : t("fullscreen")}
              className="shrink-0 text-p-ink transition-colors duration-150 hover:text-p-primary cursor-pointer"
            >
              <FullscreenGlyph exit={full} />
            </button>
          </div>
        )}
      </div>

      {caption && (
        <figcaption className="mt-6 text-small leading-relaxed text-p-ink-2 text-pretty text-center text-balance">
          {caption}
        </figcaption>
      )}

      {description && (
        <details id={descriptionId} className="mt-4 border border-p-line px-4 py-3 text-small leading-relaxed text-p-ink-2">
          <summary className="cursor-pointer font-mono text-eyebrow text-p-ink">
            {t("transcriptLabel")}
          </summary>
          <div className="mt-3 max-w-[72ch] text-start">{description}</div>
        </details>
      )}
    </figure>
  );
}

/* Square glyphs drawn to the same 14px box, so the bar keeps one rhythm. */

function PlayGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
      <path d="M2 1 L13 7 L2 13 Z" fill="currentColor" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <rect x="2" y="1" width="3.5" height="12" fill="currentColor" />
      <rect x="8.5" y="1" width="3.5" height="12" fill="currentColor" />
    </svg>
  );
}

function FullscreenGlyph({ exit = false }: { exit?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      {exit ? (
        <path d="M5 1v4H1M9 13V9h4M13 5H9V1M1 9h4v4" />
      ) : (
        <path d="M1 5V1h4M13 9v4H9M9 1h4v4M5 13H1V9" />
      )}
    </svg>
  );
}
