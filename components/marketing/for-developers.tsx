"use client";

import { motion, useInView } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Check, Copy, Terminal, Code2, ArrowRight } from "lucide-react";

const TABS = [
  {
    label: "Search",
    lang: "bash",
    filename: "search.sh",
    code: `# Search 6 satellite providers in one call
curl "https://www.astraos.cloud/api/v1/search?\\
  bbox=-122.5,37.7,-122.3,37.9&\\
  datetime=2025-01-01/2026-01-01&\\
  cloud_cover_lt=20" \\
  -H "Authorization: Bearer astra_sk_live_..."

# STAC FeatureCollection
{
  "features": [...],  // Sentinel + Planet + Airbus
  "context": { "returned": 18, "matched": 94 }
}`,
  },
  {
    label: "Analyze",
    lang: "bash",
    filename: "analyze.sh",
    code: `# AI-powered spectral analysis
curl -X POST "https://www.astraos.cloud/api/v1/analyze" \\
  -H "Authorization: Bearer astra_sk_live_..." \\
  -d '{"bbox":[-62.5,-10.5,-60.5,-8.5],
       "indices":["ndvi","nbr","ndwi"]}'

# Response includes AI classification
{
  "indices": {
    "ndvi": { "value": 0.72 },
    "nbr":  { "value": 0.61 }
  },
  "classification": {
    "primaryUseCase": "vegetation",
    "landCover": "Dense Forest"
  }
}`,
  },
  {
    label: "Time Series",
    lang: "bash",
    filename: "timeseries.sh",
    code: `# Monthly trend + anomaly detection
curl -X POST "https://www.astraos.cloud/api/v1/timeseries" \\
  -H "Authorization: Bearer astra_sk_live_..." \\
  -d '{"bbox":[-62.5,-10.5,-60.5,-8.5],
       "start_date":"2024-01-01",
       "end_date":"2026-01-01",
       "indices":["ndvi","nbr"],
       "interval":"monthly"}'

# Trends + anomalies + phenology
{
  "trends": {
    "ndvi": { "direction": "decreasing",
      "changePer30Days": -0.008, "rSquared": 0.82 }
  },
  "anomalies": [{ "date":"2025-03","zScore":-2.1 }]
}`,
  },
  {
    label: "Monitor",
    lang: "bash",
    filename: "monitor.sh",
    code: `# Set up automated daily monitoring
curl -X POST "https://www.astraos.cloud/api/monitors" \\
  -H "Authorization: Bearer astra_sk_live_..." \\
  -d '{"name":"Amazon Watch",
       "watchFor":"deforestation or fire",
       "aoiBbox":"-62.5,-10.5,-60.5,-8.5",
       "indices":["ndvi","nbr"]}'

# ASTRA runs daily change detection
# Claude AI generates significance reports:
{
  "significance": "high",
  "summary": "8.3% NDVI decline. NBR increase
    indicates fire activity in NW sector."
}`,
  },
];

const FEATURES = [
  { icon: "⚡", text: "Results in ~400ms" },
  { icon: "🛰️", text: "6 providers, one key" },
  { icon: "🤖", text: "Claude AI analysis" },
  { icon: "📈", text: "Time series + phenology" },
  { icon: "🔔", text: "Automated monitoring" },
  { icon: "📐", text: "STAC + COG output" },
];

const STAC_OUTPUT = `{
  "indices": {
    "ndvi": { "value": 0.72, "interpretation":
              "Dense vegetation" },
    "nbr":  { "value": 0.61 },
    "ndwi": { "value": -0.18 }
  },
  "classification": {
    "primaryUseCase": "vegetation",
    "landCover": "Dense Forest",
    "burnRisk": "Low",
    "floodRisk": "Low"
  },
  "sceneId": "planetary-computer:sentinel...",
  "cloudCover": 4.2
}`;

// Line-by-line highlight colors
function getLineColor(line: string, lang: string): string {
  if (line.startsWith("#") || line.startsWith("//")) return "text-muted-foreground/50";
  if (lang === "python") {
    if (line.startsWith("import") || line.startsWith("from")) return "text-purple-400";
    if (line.includes("print(")) return "text-yellow-400/80";
    if (line.includes("client.") || line.includes("job.") || line.includes("done.")) return "text-blue-300";
    if (line.includes('"""') || line.includes("'")) return "text-green-400/80";
  }
  if (lang === "javascript") {
    if (line.startsWith("import") || line.startsWith("from")) return "text-purple-400";
    if (line.includes("console.log")) return "text-yellow-400/80";
    if (line.includes("await") || line.includes("const") || line.includes("let")) return "text-blue-300";
  }
  if (lang === "bash") {
    if (line.startsWith("curl")) return "text-blue-400";
    if (line.startsWith("{") || line.startsWith("}") || line.startsWith('"')) return "text-green-400/80";
    if (line.startsWith("-H")) return "text-orange-400/80";
  }
  return "text-foreground/80";
}

export function ForDevelopers() {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const codeRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(codeRef, { once: true, margin: "-50px" });

  const lines = TABS[activeTab].code.split("\n");

  // Typewriter reveal: show one line at a time when in view
  useEffect(() => {
    if (!isInView) return;
    setVisibleLines(0);
    const timer = setInterval(() => {
      setVisibleLines((v) => {
        if (v >= lines.length) {
          clearInterval(timer);
          return v;
        }
        return v + 1;
      });
    }, 40);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView, activeTab]);

  function copy() {
    navigator.clipboard.writeText(TABS[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function switchTab(i: number) {
    setActiveTab(i);
    setVisibleLines(0);
  }

  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/3 to-background" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="primary" className="mb-4">For Developers</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Four endpoints.{" "}
            <motion.span
              className="text-primary"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              Full earth intelligence.
            </motion.span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Search, analyze, time-series, and monitor — each endpoint does exactly one thing well.
            REST API with GraphQL support. Same response shape regardless of which satellite the data came from.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ── Left: feature tiles + live response ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="rounded-xl border border-white/[0.07] bg-card p-4 flex items-center gap-3"
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className="text-sm text-muted-foreground">{f.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Live response panel */}
            <motion.div
              className="rounded-xl border border-white/[0.07] bg-[#08080f] overflow-hidden"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
                <motion.div
                  className="w-2 h-2 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Analysis response — /api/v1/analyze</span>
              </div>
              <pre className="p-4 text-[11px] font-mono text-foreground/70 leading-relaxed overflow-x-auto">
                {STAC_OUTPUT}
              </pre>
            </motion.div>

            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
            >
              <Link href="/docs">
                <Button variant="outline" className="gap-2">
                  <Code2 className="w-4 h-4" />
                  Read the Docs
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="gap-2">
                  Get API Key
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* ── Right: animated code editor ── */}
          <motion.div
            ref={codeRef}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border border-white/[0.08] bg-[#08080f] overflow-hidden shadow-2xl"
          >
            {/* Tab bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex">
                {TABS.map((tab, i) => (
                  <button
                    key={tab.label}
                    onClick={() => switchTab(i)}
                    className={`px-4 py-2.5 text-xs font-medium transition-all cursor-pointer border-b-2 ${
                      activeTab === i
                        ? "border-primary text-foreground bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                onClick={copy}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Filename */}
            <div className="px-4 py-1.5 border-b border-white/[0.04] bg-white/[0.01]">
              <span className="text-[10px] text-muted-foreground/50 font-mono">
                {TABS[activeTab].filename}
              </span>
            </div>

            {/* Code with line-by-line reveal */}
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] font-mono">
                <tbody>
                  {lines.map((line, i) => (
                    <motion.tr
                      key={`${activeTab}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: i < visibleLines ? 1 : 0 }}
                      transition={{ duration: 0.05 }}
                      className="hover:bg-white/[0.02]"
                    >
                      <td className="pl-4 pr-4 py-0 text-muted-foreground/25 text-right select-none w-8 text-[10px]">
                        {i + 1}
                      </td>
                      <td className="pr-4 py-0.5">
                        <code className={`leading-relaxed whitespace-pre ${getLineColor(line, TABS[activeTab].lang)}`}>
                          {line}
                          {/* Blinking cursor on last visible line */}
                          {i === visibleLines - 1 && visibleLines < lines.length && (
                            <motion.span
                              className="inline-block w-[7px] h-[13px] bg-primary/80 ml-0.5 align-middle"
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.5, repeat: Infinity }}
                            />
                          )}
                        </code>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-4" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
