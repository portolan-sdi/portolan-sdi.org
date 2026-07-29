import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export const proxy = createMiddleware(routing);

export const config = {
  // `opengraph-image` is excluded so the generated image routes are served
  // directly. Under `localePrefix: "as-needed"` the proxy would 307
  // /en/opengraph-image back to the unprefixed path, and social scrapers do
  // not reliably follow redirects on image URLs, so the default locale would
  // lose its preview card.
  matcher: "/((?!api|trpc|_next|_vercel|.*opengraph-image|.*\\..*).*)",
};
