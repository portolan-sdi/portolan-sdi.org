"use client";

import dynamic from "next/dynamic";

const GlyphMapCanvas = dynamic(() => import("./glyph-map-canvas"), {
  ssr: false,
  loading: () => <div className="absolute inset-0" />,
});

interface GlyphMapProps {
  className?: string;
  /** Drift speed in CSS pixels per second. Defaults to the marquee speed. */
  pxPerSecond?: number;
}

export function GlyphMap({ className = "", pxPerSecond }: GlyphMapProps) {
  return (
    <div className={className}>
      <GlyphMapCanvas
        className="absolute inset-0 w-full h-full"
        pxPerSecond={pxPerSecond}
      />
    </div>
  );
}
