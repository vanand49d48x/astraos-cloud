import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { detectChanges } from "@/lib/analytics/change-detect";

export async function GET(req: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const cronSecret = process.env.CRON_SECRET;

  if (!isDev) {
    const auth = req.headers.get("authorization");
    if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const monitors = await prisma.monitor.findMany({
    where: { active: true },
  });

  const results: Array<{ monitorId: string; status: string; error?: string }> = [];

  for (const monitor of monitors) {
    try {
      const result = await detectChanges({
        aoiBbox: monitor.aoiBbox,
        indices: monitor.indices,
        collections: monitor.collections,
        cloudCoverLt: monitor.cloudCoverLt,
        watchFor: monitor.watchFor,
      });

      await prisma.monitorReport.create({
        data: {
          monitorId: monitor.id,
          teamId: monitor.teamId,
          baselineDate: result.baseline.date,
          latestDate: result.latest.date,
          baselineSceneId: result.baseline.sceneId,
          latestSceneId: result.latest.sceneId,
          indexChanges: result.indexChanges as any,
          llmAnalysis: result.llmAnalysis,
          significance: result.significance,
          summary: result.summary,
          rawData: {
            baselineIndices: result.baselineIndices,
            latestIndices: result.latestIndices,
            recommendations: result.recommendations,
            daysDelta: result.daysDelta,
          } as any,
        },
      });

      await prisma.monitor.update({
        where: { id: monitor.id },
        data: { lastCheckedAt: new Date() },
      });

      results.push({ monitorId: monitor.id, status: "ok" });
    } catch (err: any) {
      results.push({ monitorId: monitor.id, status: "error", error: err.message });
    }
  }

  return NextResponse.json({ processed: monitors.length, results });
}
