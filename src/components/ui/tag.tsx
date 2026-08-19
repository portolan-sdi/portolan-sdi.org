import { HTMLAttributes } from "react";

// `warn` replaces the old `accent` tone. --p-accent held the same hex as
// --p-primary, so a stale catalog badged in the same blue as a neutral kind
// badge. The warn tier separates them.
type TagTone = "default" | "primary" | "warn";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
}

const toneClasses: Record<TagTone, string> = {
  default: "bg-p-bg-soft text-p-ink-2 border-p-line",
  primary:
    "bg-[color-mix(in_oklab,var(--p-primary)_12%,transparent)] text-p-primary-ink border-[color-mix(in_oklab,var(--p-primary)_25%,transparent)]",
  warn:
    "bg-[color-mix(in_oklab,var(--p-warn)_18%,transparent)] text-p-warn-ink border-[color-mix(in_oklab,var(--p-warn)_35%,transparent)]",
};

export function Tag({
  children,
  tone = "default",
  className,
  ...props
}: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-2
        text-eyebrow font-mono
        px-2.5 py-1 rounded-[var(--p-r-sm)]
        tracking-[0.02em] uppercase
        border
        ${toneClasses[tone]}
        ${className ?? ""}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
