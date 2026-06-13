import pLimit from "p-limit";
import { unifiedSearch } from "@/lib/providers/registry";
import { fetchPCBandStats, bandsForIndices } from "./providers";
import {
  computeNDVI, computeEVI, computeNDWI, computeNDSI, computeNBR,
} from "./indices";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TimeSeriesParams {
  aoiBbox: string;              // "west,south,east,north"
  startDate: string;            // "YYYY-MM-DD"
  endDate: string;              // "YYYY-MM-DD"
  indices: string[];            // ["ndvi", "nbr", "ndwi"]
  interval?: "monthly" | "biweekly";
  collections?: string[];
  cloudCoverLt?: number;
}

export interface TimeSeriesPoint {
  date: string;                 // "YYYY-MM-DD" — first day of period
  sceneId: string | null;
  cloudCover: number | null;
  values: Record<string, number | null>;
  missing: boolean;
}

export interface TrendLine {
  slope: number;                // change per day
  changePer30Days: number;      // human-readable monthly rate
  totalChange: number;          // first → last point
  direction: "increasing" | "stable" | "decreasing";
  rSquared: number;             // goodness of fit 0–1
}

export interface Anomaly {
  date: string;
  index: string;
  value: number;
  expectedMean: number;
  zScore: number;
  direction: "above" | "below";
}

export interface TimeSeriesResult {
  points: TimeSeriesPoint[];
  trends: Record<string, TrendLine>;
  anomalies: Anomaly[];
  summary: {
    totalPeriods: number;
    successfulPoints: number;
    avgCloudCover: number | null;
    startDate: string;
    endDate: string;
  };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

interface Interval { label: string; range: string }

function generateMonthlyIntervals(start: string, end: string): Interval[] {
  const intervals: Interval[] = [];
  const endDate = new Date(end + "T00:00:00Z");
  let cur = new Date(start + "T00:00:00Z");
  cur = new Date(cur.getUTCFullYear(), cur.getUTCMonth(), 1);

  while (cur <= endDate) {
    const y = cur.getUTCFullYear();
    const m = cur.getUTCMonth();
    const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getUTCDate();
    const last = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    intervals.push({ label: first, range: `${first}T00:00:00Z/${last}T23:59:59Z` });
    cur = new Date(y, m + 1, 1);
  }
  return intervals;
}

function generateBiweeklyIntervals(start: string, end: string): Interval[] {
  const intervals: Interval[] = [];
  const endDate = new Date(end + "T00:00:00Z");
  let cur = new Date(start + "T00:00:00Z");

  while (cur <= endDate) {
    const periodEnd = new Date(cur.getTime() + 13 * 86400000);
    const label = cur.toISOString().split("T")[0];
    const rangeEnd = (periodEnd > endDate ? endDate : periodEnd).toISOString().split("T")[0];
    intervals.push({ label, range: `${label}T00:00:00Z/${rangeEnd}T23:59:59Z` });
    cur = new Date(cur.getTime() + 14 * 86400000);
  }
  return intervals;
}

// ── Statistics ────────────────────────────────────────────────────────────────

function linearRegression(
  pairs: Array<{ x: number; y: number }>
): TrendLine {
  const n = pairs.length;
  if (n < 2) {
    return { slope: 0, changePer30Days: 0, totalChange: 0, direction: "stable", rSquared: 0 };
  }

  const sx  = pairs.reduce((a, p) => a + p.x, 0);
  const sy  = pairs.reduce((a, p) => a + p.y, 0);
  const sxy = pairs.reduce((a, p) => a + p.x * p.y, 0);
  const sxx = pairs.reduce((a, p) => a + p.x * p.x, 0);

  const denom = n * sxx - sx * sx;
  const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;

  const yMean = sy / n;
  const ssTot = pairs.reduce((a, p) => a + (p.y - yMean) ** 2, 0);
  const ssRes = pairs.reduce((a, p) => a + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const rSquared = ssTot < 1e-10 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  const changePer30Days = slope * 30;
  const totalChange = slope * (pairs[n - 1].x - pairs[0].x);

  let direction: TrendLine["direction"] = "stable";
  if (Math.abs(changePer30Days) >= 0.01) {
    direction = changePer30Days > 0 ? "increasing" : "decreasing";
  }

  return { slope, changePer30Days, totalChange, direction, rSquared: Math.round(rSquared * 1000) / 1000 };
}

function computeSeasonalAnomalies(
  points: TimeSeriesPoint[],
  index: string
): Anomaly[] {
  // Group values by month number (0–11)
  const byMonth: Record<number, number[]> = {};
  for (const pt of points) {
    if (pt.missing || pt.values[index] == null) continue;
    const m = new Date(pt.date + "T00:00:00Z").getUTCMonth();
    (byMonth[m] ??= []).push(pt.values[index] as number);
  }

  // Compute mean + std per month (need ≥ 2 data points for meaningful std)
  const monthStats: Record<number, { mean: number; std: number }> = {};
  for (const [m, vals] of Object.entries(byMonth)) {
    if (vals.length < 2) continue;
    const mean = vals.reduce((a, v) => a + v, 0) / vals.length;
    const std  = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
    if (std > 0.005) monthStats[Number(m)] = { mean, std };
  }

  const anomalies: Anomaly[] = [];
  for (const pt of points) {
    if (pt.missing || pt.values[index] == null) continue;
    const m     = new Date(pt.date + "T00:00:00Z").getUTCMonth();
    const stats = monthStats[m];
    if (!stats) continue;
    const zScore = (pt.values[index] as number - stats.mean) / stats.std;
    if (Math.abs(zScore) >= 1.5) {
      anomalies.push({
        date: pt.date,
        index,
        value: pt.values[index] as number,
        expectedMean: Math.round(stats.mean * 10000) / 10000,
        zScore: Math.round(zScore * 100) / 100,
        direction: zScore > 0 ? "above" : "below",
      });
    }
  }
  return anomalies;
}

// ── Scene analysis ────────────────────────────────────────────────────────────

async function analyzeOnePeriod(
  bbox: [number, number, number, number],
  range: string,
  indices: string[],
  cloudCoverLt: number,
  collections: string[]
): Promise<{ sceneId: string; cloudCover: number | null; values: Record<string, number | null> } | null> {
  // Only PC scenes support TiTiler band stats
  const searchCollections = collections.some((c) => c.includes("sentinel"))
    ? ["sentinel-2-l2a"]
    : ["sentinel-2-l2a"];

  const result = await unifiedSearch({
    bbox,
    datetime: range,
    collections: searchCollections,
    cloudCoverLt,
    limit: 5,
  });

  const pcScenes = result.features.filter((f) => f.id?.startsWith("planetary-computer:"));
  if (pcScenes.length === 0) return null;

  const best = pcScenes.reduce((a, b) =>
    (b.properties["eo:cloud_cover"] ?? 100) < (a.properties["eo:cloud_cover"] ?? 100) ? b : a
  );

  const parts = best.id.slice("planetary-computer:".length).split(":");
  if (parts.length < 2) return null;
  const [collection, itemId] = parts;

  const bands = Array.from(bandsForIndices(indices));
  let s: Record<string, any>;
  try {
    s = await fetchPCBandStats(collection, itemId, bands);
  } catch {
    return null;
  }

  const values: Record<string, number | null> = {};
  if (indices.includes("ndvi") && s["B08"] && s["B04"])  values.ndvi = computeNDVI(s["B08"], s["B04"]).value;
  if (indices.includes("evi") && s["B08"] && s["B04"] && s["B02"])  values.evi = computeEVI(s["B08"], s["B04"], s["B02"]).value;
  if (indices.includes("ndwi") && s["B03"] && s["B08"])  values.ndwi = computeNDWI(s["B03"], s["B08"]).value;
  if (indices.includes("ndsi") && s["B03"] && s["B11"])  values.ndsi = computeNDSI(s["B03"], s["B11"]).value;
  if (indices.includes("nbr")  && s["B08"] && s["B11"])  values.nbr  = computeNBR(s["B08"], s["B11"]).value;

  return {
    sceneId: best.id,
    cloudCover: best.properties["eo:cloud_cover"] ?? null,
    values,
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function buildTimeSeries(
  params: TimeSeriesParams
): Promise<TimeSeriesResult> {
  const [west, south, east, north] = params.aoiBbox.split(",").map(Number);
  const bbox: [number, number, number, number] = [west, south, east, north];
  const cloudCoverLt = params.cloudCoverLt ?? 30;
  const collections  = params.collections ?? ["sentinel-2-l2a"];
  const interval     = params.interval ?? "monthly";

  const intervals =
    interval === "biweekly"
      ? generateBiweeklyIntervals(params.startDate, params.endDate)
      : generateMonthlyIntervals(params.startDate, params.endDate);

  // Fan out with concurrency limit — avoid hammering PC TiTiler
  const limit = pLimit(4);

  const rawPoints = await Promise.all(
    intervals.map(({ label, range }) =>
      limit(async () => {
        const res = await analyzeOnePeriod(bbox, range, params.indices, cloudCoverLt, collections);
        if (!res) {
          return {
            date: label,
            sceneId: null,
            cloudCover: null,
            values: Object.fromEntries(params.indices.map((i) => [i, null])),
            missing: true,
          } as TimeSeriesPoint;
        }
        return {
          date: label,
          sceneId: res.sceneId,
          cloudCover: res.cloudCover,
          values: res.values,
          missing: false,
        } as TimeSeriesPoint;
      })
    )
  );

  // ── Trend per index ──────────────────────────────────────────────────────
  const t0 = new Date(params.startDate + "T00:00:00Z").getTime();
  const trends: Record<string, TrendLine> = {};

  for (const idx of params.indices) {
    const pairs = rawPoints
      .filter((pt) => !pt.missing && pt.values[idx] != null)
      .map((pt) => ({
        x: (new Date(pt.date + "T00:00:00Z").getTime() - t0) / 86400000, // days since start
        y: pt.values[idx] as number,
      }));
    trends[idx] = linearRegression(pairs);
  }

  // ── Anomalies ────────────────────────────────────────────────────────────
  const anomalies: Anomaly[] = [];
  for (const idx of params.indices) {
    anomalies.push(...computeSeasonalAnomalies(rawPoints, idx));
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  const successful  = rawPoints.filter((p) => !p.missing);
  const cloudValues = successful.map((p) => p.cloudCover).filter((c): c is number => c !== null);
  const avgCloudCover = cloudValues.length
    ? Math.round(cloudValues.reduce((a, v) => a + v, 0) / cloudValues.length * 10) / 10
    : null;

  return {
    points: rawPoints,
    trends,
    anomalies,
    summary: {
      totalPeriods: rawPoints.length,
      successfulPoints: successful.length,
      avgCloudCover,
      startDate: params.startDate,
      endDate: params.endDate,
    },
  };
}
