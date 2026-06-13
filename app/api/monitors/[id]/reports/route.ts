import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const teamId = (session as any)?.teamId;
  if (!teamId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const monitor = await prisma.monitor.findFirst({ where: { id, teamId } });
  if (!monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reports = await prisma.monitorReport.findMany({
    where: { monitorId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ reports });
}
