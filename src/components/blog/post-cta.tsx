import { Link } from "@/i18n/navigation";
import { DirArrow } from "../ui";
import { btnClassName } from "../ui/btn";

// A call to action inside a post or tutorial: one primary button, centered
// in the text column. The label says what the click does, so nothing else
// goes with it.
//
// A link that starts with "/" stays on the site through the locale Link. Any
// other link opens in a new tab. `track` sets `data-track`, so a click
// reports as a `cta` event.

interface PostCtaProps {
  href: string;
  label: string;
  track: string;
}

export function PostCta({ href, label, track }: PostCtaProps) {
  const className = btnClassName("primary", "lg");

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
          {label} <DirArrow kind="external" />
        </a>
      )}
    </p>
  );
}
