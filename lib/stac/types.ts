// STAC (SpatioTemporal Asset Catalog) type definitions
// Normalized to ASTRA OS schema

export interface STACItem {
  type: "Feature";
  stac_version: string;
  id: string; // provider-prefixed: "sentinel2:S2A_MSIL2A_..."
  geometry: GeoJSONGeometry;
  bbox: [number, number, number, number]; // [west, south, east, north]
  properties: STACProperties;
  assets: Record<string, STACAsset>;
  links: STACLink[];
  collection?: string;
}

export interface STACProperties {
  datetime: string; // ISO 8601
  created?: string;
  updated?: string;
  "eo:cloud_cover"?: number; // 0-100
  platform: string; // normalized: "sentinel-2a", "landsat-9", etc.
  "proj:epsg"?: number;
  gsd?: number; // ground sample distance in meters
  instruments?: string[];
  constellation?: string;
  // ASTRA OS extensions
  "astra:provider": string; // "sentinel-2-l2a", "landsat-c2-l2", "planetary-computer"
  "astra:provider_name": string; // Human-readable name
  "astra:original_id": string; // ID in the upstream provider
}

export interface STACAsset {
  href: string;
  type?: string; // MIME type, e.g., "image/tiff; application=geotiff"
  title?: string;
  roles?: string[]; // ["data", "thumbnail", "overview"]
  "eo:bands"?: EOBand[];
  "proj:epsg"?: number;
  "proj:shape"?: [number, number];
  // ASTRA OS extensions
  "astra:band_name"?: string; // normalized: "red", "green", "blue", "nir", etc.
  "astra:is_cog"?: boolean; // whether the asset is already COG
  "astra:requires_auth"?: boolean; // whether download needs provider credentials
}

export interface EOBand {
  name: string;
  common_name?: string;
  center_wavelength?: number;
  full_width_half_max?: number;
}

export interface STACLink {
  href: string;
  rel: string;
  type?: string;
  title?: string;
}

export interface STACItemCollection {
  type: "FeatureCollection";
  features: STACItem[];
  context?: {
    matched?: number;
    returned: number;
  };
  links?: STACLink[];
  warnings?: string[];
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

// Search parameters used across all providers
export interface SearchParams {
  bbox: [number, number, number, number]; // [west, south, east, north]
  datetime: string; // ISO 8601 interval: "2025-01-01/2025-02-01"
  collections?: string[]; // filter by collection: ["sentinel-2-l2a", "landsat-c2-l2"]
  cloudCoverLt?: number; // post-filter: cloud cover less than N
  limit?: number; // max results per provider (default 10)
  offset?: number;
}

// Normalized band name mapping
export const BAND_NAMES = {
  // Common optical bands
  coastal: "coastal",
  blue: "blue",
  green: "green",
  red: "red",
  rededge1: "rededge1",
  rededge2: "rededge2",
  rededge3: "rededge3",
  nir: "nir",
  nir08: "nir08",
  nir09: "nir09",
  swir16: "swir16",
  swir22: "swir22",
  // Derived
  scl: "scl", // Scene Classification Layer
  // Visual
  visual: "visual",
  thumbnail: "thumbnail",
} as const;

export type BandName = (typeof BAND_NAMES)[keyof typeof BAND_NAMES];
