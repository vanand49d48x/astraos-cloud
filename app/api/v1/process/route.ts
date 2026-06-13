import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_OPS = ["ndvi", "change_detection", "cog_convert"] as const;

export async function POST(request: NextRequest) {
  const apiKey = await validateApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { operation, scene_id, bbox, ...rest } = body as {
    operation?: string;
    scene_id?: string;
    bbox?: number[];
    [k: string]: unknown;
  };

  if (!operation) {
    return NextResponse.json(
      { error: `operation is required. One of: ${VALID_OPS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!VALID_OPS.includes(operation as (typeof VALID_OPS)[number])) {
    return NextResponse.json(
      { error: `Invalid operation. Must be one of: ${VALID_OPS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!scene_id) {
    return NextResponse.json({ error: "scene_id is required" }, { status: 400 });
  }

  const job = await prisma.processingJob.create({
    data: {
      teamId: apiKey.teamId,
      apiKeyId: apiKey.id,
      operation,
      params: { scene_id, bbox: bbox ?? null, ...rest },
      status: "queued",
    },
  });

  return NextResponse.json(
    {
      job_id: job.id,
      status: job.status,
      operation: job.operation,
      scene_id,
      bbox: bbox ?? null,
      poll_url: `/api/v1/process/${job.id}`,
      created_at: job.createdAt.toISOString(),
    },
    { status: 202 }
  );
}
