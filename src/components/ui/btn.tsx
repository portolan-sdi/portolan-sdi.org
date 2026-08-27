import {
  ButtonHTMLAttributes,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
} from "react";

type BtnVariant = "primary" | "secondary" | "ghost";
type BtnSize = "sm" | "md" | "lg";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  asChild?: boolean;
}

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
  ghost:
    "bg-transparent text-p-ink rounded-none border-b-2 border-p-line hover:border-b-4 hover:pb-[calc(0.75rem_-_2px)]",
};

export function btnClassName(
  variant: BtnVariant = "primary",
  size: BtnSize = "md",
  className?: string,
) {
  return [
    "inline-flex items-center justify-center gap-2",
    "rounded-[var(--p-r-md)] font-mono font-medium uppercase tracking-[0.08em] rtl:tracking-normal",
    "cursor-pointer whitespace-nowrap",
    "transition-[background-color,border-color,color] duration-150",
    sizeClasses[size],
    variant === "ghost" ? "" : sizePadding[size],
    variantClasses[variant],
    className ?? "",
  ].filter(Boolean).join(" ");
}

export const Btn = forwardRef<HTMLButtonElement, BtnProps>(
  ({ children, variant = "primary", size = "md", className, asChild, ...props }, ref) => {
    const classes = btnClassName(variant, size, className);

    // Navigation CTAs must expose one interactive element. asChild keeps the
    // button treatment while allowing a Link to own the interaction.
    if (asChild) {
      if (!isValidElement(children)) {
        throw new Error("Btn with asChild requires one element child");
      }
      return cloneElement(
        children as ReactElement<{ className?: string }>,
        {
          ...props,
          className: classes,
        },
      );
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  },
);

Btn.displayName = "Btn";
