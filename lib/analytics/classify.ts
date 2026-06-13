/**
 * Spectral classification functions based on Planet Labs notebook patterns.
 *
 * Sources:
 *  - park_fire.ipynb   → BAI + dNBR burn severity
 *  - ndvi_planetscope.ipynb → NDVI land cover thresholds (midpoint 0.1)
 *  - CB_phenometrics.ipynb  → crop stress / water content thresholds
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BurnClass {
  label: string;
  severity: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  description: string;
  color: string;
}

export interface VegetationClass {
  label: string;
  type: string;
  description: string;
}

export interface WaterClass {
  label: string;
  presence: "none" | "possible" | "likely" | "definite";
  description: string;
}

export interface FloodChange {
  status: "flooded" | "draining" | "persistent_water" | "no_change";
  label: string;
  description: string;
}

export interface VCI {
  vci: number;          // 0–100
  condition: string;
}

export interface BAIResult {
  bai: number;
  burned: boolean;
  description: string;
}

// ── BAI — Burned Area Index (Planet park_fire.ipynb) ─────────────────────────
// Formula: 1 / ((0.1 - red)² + (0.06 - nir)²)
// Where red and nir are reflectance values (0–1 scale; divide raw DN by 10000)
// BAI_diff > 25 marks significantly burned regions

export function computeBAI(red: number, nir: number): BAIResult {
  // Normalize from Sentinel-2 DN (0–10000) to reflectance (0–1)
  const r = red  > 1 ? red  / 10000 : red;
  const n = nir  > 1 ? nir  / 10000 : nir;
  const bai = 1 / (Math.pow(0.1 - r, 2) + Math.pow(0.06 - n, 2));
  return {
    bai: Math.round(bai * 100) / 100,
    burned: bai > 25,
    description: bai > 25
      ? "Significantly elevated BAI — active burn or recent char signature detected"
      : "No significant burn signature from BAI",
  };
}

// ── dNBR Burn Severity (USGS BARC scale, confirmed by Planet notebooks) ──────
// dNBR = pre_fire_NBR − post_fire_NBR  (positive = more burned)

export function classifyBurnSeverity(dNBR: number): BurnClass {
  if (dNBR > 0.66)  return { label: "High Severity",          severity: 6, color: "#7f1d1d", description: "Stand-replacing fire, near-total vegetation mortality" };
  if (dNBR > 0.44)  return { label: "Moderate-High Severity", severity: 5, color: "#dc2626", description: "High intensity fire, partial to complete crown scorch" };
  if (dNBR > 0.27)  return { label: "Moderate-Low Severity",  severity: 4, color: "#f97316", description: "Surface fire with moderate plant mortality" };
  if (dNBR > 0.10)  return { label: "Low Severity",           severity: 3, color: "#eab308", description: "Low intensity surface fire, minimal vegetation mortality" };
  if (dNBR > -0.10) return { label: "Unburned",               severity: 0, color: "#22c55e", description: "No evidence of fire impact" };
  if (dNBR > -0.25) return { label: "Enhanced Regrowth (Low)",severity: 1, color: "#86efac", description: "Modest post-fire green-up or soil moisture increase" };
  return                    { label: "Enhanced Regrowth (High)",severity: 2, color: "#4ade80", description: "Strong vegetation recovery following previous fire" };
}

// ── NDVI Land Cover (Planet ndvi_planetscope.ipynb — midpoint 0.1) ───────────
// Planet's own midpoint: 0.1 separates water/bare soil from vegetation.

export function classifyVegetation(ndvi: number): VegetationClass {
  if (ndvi < 0)    return { label: "Water / Snow / Cloud",   type: "non_vegetated",  description: "Surface water, snow/ice, or dense cloud shadow" };
  if (ndvi < 0.10) return { label: "Bare Soil / Rock",        type: "bare_soil",       description: "No significant photosynthetic vegetation; below Planet's 0.1 midpoint" };
  if (ndvi < 0.25) return { label: "Open Shrubland",          type: "sparse",          description: "Sparse or open shrubland, degraded grassland" };
  if (ndvi < 0.40) return { label: "Grassland / Pasture",     type: "grassland",       description: "Grassland, managed pasture, or light crop cover" };
  if (ndvi < 0.60) return { label: "Cropland / Open Woodland",type: "cropland",        description: "Active cropland or open woodland with partial canopy" };
  if (ndvi < 0.80) return { label: "Dense Forest",            type: "dense_forest",    description: "Deciduous or mixed forest with closed canopy" };
  return                   { label: "Tropical / Dense Forest",  type: "tropical_forest", description: "Very dense tropical or subtropical rainforest" };
}

// ── NDWI Water Classification ─────────────────────────────────────────────────
// NDWI < -0.15 used by Planet for water exclusion in burn analysis

export function classifyWater(ndwi: number): WaterClass {
  if (ndwi > 0.30)  return { label: "Open Water",        presence: "definite",  description: "River, lake, reservoir, or flood inundation" };
  if (ndwi > 0.00)  return { label: "Wetland / Moist",   presence: "likely",    description: "Waterlogged soil, marsh, or saturated vegetation" };
  if (ndwi > -0.15) return { label: "Dry Vegetation",    presence: "possible",  description: "Low soil moisture; above Planet's -0.15 water exclusion threshold" };
  return                    { label: "Built-up / Bare",   presence: "none",      description: "Impervious surfaces or dry bare soil" };
}

// ── Flood Change Detection ────────────────────────────────────────────────────

export function classifyFloodChange(ndwiBefore: number, ndwiAfter: number): FloodChange {
  const delta  = ndwiAfter - ndwiBefore;
  const wasWet = ndwiBefore > 0;
  const isWet  = ndwiAfter  > 0;

  if (!wasWet && isWet  && delta >  0.15) return { status: "flooded",           label: "New Flooding Detected",  description: "Previously dry area now shows water signature — possible flood or dam release" };
  if (wasWet  && !isWet && delta < -0.15) return { status: "draining",          label: "Flood Waters Receding",  description: "Previously flooded area is draining or drying" };
  if (wasWet  && isWet)                   return { status: "persistent_water",   label: "Persistent Water Body",  description: "Water present in both periods — likely a permanent water body" };
  return                                         { status: "no_change",          label: "No Flood Change",        description: "No significant change in surface water extent" };
}

// ── VCI — Vegetation Condition Index (agricultural monitoring) ────────────────
// Requires historical min/max for the same AOI from time series.
// VCI = (NDVI_current - NDVI_min) / (NDVI_max - NDVI_min) × 100

export function computeVCI(ndvi: number, historicalMin: number, historicalMax: number): VCI {
  const range = historicalMax - historicalMin;
  if (range <= 0.01) return { vci: 50, condition: "Insufficient history for VCI" };
  const vci = Math.min(100, Math.max(0, ((ndvi - historicalMin) / range) * 100));
  let condition: string;
  if      (vci < 20) condition = "Extreme Drought Stress";
  else if (vci < 35) condition = "Severe Drought";
  else if (vci < 50) condition = "Moderate Drought";
  else if (vci < 65) condition = "Fair Conditions";
  else if (vci < 80) condition = "Good Conditions";
  else               condition = "Optimal / Lush Conditions";
  return { vci: Math.round(vci), condition };
}

// ── Multi-index scene classification ─────────────────────────────────────────
// Combines all indices into a unified use-case assessment.

export interface SceneClassification {
  landCover:    VegetationClass;
  waterPresence: WaterClass;
  bai?:         BAIResult;
  vci?:         VCI;
  primaryUseCase: string;
  confidence: "high" | "medium" | "low";
}

export function classifyScene(
  indices: Record<string, number | null>,
  options?: { historicalNDVIMin?: number; historicalNDVIMax?: number }
): SceneClassification {
  const ndvi = indices.ndvi ?? 0;
  const ndwi = indices.ndwi ?? -0.5;
  const red  = indices.red_mean  ?? null;
  const nir  = indices.nir_mean  ?? null;

  const landCover    = classifyVegetation(ndvi);
  const waterPresence = classifyWater(ndwi);

  let bai: BAIResult | undefined;
  if (red !== null && nir !== null) {
    bai = computeBAI(red, nir);
  }

  let vci: VCI | undefined;
  if (
    options?.historicalNDVIMin !== undefined &&
    options?.historicalNDVIMax !== undefined
  ) {
    vci = computeVCI(ndvi, options.historicalNDVIMin, options.historicalNDVIMax);
  }

  // Determine primary use-case label
  let primaryUseCase: string;
  let confidence: SceneClassification["confidence"] = "high";

  if (waterPresence.presence === "definite") {
    primaryUseCase = "Flood / Water Monitoring";
  } else if (bai?.burned) {
    primaryUseCase = "Active Fire / Burn Mapping";
  } else if (landCover.type === "cropland" || landCover.type === "grassland") {
    primaryUseCase = "Agricultural / Crop Monitoring";
  } else if (landCover.type === "dense_forest" || landCover.type === "tropical_forest") {
    primaryUseCase = "Forest / Deforestation Monitoring";
  } else if (landCover.type === "bare_soil" || landCover.type === "non_vegetated") {
    primaryUseCase = "Land Degradation / Desertification";
    confidence = "medium";
  } else {
    primaryUseCase = "General Vegetation / Land Cover";
    confidence = "medium";
  }

  return { landCover, waterPresence, bai, vci, primaryUseCase, confidence };
}
