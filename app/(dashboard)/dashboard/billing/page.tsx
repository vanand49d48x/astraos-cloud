"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRICING_TIERS } from "@/lib/constants";
import { CreditCard, Check, ArrowRight, Zap } from "lucide-react";

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/billing");
        if (res.ok) {
          const data = await res.json();
          setCurrentPlan(data.plan);
        }
      } catch {
        // Fallback to free
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Current plan */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">Current Plan</h3>
              <Badge variant="primary">
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentPlan === "free"
                ? "5,000 API calls per month. Perfect for getting started."
                : `Your ${currentPlan} plan renews on the 1st of each month.`}
            </p>
          </div>
          {currentPlan === "free" && (
            <Button size="sm">
              <Zap className="w-4 h-4 mr-2" />
              Upgrade
            </Button>
          )}
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <h3 className="font-semibold mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`bg-card border rounded-xl p-5 relative ${
                tier.name.toLowerCase() === currentPlan
                  ? "border-primary/50"
                  : tier.highlighted
                  ? "border-primary/30"
                  : "border-white/[0.06]"
              }`}
            >
              {tier.name.toLowerCase() === currentPlan && (
                <div className="absolute -top-3 left-4">
                  <Badge variant="primary" className="text-xs">
                    Current
                  </Badge>
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

              {tier.name.toLowerCase() !== currentPlan && (
                <Button
                  variant={tier.highlighted ? "primary" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  {tier.price === null ? "Contact Sales" : `Upgrade`}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Billing history */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <h3 className="font-semibold mb-4">Billing History</h3>
        <div className="text-center py-8">
          <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No billing history yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Invoices will appear here when you upgrade to a paid plan
          </p>
        </div>
      </div>
    </div>
  );
}
