import { Link } from "@/i18n/navigation";
import { DirArrow } from "../ui";
import { btnClassName } from "../ui/btn";

// A call to action inside a post or tutorial: one primary button, centered
// in the text column. The label says what the click does, so nothing else
// goes with it.
//
// It is the homepage hero's primary button with the same forward arrow, also
// on an off-site link. It also stands on an ink offset, so it reads as a
// button on the blank page. A link that starts with "/" stays on the site
// through the locale Link. Any other link opens in a new tab. `track` sets
// `data-track`, so a click reports as a `cta` event.

interface PostCtaProps {
  href: string;
  label: string;
  track: string;
}

export function PostCta({ href, label, track }: PostCtaProps) {
  // `post-cta-btn` in globals.css adds the ink offset.
  const className = btnClassName("primary", "lg", "post-cta-btn");

  return (
    <p className="my-10 flex justify-center">
      {href.startsWith("/") ? (
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
          {label} <DirArrow />
        </a>
      )}
    </p>
  );
}
