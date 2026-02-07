import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { PricingCard } from "@/components/marketing/pricing-card";
import { PRICING_TIERS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, usage-based pricing for ASTRA OS. Start free, scale as you grow.",
};

export default function PricingPage() {
  return (
    <div className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="primary" className="mb-4">
            Pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Simple, transparent{" "}
            <span className="text-primary">pricing</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free with 5,000 API calls per month. Scale as your team grows.
            Usage-based billing means you only pay for what you use.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.name} {...tier} />
          ))}
        </div>

        {/* FAQ-like section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            <FaqItem
              question="What counts as an API call?"
              answer="Each request to /api/v1/search, /api/v1/scenes, /api/v1/assets, or /api/v1/process counts as one API call. Polling a processing job status does not count."
            />
            <FaqItem
              question="What data sources are included?"
              answer="All plans include access to open data: Sentinel-2 (Copernicus), Landsat 8/9 (USGS), and Microsoft Planetary Computer datasets. Commercial data (Planet, Maxar) is available on Pro and Enterprise plans."
            />
            <FaqItem
              question="Can I try before I buy?"
              answer="Yes! The Free tier gives you 5,000 API calls per month with no credit card required. It's fully functional with all open data sources."
            />
            <FaqItem
              question="How does billing work?"
              answer="Usage-based billing. You're charged based on API calls, data volume processed, and compute minutes. We bill monthly, and you can set usage alerts to avoid surprises."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <h3 className="font-semibold text-foreground mb-2">{question}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
    </div>
  );
}
