import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  watchFor: z.string().min(5).max(1000),
  aoiBbox: z
    .string()
    .regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/, "aoiBbox must be 'west,south,east,north'"),
  indices: z
    .array(z.enum(["ndvi", "evi", "ndwi", "ndsi", "nbr"]))
    .min(1)
    .max(5)
    .default(["ndvi", "nbr", "ndwi"]),
  collections: z.array(z.string()).default(["sentinel-2-l2a"]),
  cloudCoverLt: z.number().min(0).max(100).default(30),
});

async function getTeamId(req: NextRequest): Promise<string | null> {
  const session = await auth();
  return (session as any)?.teamId ?? null;
}

export async function GET(req: NextRequest) {
  const teamId = await getTeamId(req);
  if (!teamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const monitors = await prisma.monitor.findMany({
    where: { teamId },
    include: {
      _count: { select: { reports: true } },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { significance: true, summary: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ monitors });
}

export async function POST(req: NextRequest) {
  const teamId = await getTeamId(req);
  if (!teamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const monitor = await prisma.monitor.create({
    data: { teamId, ...parsed.data },
  });

  return NextResponse.json({ monitor }, { status: 201 });
}
