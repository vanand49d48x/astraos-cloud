import type { BandStats } from "./indices";
import { parseBandStats } from "./indices";

// Sentinel-2 L2A band names on Planetary Computer
const PC_S2_BANDS = { red: "B04", nir: "B08", green: "B03", blue: "B02", swir: "B11" };

/** Fetch per-band statistics from the Planetary Computer TiTiler API */
export async function fetchPCBandStats(
  collection: string,
  itemId: string,
  bands: string[]
): Promise<Record<string, BandStats>> {
  const params = new URLSearchParams({ collection, item: itemId });
  for (const b of bands) params.append("assets", b);

  const res = await fetch(
    `https://planetarycomputer.microsoft.com/api/data/v1/item/statistics?${params}`,
    {
      headers: { "User-Agent": "ASTRA-OS/1.0" },
      signal: AbortSignal.timeout(20_000),
    }
  );

  if (!res.ok) throw new Error(`PC statistics API: ${res.status}`);

  const data: Record<string, Record<string, number>> = await res.json();

  // Response keys are like "B04_b1" → strip the "_b1" suffix
  const result: Record<string, BandStats> = {};
  for (const [key, stats] of Object.entries(data)) {
    const band = key.replace(/_b\d+$/, "");
    result[band] = parseBandStats(stats);
  }
  return result;
}

/** Return the band names needed for the requested index set */
export function bandsForIndices(indices: string[]): Set<string> {
  const needs = new Set<string>();
  const all = new Set(indices);
  if (all.has("ndvi") || all.has("evi") || all.has("ndwi") || all.has("nbr")) {
    needs.add(PC_S2_BANDS.nir);
  }
  if (all.has("ndvi") || all.has("evi")) needs.add(PC_S2_BANDS.red);
  if (all.has("evi")) needs.add(PC_S2_BANDS.blue);
  if (all.has("ndwi") || all.has("ndsi")) needs.add(PC_S2_BANDS.green);
  if (all.has("ndsi") || all.has("nbr")) needs.add(PC_S2_BANDS.swir);
  return needs;
}

export { PC_S2_BANDS };
