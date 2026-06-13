"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRICING_TIERS } from "@/lib/constants";
import { CreditCard, Check, ArrowRight, Zap, ExternalLink } from "lucide-react";

type BillingData = {
  plan: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  stripeCustomerId?: string;
  history: {
    id: string;
    amount: number;
    currency: string;
    period: string;
    status: string;
    invoiceUrl?: string;
  }[];
};

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [justUpgraded, setJustUpgraded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setJustUpgraded(params.get("success") === "true");
  }, []);

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((json) => {
        if (json && !json.error) setData(json);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade(plan: string) {
    setActionLoading(plan);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePortal() {
    setActionLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch {
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const currentPlan = data?.plan ?? "free";
  const isPaid = currentPlan !== "free";
  const periodEnd = data?.currentPeriodEnd
    ? new Date(data.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details</p>
      </div>

      {justUpgraded && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">
          Your plan has been upgraded successfully.
        </div>
      )}

      {/* Current plan */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">Current Plan</h3>
              <Badge variant="primary">
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Badge>
              {data?.subscriptionStatus && data.subscriptionStatus !== "active" && (
                <Badge variant="destructive">{data.subscriptionStatus}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading..."
                : currentPlan === "free"
                ? "5,000 API calls per month. Perfect for getting started."
                : periodEnd
                ? `Renews on ${periodEnd}.`
                : `Your ${currentPlan} plan is active.`}
            </p>
          </div>
          <div className="flex gap-2">
            {isPaid && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortal}
                disabled={actionLoading === "portal"}
              >
                {actionLoading === "portal" ? "Opening..." : "Manage Subscription"}
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            )}
            {!isPaid && (
              <Button size="sm" onClick={() => handleUpgrade("starter")} disabled={!!actionLoading}>
                <Zap className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h3 className="font-semibold mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRICING_TIERS.map((tier) => {
            const tierKey = tier.name.toLowerCase();
            const isCurrent = tierKey === currentPlan;
            const isEnterprise = tier.price === null;

            return (
              <div
                key={tier.name}
                className={`bg-card border rounded-xl p-5 relative ${
                  isCurrent
                    ? "border-primary/50"
                    : tier.highlighted
                    ? "border-primary/30"
                    : "border-white/[0.06]"
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-4">
                    <Badge variant="primary" className="text-xs">Current</Badge>
                  </div>
                )}

                <h4 className="font-semibold">{tier.name}</h4>
                <div className="mt-2 mb-3">
                  <span className="text-2xl font-bold">{tier.priceLabel}</span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{tier.description}</p>

                <ul className="space-y-2 mb-4">
                  {tier.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <Button
                    variant={tier.highlighted ? "primary" : "outline"}
                    size="sm"
                    className="w-full"
                    disabled={!!actionLoading}
                    onClick={() => {
                      if (isEnterprise) {
                        window.location.href = "mailto:sales@astraos.cloud";
                      } else {
                        handleUpgrade(tierKey);
                      }
                    }}
                  >
                    {actionLoading === tierKey
                      ? "Redirecting..."
                      : isEnterprise
                      ? "Contact Sales"
                      : "Upgrade"}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing history */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <h3 className="font-semibold mb-4">Billing History</h3>
        {!data || data.history.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No billing history yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Invoices will appear here when you upgrade to a paid plan
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {data.history.map((record) => (
              <div key={record.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(record.period + "-01").toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{record.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    ${(record.amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  {record.invoiceUrl && (
                    <a
                      href={record.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Invoice <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
