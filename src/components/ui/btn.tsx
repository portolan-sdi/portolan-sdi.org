import { ButtonHTMLAttributes, forwardRef } from "react";

type BtnVariant = "primary" | "secondary" | "ghost";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  asChild?: boolean;
}

// Only vertical padding and size live here. Horizontal padding belongs to the
// variant, because a filled button needs it to hold its shape and the ghost
// does not: inline padding on a variant with no background only pushed the
// label off the column edge and ran its rule past the text.
// `sm` drops a size step so the three stay distinguishable.
const sizeClasses: Record<BtnSize, string> = {
  sm: "py-2 text-eyebrow",
  md: "py-2.5 text-small",
  lg: "py-3 text-small",
};

const sizePadding: Record<BtnSize, string> = {
  sm: "px-4",
  md: "px-5",
  lg: "px-6",
};

const variantClasses: Record<BtnVariant, string> = {
  primary: "bg-p-primary text-p-on-primary hover:bg-p-primary-ink",
  secondary: "bg-p-paper text-p-ink border border-p-line hover:bg-p-bg-soft",
  // The rule is visible at rest so the control reads as a control beside a
  // solid primary block, and darkens to full ink on hover. It spans the label
  // exactly, so no inline padding.
  ghost:
    "bg-transparent text-p-ink rounded-none border-b-2 border-p-line-soft hover:border-p-ink",
};

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(
  ({ children, variant = "primary", size = "md", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2
          rounded-[var(--p-r-md)] font-mono font-medium uppercase tracking-[0.08em] rtl:tracking-normal
          cursor-pointer whitespace-nowrap
          transition-[background-color,border-color,color] duration-150
          ${sizeClasses[size]}
          ${variant === "ghost" ? "" : sizePadding[size]}
          ${variantClasses[variant]}
          ${className ?? ""}
        `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Btn.displayName = "Btn";
