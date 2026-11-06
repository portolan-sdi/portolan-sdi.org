import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CATALOGS_CACHE_TAG } from "@/lib/catalogs";

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET;

// On-demand revalidation for the catalog registry. The portolan-registry
// Pages workflow posts here when the CDN serves a new export of the v0.1
// release tree on registry.portolan-sdi.org. The catalog list and the map
// then update without a wait for the hourly ISR window. Authenticated with a
// shared bearer secret.
export async function POST(req: NextRequest) {
  if (!REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: "Server not configured for revalidation" },
      { status: 503 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${REVALIDATE_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // "max" gives stale-while-revalidate semantics: the cached list is marked
  // stale and refreshed in the background on the next visit, rather than
  // forcing a blocking cache miss.
  revalidateTag(CATALOGS_CACHE_TAG, "max");

  return NextResponse.json({
    revalidated: true,
    tag: CATALOGS_CACHE_TAG,
  });
}
