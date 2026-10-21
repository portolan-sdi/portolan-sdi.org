"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { useTranslations } from "next-intl";

export function PostCodeBlock({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"pre">) {
  const t = useTranslations("blog.codeBlock");
  const pre = useRef<HTMLPreElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    if (!pre.current) return;
    if (timer.current) clearTimeout(timer.current);
    try {
      // CSS wraps long lines for display; textContent keeps the source intact.
      await navigator.clipboard.writeText(pre.current.textContent ?? "");
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div dir="ltr" className="relative mt-6 min-w-0 max-w-full rounded-[var(--p-code-radius)] bg-p-code-bg">
      <button
        type="button"
        onClick={copy}
        aria-label={t("copy")}
        title={status === "copied" ? t("copied") : t("copy")}
        className="absolute inset-e-2 top-2 grid h-8 w-8 cursor-pointer place-items-center text-p-ink-3 transition-colors hover:bg-p-primary/10 hover:text-p-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-p-primary"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          {status === "copied" ? (
            <path d="m5 12 4 4L19 6" />
          ) : (
            <>
              <path d="M9 5H5v16h14V5h-4" />
              <path d="M9 3h6v4H9z" />
            </>
          )}
        </svg>
      </button>
      <pre
        {...props}
        ref={pre}
        dir="ltr"
        className={`m-0 whitespace-pre-wrap p-4 pe-14 text-small leading-[1.6] [overflow-wrap:anywhere] ${className ?? ""}`}
      >
        {children}
      </pre>
      <span
        role="status"
        dir="auto"
        className={status === "failed" ? "block px-4 pb-4 text-small text-p-ink-2" : "sr-only"}
      >
        {status === "failed" ? t("failed") : status === "copied" ? t("copied") : ""}
      </span>
    </div>
  );
}
