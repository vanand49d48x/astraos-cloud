import { NextResponse } from "next/server";
import { getProviderForScene } from "@/lib/providers/registry";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/assets
 * Resolve download/streaming URLs for specific bands of a scene.
 *
 * Query params:
 *   scene_id - ASTRA scene ID (required): "provider-id:original-scene-id"
 *   bands    - Comma-separated band names (optional, defaults to all)
 *   format   - Output format: "cog" (default)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const sceneId = searchParams.get("scene_id");
    if (!sceneId) {
      return NextResponse.json(
        { error: "scene_id parameter is required" },
        { status: 400 }
      );
    }

    const resolved = getProviderForScene(sceneId);
    if (!resolved) {
      return NextResponse.json(
        { error: `Unknown provider in scene ID: "${sceneId}"` },
        { status: 400 }
      );
    }

    const { provider, originalId } = resolved;
    const scene = await provider.getScene(originalId);

    // Filter to requested bands or return all
    const bandsStr = searchParams.get("bands");
    const requestedBands = bandsStr ? bandsStr.split(",") : Object.keys(scene.assets);

    const assets = await Promise.allSettled(
      requestedBands.map(async (band) => {
        const asset = scene.assets[band];
        if (!asset) {
          return {
            band,
            status: "error" as const,
            error: `Band "${band}" not found`,
          };
        }

        const isCog = asset["astra:is_cog"];
        const requiresAuth = asset["astra:requires_auth"];

        if (isCog && !requiresAuth) {
          // Direct access — return the URL as-is
          return {
            band,
            status: "ready" as const,
            url: asset.href,
            type: asset.type,
            is_cog: true,
          };
        }

        // Try to get a resolved/signed URL from the provider
        try {
          const resolvedUrl = await provider.getAssetUrl(originalId, band);
          return {
            band,
            status: "ready" as const,
            url: resolvedUrl,
            type: asset.type,
            is_cog: isCog,
            requires_conversion: !isCog,
          };
        } catch (err: any) {
          return {
            band,
            status: "error" as const,
            error: err.message,
          };
        }
      })
    );

    const resolvedAssets = assets.map((result) => {
      if (result.status === "fulfilled") return result.value;
      return {
        band: "unknown",
        status: "error" as const,
        error: result.reason?.message || "Failed to resolve",
      };
    });

    return NextResponse.json(
      { assets: resolvedAssets },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
        },
      }
    );
  } catch (err: any) {
    console.error("Asset resolver error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
