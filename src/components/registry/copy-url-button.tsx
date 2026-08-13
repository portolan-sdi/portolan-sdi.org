"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface CopyUrlButtonProps {
  url: string;
  className?: string;
  /** -1 while the card face holding this button is turned away. */
  tabIndex?: number;
}

const RESET_MS = 2000;

// Copies a catalog.json address so it can be pasted into a client. The label
// stays in place and swaps text, so the row does not reflow on click.
export function CopyUrlButton({ url, className, tabIndex }: CopyUrlButtonProps) {
  const t = useTranslations("registry.card");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access is refused on insecure origins and in some embedded
      // browsers. Selecting the address by hand still works, so say nothing.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), RESET_MS);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      tabIndex={tabIndex}
      title={url}
      className={`inline-flex items-center gap-1.5 text-micro font-mono text-p-ink-3 hover:text-p-ink transition-colors cursor-pointer ${className ?? ""}`}
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" />
          <path d="M5 15V5a2 2 0 0 1 2-2h8" />
        </svg>
      )}
      <span aria-live="polite">{copied ? t("copied") : t("copyUrl")}</span>
    </button>
  );
}
