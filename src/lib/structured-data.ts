import { COMMUNITY_LINKS, SITE_ORIGIN, localeUrl } from "./site";

/**
 * Stable node identifiers. Schema.org nodes are joined by `@id`, so the
 * Organization is declared once and every other node points at that URI
 * instead of repeating the publisher block.
 */
const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

/**
 * "Portolan" is also the name of a medieval nautical chart, so a search engine
 * has to be told which entity this site is. `sameAs` links the profiles that
 * carry the same name, which is the signal that separates the project from the
 * historical term.
 */
const SAME_AS = [COMMUNITY_LINKS.github, COMMUNITY_LINKS.googleGroup];

interface JsonLdNode {
  "@type": string;
  [key: string]: unknown;
}

/** Wraps nodes in the document envelope every JSON-LD block needs. */
function graph(nodes: JsonLdNode[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * Organization and WebSite for the whole site. The locale layout wraps every
 * route, so these two nodes are the only ones it can state without claiming
 * the home page URL on a subpage.
 *
 * `description` comes from the locale's own metadata so the structured data
 * says the same thing as the meta description.
 */
export function siteJsonLd({
  locale,
  description,
}: {
  locale: string;
  description: string;
}) {
  return graph([
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: "Portolan",
      alternateName: "Portolan SDI",
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/logo-mark.svg`,
      description,
      sameAs: SAME_AS,
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_ORIGIN,
      name: "Portolan",
      description,
      inLanguage: locale,
      publisher: { "@id": ORGANIZATION_ID },
    },
  ]);
}

/**
 * FAQPage for the questions the FAQ route renders. Google reads the answer as
 * text, so callers pass prose with the message rich-text tags already removed.
 */
export function faqJsonLd({
  locale,
  route,
  questions,
}: {
  locale: string;
  route: string;
  questions: { question: string; answer: string }[];
}) {
  const url = localeUrl(locale, route);

  return graph([
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      url,
      inLanguage: locale,
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORGANIZATION_ID },
      mainEntity: questions.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ]);
}

/**
 * Strips the rich-text tags the message files carry, such as `<m>` and
 * `<spec>`. The tags are a rendering contract for `t.rich`, and structured
 * data has to hold the plain sentence instead.
 */
export function plainText(message: string): string {
  return message.replace(/<\/?[a-zA-Z][^>]*>/g, "").replace(/\s+/g, " ").trim();
}
