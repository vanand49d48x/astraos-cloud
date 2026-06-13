"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const WITHOUT = [
  { name: "Sentinel API", format: "SAFE format", color: "border-red-500/30 bg-red-500/5" },
  { name: "Landsat API", format: "GeoTIFF", color: "border-orange-500/30 bg-orange-500/5" },
  { name: "Planet API", format: "NITF format", color: "border-yellow-500/30 bg-yellow-500/5" },
  { name: "Maxar API", format: "Custom SDK", color: "border-pink-500/30 bg-pink-500/5" },
];

const WITH = [
  { name: "Sentinel", color: "text-green-400" },
  { name: "Landsat", color: "text-blue-400" },
  { name: "Planet", color: "text-purple-400" },
  { name: "Maxar", color: "text-cyan-400" },
];

export function PainPoints() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-red-950/5 to-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Badge variant="destructive" className="mb-4">The Problem</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Satellite data integration is <span className="text-destructive">broken</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Every team building on satellite data wastes months reinventing the same infrastructure.
          </p>
        </motion.div>

        {/* Visual before / after */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* ── Without ── */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <p className="text-sm font-semibold text-destructive">Without ASTRA OS</p>
            </div>

            <div className="space-y-3 mb-6">
              {WITHOUT.map((p, i) => (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className={`flex-1 rounded-lg border ${p.color} px-3 py-2 flex items-center justify-between`}>
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{p.format}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground/40 text-xs font-mono shrink-0">
                    <div className="w-8 h-px bg-destructive/30" />
                    <span className="text-destructive/50">→</span>
                  </div>
                  <div className="text-xs text-muted-foreground bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1 shrink-0">
                    Your App
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-destructive/10">
              {[
                { label: "4 contracts", sub: "to sign & maintain" },
                { label: "4 invoices", sub: "per month" },
                { label: "4 auth systems", sub: "to integrate" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-sm font-bold text-destructive">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── With ASTRA ── */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-sm font-semibold text-primary">With ASTRA OS</p>
            </div>

            {/* Funnel diagram */}
            <div className="flex items-center gap-4 mb-6">
              {/* Provider list */}
              <div className="flex-1 space-y-3">
                {WITH.map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-1 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2">
                      <span className={`text-sm font-medium ${p.color}`}>{p.name}</span>
                    </div>
                    <div className="w-6 h-px bg-primary/30" />
                  </motion.div>
                ))}
              </div>

              {/* ASTRA box */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="rounded-xl border border-primary/40 bg-primary/15 px-4 py-5 text-center">
                  <p className="text-xs font-bold text-primary tracking-widest">ASTRA</p>
                  <p className="text-[9px] text-primary/60 mt-0.5">OS</p>
                </div>
                <div className="h-6 w-px bg-primary/30" />
                <div className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">COG + STAC</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">Your App</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-primary/10">
              {[
                { label: "1 contract", sub: "covers all providers" },
                { label: "1 invoice", sub: "per month" },
                { label: "1 API key", sub: "one format" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-sm font-bold text-primary">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom impact strip */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {[
            { before: "Weeks", after: "Hours", label: "to first result" },
            { before: "40–60%", after: "~0%", label: "of eng time on ETL" },
            { before: "4× cost", after: "1 invoice", label: "procurement overhead" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-sm line-through text-muted-foreground/40">{s.before}</span>
                <span className="text-muted-foreground/30">→</span>
                <span className="text-sm font-bold text-primary">{s.after}</span>
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
