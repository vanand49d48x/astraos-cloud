import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getOwnedWebhook(userId: string, webhookId: string) {
  const member = await prisma.teamMember.findFirst({ where: { userId } });
  if (!member) return null;
  return prisma.webhook.findFirst({ where: { id: webhookId, teamId: member.teamId } });
}

// PATCH /api/webhooks/:id — toggle active or rename
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const webhook = await getOwnedWebhook(session.user.id, id);
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updated = await prisma.webhook.update({
    where: { id },
    data: {
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
      ...(body.name ? { name: body.name } : {}),
    },
  });

  const { secret: _s, ...safe } = updated;
  return NextResponse.json(safe);
}

// DELETE /api/webhooks/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const webhook = await getOwnedWebhook(session.user.id, id);
  if (!webhook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.webhook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// GET /api/webhooks/:id/deliveries handled in separate file
