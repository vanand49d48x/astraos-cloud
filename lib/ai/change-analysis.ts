import Anthropic from "@anthropic-ai/sdk";
import type { IndexResult } from "@/lib/analytics/indices";

export interface IndexChange {
  index: string;
  baseline: number;
  latest: number;
  change: number;
  changePct: number;
  description: string;
}

export interface ChangeAnalysisInput {
  watchFor: string;
  aoi: string;
  baselineDate: string;
  latestDate: string;
  daysDelta: number;
  baselineCloudCover: number | null;
  latestCloudCover: number | null;
  changes: IndexChange[];
}

export interface ChangeAnalysisOutput {
  significance: "none" | "low" | "medium" | "high" | "critical";
  summary: string;
  analysis: string;
  recommendations: string[];
}

const INDEX_LABELS: Record<string, string> = {
  ndvi: "NDVI (vegetation health)",
  evi:  "EVI (enhanced vegetation)",
  ndwi: "NDWI (surface water)",
  ndsi: "NDSI (snow/ice)",
  nbr:  "NBR (burn severity)",
};

export async function analyzeChangesWithLLM(
  input: ChangeAnalysisInput
): Promise<ChangeAnalysisOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const client = new Anthropic({ apiKey });

  const changesText = input.changes
    .map((c) => {
      const dir = c.change > 0 ? "+" : "";
      return `  - ${INDEX_LABELS[c.index] ?? c.index}: ${c.baseline.toFixed(3)} → ${c.latest.toFixed(3)} (${dir}${c.change.toFixed(3)}, ${dir}${c.changePct.toFixed(1)}%)`;
    })
    .join("\n");

  const prompt = `You are an expert remote sensing analyst reviewing satellite imagery change data.

MONITORING OBJECTIVE: "${input.watchFor}"
LOCATION: ${input.aoi}
BASELINE DATE: ${input.baselineDate}
LATEST DATE: ${input.latestDate}
TIME SPAN: ${input.daysDelta} days
CLOUD COVER: baseline=${input.baselineCloudCover ?? "unknown"}%, latest=${input.latestCloudCover ?? "unknown"}%

SPECTRAL INDEX CHANGES:
${changesText}

Based on these changes, provide:
1. significance: one of "none", "low", "medium", "high", or "critical" — based on how significant the changes are FOR THE STATED MONITORING OBJECTIVE
2. summary: a single sentence (max 120 chars) describing what happened
3. analysis: 2-3 paragraphs explaining what likely occurred, what it means in context of the monitoring objective, and any caveats (cloud cover effects, seasonal patterns, etc.)
4. recommendations: 2-4 specific actionable recommendations

Respond in valid JSON with keys: significance, summary, analysis, recommendations (array of strings).
Consider seasonal patterns, natural variability, and focus on changes relevant to the monitoring objective.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown code fences if present
  const jsonText = text.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "").trim();

  const parsed = JSON.parse(jsonText) as ChangeAnalysisOutput;
  return parsed;
}

/** Compute change statistics from two sets of index results */
export function computeIndexChanges(
  baseline: Record<string, IndexResult>,
  latest: Record<string, IndexResult>
): IndexChange[] {
  const indices = Object.keys(baseline).filter((k) => k in latest);
  return indices.map((idx) => {
    const b = baseline[idx].value;
    const l = latest[idx].value;
    const change = l - b;
    const changePct = b === 0 ? 0 : (change / Math.abs(b)) * 100;
    return {
      index: idx,
      baseline: b,
      latest: l,
      change,
      changePct,
      description: latest[idx].description,
    };
  });
}

/** Rule-based significance estimate (fallback if LLM fails) */
export function estimateSignificance(
  changes: IndexChange[]
): "none" | "low" | "medium" | "high" | "critical" {
  let maxAbsChange = 0;
  for (const c of changes) {
    if (Math.abs(c.change) > maxAbsChange) maxAbsChange = Math.abs(c.change);
  }
  if (maxAbsChange < 0.05) return "none";
  if (maxAbsChange < 0.1)  return "low";
  if (maxAbsChange < 0.2)  return "medium";
  if (maxAbsChange < 0.3)  return "high";
  return "critical";
}
