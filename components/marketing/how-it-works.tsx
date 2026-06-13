"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, Download } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: MapPin,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    title: "Define your area",
    description:
      "Pass a bounding box (any corner of Earth) and a date range. That's all the input ASTRA needs.",
    code: `bbox=[-122.5, 37.7, -122.3, 37.9]\ndatetime="2025-01-01/2026-01-01"`,
  },
  {
    number: "02",
    icon: Zap,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    title: "We query all providers simultaneously",
    description:
      "ASTRA fans out to Sentinel-2, Landsat 8/9, and Planetary Computer in parallel. You don't write a single line of provider-specific code.",
    code: `→ Sentinel-2  (10m, 5-day revisit)\n→ Landsat 9   (30m, 8-day revisit)\n→ Planetary   (multi-source)`,
  },
  {
    number: "03",
    icon: Download,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    title: "Get standardized data",
    description:
      "Every result comes back as a STAC item with COG assets. Same schema, same coordinate system, same band names — regardless of provider.",
    code: `{ "type": "FeatureCollection",\n  "features": [...],  // STAC items\n  "context": { "returned": 12 } }`,
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
            From coordinates to imagery in{" "}
            <span className="text-primary">one request</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No provider SDKs to install. No format conversion. No separate auth tokens. Three steps, done.
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
            { value: "1", label: "API call" },
            { value: "3+", label: "providers searched" },
            { value: "~400ms", label: "median latency" },
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
