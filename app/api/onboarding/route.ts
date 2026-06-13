import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userType, useCase, teamName } = await request.json();

  if (!userType || !["developer", "business"].includes(userType)) {
    return NextResponse.json({ error: "Invalid userType" }, { status: 400 });
  }

  // Save user type + mark onboarding complete
  await prisma.user.update({
    where: { id: session.user.id },
    data: { userType, useCase: useCase ?? null, onboardedAt: new Date() },
  });

  // Update team name if provided and user has a team
  if (teamName) {
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
    });
    if (teamMember) {
      await prisma.team.update({
        where: { id: teamMember.teamId },
        data: { name: teamName },
      });
    }
  }

  const response = NextResponse.json({ ok: true });
  // Set a long-lived cookie so the middleware knows onboarding is done
  const isProd = process.env.NODE_ENV === "production";
  response.cookies.set("astra_onboarded", "1", {
    httpOnly: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    sameSite: "lax",
    secure: isProd,
    domain: isProd ? ".astraos.cloud" : undefined,
  });
  return response;
}
