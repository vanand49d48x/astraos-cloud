import crypto from "crypto";
import { prisma } from "@/lib/db";
import type { Webhook } from "@prisma/client";

export interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

/**
 * Sign the payload body with the webhook secret using HMAC-SHA256.
 * Receivers can verify: X-ASTRA-Signature header == sha256=<hmac>
 */
function sign(secret: string, body: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export async function deliverWebhook(
  webhook: Webhook,
  event: string,
  payload: object
): Promise<DeliveryResult> {
  const body = JSON.stringify(payload);
  const signature = sign(webhook.secret, body);

  let statusCode: number | undefined;
  let response: string | undefined;
  let error: string | undefined;
  let success = false;

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ASTRA-Event": event,
        "X-ASTRA-Signature": signature,
        "X-ASTRA-Webhook-ID": webhook.id,
        "User-Agent": "ASTRA-OS-Webhooks/1.0",
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    statusCode = res.status;
    response = (await res.text()).slice(0, 1000);
    success = res.ok;
  } catch (err) {
    error = err instanceof Error ? err.message : "Delivery failed";
  }

  // Log delivery
  await prisma.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event,
      payload,
      statusCode,
      response,
      error,
      success,
    },
  });

  // Update lastTriggeredAt on success
  if (success) {
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastTriggeredAt: new Date() },
    });
  }

  return { success, statusCode, error };
}
