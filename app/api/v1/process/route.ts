import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/process
 * Submit a processing job (NDVI, change detection, COG conversion).
 * Returns a job ID for polling.
 *
 * Body:
 *   operation - "ndvi" | "change_detection" | "cog_convert"
 *   scene_id  - ASTRA scene ID
 *   bbox      - Optional crop bbox
 *   params    - Operation-specific parameters
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { operation, scene_id, bbox, ...rest } = body;

    if (!operation) {
      return NextResponse.json(
        { error: "operation is required (ndvi, change_detection, cog_convert)" },
        { status: 400 }
      );
    }

    if (!scene_id) {
      return NextResponse.json(
        { error: "scene_id is required" },
        { status: 400 }
      );
    }

    const validOps = ["ndvi", "change_detection", "cog_convert"];
    if (!validOps.includes(operation)) {
      return NextResponse.json(
        { error: `Invalid operation. Must be one of: ${validOps.join(", ")}` },
        { status: 400 }
      );
    }

    // In production, this creates a ProcessingJob in the database.
    // For now, return a placeholder response showing the API structure.
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json(
      {
        job_id: jobId,
        status: "queued",
        operation,
        scene_id,
        bbox,
        poll_url: `/api/v1/process/${jobId}`,
        created_at: new Date().toISOString(),
      },
      { status: 202 }
    );
  } catch (err: any) {
    console.error("Process submit error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
