"use client";

import { useState } from "react";
import { TrendingUp, Play, Loader2, AlertTriangle, Info } from "lucide-react";
import { TimeSeriesChart } from "@/components/dashboard/timeseries-chart";
import type { TimeSeriesResult } from "@/lib/analytics/timeseries";

const ALL_INDICES = ["ndvi", "evi", "ndwi", "ndsi", "nbr"] as const;
const INDEX_LABELS: Record<string, string> = {
  ndvi: "NDVI – Vegetation",
  evi:  "EVI – Enhanced Vegetation",
  ndwi: "NDWI – Water",
  ndsi: "NDSI – Snow/Ice",
  nbr:  "NBR – Burn Severity",
};

const PRESETS = [
  { label: "Amazon Rainforest",   bbox: "-62.5,-10.5,-60.5,-8.5" },
  { label: "California Bay Area", bbox: "-122.5,37.3,-121.8,37.9" },
  { label: "Sahel Belt",          bbox: "14.0,13.0,16.0,15.0" },
  { label: "Ganges Delta",        bbox: "88.5,21.5,90.5,23.5" },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export default function TimeSeriesPage() {
  const [bbox, setBbox] = useState("-62.5,-10.5,-60.5,-8.5");
  const [startDate, setStartDate] = useState(daysAgo(365 * 2));
  const [endDate, setEndDate] = useState(daysAgo(0));
  const [indices, setIndices] = useState<string[]>(["ndvi", "nbr"]);
  const [interval, setInterval] = useState<"monthly" | "biweekly">("monthly");
  const [cloudCoverLt, setCloudCoverLt] = useState(30);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TimeSeriesResult | null>(null);
  const [computeMs, setComputeMs] = useState<number | null>(null);
  const [error, setError] = useState("");

  const toggleIndex = (idx: string) =>
    setIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );

  const run = async () => {
    if (indices.length === 0) { setError("Select at least one index."); return; }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/timeseries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bbox,
          start_date: startDate,
          end_date: endDate,
          indices,
          interval,
          cloud_cover_lt: cloudCoverLt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data);
      setComputeMs(data.computeMs ?? null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Time Series Analysis
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track spectral indices monthly over years. Detect long-term trends and seasonal anomalies.
        </p>
      </div>

      {/* Config panel */}
      <div className="bg-card border border-white/[0.06] rounded-2xl p-6 space-y-5">
        {/* Presets */}
        <div>
          <label className="block text-sm font-medium mb-2">Quick presets</label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setBbox(p.bbox)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                  bbox === p.bbox
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : "bg-white/5 border-white/[0.08] text-muted-foreground hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Bounding box</label>
            <input
              type="text"
              value={bbox}
              onChange={(e) => setBbox(e.target.value)}
              placeholder="-62.5,-10.5,-60.5,-8.5"
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">west, south, east, north</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Max cloud cover: <span className="text-primary">{cloudCoverLt}%</span>
            </label>
            <input
              type="range" min={5} max={80} value={cloudCoverLt}
              onChange={(e) => setCloudCoverLt(Number(e.target.value))}
              className="w-full mt-3 accent-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Start date</label>
            <input
              type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">End date</label>
            <input
              type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Indices */}
        <div>
          <label className="block text-sm font-medium mb-2">Spectral indices</label>
          <div className="flex flex-wrap gap-2">
            {ALL_INDICES.map((idx) => (
              <button
                key={idx}
                onClick={() => toggleIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  indices.includes(idx)
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : "bg-white/5 border-white/[0.08] text-muted-foreground hover:bg-white/10"
                }`}
              >
                {INDEX_LABELS[idx]}
              </button>
            ))}
          </div>
        </div>

        {/* Interval */}
        <div>
          <label className="block text-sm font-medium mb-2">Interval</label>
          <div className="flex gap-2">
            {(["monthly", "biweekly"] as const).map((iv) => (
              <button
                key={iv}
                onClick={() => setInterval(iv)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  interval === iv
                    ? "bg-primary/20 border-primary/30 text-primary"
                    : "bg-white/5 border-white/[0.08] text-muted-foreground hover:bg-white/10"
                }`}
              >
                {iv === "monthly" ? "Monthly" : "Bi-weekly"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {loading ? "Analyzing…" : "Run Analysis"}
          </button>
          {loading && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              This may take 15–30 seconds for long date ranges
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>
              <span className="text-foreground font-medium">{result.summary.successfulPoints}</span>
              /{result.summary.totalPeriods} periods with imagery
            </span>
            {result.summary.avgCloudCover != null && (
              <span>
                Avg cloud cover: <span className="text-foreground font-medium">{result.summary.avgCloudCover}%</span>
              </span>
            )}
            {computeMs && (
              <span>Computed in {(computeMs / 1000).toFixed(1)}s</span>
            )}
            {result.anomalies.length > 0 && (
              <span className="text-orange-400 font-medium">
                ⚠ {result.anomalies.length} anomal{result.anomalies.length === 1 ? "y" : "ies"} detected
              </span>
            )}
          </div>

          <div className="bg-card border border-white/[0.06] rounded-2xl p-6">
            <TimeSeriesChart
              points={result.points as any}
              trends={result.trends}
              anomalies={result.anomalies}
              indices={indices}
            />
          </div>

          {/* Missing months note */}
          {result.summary.successfulPoints < result.summary.totalPeriods && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {result.summary.totalPeriods - result.summary.successfulPoints} period(s) had no cloud-free
              Sentinel-2 imagery. Try increasing the cloud cover threshold to fill gaps.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
