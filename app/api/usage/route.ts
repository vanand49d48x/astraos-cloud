import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!teamMember) {
      return NextResponse.json({
        totalCalls: 0,
        totalVolume: "0 B",
        avgLatency: 0,
        errorRate: 0,
        byEndpoint: [],
        daily: [],
      });
    }

    const period = request.nextUrl.searchParams.get("period") || "30d";
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const teamId = teamMember.teamId;

    const [totalCalls, volumeAgg, latencyAgg, errorCount, endpointBreakdown] =
      await Promise.all([
        prisma.usageRecord.count({
          where: { teamId, timestamp: { gte: since } },
        }),

        prisma.usageRecord.aggregate({
          where: { teamId, timestamp: { gte: since } },
          _sum: { dataVolume: true },
        }),

        prisma.usageRecord.aggregate({
          where: { teamId, timestamp: { gte: since } },
          _avg: { computeMs: true },
        }),

        prisma.usageRecord.count({
          where: { teamId, timestamp: { gte: since }, statusCode: { gte: 400 } },
        }),

        prisma.usageRecord.groupBy({
          by: ["endpoint"],
          where: { teamId, timestamp: { gte: since } },
          _count: true,
          orderBy: { _count: { endpoint: "desc" } },
          take: 10,
        }),
      ]);

    const totalBytes = Number(volumeAgg._sum.dataVolume || 0);
    let totalVolume = "0 B";
    if (totalBytes >= 1e9) totalVolume = `${(totalBytes / 1e9).toFixed(1)} GB`;
    else if (totalBytes >= 1e6) totalVolume = `${(totalBytes / 1e6).toFixed(1)} MB`;
    else if (totalBytes >= 1e3) totalVolume = `${(totalBytes / 1e3).toFixed(1)} KB`;
    else if (totalBytes > 0) totalVolume = `${totalBytes} B`;

    const byEndpoint = endpointBreakdown.map((ep) => ({
      endpoint: ep.endpoint,
      count: ep._count,
      percentage: totalCalls > 0 ? Math.round((ep._count / totalCalls) * 100) : 0,
    }));

    return NextResponse.json({
      totalCalls,
      totalVolume,
      avgLatency: Math.round(latencyAgg._avg.computeMs || 0),
      errorRate: totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0,
      byEndpoint,
    });
  } catch (err) {
    console.error("Usage API error:", err);
    return NextResponse.json(
      { error: "Failed to load usage data" },
      { status: 500 }
    );
  }
}
