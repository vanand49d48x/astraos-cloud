"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Link from "next/link";

interface PricingCardProps {
  name: string;
  price: number | null;
  priceLabel: string;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  highlighted: boolean;
}

export function PricingCard({
  name,
  priceLabel,
  period,
  description,
  features,
  cta,
  highlighted,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-6 flex flex-col relative",
        highlighted
          ? "border-primary/40 bg-primary/5 shadow-[0_0_40px_rgba(0,212,255,0.08)]"
          : "border-card-border bg-card"
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-foreground">{priceLabel}</span>
        {period && <span className="text-muted-foreground ml-1">{period}</span>}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      <Link href={name === "Enterprise" ? "#" : "/signup"}>
        <Button
          variant={highlighted ? "primary" : "ghost"}
          className="w-full"
        >
          {cta}
        </Button>
      </Link>
    </div>
  );
}
