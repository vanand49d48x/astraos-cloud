"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Eye,
  Flame,
  Droplets,
  Sprout,
  Brain,
} from "lucide-react";

const CAPABILITIES = [
  {
    icon: TrendingUp,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/15",
    title: "Time Series Analysis",
    description:
      "Track spectral indices monthly or bi-weekly over years. Linear regression trend lines, seasonal anomaly detection (z-score), and R² goodness-of-fit.",
    tags: ["NDVI", "EVI", "NBR", "NDWI", "NDSI"],
  },
  {
    icon: Brain,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/15",
    title: "AI Change Detection",
    description:
      "Compare two scenes with Claude AI. Get significance ratings (none → critical), natural-language summaries, and actionable recommendations.",
    tags: ["Claude AI", "dNBR", "dNDWI", "significance"],
  },
  {
    icon: Flame,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/15",
    title: "Burn Severity Mapping",
    description:
      "USGS BARC-compliant 7-class burn severity classification using dNBR (pre_NBR − post_NBR). Enhanced by BAI (Burned Area Index) from Planet Labs notebook patterns.",
    tags: ["dNBR", "BAI", "USGS BARC", "7 severity classes"],
  },
  {
    icon: Droplets,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/15",
    title: "Flood Detection",
    description:
      "Detect flood extent and recession using dNDWI (±0.15 threshold). Classify flood change as: flooding, recession, stable inundation, or no change.",
    tags: ["dNDWI", "flood extent", "recession"],
  },
  {
    icon: Sprout,
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/15",
    title: "Crop Phenology Metrics",
    description:
      "Green-up duration, peak date, senescence rate, seasonal productivity integral, and stress dip detection — based on Planet Labs CB_phenometrics notebook patterns.",
    tags: ["VCI", "green-up", "senescence", "stress dips"],
  },
  {
    icon: Eye,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/15",
    title: "Automated Monitoring",
    description:
      "Save areas of interest with natural-language watch goals. Daily cron runs change detection, Claude AI rates significance, and fires webhooks on high/critical events.",
    tags: ["daily cron", "webhooks", "AI reports", "alerts"],
  },
];

export function Capabilities() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Badge variant="primary" className="mb-4">Intelligence Layer</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Beyond search —{" "}
            <span className="text-primary">built-in earth intelligence</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            ASTRA OS isn&apos;t just a satellite catalog. It&apos;s a multi-temporal processing platform with AI analysis,
            trend detection, and automated monitoring built into the API.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`rounded-xl border ${cap.border} bg-card p-5 flex flex-col gap-4`}
              >
                <div className={`w-10 h-10 rounded-lg ${cap.bg} border ${cap.border} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${cap.color}`} />
                </div>

                <div>
                  <h3 className="font-semibold mb-1.5">{cap.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {cap.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cap.bg} ${cap.border} ${cap.color}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
