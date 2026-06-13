import { unifiedSearch } from "@/lib/providers/registry";
import { fetchPCBandStats, bandsForIndices } from "./providers";
import {
  computeNDVI,
  computeEVI,
  computeNDWI,
  computeNDSI,
  computeNBR,
} from "./indices";
import type { IndexResult } from "./indices";
import {
  analyzeChangesWithLLM,
  computeIndexChanges,
  estimateSignificance,
} from "@/lib/ai/change-analysis";
import {
  classifyBurnSeverity,
  classifyFloodChange,
  classifyVegetation,
  classifyScene,
  computeBAI,
} from "./classify";
import type { BurnClass, FloodChange, SceneClassification } from "./classify";

export interface ChangeDetectParams {
  aoiBbox: string;             // "west,south,east,north"
  indices: string[];           // ["ndvi", "nbr", "ndwi"]
  collections: string[];
  cloudCoverLt: number;
  watchFor: string;
  baselineDateRange?: string;  // "YYYY-MM-DD/YYYY-MM-DD" — defaults to 90-30 days ago
  latestDateRange?: string;    // "YYYY-MM-DD/YYYY-MM-DD" — defaults to last 30 days
}

export interface SceneInfo {
  sceneId: string;
  date: string;
  cloudCover: number | null;
  bbox: number[] | null;
}

export interface ChangeDetectResult {
  baseline: SceneInfo;
  latest: SceneInfo;
  baselineIndices: Record<string, IndexResult>;
  latestIndices: Record<string, IndexResult>;
  indexChanges: ReturnType<typeof computeIndexChanges>;
  significance: "none" | "low" | "medium" | "high" | "critical";
  summary: string;
  llmAnalysis: string;
  recommendations: string[];
  daysDelta: number;
  // Planet notebook-derived classifications
  burnSeverity?: BurnClass;          // dNBR-based (when NBR available)
  floodChange?: FloodChange;         // dNDWI-based (when NDWI available)
  baselineClassification?: SceneClassification;
  latestClassification?: SceneClassification;
}

function toRfc3339Interval(range: string): string {
  return range.replace(
    /(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})/,
    (_, a, b) => `${a}T00:00:00Z/${b}T23:59:59Z`
  );
}

function defaultRanges(): { baseline: string; latest: string } {
  const now = new Date();
  const days = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  };
  // baseline: 90-30 days ago; latest: 30-0 days ago
  return {
    baseline: `${days(90)}/${days(30)}`,
    latest: `${days(30)}/${days(0)}`,
  };
}

async function computeIndicesForScene(
  sceneId: string,
  indices: string[]
): Promise<Record<string, IndexResult>> {
  // Only Planetary Computer scenes support band stats
  const pcPrefix = "planetary-computer:";
  if (!sceneId.startsWith(pcPrefix)) {
    throw new Error(`Only planetary-computer scenes support spectral analysis (got: ${sceneId})`);
  }

  const parts = sceneId.slice(pcPrefix.length).split(":");
  // Format: "planetary-computer:collection:itemId"
  if (parts.length < 2) throw new Error(`Malformed scene ID: ${sceneId}`);
  const [collection, itemId] = parts;

  const bands = Array.from(bandsForIndices(indices));
  const bandStats = await fetchPCBandStats(collection, itemId, bands);

  const result: Record<string, IndexResult> = {};
  const s = bandStats;

  const hasAll = (...keys: string[]) => keys.every((k) => k in s);

  if (indices.includes("ndvi") && hasAll("B08", "B04")) {
    result.ndvi = computeNDVI(s["B08"], s["B04"]);
  }
  if (indices.includes("evi") && hasAll("B08", "B04", "B02")) {
    result.evi = computeEVI(s["B08"], s["B04"], s["B02"]);
  }
  if (indices.includes("ndwi") && hasAll("B03", "B08")) {
    result.ndwi = computeNDWI(s["B03"], s["B08"]);
  }
  if (indices.includes("ndsi") && hasAll("B03", "B11")) {
    result.ndsi = computeNDSI(s["B03"], s["B11"]);
  }
  if (indices.includes("nbr") && hasAll("B08", "B11")) {
    result.nbr = computeNBR(s["B08"], s["B11"]);
  }

  return result;
}

export async function detectChanges(
  params: ChangeDetectParams
): Promise<ChangeDetectResult> {
  const [west, south, east, north] = params.aoiBbox.split(",").map(Number);
  const bbox: [number, number, number, number] = [west, south, east, north];
  const ranges = defaultRanges();
  const baselineRange = params.baselineDateRange ?? ranges.baseline;
  const latestRange = params.latestDateRange ?? ranges.latest;

  // Fetch best (lowest cloud cover) scene from each period
  const [baselineResult, latestResult] = await Promise.all([
    unifiedSearch({
      bbox,
      datetime: toRfc3339Interval(baselineRange),
      collections: params.collections,
      cloudCoverLt: params.cloudCoverLt,
      limit: 5,
    }),
    unifiedSearch({
      bbox,
      datetime: toRfc3339Interval(latestRange),
      collections: params.collections,
      cloudCoverLt: params.cloudCoverLt,
      limit: 5,
    }),
  ]);

  // Pick the scene with lowest cloud cover from each period
  const pickBest = (features: typeof baselineResult.features) => {
    if (features.length === 0) return null;
    return features.reduce((best, item) => {
      const bcc = best.properties["eo:cloud_cover"] ?? 100;
      const icc = item.properties["eo:cloud_cover"] ?? 100;
      return icc < bcc ? item : best;
    });
  };

  const baselineScene = pickBest(
    baselineResult.features.filter((f) => f.id?.startsWith("planetary-computer:"))
  );
  const latestScene = pickBest(
    latestResult.features.filter((f) => f.id?.startsWith("planetary-computer:"))
  );

  if (!baselineScene) {
    throw new Error(`No cloud-free baseline scene found for the period ${baselineRange}. Try expanding the baseline date range or relaxing cloud cover threshold.`);
  }
  if (!latestScene) {
    throw new Error(`No cloud-free latest scene found for the period ${latestRange}. The area may be cloudy — try increasing the cloud cover threshold.`);
  }

  const baselineId = baselineScene.id!;
  const latestId = latestScene.id!;

  // Compute spectral indices for both scenes in parallel
  const [baselineIndices, latestIndices] = await Promise.all([
    computeIndicesForScene(baselineId, params.indices),
    computeIndicesForScene(latestId, params.indices),
  ]);

  const indexChanges = computeIndexChanges(baselineIndices, latestIndices);

  const baselineDate = baselineScene.properties.datetime.split("T")[0];
  const latestDate = latestScene.properties.datetime.split("T")[0];
  const daysDelta = Math.round(
    (new Date(latestDate).getTime() - new Date(baselineDate).getTime()) / 86400000
  );

  // LLM analysis
  let significance: ChangeDetectResult["significance"] = "none";
  let summary = "";
  let llmAnalysis = "";
  let recommendations: string[] = [];

  try {
    const llmResult = await analyzeChangesWithLLM({
      watchFor: params.watchFor,
      aoi: params.aoiBbox,
      baselineDate,
      latestDate,
      daysDelta,
      baselineCloudCover: baselineScene.properties["eo:cloud_cover"] ?? null,
      latestCloudCover: latestScene.properties["eo:cloud_cover"] ?? null,
      changes: indexChanges,
    });
    significance = llmResult.significance;
    summary = llmResult.summary;
    llmAnalysis = llmResult.analysis;
    recommendations = llmResult.recommendations ?? [];
  } catch (err) {
    // Fallback to rule-based if LLM fails
    significance = estimateSignificance(indexChanges);
    summary = `Index changes detected over ${daysDelta} days (AI analysis unavailable).`;
    llmAnalysis = `Spectral analysis complete. ${indexChanges.map((c) => `${c.index.toUpperCase()}: ${c.change > 0 ? "+" : ""}${c.change.toFixed(3)}`).join(", ")}.`;
    recommendations = ["Review the spectral index changes manually.", "Consider enabling AI analysis by configuring ANTHROPIC_API_KEY."];
  }

  // ── Planet notebook-derived classifications ────────────────────────────────
  const bIdx = baselineIndices;
  const lIdx = latestIndices;

  // dNBR burn severity (pre_NBR - post_NBR, as per USGS/Planet convention)
  let burnSeverity: BurnClass | undefined;
  if (bIdx.nbr && lIdx.nbr) {
    const dNBR = bIdx.nbr.value - lIdx.nbr.value;
    burnSeverity = classifyBurnSeverity(dNBR);
  }

  // Flood change via dNDWI
  let floodChange: FloodChange | undefined;
  if (bIdx.ndwi && lIdx.ndwi) {
    floodChange = classifyFloodChange(bIdx.ndwi.value, lIdx.ndwi.value);
  }

  // Scene-level land cover classification
  const toValues = (ix: Record<string, IndexResult>) =>
    Object.fromEntries(Object.entries(ix).map(([k, v]) => [k, v.value]));

  const baselineClassification = classifyScene(toValues(bIdx));
  const latestClassification   = classifyScene(toValues(lIdx));

  return {
    baseline: {
      sceneId: baselineId,
      date: baselineDate,
      cloudCover: baselineScene.properties["eo:cloud_cover"] ?? null,
      bbox: baselineScene.bbox ?? null,
    },
    latest: {
      sceneId: latestId,
      date: latestDate,
      cloudCover: latestScene.properties["eo:cloud_cover"] ?? null,
      bbox: latestScene.bbox ?? null,
    },
    baselineIndices,
    latestIndices,
    indexChanges,
    significance,
    summary,
    llmAnalysis,
    recommendations,
    daysDelta,
    burnSeverity,
    floodChange,
    baselineClassification,
    latestClassification,
  };
}
