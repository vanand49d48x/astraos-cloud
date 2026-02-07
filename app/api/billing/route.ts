import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    });

    if (!teamMember) {
      return NextResponse.json({ plan: "free", history: [] });
    }

    const history = await prisma.billingRecord.findMany({
      where: { teamId: teamMember.teamId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      plan: teamMember.team.plan,
      stripeCustomerId: teamMember.team.stripeCustomerId,
      history,
    });
  } catch (err) {
    console.error("Billing API error:", err);
    return NextResponse.json(
      { error: "Failed to load billing data" },
      { status: 500 }
    );
  }
}
