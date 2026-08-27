"use client";

import { useTranslations } from "next-intl";
import { VideoFigure } from "../video-figure";

interface PostVideoFigureProps {
  n: number;
  src: string;
  poster: string;
  ratio: string;
  caption: string;
  description: string;
}

export function PostVideoFigure({ n, src, poster, ratio, caption, description }: PostVideoFigureProps) {
  const t = useTranslations("blog");
  return <VideoFigure src={src} poster={poster} ratio={ratio} description={description} className="post-figure my-10" captionClassName="mt-0 flex items-baseline gap-3 border border-p-line px-4 py-3 text-start text-balance" caption={<><span className="shrink-0 font-mono text-eyebrow uppercase tracking-[0.08em] text-p-ink-3">{t("figureLabel", { n })}</span><span>{caption}</span></>} />;
}
