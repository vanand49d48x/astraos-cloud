import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's team
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId },
      include: { team: true },
    });

    if (!teamMember) {
      return NextResponse.json({
        totalCalls: 0,
        dataVolume: "0 B",
        activeKeys: 0,
        plan: "Free",
        recentRequests: [],
      });
    }

    const teamId = teamMember.teamId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries
    const [callCount, activeKeys, recentRequests, dataVolumeAgg] =
      await Promise.all([
        // Total API calls this month
        prisma.usageRecord.count({
          where: { teamId, timestamp: { gte: monthStart } },
        }),

        // Active API keys
        prisma.apiKey.count({
          where: { teamId, revokedAt: null },
        }),

        // Recent requests
        prisma.usageRecord.findMany({
          where: { teamId },
          orderBy: { timestamp: "desc" },
          take: 10,
          select: {
            id: true,
            endpoint: true,
            method: true,
            statusCode: true,
            timestamp: true,
          },
        }),

        // Data volume this month
        prisma.usageRecord.aggregate({
          where: { teamId, timestamp: { gte: monthStart } },
          _sum: { dataVolume: true },
        }),
      ]);

    // Format data volume
    const totalBytes = Number(dataVolumeAgg._sum.dataVolume || 0);
    let dataVolume = "0 B";
    if (totalBytes >= 1e9) dataVolume = `${(totalBytes / 1e9).toFixed(1)} GB`;
    else if (totalBytes >= 1e6) dataVolume = `${(totalBytes / 1e6).toFixed(1)} MB`;
    else if (totalBytes >= 1e3) dataVolume = `${(totalBytes / 1e3).toFixed(1)} KB`;
    else if (totalBytes > 0) dataVolume = `${totalBytes} B`;

    return NextResponse.json({
      totalCalls: callCount,
      dataVolume,
      activeKeys,
      plan: teamMember.team.plan.charAt(0).toUpperCase() + teamMember.team.plan.slice(1),
      recentRequests,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
