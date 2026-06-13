import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    });

    // Auto-create team if missing (DB was down during sign-in)
    if (!teamMember) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user) {
        const team = await prisma.team.create({
          data: {
            name: user.name ? `${user.name}'s Team` : "My Team",
            members: { create: { userId: user.id, role: "owner" } },
          },
        });
        teamMember = await prisma.teamMember.findFirst({
          where: { userId: user.id, teamId: team.id },
          include: { team: true },
        });
      }
      if (!teamMember) {
        return NextResponse.json({ plan: "free", history: [] });
      }
    }

    const history = await prisma.billingRecord.findMany({
      where: { teamId: teamMember.teamId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      plan: teamMember.team.plan,
      stripeCustomerId: teamMember.team.stripeCustomerId,
      subscriptionStatus: teamMember.team.subscriptionStatus,
      currentPeriodEnd: teamMember.team.currentPeriodEnd,
      history,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Billing API error:", message, err);
    return NextResponse.json(
      { error: "Failed to load billing data", detail: message },
      { status: 500 }
    );
  }
}
