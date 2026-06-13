/**
 * Crop phenology and time-series metrics based on Planet CB_phenometrics.ipynb patterns.
 *
 * Key patterns from notebook:
 *  - Green-up: period from season start to 50% of peak value
 *  - Peak: maximum CB/index value and date
 *  - Senescence: 50% of peak on the declining side to end of season
 *  - Greening Rate = (Peak - Start) / greenup_days   [index units / day]
 *  - Senescence Rate = (Peak - End) / senescence_days
 *  - Integration: trapezoidal rule (Simpson's approximation)
 *  - Stress dip threshold: 0.05–0.1 drop below local trend
 *  - GDD base temperature: 10°C
 */

export interface PhenologyPoint {
  date: string;
  value: number | null;
}

export interface StressDip {
  date: string;
  value: number;
  drop: number;   // how far below local trend
}

export interface PhenologyMetrics {
  // Peak / trough
  peakDate:    string | null;
  peakValue:   number | null;
  troughDate:  string | null;
  troughValue: number | null;

  // Planet phenometrics (CB_phenometrics.ipynb)
  greenupDays:     number | null;  // days from start of season to mid-greenup (50% peak)
  senescenceDays:  number | null;  // days from 50% peak (declining) to end
  greeningRate:    number | null;  // (peak - start) / greenup_days
  senescenceRate:  number | null;  // (peak - end)   / senescence_days
  seasonLengthDays: number | null; // total season length

  // Integration (proxy for annual productivity)
  seasonalIntegral: number;        // trapezoidal sum × days

  // Stress periods (dip threshold 0.05–0.1)
  stressDips: StressDip[];

  // Summary
  dataPoints: number;
  validPoints: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return (new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000;
}

function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end   = Math.min(values.length, i + Math.ceil(window / 2));
    const slice = values.slice(start, end);
    return slice.reduce((a, v) => a + v, 0) / slice.length;
  });
}

// ── Main phenology computation ────────────────────────────────────────────────

export function computePhenology(points: PhenologyPoint[]): PhenologyMetrics {
  const valid = points.filter((p): p is { date: string; value: number } => p.value !== null);

  const base: PhenologyMetrics = {
    peakDate: null, peakValue: null,
    troughDate: null, troughValue: null,
    greenupDays: null, senescenceDays: null,
    greeningRate: null, senescenceRate: null,
    seasonLengthDays: null,
    seasonalIntegral: 0,
    stressDips: [],
    dataPoints: points.length,
    validPoints: valid.length,
  };

  if (valid.length < 3) return base;

  // ── Peak and trough ───────────────────────────────────────────────────────
  const peak   = valid.reduce((a, b) => b.value > a.value ? b : a);
  const trough = valid.reduce((a, b) => b.value < a.value ? b : a);

  // ── Trapezoidal integration (from CB_phenometrics.ipynb) ──────────────────
  let integral = 0;
  for (let i = 1; i < valid.length; i++) {
    const dt = daysBetween(valid[i - 1].date, valid[i].date);
    integral += ((valid[i].value + valid[i - 1].value) / 2) * dt;
  }

  // ── Green-up: start → 50% of peak (Planet phenometrics definition) ────────
  const peakIdx   = valid.findIndex((p) => p.date === peak.date);
  const half      = peak.value * 0.50;
  const startVal  = valid[0].value;
  const startDate = valid[0].date;

  // Find where value first crosses 50% of peak (on the way up)
  let midGreenIdx = peakIdx; // default to peak
  for (let i = 0; i < peakIdx; i++) {
    if (valid[i].value >= half) { midGreenIdx = i; break; }
  }
  const greenupDays = midGreenIdx > 0 ? daysBetween(startDate, valid[midGreenIdx].date) : null;
  const greeningRate = greenupDays && greenupDays > 0
    ? (peak.value - startVal) / greenupDays
    : null;

  // ── Senescence: 50% peak (declining) → end ───────────────────────────────
  const endVal    = valid[valid.length - 1].value;
  const endDate   = valid[valid.length - 1].date;
  let midSenIdx   = peakIdx;
  for (let i = valid.length - 1; i > peakIdx; i--) {
    if (valid[i].value >= half) { midSenIdx = i; break; }
  }
  const senescenceDays = midSenIdx > peakIdx
    ? daysBetween(valid[midSenIdx].date, endDate)
    : null;
  const senescenceRate = senescenceDays && senescenceDays > 0
    ? (peak.value - endVal) / senescenceDays
    : null;

  const seasonLengthDays = daysBetween(startDate, endDate);

  // ── Stress dip detection (Planet dip threshold 0.05–0.1) ─────────────────
  // Smooth the series, then find drops > 0.07 below trend
  const DIP_THRESHOLD = 0.07;
  const values  = valid.map((p) => p.value);
  const trend   = movingAverage(values, 3);
  const stressDips: StressDip[] = [];
  for (let i = 1; i < valid.length - 1; i++) {
    const drop = trend[i] - values[i];
    if (drop >= DIP_THRESHOLD) {
      stressDips.push({ date: valid[i].date, value: values[i], drop: Math.round(drop * 1000) / 1000 });
    }
  }

  return {
    peakDate:  peak.date,
    peakValue: Math.round(peak.value  * 10000) / 10000,
    troughDate:  trough.date,
    troughValue: Math.round(trough.value * 10000) / 10000,
    greenupDays:     greenupDays    ? Math.round(greenupDays)    : null,
    senescenceDays:  senescenceDays ? Math.round(senescenceDays) : null,
    greeningRate:    greeningRate   ? Math.round(greeningRate   * 100000) / 100000 : null,
    senescenceRate:  senescenceRate ? Math.round(senescenceRate * 100000) / 100000 : null,
    seasonLengthDays: Math.round(seasonLengthDays),
    seasonalIntegral: Math.round(integral * 100) / 100,
    stressDips,
    dataPoints: points.length,
    validPoints: valid.length,
  };
}

// ── Per-index phenology from a full TimeSeriesResult ─────────────────────────

export function computeAllPhenology(
  points: Array<{ date: string; values: Record<string, number | null> }>,
  indices: string[]
): Record<string, PhenologyMetrics> {
  const result: Record<string, PhenologyMetrics> = {};
  for (const idx of indices) {
    result[idx] = computePhenology(
      points.map((p) => ({ date: p.date, value: p.values[idx] ?? null }))
    );
  }
  return result;
}

// ── Growing Degree Days (GDD) from CB_phenometrics — base 10°C ───────────────
// Requires temperature data (LST in Kelvin → °C = K - 273.15)
// GDD = sum of (LST_celsius - 10) where LST_celsius > 10

export function computeGDD(lstKelvinValues: number[]): number {
  return lstKelvinValues.reduce((sum, k) => {
    const celsius = k - 273.15;
    return celsius > 10 ? sum + (celsius - 10) : sum;
  }, 0);
}
