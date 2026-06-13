import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { unifiedSearch } from "@/lib/providers/registry";
import {
  computeNDVI,
  computeEVI,
  computeNDWI,
  computeNDSI,
  computeNBR,
  type AnalyticsResult,
  type IndexResult,
} from "@/lib/analytics/indices";
import { fetchPCBandStats, bandsForIndices, PC_S2_BANDS } from "@/lib/analytics/providers";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SUPPORTED_INDICES = ["ndvi", "evi", "ndwi", "ndsi", "nbr"] as const;

const bodySchema = z.object({
  scene_id: z.string().optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  datetime: z.string().optional(),
  cloud_cover_lt: z.number().min(0).max(100).optional(),
  indices: z.array(z.enum(SUPPORTED_INDICES)).optional(),
});

export async function POST(request: NextRequest) {
  const startMs = Date.now();

  // Auth: API key or session
  let teamId: string | null = null;
  let apiKeyId: string | null = null;

  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer /, "").trim();
  if (bearer) {
    const record = await prisma.apiKey.findFirst({
      where: { key: bearer, revokedAt: null },
      select: { id: true, teamId: true },
    });
    if (!record) return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
    teamId = record.teamId;
    apiKeyId = record.id;
    prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  } else {
    const session = await auth();
    if (session?.user?.id) {
      const member = await prisma.teamMember.findFirst({ where: { userId: session.user.id }, select: { teamId: true } });
      if (member) teamId = member.teamId;
    }
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { scene_id, bbox, datetime, cloud_cover_lt, indices: requestedIndices } = parsed.data;
  const indices = requestedIndices ?? [...SUPPORTED_INDICES];

  if (!scene_id && (!bbox || !datetime)) {
    return NextResponse.json(
      { error: "Provide either scene_id or both bbox and datetime" },
      { status: 400 }
    );
  }

  try {
    // ── Resolve STAC item ─────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let stacItem: any = null;

    if (scene_id) {
      // Search for the specific scene by ID prefix
      const [provider, ...rest] = scene_id.split(":");
      if (provider !== "planetary-computer") {
        return NextResponse.json(
          { error: `Analytics currently supported for Planetary Computer scenes only (prefix: planetary-computer:)` },
          { status: 422 }
        );
      }
      const originalId = rest.join(":");
      const res = await fetch(
        `https://planetarycomputer.microsoft.com/api/stac/v1/search?ids=${originalId}&limit=1`,
        { headers: { "User-Agent": "ASTRA-OS/1.0" } }
      );
      const data = await res.json();
      stacItem = data.features?.[0] ?? null;
      if (!stacItem) return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    } else {
      // Search for best scene in bbox
      const result = await unifiedSearch({
        bbox: bbox!,
        datetime: datetime!,
        cloudCoverLt: cloud_cover_lt,
        limit: 1,
        collections: ["sentinel-2-l2a"],
      });
      stacItem = result.features[0] ?? null;
      if (!stacItem) {
        return NextResponse.json(
          { error: "No Sentinel-2 scenes found matching the search criteria" },
          { status: 404 }
        );
      }
      // Strip ASTRA prefix for PC lookup
      const [, ...rest] = stacItem.id.split(":");
      stacItem.id = rest.join(":");
    }

    // Determine collection from stacItem
    const collection = (stacItem as { collection?: string }).collection ?? "sentinel-2-l2a";
    const itemId = stacItem.id;
    const cloudCover = (stacItem.properties["eo:cloud_cover"] ?? null) as number | null;
    const sceneDateTime = (stacItem.properties.datetime ?? "") as string;

    // ── Fetch band statistics ─────────────────────────────────────────────
    const neededBands = Array.from(bandsForIndices(indices));
    const bandStats = await fetchPCBandStats(collection, itemId, neededBands);

    const has = (b: string) => !!bandStats[b];
    const get = (b: string) => bandStats[b];

    // ── Compute requested indices ─────────────────────────────────────────
    const computed: Record<string, IndexResult> = {};

    if (indices.includes("ndvi") && has(PC_S2_BANDS.nir) && has(PC_S2_BANDS.red)) {
      computed.ndvi = computeNDVI(get(PC_S2_BANDS.nir), get(PC_S2_BANDS.red));
    }
    if (indices.includes("evi") && has(PC_S2_BANDS.nir) && has(PC_S2_BANDS.red) && has(PC_S2_BANDS.blue)) {
      computed.evi = computeEVI(get(PC_S2_BANDS.nir), get(PC_S2_BANDS.red), get(PC_S2_BANDS.blue));
    }
    if (indices.includes("ndwi") && has(PC_S2_BANDS.green) && has(PC_S2_BANDS.nir)) {
      computed.ndwi = computeNDWI(get(PC_S2_BANDS.green), get(PC_S2_BANDS.nir));
    }
    if (indices.includes("ndsi") && has(PC_S2_BANDS.green) && has(PC_S2_BANDS.swir)) {
      computed.ndsi = computeNDSI(get(PC_S2_BANDS.green), get(PC_S2_BANDS.swir));
    }
    if (indices.includes("nbr") && has(PC_S2_BANDS.nir) && has(PC_S2_BANDS.swir)) {
      computed.nbr = computeNBR(get(PC_S2_BANDS.nir), get(PC_S2_BANDS.swir));
    }

    if (Object.keys(computed).length === 0) {
      return NextResponse.json({ error: "No indices could be computed for this scene" }, { status: 422 });
    }

    const analyticsResult: AnalyticsResult = {
      sceneId: `planetary-computer:${itemId}`,
      datetime: sceneDateTime,
      provider: "Microsoft Planetary Computer",
      cloudCover,
      bbox: stacItem.bbox ?? null,
      indices: computed,
      bandsUsed: neededBands,
    };

    // Log usage
    if (teamId) {
      prisma.usageRecord.create({
        data: {
          teamId,
          apiKeyId,
          endpoint: "/api/v1/analyze",
          method: "POST",
          statusCode: 200,
          dataVolume: BigInt(JSON.stringify(analyticsResult).length),
          computeMs: Date.now() - startMs,
        },
      }).catch(() => {});
    }

    return NextResponse.json(analyticsResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    console.error("Analyze error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
