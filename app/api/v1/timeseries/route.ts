import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { buildTimeSeries } from "@/lib/analytics/timeseries";

// Allow up to 60s — 24-month time series requires many API calls
export const maxDuration = 60;

const schema = z.object({
  bbox: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  indices: z
    .array(z.enum(["ndvi", "evi", "ndwi", "ndsi", "nbr"]))
    .min(1)
    .max(5)
    .default(["ndvi", "nbr", "ndwi"]),
  interval: z.enum(["monthly", "biweekly"]).default("monthly"),
  cloud_cover_lt: z.number().min(0).max(100).default(30),
  collections: z.array(z.string()).default(["sentinel-2-l2a"]),
});

async function resolveAuth(req: NextRequest): Promise<{ teamId: string | null; apiKeyId: string | null }> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer astra_")) {
    const key = authHeader.slice(7);
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      select: { teamId: true, id: true, revokedAt: true },
    });
    if (apiKey && !apiKey.revokedAt) {
      prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
      return { teamId: apiKey.teamId, apiKeyId: apiKey.id };
    }
  }
  const session = await auth();
  const teamId = (session as any)?.teamId ?? null;
  return { teamId, apiKeyId: null };
}

export async function POST(req: NextRequest) {
  const { teamId, apiKeyId } = await resolveAuth(req);

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { bbox, start_date, end_date, indices, interval, cloud_cover_lt, collections } = parsed.data;

  // Guard against overly long ranges
  const startMs = new Date(start_date).getTime();
  const endMs   = new Date(end_date).getTime();
  const days    = (endMs - startMs) / 86400000;
  const maxDays = interval === "monthly" ? 365 * 5 : 365; // 5yr monthly / 1yr biweekly
  if (days > maxDays) {
    return NextResponse.json(
      { error: `Date range too long for ${interval} interval. Max: ${maxDays} days.` },
      { status: 400 }
    );
  }

  const t0 = Date.now();
  let result;
  try {
    result = await buildTimeSeries({
      aoiBbox: bbox,
      startDate: start_date,
      endDate: end_date,
      indices,
      interval,
      collections,
      cloudCoverLt: cloud_cover_lt,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 422 });
  }

  const computeMs = Date.now() - t0;

  // Log usage fire-and-forget
  if (teamId) {
    prisma.usageRecord.create({
      data: {
        teamId,
        apiKeyId: apiKeyId ?? undefined,
        endpoint: "/api/v1/timeseries",
        method: "POST",
        statusCode: 200,
        computeMs,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ ...result, computeMs });
}
