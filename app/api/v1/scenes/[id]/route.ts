import { NextResponse } from "next/server";
import { getProviderForScene } from "@/lib/providers/registry";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/scenes/[id]
 * Get detailed metadata for a specific satellite scene.
 * ID format: "provider-id:original-scene-id"
 * Example: "sentinel-2-l2a:S2A_MSIL2A_20250115T..."
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decoded = decodeURIComponent(id);

    const resolved = getProviderForScene(decoded);
    if (!resolved) {
      return NextResponse.json(
        {
          error: `Unknown provider in scene ID: "${decoded}". Expected format: "provider-id:scene-id"`,
        },
        { status: 400 }
      );
    }

    const { provider, originalId } = resolved;
    const scene = await provider.getScene(originalId);

    return NextResponse.json(scene, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
      },
    });
  } catch (err: any) {
    console.error("Scene detail error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
