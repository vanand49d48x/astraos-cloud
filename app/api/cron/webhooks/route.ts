import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deliverWebhook } from "@/lib/webhooks/deliver";
import { unifiedSearch } from "@/lib/providers/registry";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel cron calls this with the CRON_SECRET in Authorization header
function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev mode — allow
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeWebhooks = await prisma.webhook.findMany({
    where: { active: true, events: { has: "imagery.available" } },
  });

  const results: Array<{ id: string; name: string; fired: number; error?: string }> = [];

  for (const webhook of activeWebhooks) {
    if (!webhook.aoiBbox) continue;

    const parts = webhook.aoiBbox.split(",").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) continue;

    const since = webhook.lastTriggeredAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();

    const sinceStr = since.toISOString().replace(/\.\d{3}Z$/, "Z");
    const nowStr = now.toISOString().replace(/\.\d{3}Z$/, "Z");

    try {
      const searchResult = await unifiedSearch({
        bbox: parts as [number, number, number, number],
        datetime: `${sinceStr}/${nowStr}`,
        cloudCoverLt: webhook.cloudCoverLt ?? undefined,
        collections: webhook.collections.length > 0 ? webhook.collections : undefined,
        limit: 10,
      });

      const scenes = searchResult.features;
      if (scenes.length === 0) {
        results.push({ id: webhook.id, name: webhook.name, fired: 0 });
        continue;
      }

      const payload = {
        id: `evt_${Date.now()}_${webhook.id}`,
        event: "imagery.available",
        timestamp: now.toISOString(),
        data: {
          scenes: scenes.slice(0, 5),
          total: scenes.length,
          since: sinceStr,
          aoi: webhook.aoiBbox,
          webhook: { id: webhook.id, name: webhook.name },
        },
      };

      const delivery = await deliverWebhook(webhook, "imagery.available", payload);
      results.push({ id: webhook.id, name: webhook.name, fired: scenes.length, ...(!delivery.success ? { error: delivery.error } : {}) });
    } catch (err) {
      results.push({ id: webhook.id, name: webhook.name, fired: 0, error: String(err) });
    }
  }

  return NextResponse.json({ checked: activeWebhooks.length, results });
}
