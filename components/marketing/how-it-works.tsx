"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MapPin, Brain, Bell } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: MapPin,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "Define your area of interest",
    description:
      "Pass a bounding box and a date range. ASTRA fans out to 6 providers — Sentinel-2, Landsat, Planet Labs, UP42, Airbus, and Planetary Computer — in a single request.",
    code: `# One search, 6 providers\nPOST /api/v1/search\n{\n  "bbox": [-122.5, 37.7, -122.3, 37.9],\n  "datetime": "2025-01-01/2026-01-01",\n  "cloud_cover_lt": 20\n}`,
  },
  {
    number: "02",
    icon: Brain,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    title: "Run AI-powered analysis",
    description:
      "Compute spectral indices (NDVI, NBR, NDWI), detect burn severity, flood changes, and vegetation stress. Claude AI generates natural-language reports and significance ratings.",
    code: `# Analyze any scene\nPOST /api/v1/analyze\n→ NDVI: 0.72  (Dense vegetation)\n→ NBR:  0.61  (Low burn risk)\n→ NDWI: -0.18 (No flood signal)\n→ AI: "Stable canopy, no anomalies"`,
  },
  {
    number: "03",
    icon: Bell,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    title: "Monitor and get alerted",
    description:
      "Save areas of interest with watch goals. ASTRA runs daily change detection, builds time series trends, and fires alerts when something significant happens.",
    code: `# Automated monitoring\nPOST /api/monitors\n{\n  "name": "Amazon Deforestation Watch",\n  "watchFor": "deforestation or fire",\n  "indices": ["ndvi", "nbr"]\n}\n# → Daily checks · AI reports · Alerts`,
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/10 to-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Badge variant="primary" className="mb-4">How It Works</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Search, analyze, and monitor{" "}
            <span className="text-primary">any location on Earth</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From raw satellite pixels to AI-generated insights in three steps. No provider SDKs, no format conversion, no separate credentials.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute left-1/2 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2" />

          <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.12 }}
                  className="relative"
                >
                  <div className={`rounded-xl border ${step.border} bg-card p-6 h-full`}>
                    {/* Step number */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`p-2.5 rounded-lg ${step.bg} border ${step.border}`}>
                        <Icon className={`w-5 h-5 ${step.color}`} />
                      </div>
                      <span className={`text-4xl font-black ${step.color} opacity-20 leading-none`}>
                        {step.number}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      {step.description}
                    </p>

                    {/* Code snippet */}
                    <div className="rounded-lg bg-[#08080f] border border-white/[0.05] p-3 font-mono text-[11px] text-foreground/60 leading-relaxed whitespace-pre">
                      {step.code}
                    </div>
                  </div>

                  {/* Arrow between cards (mobile) */}
                  {i < STEPS.length - 1 && (
                    <div className="flex justify-center py-2 lg:hidden">
                      <div className="text-muted-foreground/30 text-xl">↓</div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom stat bar */}
        <motion.div
          className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {[
            { value: "6", label: "providers in one call" },
            { value: "5", label: "spectral indices" },
            { value: "AI", label: "change analysis" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
