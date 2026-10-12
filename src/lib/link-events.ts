// Click events sent to Vercel Web Analytics. One listener in the layout reads
// every link click, so a new external link reports itself with no extra code.
//
// `outbound` fires for a link to another host. Its `target` is the host and
// path with no query, so the dashboard groups one page as one row. A fragment
// that starts with `#/` stays, because it is a client-side route and not an
// anchor. The catalog links to browser.portolan-sdi.org name the catalog there.
// `cta` fires for a link that carries `data-track`. Its `target` is that
// attribute. The hero buttons use it because they point into the same page.

export const OUTBOUND_EVENT = "outbound";
export const CTA_EVENT = "cta";

/** Vercel rejects a property value longer than 255 characters. */
export const MAX_TARGET = 255;

export interface LinkEvent {
  name: typeof OUTBOUND_EVENT | typeof CTA_EVENT;
  target: string;
}

/**
 * The event for a click on a link, or null when the click needs no event.
 * `origin` is the origin of the page that holds the link.
 */
export function linkEvent(
  href: string,
  origin: string,
  cta: string | null = null,
): LinkEvent | null {
  if (cta) return { name: CTA_EVENT, target: cta.slice(0, MAX_TARGET) };

  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return null;
  }
  // mailto:, tel:, and similar links open another application, not a page.
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.origin === new URL(origin).origin) return null;

  const path = url.pathname.replace(/\/+$/, "");
  const route = url.hash.startsWith("#/") ? `/${url.hash}` : "";
  const target = `${url.host}${path}${route}`.slice(0, MAX_TARGET);
  return { name: OUTBOUND_EVENT, target };
}
