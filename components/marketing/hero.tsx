"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Cloud, Satellite, ArrowRight, Loader2 } from "lucide-react";
import type { STACItem, STACItemCollection } from "@/lib/stac/types";
import { formatDate } from "@/lib/utils";

// Pre-baked San Francisco search — loads on mount to show real imagery immediately
const SF_BBOX = "-122.52,37.70,-122.35,37.82";
const SF_DATETIME = "2025-09-01/2026-01-01";

function ProviderDot({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
      <span className="text-xs text-muted-foreground font-mono">{label}</span>
    </div>
  );
}

function SatelliteCard({ item, index }: { item: STACItem; index: number }) {
  const thumbnail =
    item.assets.thumbnail?.href ||
    item.assets.rendered_preview?.href ||
    item.assets.visual?.href;
  const cloudCover = item.properties["eo:cloud_cover"];
  const provider = item.properties["astra:provider_name"] || item.properties["astra:provider"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.03] group"
    >
      <div className="aspect-video relative overflow-hidden bg-white/[0.04]">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`Satellite image from ${provider}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Satellite className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[9px] text-white/80 font-mono">
          {provider}
        </div>
      </div>
      <div className="px-2.5 py-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{formatDate(item.properties.datetime)}</span>
        {cloudCover !== undefined && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Cloud className="w-2.5 h-2.5" />
            {cloudCover.toFixed(0)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function Hero() {
  const [scenes, setScenes] = useState<STACItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      `/api/v1/search?bbox=${SF_BBOX}&datetime=${SF_DATETIME}&cloud_cover_lt=30&limit=3`
    )
      .then((r) => r.json())
      .then((data: STACItemCollection) => {
        setScenes(data.features?.slice(0, 3) ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[140px] opacity-40" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/8 rounded-full blur-[120px] opacity-30" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Explanation ── */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/8 text-primary text-sm mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live · 6 providers · AI-powered analysis
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
            >
              From satellite data to{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI-powered insights
              </span>
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground leading-relaxed mb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              ASTRA OS unifies 6 satellite providers — Sentinel, Landsat, Planet Labs, UP42, Airbus, and more — into a{" "}
              <span className="text-foreground font-medium">single API</span> that searches,
              analyzes, and monitors any location on Earth. Get spectral indices, change detection, and
              LLM-powered reports without managing a single provider contract.
            </motion.p>

            {/* Before / After pill */}
            <motion.div
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 mb-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
            >
              <div className="grid grid-cols-2 divide-x divide-white/[0.06]">
                <div className="pr-4">
                  <p className="text-[10px] uppercase tracking-widest text-destructive/70 font-medium mb-2">Without ASTRA</p>
                  <div className="space-y-1.5">
                    {["Sentinel → SAFE format", "Planet → NITF + auth", "UP42 → OAuth2 + STAC", "Airbus → opensearch API"].map((t) => (
                      <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground/60">
                        <span className="w-1 h-1 rounded-full bg-destructive/50 shrink-0" />
                        {t}
                      </div>
                    ))}
                    <div className="text-[10px] text-destructive/60 mt-2 pt-2 border-t border-white/[0.05]">
                      6 contracts · 6 invoices · 6 formats
                    </div>
                  </div>
                </div>
                <div className="pl-4">
                  <p className="text-[10px] uppercase tracking-widest text-primary/70 font-medium mb-2">With ASTRA</p>
                  <div className="space-y-1.5">
                    {["Sentinel ─┐", "Planet   ─┤", "UP42     ─┼─▶ ASTRA ─▶ AI insights", "Airbus   ─┤", "Landsat  ─┘"].map((t) => (
                      <div key={t} className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        {t}
                      </div>
                    ))}
                    <div className="text-[10px] text-primary/60 mt-2 pt-2 border-t border-white/[0.05]">
                      1 key · 1 invoice · 1 format
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
            >
              <Link href="/signup">
                <Button size="lg" className="text-base px-8">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/docs">
                <Button variant="ghost" size="lg" className="text-base px-8">
                  View Docs
                </Button>
              </Link>
            </motion.div>

            <motion.div
              className="flex items-center gap-4 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <ProviderDot label="sentinel-2" color="bg-green-500" />
              <ProviderDot label="planet-labs" color="bg-yellow-500" />
              <ProviderDot label="up42" color="bg-blue-500" />
              <ProviderDot label="airbus" color="bg-purple-500" />
            </motion.div>
          </div>

          {/* ── Right: Live satellite imagery ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Satellite className="w-4 h-4" />
                <span>Live results — San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-primary/70 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                GET /api/v1/search
              </div>
            </div>

            {/* Imagery grid */}
            {loading ? (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] aspect-[4/3] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm">Querying providers...</p>
                <div className="flex items-center gap-3 text-[10px]">
                  <ProviderDot label="Sentinel-2" color="bg-green-500" />
                  <ProviderDot label="Planet Labs" color="bg-yellow-500" />
                  <ProviderDot label="UP42" color="bg-blue-500" />
                  <ProviderDot label="Airbus" color="bg-purple-500" />
                </div>
              </div>
            ) : scenes.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {scenes.slice(0, 2).map((scene, i) => (
                    <SatelliteCard key={scene.id} item={scene} index={i} />
                  ))}
                </div>
                {scenes[2] && (
                  <SatelliteCard key={scenes[2].id} item={scenes[2]} index={2} />
                )}
                <p className="text-[11px] text-muted-foreground/50 text-center pt-1">
                  Real imagery · Multiple providers · One response
                </p>
              </div>
            ) : (
              /* Fallback: static explainer if API is down */
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-6 space-y-3">
                {[
                  { provider: "Sentinel-2", date: "2025-12-14", cloud: "4%", color: "bg-green-500/10 border-green-500/20" },
                  { provider: "Landsat 9", date: "2025-12-10", cloud: "11%", color: "bg-blue-500/10 border-blue-500/20" },
                  { provider: "Planetary Computer", date: "2025-12-08", cloud: "7%", color: "bg-purple-500/10 border-purple-500/20" },
                ].map((item) => (
                  <div key={item.provider} className={`rounded-lg border ${item.color} p-3 flex items-center justify-between`}>
                    <div>
                      <p className="text-sm font-medium">{item.provider}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Cloud cover</p>
                      <p className="text-sm font-mono">{item.cloud}</p>
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground/50 text-center">
                  3 providers · 1 API call · Standardized output
                </p>
              </div>
            )}

            {/* Code snippet below imagery */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-4 rounded-lg bg-[#0a0a14] border border-white/[0.06] p-4 font-mono text-xs leading-relaxed overflow-x-auto"
            >
              <span className="text-muted-foreground/50"># Analyze any location — AI insights in one call</span>
              {"\n"}
              <span className="text-blue-400">curl</span>
              <span className="text-foreground/80">{` -X POST "https://www.astraos.cloud/api/v1/analyze" \\`}</span>
              {"\n"}
              <span className="text-foreground/80">{`  -H `}</span>
              <span className="text-green-400">"Authorization: Bearer astra_..."</span>
              {"\n"}
              <span className="text-foreground/80">{`  -d '{"bbox":[-122.5,37.7,-122.3,37.9],`}</span>
              {"\n"}
              <span className="text-foreground/80">{`      "indices":["ndvi","nbr","ndwi"]}'`}</span>
              {"\n"}
              <span className="text-muted-foreground/50"># → NDVI 0.72 (Dense vegetation) · NBR 0.61 · Flood risk: Low</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
