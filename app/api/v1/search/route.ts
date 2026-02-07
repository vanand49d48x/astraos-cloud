import { NextResponse } from "next/server";
import { unifiedSearch } from "@/lib/providers/registry";
import type { SearchParams } from "@/lib/stac/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/search
 * Unified satellite imagery search across all providers.
 *
 * Query params:
 *   bbox    - Bounding box: west,south,east,north (required)
 *   datetime - ISO 8601 interval: "2025-01-01/2025-02-01" (required)
 *   collections - Comma-separated collection IDs (optional)
 *   cloud_cover_lt - Max cloud cover percentage (optional)
 *   limit - Max results (default 10, max 100)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse bbox
    const bboxStr = searchParams.get("bbox");
    if (!bboxStr) {
      return NextResponse.json(
        { error: "bbox parameter is required (west,south,east,north)" },
        { status: 400 }
      );
    }
    const bboxParts = bboxStr.split(",").map(Number);
    if (bboxParts.length !== 4 || bboxParts.some(isNaN)) {
      return NextResponse.json(
        { error: "bbox must be 4 comma-separated numbers: west,south,east,north" },
        { status: 400 }
      );
    }
    const bbox = bboxParts as [number, number, number, number];

    // Parse datetime
    const datetime = searchParams.get("datetime");
    if (!datetime) {
      return NextResponse.json(
        { error: 'datetime parameter is required (e.g., "2025-01-01/2025-02-01")' },
        { status: 400 }
      );
    }

    // Parse optional params
    const collectionsStr = searchParams.get("collections");
    const collections = collectionsStr ? collectionsStr.split(",") : undefined;

    const cloudCoverStr = searchParams.get("cloud_cover_lt");
    const cloudCoverLt = cloudCoverStr ? Number(cloudCoverStr) : undefined;

    const limitStr = searchParams.get("limit");
    const limit = limitStr ? Math.min(Number(limitStr), 100) : 10;

    const params: SearchParams = {
      bbox,
      datetime,
      collections,
      cloudCoverLt,
      limit,
    };

    const result = await unifiedSearch(params);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (err: any) {
    console.error("Search error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
