import { NextResponse } from "next/server";
import { getCoverageBboxes } from "@/lib/catalogs";
import { dedupeCoverage } from "@/lib/collection-points";

// Next.js 16 does not cache GET route handlers by default. This response only
// depends on the tagged registry export, so cache the complete response too.
export const dynamic = "force-static";

export async function GET() {
  try {
    const coverage = dedupeCoverage(await getCoverageBboxes());
    return NextResponse.json(coverage);
  } catch (error) {
    console.error("Failed to fetch collection coverage:", error);
    return new NextResponse(null, { status: 502 });
  }
}
