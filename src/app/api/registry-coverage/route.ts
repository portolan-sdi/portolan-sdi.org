import { NextResponse } from "next/server";
import { getCoverageBboxes } from "@/lib/catalogs";
import { dedupeCoverage } from "@/lib/collection-points";

export async function GET() {
  try {
    const coverage = dedupeCoverage(await getCoverageBboxes());
    return NextResponse.json(coverage);
  } catch (error) {
    console.error("Failed to fetch collection coverage:", error);
    return new NextResponse(null, { status: 502 });
  }
}
