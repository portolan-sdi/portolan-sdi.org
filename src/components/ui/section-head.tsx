import { ReactNode } from "react";

interface SectionHeadProps {
  /**
   * Eyebrow label (from translations). Omit where the title below already
   * names the section: a kicker that restates the headline is noise, and the
   * page budgets a small number of them.
   */
  eyebrow?: string;
  /** Section title (from translations). */
  title: ReactNode;
  /** Supporting copy shown in the right column on wide screens. */
  subtitle?: ReactNode;
  /** Replaces the subtitle with arbitrary content (e.g. a CTA), bottom-right. */
  aside?: ReactNode;
  /** Single-column, full-width title (no reserved right column, no max-width). */
  wide?: boolean;
}

// Editorial section header: title block on the start side, supporting copy (or a
// CTA) on the end side, bottom-aligned on wide screens. Mirrors the mockup's
// `.sec-head`.
export function SectionHead({
  eyebrow,
  title,
  subtitle,
  aside,
  wide,
}: SectionHeadProps) {
  return (
    <div
      className={`grid grid-cols-1 gap-5 md:gap-12 md:items-end mb-[clamp(2.5rem,5vw,4rem)] ${
        wide ? "" : "md:grid-cols-[minmax(0,1fr)_minmax(0,46ch)]"
      }`}
    >
      <div>
        {eyebrow && (
          <div className="font-mono text-eyebrow text-p-ink-3 tracking-[0.04em]">
            {eyebrow}
          </div>
        )}
        <h2
          className={`text-section font-extrabold tracking-[-0.03em] leading-[1.05] text-balance ${
            eyebrow ? "mt-3" : ""
          } ${
            wide ? "max-w-none" : "max-w-[32ch]"
          }`}
        >
          {title}
        </h2>
      </div>
      {aside ? (
        <div className="md:justify-self-end">{aside}</div>
      ) : subtitle ? (
        <p className="text-body-lg leading-relaxed text-p-ink-2">{subtitle}</p>
      ) : null}
    </div>
  );
}
