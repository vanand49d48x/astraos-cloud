import { NextResponse } from "next/server";
import { unifiedSearch } from "@/lib/providers/registry";
import type { SearchParams } from "@/lib/stac/types";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/search
 * Unified satellite imagery search across all providers.
 *
 * Query params:
 *   bbox           - Bounding box: west,south,east,north (required)
 *   datetime       - ISO 8601 interval: "2025-01-01/2025-02-01" (required)
 *   collections    - Comma-separated collection IDs (optional)
 *   cloud_cover_lt - Max cloud cover percentage (optional)
 *   limit          - Max results (default 10, max 100)
 *
 * Auth (one of):
 *   Authorization: Bearer astra_<key>  (API key — external callers)
 *   Session cookie                      (dashboard Explorer)
 */
export async function GET(request: Request) {
  const startMs = Date.now();
  let teamId: string | null = null;
  let apiKeyId: string | null = null;

  // --- Resolve identity ---
  const authHeader = request.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (bearer) {
    // API key path
    const record = await prisma.apiKey.findFirst({
      where: { key: bearer, revokedAt: null },
      select: { id: true, teamId: true },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
    }

    // Update last-used timestamp (fire-and-forget)
    prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    teamId = record.teamId;
    apiKeyId = record.id;
  } else {
    // Session path (dashboard explorer)
    const session = await auth();
    if (session?.user?.id) {
      const member = await prisma.teamMember.findFirst({
        where: { userId: session.user.id },
        select: { teamId: true },
      });
      if (member) teamId = member.teamId;
    }
    // If no session either, allow anonymous (unauthenticated) search for now
    // but don't track usage
  }

  // --- Parse params ---
  const { searchParams } = new URL(request.url);

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

  const datetime = searchParams.get("datetime");
  if (!datetime) {
    return NextResponse.json(
      { error: 'datetime parameter is required (e.g., "2025-01-01/2025-02-01")' },
      { status: 400 }
    );
  }

  const collectionsStr = searchParams.get("collections");
  const collections = collectionsStr ? collectionsStr.split(",") : undefined;

  const cloudCoverStr = searchParams.get("cloud_cover_lt");
  const cloudCoverLt = cloudCoverStr ? Number(cloudCoverStr) : undefined;

  const limitStr = searchParams.get("limit");
  const limit = limitStr ? Math.min(Number(limitStr), 100) : 10;

  const params: SearchParams = { bbox, datetime, collections, cloudCoverLt, limit };

  // --- Execute search ---
  try {
    const result = await unifiedSearch(params);
    const computeMs = Date.now() - startMs;

    // Estimate response size from number of features
    const dataVolume = BigInt(
      JSON.stringify(result).length
    );

    // Write usage record (fire-and-forget, don't block response)
    if (teamId) {
      prisma.usageRecord.create({
        data: {
          teamId,
          apiKeyId,
          endpoint: "/api/v1/search",
          method: "GET",
          statusCode: 200,
          dataVolume,
          computeMs,
        },
      }).catch(() => {});
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (err: unknown) {
    const computeMs = Date.now() - startMs;

    // Log error usage
    if (teamId) {
      prisma.usageRecord.create({
        data: {
          teamId,
          apiKeyId,
          endpoint: "/api/v1/search",
          method: "GET",
          statusCode: 500,
          dataVolume: BigInt(0),
          computeMs,
        },
      }).catch(() => {});
    }

    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Search error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
