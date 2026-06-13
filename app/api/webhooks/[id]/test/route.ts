import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deliverWebhook } from "@/lib/webhooks/deliver";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const member = await prisma.teamMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "No team" }, { status: 400 });

  const webhook = await prisma.webhook.findFirst({ where: { id, teamId: member.teamId } });
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payload = {
    id: `test_${Date.now()}`,
    event: "imagery.available",
    timestamp: new Date().toISOString(),
    test: true,
    data: {
      scenes: [],
      aoi: webhook.aoiBbox ?? "global",
      webhook: { id: webhook.id, name: webhook.name },
    },
  };

  const result = await deliverWebhook(webhook, "imagery.available", payload);
  return NextResponse.json(result);
}
