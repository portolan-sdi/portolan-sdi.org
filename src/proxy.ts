import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
const INTERNAL_REWRITE_HEADER = "x-portolan-locale-rewrite";
const INTERNAL_REWRITE_PARAM = "__portolan_locale_rewrite";

/**
 * Keep the default locale unprefixed while avoiding a self-hosted Next.js
 * rewrite pass that sends /en back to /. Vercel handles this internal rewrite
 * in one pass, but the Node server can invoke proxy again for it.
 */
export function proxy(request: NextRequest) {
  if (
    request.headers.get(INTERNAL_REWRITE_HEADER) === "1" ||
    request.nextUrl.searchParams.get(INTERNAL_REWRITE_PARAM) === "1"
  ) {
    const headers = new Headers(request.headers);
    headers.delete(INTERNAL_REWRITE_HEADER);
    return NextResponse.next({ request: { headers } });
  }

  const response = intlMiddleware(request);
  const rewrite = response.headers.get("x-middleware-rewrite");
  if (!rewrite) return response;

  const rewriteUrl = new URL(rewrite);
  const defaultLocalePath = "/" + routing.defaultLocale;
  if (
    rewriteUrl.pathname !== defaultLocalePath &&
    !rewriteUrl.pathname.startsWith(defaultLocalePath + "/")
  ) {
    return response;
  }

  const headers = new Headers(request.headers);
  headers.set("x-next-intl-locale", routing.defaultLocale);
  headers.set(INTERNAL_REWRITE_HEADER, "1");
  rewriteUrl.searchParams.set(INTERNAL_REWRITE_PARAM, "1");
  const rewritten = NextResponse.rewrite(rewriteUrl, { request: { headers } });

  // Preserve the locale cookie and alternate-link metadata from next-intl.
  response.headers.forEach((value, key) => {
    if (key !== "x-middleware-rewrite") rewritten.headers.set(key, value);
  });
  return rewritten;
}

export const config = {
  // opengraph-image is excluded so generated image routes are served directly.
  // Under localePrefix as-needed, the proxy would redirect /en/opengraph-image
  // back to the unprefixed path, and social scrapers do not reliably follow it.
  matcher: "/((?!api|trpc|_next|_vercel|.*opengraph-image|.*\\..*).*)",
};
