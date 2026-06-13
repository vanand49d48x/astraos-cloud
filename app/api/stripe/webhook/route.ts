import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";

// Stripe requires the raw body to verify the signature
export const runtime = "nodejs";

async function syncSubscription(subscription: Stripe.Subscription) {
  const teamId = subscription.metadata?.teamId;
  if (!teamId) return;

  const firstItem = subscription.items.data[0];
  const priceId = firstItem?.price.id ?? null;
  const plan = priceId ? planFromPriceId(priceId) : "free";
  const rawPeriodEnd = firstItem?.current_period_end;
  const currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000) : null;

  await prisma.team.update({
    where: { id: teamId },
    data: {
      plan,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      currentPeriodEnd,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const teamId = sub.metadata?.teamId;
        if (teamId) {
          await prisma.team.update({
            where: { id: teamId },
            data: {
              plan: "free",
              stripeSubscriptionId: null,
              stripePriceId: null,
              subscriptionStatus: "canceled",
              currentPeriodEnd: null,
            },
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
        if (!customerId) break;

        const team = await prisma.team.findUnique({ where: { stripeCustomerId: customerId } });
        if (!team) break;

        await prisma.billingRecord.create({
          data: {
            teamId: team.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            period: new Date(invoice.period_start * 1000).toISOString().slice(0, 7),
            status: "paid",
            invoiceUrl: invoice.hosted_invoice_url ?? null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
        if (!customerId) break;

        const team = await prisma.team.findUnique({ where: { stripeCustomerId: customerId } });
        if (team) {
          await prisma.team.update({
            where: { id: team.id },
            data: { subscriptionStatus: "past_due" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
