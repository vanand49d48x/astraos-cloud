import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PLAN_LIMITS: Record<string, number> = {
  free: 5_000,
  starter: 50_000,
  pro: 500_000,
  enterprise: 10_000_000,
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: { select: { plan: true } } },
    });

    if (!teamMember) {
      return NextResponse.json(emptyResponse("free"));
    }

    const period = request.nextUrl.searchParams.get("period") || "30d";
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const teamId = teamMember.teamId;
    const plan = teamMember.team.plan;
    const callLimit = PLAN_LIMITS[plan] ?? 5_000;

    // ── Core aggregates ───────────────────────────────────────────────────
    const [totalCalls, volumeAgg, latencyAgg, errorCount] = await Promise.all([
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
    ]);

    // ── By endpoint ───────────────────────────────────────────────────────
    const endpointGroups = await prisma.usageRecord.groupBy({
      by: ["endpoint"],
      where: { teamId, timestamp: { gte: since } },
      _count: true,
      _avg: { computeMs: true },
      orderBy: { _count: { endpoint: "desc" } },
      take: 10,
    });

    const byEndpoint = endpointGroups.map((ep) => ({
      endpoint: ep.endpoint,
      count: ep._count,
      avgLatency: Math.round(ep._avg.computeMs ?? 0),
      percentage: totalCalls > 0 ? Math.round((ep._count / totalCalls) * 100) : 0,
    }));

    // ── By API key ────────────────────────────────────────────────────────
    const keyGroups = await prisma.usageRecord.groupBy({
      by: ["apiKeyId"],
      where: { teamId, timestamp: { gte: since }, apiKeyId: { not: null } },
      _count: true,
      orderBy: { _count: { apiKeyId: "desc" } },
      take: 20,
    });

    const keyIds = keyGroups.map((g) => g.apiKeyId).filter(Boolean) as string[];
    const keyDetails = keyIds.length
      ? await prisma.apiKey.findMany({
          where: { id: { in: keyIds } },
          select: { id: true, name: true, prefix: true, revokedAt: true },
        })
      : [];

    const keyMap = Object.fromEntries(keyDetails.map((k) => [k.id, k]));
    const byKey = keyGroups.map((g) => ({
      apiKeyId: g.apiKeyId,
      name: g.apiKeyId ? (keyMap[g.apiKeyId]?.name ?? "Unknown key") : "Dashboard / session",
      prefix: g.apiKeyId ? (keyMap[g.apiKeyId]?.prefix ?? "") : "",
      revoked: g.apiKeyId ? !!keyMap[g.apiKeyId]?.revokedAt : false,
      count: g._count,
      percentage: totalCalls > 0 ? Math.round((g._count / totalCalls) * 100) : 0,
    }));

    // Session-based calls (no apiKeyId) lumped as "Dashboard"
    const sessionCalls = totalCalls - keyGroups.reduce((s, g) => s + g._count, 0);
    if (sessionCalls > 0) {
      byKey.push({
        apiKeyId: null,
        name: "Dashboard (Explorer)",
        prefix: "",
        revoked: false,
        count: sessionCalls,
        percentage: totalCalls > 0 ? Math.round((sessionCalls / totalCalls) * 100) : 0,
      });
    }

    // ── Daily trend (raw SQL for date truncation) ─────────────────────────
    const daily: Array<{ date: string; calls: number; errors: number }> =
      await prisma.$queryRaw`
        SELECT
          TO_CHAR(timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
          COUNT(*)::int AS calls,
          COUNT(*) FILTER (WHERE "statusCode" >= 400)::int AS errors
        FROM "UsageRecord"
        WHERE "teamId" = ${teamId}
          AND timestamp >= ${since}
        GROUP BY 1
        ORDER BY 1 ASC
      `;

    // ── Format volume ─────────────────────────────────────────────────────
    const totalBytes = Number(volumeAgg._sum.dataVolume || 0);
    let totalVolume = "0 B";
    if (totalBytes >= 1e9)      totalVolume = `${(totalBytes / 1e9).toFixed(1)} GB`;
    else if (totalBytes >= 1e6) totalVolume = `${(totalBytes / 1e6).toFixed(1)} MB`;
    else if (totalBytes >= 1e3) totalVolume = `${(totalBytes / 1e3).toFixed(1)} KB`;
    else if (totalBytes > 0)    totalVolume = `${totalBytes} B`;

    return NextResponse.json({
      totalCalls,
      totalVolume,
      avgLatency: Math.round(latencyAgg._avg.computeMs ?? 0),
      errorRate: totalCalls > 0 ? +((errorCount / totalCalls) * 100).toFixed(1) : 0,
      byEndpoint,
      byKey,
      daily,
      plan,
      callLimit,
      period,
    });
  } catch (err) {
    console.error("Usage API error:", err);
    return NextResponse.json({ error: "Failed to load usage data" }, { status: 500 });
  }
}

function emptyResponse(plan: string) {
  return {
    totalCalls: 0,
    totalVolume: "0 B",
    avgLatency: 0,
    errorRate: 0,
    byEndpoint: [],
    byKey: [],
    daily: [],
    plan,
    callLimit: PLAN_LIMITS[plan] ?? 5_000,
    period: "30d",
  };
}
