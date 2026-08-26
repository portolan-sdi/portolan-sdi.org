"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

/**
 * The launch demo: one recorded run, from a source portal to a published
 * catalog.
 *
 * It sits directly under the hero because it is the shortest answer to the
 * question the hero raises. The hero says what Portolan does. This shows it
 * happening, before the page spends three sections explaining it.
 *
 * The section carries no heading and no kicker. The video is the content, and
 * a title above it would name what the reader can already see. This is the one
 * section on the page that centers, for the same reason: there is no text
 * column here to hold the start edge.
 *
 * The player is ours rather than the browser's. Native `controls` paint a
 * rounded translucent bar with a pill scrubber and a volume slider. The
 * volume slider is the plain error, because the recording carries no audio at
 * all. The rest fights every rule this site keeps: square corners, flat
 * surfaces, black rules, mono labels. So the element runs without `controls`
 * and the bar below it is built from the same parts as the rest of the page.
 *
 * The bar sits under the image rather than over it. An overlay needs a
 * gradient scrim to stay readable, and a scrim is the glassy surface the
 * design system bans.
 *
 * The video runs 73 seconds. It does not autoplay. A reader who scrolls past
 * downloads the poster and nothing else, which is what `preload="none"` buys:
 * the video itself is 7.1 MB and only the reader who presses play pays for it.
 *
 * The poster is the frame at 64 seconds, where the browser lists the finished
 * catalog. The video opens on a terminal, but the still that stands under the
 * hero shows the result.
 *
 * The frame holds no padding of its own. The black band that used to sit above
 * and below the picture came from the recording, not from this component, and
 * the encode crops it away.
 */

/** Aspect ratio of the encoded file, 1454x1118. The source recording stands
 *  1314 tall and carries a 98px black band above and below the browser window.
 *  The encode crops those rows away, so this ratio holds the picture and
 *  nothing else. It also reserves the box before metadata loads, so the poster
 *  does not shift the page when it paints. */
const DEMO_RATIO = "1454 / 1118";

/** mm:ss. The demo runs about 73 seconds, so it never needs an hour field. */
function clock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function DemoSection() {
  const t = useTranslations("demo");
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
    <section
      id="demo"
      className="px-[var(--p-pad-section-x)] py-[var(--p-pad-section-y)] border-t border-p-line"
    >
      {/* Sized to sit inside a viewport rather than fill the 1240px column.
          The source is near-square, so column width here would stand about
          1120px tall and push the caption off screen. */}
      <figure className="m-0 mx-auto max-w-[620px]">
        {/* The recording captures an LTR interface, and so does the bar that
            controls it: a scrub track that ran end-to-start would read against
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
              poster="/video/portolan-demo-one.jpg"
              onClick={toggle}
              style={{ "--demo-ratio": DEMO_RATIO } as CSSProperties}
              className="demo-media block w-full h-auto cursor-pointer bg-p-paper"
            >
              <source src="/video/portolan-demo-one.mp4" type="video/mp4" />
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

        <figcaption className="mt-6 text-small leading-relaxed text-p-ink-2 text-pretty text-center text-balance">
          {t.rich("caption", {
            catalog: (chunks) => (
              <a
                href="https://source.coop/nlebovits/phl-housing-demo"
                className="text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink"
              >
                {chunks}
              </a>
            ),
          })}
        </figcaption>
      </figure>
    </section>
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
