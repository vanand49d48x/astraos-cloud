import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const apiKey = await validateApiKey(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const { jobId } = await params;

  const job = await prisma.processingJob.findFirst({
    where: {
      id: jobId,
      teamId: apiKey.teamId, // Scope to the caller's team
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const params_ = job.params as Record<string, unknown>;

  return NextResponse.json({
    job_id: job.id,
    status: job.status,
    operation: job.operation,
    scene_id: params_.scene_id ?? null,
    bbox: params_.bbox ?? null,
    poll_url: `/api/v1/process/${job.id}`,
    result_url: job.resultUrl ?? null,
    error: job.error ?? null,
    compute_ms: job.computeMs,
    created_at: job.createdAt.toISOString(),
    started_at: job.startedAt?.toISOString() ?? null,
    completed_at: job.completedAt?.toISOString() ?? null,
  });
}
