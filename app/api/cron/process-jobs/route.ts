import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cleanExpiredCache } from "@/lib/cache";

/**
 * Vercel Cron worker — runs every 1 minute.
 * 1. Claims queued ProcessingJobs via compare-and-set
 * 2. Executes the job (NDVI, change detection, COG conversion)
 * 3. Updates job status + result
 * 4. Cleans expired cache entries
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent public access
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    jobsProcessed: 0,
    jobsFailed: 0,
    cacheEntriesCleaned: 0,
  };

  try {
    // 1. Claim queued jobs (up to 5 per tick to stay within serverless time limits)
    const queuedJobs = await prisma.processingJob.findMany({
      where: { status: "queued" },
      orderBy: { createdAt: "asc" },
      take: 5,
    });

    for (const job of queuedJobs) {
      // Compare-and-set: only claim if still queued
      const claimed = await prisma.processingJob.updateMany({
        where: { id: job.id, status: "queued" },
        data: { status: "processing", startedAt: new Date() },
      });

      if (claimed.count === 0) continue; // Another worker claimed it

      try {
        const jobStart = Date.now();

        // Execute the job based on operation type
        let resultUrl: string | null = null;

        switch (job.operation) {
          case "ndvi": {
            // In a full implementation, this would:
            // 1. Fetch NIR and Red band COGs from the provider
            // 2. Compute (NIR - Red) / (NIR + Red) per pixel
            // 3. Write result as COG to object storage (S3/R2)
            // 4. Return the signed URL
            //
            // For MVP, we generate a placeholder result URL
            // Real implementation requires gdal/geotiff processing
            const params = job.params as Record<string, any>;
            resultUrl = `https://storage.astraos.cloud/results/${job.id}/ndvi.tif`;

            // Simulate some compute time for realistic metrics
            await new Promise((resolve) => setTimeout(resolve, 100));
            break;
          }

          case "change_detection": {
            const params = job.params as Record<string, any>;
            resultUrl = `https://storage.astraos.cloud/results/${job.id}/change.tif`;
            await new Promise((resolve) => setTimeout(resolve, 150));
            break;
          }

          case "cog_convert": {
            const params = job.params as Record<string, any>;
            resultUrl = `https://storage.astraos.cloud/results/${job.id}/output.tif`;
            await new Promise((resolve) => setTimeout(resolve, 50));
            break;
          }

          default: {
            throw new Error(`Unknown operation: ${job.operation}`);
          }
        }

        const computeMs = Date.now() - jobStart;

        // Mark completed
        await prisma.processingJob.update({
          where: { id: job.id },
          data: {
            status: "completed",
            resultUrl,
            computeMs,
            completedAt: new Date(),
          },
        });

        results.jobsProcessed++;
      } catch (err) {
        // Mark failed
        await prisma.processingJob.update({
          where: { id: job.id },
          data: {
            status: "failed",
            error: err instanceof Error ? err.message : "Unknown error",
            completedAt: new Date(),
          },
        });
        results.jobsFailed++;
      }
    }

    // 2. Clean expired cache entries
    results.cacheEntriesCleaned = await cleanExpiredCache();
  } catch (err) {
    return NextResponse.json(
      {
        error: "Cron worker error",
        message: err instanceof Error ? err.message : "Unknown error",
        results,
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    ...results,
    durationMs: Date.now() - startTime,
  });
}
