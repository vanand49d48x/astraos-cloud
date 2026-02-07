"use client";

import { Badge } from "@/components/ui/badge";
import { DATA_SOURCES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Satellite, Clock, Maximize, Radio } from "lucide-react";
import { motion } from "framer-motion";

export function DataSources() {
  return (
    <section className="py-20 md:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/20 to-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="primary" className="mb-4">
            Data Sources
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            One API, many{" "}
            <span className="text-primary">providers</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Access satellite imagery from multiple providers through a single, unified interface.
            No separate contracts, no format differences, no integration headaches.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DATA_SOURCES.map((source, i) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={cn(
                "rounded-xl border bg-card p-5",
                source.status === "live"
                  ? "border-primary/20"
                  : "border-card-border opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{source.name}</h3>
                  <p className="text-xs text-muted-foreground">{source.provider}</p>
                </div>
                <Badge
                  variant={source.status === "live" ? "success" : "outline"}
                >
                  {source.status === "live" ? "Live" : "Coming Soon"}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Maximize className="h-3 w-3" />
                  {source.resolution}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {source.revisit}
                </span>
                <span className="flex items-center gap-1">
                  <Radio className="h-3 w-3" />
                  {source.type}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
