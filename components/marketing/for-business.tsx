"use client";

import { motion, useInView, animate } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ArrowRight, TrendingUp, Clock, DollarSign } from "lucide-react";

// NASA GIBS WMS public tile URLs — no auth required
const USE_CASES = [
  {
    id: "agriculture",
    label: "Agriculture",
    headline: "$4.3M revenue identified",
    subline: "across 180,000 acres in one analysis run",
    metrics: [
      { icon: TrendingUp, label: "Crop yield accuracy", before: "±18%", after: "±4%", highlight: true },
      { icon: Clock, label: "Field assessment time", before: "3 weeks", after: "6 hours", highlight: false },
      { icon: DollarSign, label: "Irrigation waste reduced", before: null, after: "23%", highlight: false },
    ],
    description:
      "Agronomists at scale use ASTRA OS to monitor crop health, detect early stress signals, and file NDVI-backed reports without touching a single satellite API directly.",
    imgUrl:
      "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&CRS=EPSG:4326&BBOX=41,-96,44,-90&WIDTH=700&HEIGHT=400&FORMAT=image/jpeg",
    imgAlt: "Satellite view of croplands — MODIS Terra",
    tag: "Crop monitoring",
    accent: "from-green-500/20 to-emerald-600/5",
    border: "border-green-500/20",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
    steps: ["Define AOI", "Pull NDVI history", "Detect anomalies", "Alert field team"],
  },
  {
    id: "insurance",
    label: "Insurance & Risk",
    headline: "73% faster claims",
    subline: "verified with before/after imagery — no field visit needed",
    metrics: [
      { icon: Clock, label: "Claim verification time", before: "14 days", after: "4 hours", highlight: true },
      { icon: TrendingUp, label: "Fraud detection rate", before: "12%", after: "41%", highlight: false },
      { icon: DollarSign, label: "Assessor costs saved", before: null, after: "$2.1M/yr", highlight: false },
    ],
    description:
      "P&C insurers use before/after satellite imagery to verify property damage instantly. ASTRA OS delivers change detection results in hours instead of dispatching adjusters.",
    imgUrl:
      "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&CRS=EPSG:4326&BBOX=29,-92,32,-88&WIDTH=700&HEIGHT=400&FORMAT=image/jpeg",
    imgAlt: "Satellite view of Gulf Coast — MODIS Terra",
    tag: "Damage assessment",
    accent: "from-blue-500/20 to-cyan-600/5",
    border: "border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    steps: ["File claim", "Pull pre/post imagery", "Run change detection", "Auto-approve or flag"],
  },
  {
    id: "realestate",
    label: "Real Estate",
    headline: "3× faster due diligence",
    subline: "on land use, zoning, and environmental risk",
    metrics: [
      { icon: Clock, label: "Site analysis time", before: "3 weeks", after: "2 days", highlight: true },
      { icon: TrendingUp, label: "Environmental risk", before: "Manual review", after: "Automated", highlight: false },
      { icon: DollarSign, label: "Report cost per site", before: "$8,000", after: "$400", highlight: false },
    ],
    description:
      "Real estate firms run land classification, flood risk, and change detection on acquisition targets before committing to site visits.",
    imgUrl:
      "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&CRS=EPSG:4326&BBOX=33,-113,34,-111&WIDTH=700&HEIGHT=400&FORMAT=image/jpeg",
    imgAlt: "Satellite view of Phoenix urban area — MODIS Terra",
    tag: "Land intelligence",
    accent: "from-orange-500/20 to-amber-600/5",
    border: "border-orange-500/20",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    steps: ["Select target parcel", "Run land classification", "Score environmental risk", "Decide in hours"],
  },
];

function ScanLine() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        initial={{ top: "0%" }}
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
      />
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary/50" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary/50" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary/50" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary/50" />
    </motion.div>
  );
}

function AnimatedMetric({ metric, delay, borderClass }: {
  metric: typeof USE_CASES[0]["metrics"][0];
  delay: number;
  borderClass: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`flex items-center justify-between rounded-xl border ${borderClass} bg-card px-4 py-3`}
    >
      <div className="flex items-center gap-3">
        <metric.icon className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">{metric.label}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {metric.before && (
          <>
            <span className="text-sm line-through text-muted-foreground/40">{metric.before}</span>
            <span className="text-muted-foreground/30 text-xs">→</span>
          </>
        )}
        <span className="text-sm font-bold text-primary">{metric.after}</span>
      </div>
    </motion.div>
  );
}

export function ForBusiness() {
  const [active, setActive] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const uc = USE_CASES[active];

  // Reset image loaded state when switching tabs
  useEffect(() => {
    setImgLoaded(false);
  }, [active]);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/2 to-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="secondary" className="mb-4">For Business</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Turn satellite data into{" "}
            <motion.span
              className="text-primary"
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
            >
              business outcomes
            </motion.span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No geospatial expertise required. Your team gets answers, not data engineering work.
          </p>
        </motion.div>

        {/* Tab selector */}
        <motion.div
          className="flex justify-center gap-2 mb-10 flex-wrap"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {USE_CASES.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActive(i)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border ${
                active === i
                  ? `${item.badge} border-current scale-105`
                  : "border-white/[0.07] text-muted-foreground hover:text-foreground hover:border-white/20"
              }`}
            >
              {item.label}
            </button>
          ))}
        </motion.div>

        {/* Main content */}
        <motion.div
          key={active}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* ── Left: satellite imagery ── */}
          <div className="space-y-3">
            <div
              className={`relative rounded-2xl overflow-hidden border bg-gradient-to-br ${uc.accent} ${uc.border}`}
              style={{ minHeight: 256 }}
            >
              {/* Loading skeleton */}
              {!imgLoaded && (
                <motion.div
                  className="absolute inset-0 bg-card flex items-center justify-center"
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uc.imgUrl}
                alt={uc.imgAlt}
                className={`w-full h-64 object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-90" : "opacity-0"}`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
              />

              {/* Scan-line effect overlay */}
              {imgLoaded && <ScanLine />}

              {/* Tag badge */}
              <div className="absolute top-3 left-3 z-20">
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm ${uc.badge}`}
                >
                  {uc.tag}
                </motion.span>
              </div>

              {/* Bottom result overlay */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 z-20"
                initial={{ opacity: 0, y: 8 }}
                animate={imgLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <p className="text-white font-bold text-xl leading-tight">{uc.headline}</p>
                <p className="text-white/70 text-sm mt-0.5">{uc.subline}</p>
              </motion.div>
            </div>

            <p className="text-[10px] text-muted-foreground/40 text-right">
              Imagery: NASA GIBS / MODIS Terra — public domain
            </p>

            {/* Workflow steps */}
            <div className={`rounded-xl border ${uc.border} bg-card/50 p-4`}>
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">
                Typical workflow
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {uc.steps.map((step, i) => (
                  <motion.div
                    key={step}
                    className="flex items-center gap-1.5"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                  >
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${uc.badge}`}>
                      {step}
                    </span>
                    {i < uc.steps.length - 1 && (
                      <span className="text-muted-foreground/30 text-xs">→</span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: metrics + description ── */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3">
              {uc.metrics.map((m, i) => (
                <AnimatedMetric key={m.label} metric={m} delay={i * 0.1} borderClass={uc.border} />
              ))}
            </div>

            <motion.p
              className="text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              {uc.description}
            </motion.p>

            {/* Social proof strip */}
            <motion.div
              className={`rounded-xl border ${uc.border} bg-card/40 px-4 py-3 flex items-start gap-3`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-sm">
                📡
              </div>
              <div>
                <p className="text-sm text-foreground/90">
                  "We went from a 3-week manual process to same-day results. The ROI was obvious in the first week."
                </p>
                <p className="text-xs text-muted-foreground mt-1">— Head of Analytics, Fortune 500 insurer</p>
              </div>
            </motion.div>

            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/signup">
                <Button className="gap-2">
                  Start free trial
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">Talk to sales</Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
