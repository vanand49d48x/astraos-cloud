/**
 * Spectral index computation and interpretation.
 * All indices expect raw DN values from Sentinel-2 L2A (0–10000 scale).
 * Ratio-based indices are scale-invariant so no normalization needed.
 */

export interface BandStats {
  mean: number;
  min: number;
  max: number;
  std: number;
  median: number;
  percentile2: number;
  percentile98: number;
}

export interface IndexResult {
  value: number;        // mean-based scalar
  min: number;
  max: number;
  std: number;
  interpretation: string;
  category: string;
  description: string;
}

export interface AnalyticsResult {
  sceneId: string;
  datetime: string;
  provider: string;
  cloudCover: number | null;
  bbox: number[] | null;
  indices: Record<string, IndexResult>;
  bandsUsed: string[];
  processingNote?: string;
}

// ── Index formulas ───────────────────────────────────────────────────────────

function safeRatio(a: number, b: number): number {
  return b === 0 ? 0 : (a - b) / (a + b);
}

/** NDVI = (NIR - Red) / (NIR + Red) */
export function computeNDVI(nir: BandStats, red: BandStats): IndexResult {
  const value = safeRatio(nir.mean, red.mean);
  const min = safeRatio(nir.min, red.max);
  const max = safeRatio(nir.max, red.min);
  const std = Math.sqrt(nir.std ** 2 + red.std ** 2) / (nir.mean + red.mean || 1);

  let interpretation: string;
  let category: string;

  if (value < 0)        { interpretation = "Water, snow or clouds"; category = "water_or_cloud"; }
  else if (value < 0.1) { interpretation = "Bare soil or rock"; category = "bare_soil"; }
  else if (value < 0.3) { interpretation = "Sparse vegetation"; category = "sparse_vegetation"; }
  else if (value < 0.5) { interpretation = "Moderate vegetation / cropland"; category = "moderate_vegetation"; }
  else if (value < 0.7) { interpretation = "Dense vegetation"; category = "dense_vegetation"; }
  else                  { interpretation = "Very dense / tropical vegetation"; category = "very_dense_vegetation"; }

  return {
    value: round(value), min: round(min), max: round(max), std: round(std),
    interpretation, category,
    description: "Normalized Difference Vegetation Index — measures live green vegetation density",
  };
}

/** EVI = 2.5 × (NIR − Red) / (NIR + 6×Red − 7.5×Blue + 1) */
export function computeEVI(nir: BandStats, red: BandStats, blue: BandStats): IndexResult {
  const N = nir.mean / 10000, R = red.mean / 10000, B = blue.mean / 10000;
  const denom = N + 6 * R - 7.5 * B + 1;
  const value = denom === 0 ? 0 : 2.5 * (N - R) / denom;

  let interpretation: string;
  let category: string;
  if (value < 0)        { interpretation = "Non-vegetated surface"; category = "non_vegetated"; }
  else if (value < 0.2) { interpretation = "Low vegetation / bare ground"; category = "low_vegetation"; }
  else if (value < 0.4) { interpretation = "Moderate vegetation"; category = "moderate_vegetation"; }
  else if (value < 0.6) { interpretation = "Dense canopy"; category = "dense_canopy"; }
  else                  { interpretation = "Very dense tropical forest"; category = "tropical_forest"; }

  return {
    value: round(value), min: round(value - 0.05), max: round(value + 0.05), std: 0,
    interpretation, category,
    description: "Enhanced Vegetation Index — reduces atmosphere and soil noise vs NDVI",
  };
}

/** NDWI = (Green − NIR) / (Green + NIR) — water bodies */
export function computeNDWI(green: BandStats, nir: BandStats): IndexResult {
  const value = safeRatio(green.mean, nir.mean);
  const min = safeRatio(green.min, nir.max);
  const max = safeRatio(green.max, nir.min);
  const std = Math.sqrt(green.std ** 2 + nir.std ** 2) / (green.mean + nir.mean || 1);

  let interpretation: string;
  let category: string;
  if (value > 0.3)      { interpretation = "Open water / flooded area"; category = "open_water"; }
  else if (value > 0)   { interpretation = "Wetland or moist soil"; category = "wetland"; }
  else if (value > -0.3){ interpretation = "Sparse vegetation or dry soil"; category = "dry_soil"; }
  else                  { interpretation = "Dense vegetation or built-up area"; category = "dense_vegetation"; }

  return {
    value: round(value), min: round(min), max: round(max), std: round(std),
    interpretation, category,
    description: "Normalized Difference Water Index — highlights surface water and moisture",
  };
}

/** NDSI = (Green − SWIR) / (Green + SWIR) — snow / ice */
export function computeNDSI(green: BandStats, swir: BandStats): IndexResult {
  const value = safeRatio(green.mean, swir.mean);
  const min = safeRatio(green.min, swir.max);
  const max = safeRatio(green.max, swir.min);

  let interpretation: string;
  let category: string;
  if (value > 0.4)      { interpretation = "Snow or ice"; category = "snow_ice"; }
  else if (value > 0.1) { interpretation = "Possible snow cover"; category = "possible_snow"; }
  else if (value > -0.1){ interpretation = "Mixed / cloud shadow"; category = "mixed"; }
  else                  { interpretation = "Vegetation or bare soil"; category = "no_snow"; }

  return {
    value: round(value), min: round(min), max: round(max), std: 0,
    interpretation, category,
    description: "Normalized Difference Snow Index — distinguishes snow from clouds",
  };
}

/** NBR = (NIR − SWIR) / (NIR + SWIR) — burn severity */
export function computeNBR(nir: BandStats, swir: BandStats): IndexResult {
  const value = safeRatio(nir.mean, swir.mean);
  const min = safeRatio(nir.min, swir.max);
  const max = safeRatio(nir.max, swir.min);

  let interpretation: string;
  let category: string;
  if (value > 0.4)       { interpretation = "Healthy / unburned vegetation"; category = "healthy"; }
  else if (value > 0.1)  { interpretation = "Low to moderate burn severity"; category = "low_burn"; }
  else if (value > -0.1) { interpretation = "Moderate burn"; category = "moderate_burn"; }
  else if (value > -0.4) { interpretation = "High burn severity"; category = "high_burn"; }
  else                   { interpretation = "Very high burn severity"; category = "very_high_burn"; }

  return {
    value: round(value), min: round(min), max: round(max), std: 0,
    interpretation, category,
    description: "Normalized Burn Ratio — detects fire-affected areas and burn severity",
  };
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// ── Band stat extraction ─────────────────────────────────────────────────────

/** Parse a single band's stats from the PC TiTiler statistics API response */
export function parseBandStats(raw: Record<string, number>): BandStats {
  return {
    mean: raw.mean ?? 0,
    min: raw.min ?? 0,
    max: raw.max ?? 0,
    std: raw.std ?? 0,
    median: raw.median ?? raw.mean ?? 0,
    percentile2: raw.percentile_2 ?? raw.min ?? 0,
    percentile98: raw.percentile_98 ?? raw.max ?? 0,
  };
}
