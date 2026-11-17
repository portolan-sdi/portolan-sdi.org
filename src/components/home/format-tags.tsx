import type { ReactNode } from "react";
import { PROSE_LINK } from "@/components/ui";
import { FORMAT_LINKS } from "@/lib/site";

/** Rich-text tags that link a format name to its spec site. A format name
 *  that links somewhere renders as a plain link, not as mono. */
export const FORMAT_TAGS = Object.fromEntries(
  (
    [
      ["geoparquet", FORMAT_LINKS.geoParquet],
      ["pmtiles", FORMAT_LINKS.pmtiles],
      ["cog", FORMAT_LINKS.cog],
      ["stac", FORMAT_LINKS.stac],
    ] as const
  ).map(([tag, href]) => [
    tag,
    (chunks: ReactNode) => (
      <a href={href} className={PROSE_LINK}>
        {chunks}
      </a>
    ),
  ]),
);
