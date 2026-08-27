"use client";

import { useTranslations } from "next-intl";

// A figure inside a blog post: a screenshot, a recording, or an embed, with a
// numbered caption row.
//
// Two rules come from PipelineFigure (src/components/pipeline-figure.tsx). The
// figure carries dir="ltr" so it never mirrors in Arabic, and the caption is
// mono at the eyebrow step. Corners stay square and the frame is a rule, not a
// shadow.
//
// Omit `src` while an asset is still missing. The figure then draws its frame
// at the declared ratio and names what belongs there, so an unfinished post is
// obvious in review.

interface PostFigureProps {
  /** Figure number, written by the post author. */
  n: number;
  caption: string;
  /** Asset path under /public. Omit while the asset is pending. */
  src?: string;
  /** Required whenever `src` is set. */
  alt?: string;
  /** CSS aspect-ratio for the frame. */
  ratio?: string;
  /** What belongs here. Shown in the placeholder only. */
  pending?: string;
}

export function PostFigure({
  n,
  caption,
  src,
  alt,
  ratio = "16 / 9",
  pending,
}: PostFigureProps) {
  const t = useTranslations("blog");

  return (
    <figure dir="ltr" className="post-figure my-10">
      <div className="post-media-frame overflow-hidden border border-p-line bg-p-paper">
        {src ? (
        // The site does not use next/image anywhere. Remote and local assets
        // both render as a plain img, as in Shot (talks-page.tsx).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? caption}
          loading="lazy"
          decoding="async"
          className="block w-full"
          style={{ aspectRatio: ratio, objectFit: "cover" }}
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-2 bg-p-bg-soft p-6 text-center"
          style={{ aspectRatio: ratio }}
        >
          <span className="font-mono text-eyebrow uppercase tracking-[0.08em] text-p-primary">
            {t("figurePending")}
          </span>
          {pending && (
            <span className="font-mono text-small text-p-ink-3">{pending}</span>
          )}
        </div>
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
    </figure>
  );
}
