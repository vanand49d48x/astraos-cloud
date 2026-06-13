import { unifiedSearch } from "@/lib/providers/registry";
import { fetchPCBandStats, bandsForIndices, PC_S2_BANDS } from "@/lib/analytics/providers";
import {
  computeNDVI, computeEVI, computeNDWI, computeNDSI, computeNBR,
} from "@/lib/analytics/indices";
import { prisma } from "@/lib/db";

const PLAN_LIMITS: Record<string, number> = {
  free: 5_000, starter: 50_000, pro: 500_000, enterprise: 10_000_000,
};

// Context injected by the route handler after auth
export interface GQLContext {
  teamId: string | null;
  apiKeyId: string | null;
  userId: string | null;
}

const ALL_INDICES = ["ndvi", "evi", "ndwi", "ndsi", "nbr"] as const;

function getThumbnail(assets: Record<string, { href: string }> = {}): string | null {
  for (const k of ["rendered_preview", "thumbnail", "overview", "visual"]) {
    if (assets[k]?.href) return assets[k].href;
  }
  return null;
}

function normalizeItem(f: any) {
  const assets = f.assets ?? {};
  return {
    id: f.id,
    datetime: f.properties?.datetime ?? null,
    cloudCover: f.properties?.["eo:cloud_cover"] ?? null,
    platform: f.properties?.platform ?? null,
    providerName: f.properties?.["astra:provider_name"] ?? null,
    gsd: f.properties?.gsd ?? null,
    bbox: f.bbox ?? null,
    thumbnailUrl: getThumbnail(assets),
    collection: f.collection ?? null,
    assets: Object.entries(assets).map(([key, a]: [string, any]) => ({
      key,
      href: a.href,
      type: a.type ?? null,
      title: a.title ?? null,
    })),
  };
}

export const resolvers = {
  Query: {
    // ── search ────────────────────────────────────────────────────────────
    async search(_: unknown, args: {
      bbox: number[];
      datetime: string;
      collections?: string[];
      cloudCoverLt?: number;
      limit?: number;
    }, ctx: GQLContext) {
      const result = await unifiedSearch({
        bbox: args.bbox as [number, number, number, number],
        datetime: args.datetime,
        collections: args.collections,
        cloudCoverLt: args.cloudCoverLt,
        limit: Math.min(args.limit ?? 10, 100),
      });

      logUsage(ctx, "/api/v1/graphql?op=search", JSON.stringify(result).length);

      return {
        features: result.features.map(normalizeItem),
        context: result.context ?? null,
        warnings: result.warnings ?? [],
      };
    },

    // ── scene ─────────────────────────────────────────────────────────────
    async scene(_: unknown, { id }: { id: string }, ctx: GQLContext) {
      const [provider, ...rest] = id.split(":");
      if (provider !== "planetary-computer") return null;
      const originalId = rest.join(":");

      const res = await fetch(
        `https://planetarycomputer.microsoft.com/api/stac/v1/search?ids=${originalId}&limit=1`,
        { headers: { "User-Agent": "ASTRA-OS/1.0" } }
      );
      const data = await res.json();
      const f = data.features?.[0];
      if (!f) return null;

      logUsage(ctx, "/api/v1/graphql?op=scene", 500);
      return normalizeItem({ ...f, id });
    },

    // ── analyze ───────────────────────────────────────────────────────────
    async analyze(_: unknown, args: {
      sceneId?: string;
      bbox?: number[];
      datetime?: string;
      cloudCoverLt?: number;
      indices?: string[];
    }, ctx: GQLContext) {
      const requestedIndices = (args.indices ?? [...ALL_INDICES]) as string[];

      let stacItem: any = null;

      if (args.sceneId) {
        const [provider, ...rest] = args.sceneId.split(":");
        if (provider !== "planetary-computer") {
          throw new Error("Analytics currently only supported for Planetary Computer scenes");
        }
        const originalId = rest.join(":");
        const res = await fetch(
          `https://planetarycomputer.microsoft.com/api/stac/v1/search?ids=${originalId}&limit=1`,
          { headers: { "User-Agent": "ASTRA-OS/1.0" } }
        );
        const data = await res.json();
        stacItem = data.features?.[0] ?? null;
        if (!stacItem) throw new Error("Scene not found");
      } else if (args.bbox && args.datetime) {
        const result = await unifiedSearch({
          bbox: args.bbox as [number, number, number, number],
          datetime: args.datetime,
          cloudCoverLt: args.cloudCoverLt,
          limit: 1,
          collections: ["sentinel-2-l2a"],
        });
        stacItem = result.features[0] ?? null;
        if (!stacItem) throw new Error("No scenes found matching the criteria");
        // strip ASTRA prefix for PC lookup
        stacItem.id = stacItem.id.split(":").slice(1).join(":");
      } else {
        throw new Error("Provide either sceneId or both bbox and datetime");
      }

      const collection = stacItem.collection ?? "sentinel-2-l2a";
      const itemId = stacItem.id;
      const neededBands = Array.from(bandsForIndices(requestedIndices));
      const bandStats = await fetchPCBandStats(collection, itemId, neededBands);

      const has = (b: string) => !!bandStats[b];
      const get = (b: string) => bandStats[b];

      const indices: Record<string, any> = {
        ndvi: requestedIndices.includes("ndvi") && has(PC_S2_BANDS.nir) && has(PC_S2_BANDS.red)
          ? computeNDVI(get(PC_S2_BANDS.nir), get(PC_S2_BANDS.red)) : null,
        evi: requestedIndices.includes("evi") && has(PC_S2_BANDS.nir) && has(PC_S2_BANDS.red) && has(PC_S2_BANDS.blue)
          ? computeEVI(get(PC_S2_BANDS.nir), get(PC_S2_BANDS.red), get(PC_S2_BANDS.blue)) : null,
        ndwi: requestedIndices.includes("ndwi") && has(PC_S2_BANDS.green) && has(PC_S2_BANDS.nir)
          ? computeNDWI(get(PC_S2_BANDS.green), get(PC_S2_BANDS.nir)) : null,
        ndsi: requestedIndices.includes("ndsi") && has(PC_S2_BANDS.green) && has(PC_S2_BANDS.swir)
          ? computeNDSI(get(PC_S2_BANDS.green), get(PC_S2_BANDS.swir)) : null,
        nbr: requestedIndices.includes("nbr") && has(PC_S2_BANDS.nir) && has(PC_S2_BANDS.swir)
          ? computeNBR(get(PC_S2_BANDS.nir), get(PC_S2_BANDS.swir)) : null,
      };

      logUsage(ctx, "/api/v1/graphql?op=analyze", 1000);

      return {
        sceneId: `planetary-computer:${itemId}`,
        datetime: stacItem.properties?.datetime ?? "",
        provider: "Microsoft Planetary Computer",
        cloudCover: stacItem.properties?.["eo:cloud_cover"] ?? null,
        bbox: stacItem.bbox ?? null,
        indices,
        bandsUsed: neededBands,
      };
    },

    // ── me ────────────────────────────────────────────────────────────────
    async me(_: unknown, __: unknown, ctx: GQLContext) {
      if (!ctx.teamId) return null;

      const [team, totalCalls] = await Promise.all([
        prisma.team.findUnique({ where: { id: ctx.teamId }, select: { plan: true } }),
        prisma.usageRecord.count({
          where: {
            teamId: ctx.teamId,
            timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      const plan = team?.plan ?? "free";
      const callLimit = PLAN_LIMITS[plan] ?? 5_000;

      return {
        plan,
        totalCalls,
        callLimit,
        quotaUsedPct: callLimit > 0 ? +((totalCalls / callLimit) * 100).toFixed(1) : 0,
      };
    },
  },
};

// Fire-and-forget usage logging
function logUsage(ctx: GQLContext, endpoint: string, responseBytes: number) {
  if (!ctx.teamId) return;
  prisma.usageRecord.create({
    data: {
      teamId: ctx.teamId,
      apiKeyId: ctx.apiKeyId,
      endpoint,
      method: "POST",
      statusCode: 200,
      dataVolume: BigInt(responseBytes),
      computeMs: 0,
    },
  }).catch(() => {});
}
