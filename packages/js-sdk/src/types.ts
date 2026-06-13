// ── Search ────────────────────────────────────────────────────────────────────

export type BBox = [number, number, number, number]; // [west, south, east, north]

export interface SearchParams {
  /** Bounding box [west, south, east, north] */
  bbox: BBox;
  /** ISO 8601 interval e.g. "2025-01-01/2025-06-01" */
  datetime: string;
  /** Filter to specific collection IDs */
  collections?: string[];
  /** Maximum cloud cover percentage (0–100) */
  cloudCoverLt?: number;
  /** Max results (default 10, max 100) */
  limit?: number;
}

// ── Scene / STAC ──────────────────────────────────────────────────────────────

export interface SceneProperties {
  datetime: string;
  "eo:cloud_cover"?: number;
  platform: string;
  gsd?: number;
  instruments?: string[];
  "astra:provider": string;
  "astra:provider_name": string;
  "astra:original_id": string;
  [key: string]: unknown;
}

export interface SceneAsset {
  href: string;
  type?: string;
  title?: string;
  roles?: string[];
  "astra:band_name"?: string;
  "astra:is_cog"?: boolean;
  "astra:requires_auth"?: boolean;
}

export interface Scene {
  type: "Feature";
  id: string;
  bbox: BBox;
  geometry: { type: string; coordinates: unknown };
  properties: SceneProperties;
  assets: Record<string, SceneAsset>;
  links: { href: string; rel: string }[];
  collection?: string;
}

export interface SearchResult {
  type: "FeatureCollection";
  features: Scene[];
  context?: { matched?: number; returned: number };
  warnings?: string[];
}

// ── Assets ────────────────────────────────────────────────────────────────────

export interface ResolvedAsset {
  band: string;
  status: "ready" | "error";
  url?: string;
  type?: string;
  is_cog?: boolean;
  requires_conversion?: boolean;
  error?: string;
}

export interface AssetListParams {
  sceneId: string;
  bands?: string[];
}

export interface AssetListResult {
  assets: ResolvedAsset[];
}

// ── Processing ────────────────────────────────────────────────────────────────

export type Operation = "ndvi" | "change_detection" | "cog_convert";
export type JobStatus = "queued" | "processing" | "complete" | "failed";

export interface SubmitJobParams {
  operation: Operation;
  sceneId: string;
  bbox?: BBox;
  /** Operation-specific params */
  params?: Record<string, unknown>;
}

export interface Job {
  jobId: string;
  status: JobStatus;
  operation: Operation;
  sceneId: string;
  bbox?: BBox;
  pollUrl: string;
  resultUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface PollOptions {
  /** Poll interval in ms (default 2000) */
  intervalMs?: number;
  /** Timeout in ms (default 120000) */
  timeoutMs?: number;
}

// ── Client ────────────────────────────────────────────────────────────────────

export interface ClientOptions {
  apiKey: string;
  /** Override API base URL (default: https://astraos.cloud) */
  baseUrl?: string;
}
