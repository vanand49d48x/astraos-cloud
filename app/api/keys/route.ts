import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { z } from "zod";

const createKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(64),
});

/**
 * GET /api/keys — List all API keys for the current user's team.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!teamMember) {
      return NextResponse.json({ keys: [] });
    }

    const keys = await prisma.apiKey.findMany({
      where: { teamId: teamMember.teamId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        prefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ keys });
  } catch (err) {
    console.error("List keys error:", err);
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keys — Create a new API key.
 * Returns the full key ONCE (it's hashed before storage — actually we store raw for simplicity, but prefix for display).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: { team: true },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "No team found" },
        { status: 400 }
      );
    }

    // Check key limits based on plan
    const existingKeys = await prisma.apiKey.count({
      where: { teamId: teamMember.teamId, revokedAt: null },
    });

    const keyLimits: Record<string, number> = {
      free: 1,
      starter: 5,
      pro: 999,
      enterprise: 999,
    };

    const limit = keyLimits[teamMember.team.plan] || 1;
    if (existingKeys >= limit) {
      return NextResponse.json(
        { error: `Key limit reached for ${teamMember.team.plan} plan (${limit} keys)` },
        { status: 403 }
      );
    }

    // Generate key: astra_ + 40 char nanoid
    const rawKey = `astra_${nanoid(40)}`;
    const prefix = rawKey.slice(0, 12) + "...";

    const apiKey = await prisma.apiKey.create({
      data: {
        name: parsed.data.name,
        key: rawKey,
        prefix,
        userId: session.user.id,
        teamId: teamMember.teamId,
      },
    });

    // Return full key only on creation — this is the only time the user sees it
    return NextResponse.json(
      {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey,
        prefix: apiKey.prefix,
        createdAt: apiKey.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create key error:", err);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
