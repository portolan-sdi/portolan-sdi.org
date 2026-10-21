import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { DirArrow } from "../ui";
import { btnClassName } from "../ui/btn";

// A call to action inside a post or tutorial: a solid --p-primary band with
// one sentence and one button. The band uses the same fill as the talks
// section. Use a few per piece, not one per section.
//
// The sentence is the children. Write it on one line in the MDX file, so MDX
// does not wrap it in a paragraph. The button label says what the click does.
//
// A link that starts with "/" stays on the site through the locale Link. Any
// other link opens in a new tab. `track` sets `data-track`, so a click
// reports as a `cta` event.

interface PostCtaProps {
  href: string;
  label: string;
  track: string;
  children: ReactNode;
}

export function PostCta({ href, label, track, children }: PostCtaProps) {
  // The primary fill would vanish on the band, so the button is paper.
  const className = btnClassName("secondary", "md");
  const internal = href.startsWith("/");

  return (
    <aside className="my-10 flex flex-col items-start gap-4 bg-p-primary p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
      <p className="text-body font-medium leading-snug text-p-on-primary text-balance">
        {children}
      </p>
      {internal ? (
        <Link href={href} className={className} data-track={track}>
          {label} <DirArrow />
        </Link>
      ) : (
        <a
          href={href}
          className={className}
          target="_blank"
          rel="noreferrer"
          data-track={track}
        >
          {label} <DirArrow kind="external" />
        </a>
      )}
    </aside>
  );
}
