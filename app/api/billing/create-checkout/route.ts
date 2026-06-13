import { NextRequest, NextResponse } from "next/server";
import { getSessionWithTeam } from "@/lib/auth-helpers";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const ctx = await getSessionWithTeam();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await request.json();
  const priceId = STRIPE_PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { team, user } = ctx;
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

  // Reuse existing Stripe customer or create a new one
  let customerId = team.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: team.name,
      metadata: { teamId: team.id },
    });
    customerId = customer.id;
    await prisma.team.update({
      where: { id: team.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/billing?success=true`,
    cancel_url: `${baseUrl}/dashboard/billing`,
    metadata: { teamId: team.id, plan },
    subscription_data: {
      metadata: { teamId: team.id, plan },
    },
  });

  return NextResponse.json({ url: session.url });
}
