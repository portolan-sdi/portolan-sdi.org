import type { MDXComponents } from "mdx/types";
import { ProseLink } from "@/components/ui";

// Element map for every MDX file on the site.
//
// The site has no typography plugin and no `prose` class. Long-form text is
// hand-classed per instance, so these classes are the FAQ answer recipe
// (src/components/faq-page.tsx) and the section heading recipe, moved to one
// place. A post body picks up the same type scale as the rest of the site.
//
// Required by @next/mdx: the App Router loader fails without this file.

const components: MDXComponents = {
  // A post supplies its own <h1>, so the body starts at h2.
  h2: ({ children, ...props }) => (
    <h2
      className="mt-14 mb-4 text-feature font-extrabold leading-[1.2] tracking-[-0.02em] text-balance text-p-ink"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3
      className="mt-10 mb-3 text-card-title font-bold leading-[1.3] tracking-[-0.02em] text-pretty text-p-ink"
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mt-4 text-body leading-[1.7] text-p-ink-2 text-pretty" {...props}>
      {children}
    </p>
  ),
  a: ProseLink,
  ul: ({ children, ...props }) => (
    <ul
      className="mt-4 list-disc ps-6 text-body leading-[1.7] text-p-ink-2 marker:text-p-ink-3"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      className="mt-4 list-decimal ps-6 text-body leading-[1.7] text-p-ink-2 marker:text-p-ink-3"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="mt-2 text-pretty" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-bold text-p-ink" {...props}>
      {children}
    </strong>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote className="mt-6 border-s-2 border-p-line ps-5" {...props}>
      {children}
    </blockquote>
  ),
  hr: (props) => <hr className="my-12 border-p-line" {...props} />,
  // Backticks in MDX carry what <m> carries in a translation string: a
  // typeable identifier set in the mono voice inside sans prose.
  code: ({ children, ...props }) => (
    <code className="font-mono" {...props}>
      {children}
    </code>
  ),
  // A code block never mirrors in Arabic, and scrolls rather than wrapping.
  pre: ({ children, ...props }) => (
    <pre
      dir="ltr"
      className="mt-6 overflow-x-auto border border-p-line bg-p-paper p-4 text-small leading-[1.6]"
      {...props}
    >
      {children}
    </pre>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
