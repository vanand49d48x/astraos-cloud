"use client";

import { Badge } from "@/components/ui/badge";
import { USE_CASES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Leaf, Wheat, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, any> = {
  Leaf,
  Wheat,
  Shield,
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  Leaf: { bg: "bg-success/10", text: "text-success", border: "border-success/20" },
  Wheat: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
  Shield: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20" },
};

export function UseCasesSection() {
  return (
    <section className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="primary" className="mb-4">
            Use Cases
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for teams that need{" "}
            <span className="text-primary">satellite data</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From climate tech startups to agricultural analytics to insurance risk assessment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {USE_CASES.map((useCase, i) => {
            const Icon = iconMap[useCase.icon] || Leaf;
            const colors = colorMap[useCase.icon] || colorMap.Leaf;

            return (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className={cn(
                  "group rounded-xl border border-card-border bg-card overflow-hidden",
                  "hover:border-white/10 transition-all duration-300"
                )}
              >
                {/* Header */}
                <div className={cn("p-6 border-b", colors.border, "border-opacity-50")}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("p-2 rounded-lg", colors.bg)}>
                      <Icon className={cn("h-5 w-5", colors.text)} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {useCase.title}
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Problem */}
                  <div>
                    <div className="text-xs font-medium text-destructive/80 uppercase tracking-wider mb-1">
                      The Problem
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {useCase.problem}
                    </p>
                  </div>

                  {/* Solution */}
                  <div>
                    <div className={cn("text-xs font-medium uppercase tracking-wider mb-1", colors.text)}>
                      With ASTRA OS
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {useCase.solution}
                    </p>
                  </div>

                  {/* Value */}
                  <div className={cn("flex items-start gap-2 p-3 rounded-lg", colors.bg, "border", colors.border)}>
                    <ArrowRight className={cn("h-4 w-4 mt-0.5 shrink-0", colors.text)} />
                    <p className={cn("text-sm font-medium", colors.text)}>
                      {useCase.value}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
