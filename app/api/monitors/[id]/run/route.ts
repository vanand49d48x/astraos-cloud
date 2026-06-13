import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { detectChanges } from "@/lib/analytics/change-detect";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const teamId = (session as any)?.teamId;
  if (!teamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const monitor = await prisma.monitor.findFirst({ where: { id, teamId } });
  if (!monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let result;
  try {
    result = await detectChanges({
      aoiBbox: monitor.aoiBbox,
      indices: monitor.indices,
      collections: monitor.collections,
      cloudCoverLt: monitor.cloudCoverLt,
      watchFor: monitor.watchFor,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 });
  }

  const report = await prisma.monitorReport.create({
    data: {
      monitorId: monitor.id,
      teamId,
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

  return NextResponse.json({ report, result });
}
