// A pull quote inside a post, a tutorial, or a case study.
//
// The quote sets in `text-feature` bold between two ink rules, under one
// large `--p-primary` quotation mark. The mark is decoration, so a screen
// reader skips it. The quote text carries no quotation marks of its own.
// The caption gives the name and the role of the person. A Markdown `>`
// quote stays the quiet form for a quote that does not need to stand out.

interface PostQuoteProps {
  quote: string;
  name: string;
  role: string;
}

export function PostQuote({ quote, name, role }: PostQuoteProps) {
  return (
    <figure className="my-14 border-y border-p-line py-10">
      {/* A drawn mark, square like the rest of the site. The body face
          sets its quotation mark as two slanted strokes. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 38 30"
        className="h-10 w-auto text-p-primary"
        fill="currentColor"
      >
        <path d="M0 0h16v16l-7 14H3l6-14H0zM22 0h16v16l-7 14h-6l6-14h-9z" />
      </svg>
      <blockquote className="mt-4 text-feature font-bold tracking-[-0.01em] text-p-ink rtl:tracking-normal">
        <p>{quote}</p>
      </blockquote>
      <figcaption className="mt-6 text-body text-p-ink-3">
        <span className="font-semibold text-p-ink">{name}</span>
        {" · "}
        {role}
      </figcaption>
    </figure>
  );
}
