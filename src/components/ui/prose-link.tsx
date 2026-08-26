import type { AnchorHTMLAttributes } from "react";
import { DirArrow } from "./dir-arrow";

/**
 * Inline link inside running prose. One home for the string, because the FAQ,
 * the registry intro, and the MDX element map all set the same link.
 */
export const PROSE_LINK =
  "text-p-primary underline underline-offset-2 transition-colors hover:text-p-ink";

/**
 * The prose link as a component. The MDX element map points markdown links at
 * it, and an MDX file uses it directly whenever the href comes from a constant
 * rather than from literal markdown.
 *
 * An off-site href opens in a new tab and takes a trailing arrow, which
 * mirrors in Arabic.
 */
export function ProseLink({
  href = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = /^https?:\/\//.test(href);

  return (
    <a
      href={href}
      className={PROSE_LINK}
      {...(external ? { target: "_blank", rel: "noreferrer" } : null)}
      {...props}
    >
      {children}
      {external && (
        <>
          {" "}
          <DirArrow kind="external" />
        </>
      )}
    </a>
  );
}
