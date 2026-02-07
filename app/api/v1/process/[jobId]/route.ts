import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/process/[jobId]
 * Poll the status of a processing job.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  // In production, this looks up the ProcessingJob in the database.
  // For now, return a placeholder response.
  return NextResponse.json({
    job_id: jobId,
    status: "queued",
    message: "Processing jobs require a database connection. Set up Prisma and run migrations.",
    poll_url: `/api/v1/process/${jobId}`,
  });
}
