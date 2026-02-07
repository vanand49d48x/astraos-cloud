import { prisma } from "./db";
import { auth } from "./auth";
import { NextRequest } from "next/server";

/**
 * Validate an API key from the Authorization header.
 * Returns the API key record with team info, or null if invalid.
 */
export async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7);
  if (!key.startsWith("astra_")) return null;

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { team: true, user: true },
    });

    if (!apiKey || apiKey.revokedAt) return null;

    // Update last used timestamp (fire and forget)
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return apiKey;
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated session user with their active team.
 */
export async function getSessionWithTeam() {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: {
        team: true,
        user: true,
      },
      orderBy: { team: { createdAt: "asc" } },
    });

    if (!teamMember) return null;

    return {
      user: teamMember.user,
      team: teamMember.team,
      role: teamMember.role,
    };
  } catch {
    return null;
  }
}

/**
 * Log a usage record for an API request.
 */
export async function logUsage(params: {
  teamId: string;
  apiKeyId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  dataVolume?: number;
  computeMs?: number;
}) {
  try {
    await prisma.usageRecord.create({
      data: {
        teamId: params.teamId,
        apiKeyId: params.apiKeyId || null,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        dataVolume: params.dataVolume || 0,
        computeMs: params.computeMs || 0,
      },
    });
  } catch {
    // Non-critical — don't fail the request
  }
}

/**
 * Log a provider hit for observability.
 */
export async function logProviderHit(params: {
  teamId?: string;
  apiKeyId?: string;
  requestId: string;
  providerId: string;
  endpoint: string;
  statusCode?: number;
  latencyMs: number;
  error?: string;
}) {
  try {
    await prisma.providerHit.create({
      data: {
        teamId: params.teamId || null,
        apiKeyId: params.apiKeyId || null,
        requestId: params.requestId,
        providerId: params.providerId,
        endpoint: params.endpoint,
        statusCode: params.statusCode || null,
        latencyMs: params.latencyMs,
        error: params.error || null,
      },
    });
  } catch {
    // Non-critical
  }
}
