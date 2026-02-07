import type { STACItem, STACAsset } from "./types";

/**
 * Sentinel-2 band name mapping (CDSE / Planetary Computer)
 * Maps upstream asset keys to normalized ASTRA band names.
 */
export const SENTINEL2_BAND_MAP: Record<string, string> = {
  B01: "coastal",
  B02: "blue",
  B03: "green",
  B04: "red",
  B05: "rededge1",
  B06: "rededge2",
  B07: "rededge3",
  B08: "nir",
  B8A: "nir08",
  B09: "nir09",
  B11: "swir16",
  B12: "swir22",
  SCL: "scl",
  // Planetary Computer naming
  "coastal-aerosol": "coastal",
  blue: "blue",
  green: "green",
  red: "red",
  "rededge-1": "rededge1",
  "rededge-2": "rededge2",
  "rededge-3": "rededge3",
  nir: "nir",
  "nir-narrow": "nir08",
  "water-vapor": "nir09",
  swir16: "swir16",
  swir22: "swir22",
  scl: "scl",
  visual: "visual",
  thumbnail: "thumbnail",
  rendered_preview: "thumbnail",
};

/**
 * Landsat band name mapping (USGS / Planetary Computer)
 */
export const LANDSAT_BAND_MAP: Record<string, string> = {
  coastal: "coastal",
  blue: "blue",
  green: "green",
  red: "red",
  nir08: "nir",
  swir16: "swir16",
  swir22: "swir22",
  lwir11: "lwir11",
  // USGS naming
  SR_B1: "coastal",
  SR_B2: "blue",
  SR_B3: "green",
  SR_B4: "red",
  SR_B5: "nir",
  SR_B6: "swir16",
  SR_B7: "swir22",
  thumbnail: "thumbnail",
  rendered_preview: "thumbnail",
};

/**
 * Normalize asset keys to ASTRA band names and add ASTRA metadata.
 */
export function normalizeAssets(
  assets: Record<string, any>,
  bandMap: Record<string, string>
): Record<string, STACAsset> {
  const normalized: Record<string, STACAsset> = {};

  for (const [key, asset] of Object.entries(assets)) {
    const bandName = bandMap[key] || key;
    const isCog = isCloudOptimizedGeoTiff(asset);

    normalized[bandName] = {
      ...asset,
      "astra:band_name": bandName,
      "astra:is_cog": isCog,
      "astra:requires_auth": false, // overridden per-provider
    };
  }

  return normalized;
}

/**
 * Heuristic check if an asset is likely a Cloud-Optimized GeoTIFF.
 */
function isCloudOptimizedGeoTiff(asset: any): boolean {
  const type = asset.type || "";
  const href = asset.href || "";

  // Explicit COG type
  if (type.includes("cloud-optimized") || type.includes("profile=cloud-optimized")) {
    return true;
  }

  // GeoTIFF that's likely COG (most modern providers serve COGs)
  if (type.includes("geotiff") || type.includes("image/tiff")) {
    // If served from known COG-hosting services
    if (
      href.includes("planetarycomputer.microsoft.com") ||
      href.includes("landsatlook.usgs.gov") ||
      href.includes("sentinel-cogs")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Extract cloud cover from various property formats.
 */
export function extractCloudCover(properties: Record<string, any>): number | undefined {
  // Standard STAC EO extension
  if (typeof properties["eo:cloud_cover"] === "number") {
    return properties["eo:cloud_cover"];
  }
  // Some providers use different field names
  if (typeof properties.cloudCover === "number") {
    return properties.cloudCover;
  }
  if (typeof properties["s2:cloud_probability"] === "number") {
    return properties["s2:cloud_probability"];
  }
  return undefined;
}

/**
 * Normalize a datetime from various formats to ISO 8601.
 */
export function normalizeDatetime(properties: Record<string, any>): string {
  return properties.datetime || properties.start_datetime || new Date().toISOString();
}

/**
 * Extract GSD (ground sample distance) from properties.
 */
export function extractGsd(properties: Record<string, any>): number | undefined {
  if (typeof properties.gsd === "number") return properties.gsd;
  if (typeof properties["eo:gsd"] === "number") return properties["eo:gsd"];
  return undefined;
}
