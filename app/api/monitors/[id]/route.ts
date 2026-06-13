import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

async function getTeamId(): Promise<string | null> {
  const session = await auth();
  return (session as any)?.teamId ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teamId = await getTeamId();
  if (!teamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const monitor = await prisma.monitor.findFirst({
    where: { id, teamId },
    include: {
      _count: { select: { reports: true } },
      reports: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ monitor });
}

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  watchFor: z.string().min(5).max(1000).optional(),
  active: z.boolean().optional(),
  cloudCoverLt: z.number().min(0).max(100).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teamId = await getTeamId();
  if (!teamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const monitor = await prisma.monitor.updateMany({
    where: { id, teamId },
    data: parsed.data,
  });
  if (monitor.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teamId = await getTeamId();
  if (!teamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.monitor.deleteMany({ where: { id, teamId } });
  return NextResponse.json({ ok: true });
}
