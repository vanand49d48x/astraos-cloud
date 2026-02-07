import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/keys/[id] — Revoke an API key (soft delete).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the key belongs to the user's team
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "No team found" }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.findFirst({
      where: { id, teamId: teamMember.teamId },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    if (apiKey.revokedAt) {
      return NextResponse.json(
        { error: "Key already revoked" },
        { status: 400 }
      );
    }

    // Soft delete — set revokedAt
    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Revoke key error:", err);
    return NextResponse.json(
      { error: "Failed to revoke key" },
      { status: 500 }
    );
  }
}
