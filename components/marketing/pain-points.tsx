"use client";

import { Badge } from "@/components/ui/badge";
import { PAIN_POINTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  FileWarning,
  Grid3x3,
  Receipt,
  Cpu,
  SearchX,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, any> = {
  FileWarning,
  Grid3x3,
  Receipt,
  Cpu,
  SearchX,
};

export function PainPoints() {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/20 to-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="destructive" className="mb-4">
            The Problem
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Satellite data integration is{" "}
            <span className="text-destructive">broken</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every company building on satellite data reinvents the same infrastructure.
            ASTRA OS eliminates this work entirely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PAIN_POINTS.map((point, i) => {
            const Icon = iconMap[point.icon] || FileWarning;
            return (
              <motion.div
                key={point.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={cn(
                  "group rounded-xl border border-card-border bg-card p-6 hover:border-primary/20 transition-all duration-300",
                  "hover:shadow-[0_0_30px_rgba(0,212,255,0.05)]"
                )}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Icon className="h-5 w-5 text-destructive" />
                  </div>
                  <h3 className="font-semibold text-foreground">{point.title}</h3>
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {point.problem}
                </p>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-primary font-medium">
                    {point.solution}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
