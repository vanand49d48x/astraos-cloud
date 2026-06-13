import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(64),
  url: z.string().url("Must be a valid HTTPS URL").startsWith("https://", "URL must use HTTPS"),
  events: z.array(z.enum(["imagery.available"])).min(1),
  aoiBbox: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*,-?\d+\.?\d*$/, "Format: west,south,east,north").optional(),
  cloudCoverLt: z.number().min(0).max(100).optional(),
  collections: z.array(z.string()).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.teamMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ webhooks: [] });

  const webhooks = await prisma.webhook.findMany({
    where: { teamId: member.teamId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { deliveries: true } },
      deliveries: {
        orderBy: { attemptedAt: "desc" },
        take: 1,
        select: { success: true, statusCode: true, attemptedAt: true },
      },
    },
  });

  // Never return the secret after creation
  return NextResponse.json({
    webhooks: webhooks.map(({ secret: _s, ...w }) => w),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const member = await prisma.teamMember.findFirst({ where: { userId: session.user.id } });
  if (!member) return NextResponse.json({ error: "No team found" }, { status: 400 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, url, events, aoiBbox, cloudCoverLt, collections } = parsed.data;
  const secret = `whsec_${nanoid(32)}`;

  const webhook = await prisma.webhook.create({
    data: {
      teamId: member.teamId,
      name,
      url,
      secret,
      events,
      aoiBbox: aoiBbox ?? null,
      cloudCoverLt: cloudCoverLt ?? null,
      collections: collections ?? [],
    },
  });

  // Return secret ONCE on creation
  return NextResponse.json({ ...webhook }, { status: 201 });
}
