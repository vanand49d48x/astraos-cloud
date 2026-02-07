import type { SearchParams, STACItem, STACItemCollection } from "@/lib/stac/types";

export interface ProviderAdapter {
  /** Unique provider ID used in ASTRA OS */
  id: string;
  /** Human-readable name */
  name: string;
  /** STAC collection names this provider serves */
  collections: string[];

  /**
   * Search for satellite scenes matching the given parameters.
   * Returns normalized STAC items.
   * Note: cloud cover filtering is best-effort — ASTRA OS will post-filter.
   */
  search(params: SearchParams): Promise<STACItemCollection>;

  /**
   * Get detailed metadata for a specific scene.
   * @param originalId The scene ID in the upstream provider (without ASTRA prefix)
   */
  getScene(originalId: string): Promise<STACItem>;

  /**
   * Resolve the download/streaming URL for a specific asset.
   * May sign the URL (e.g., Planetary Computer SAS tokens).
   * @returns The resolved URL string
   */
  getAssetUrl(originalId: string, assetKey: string): Promise<string>;
}

/**
 * Base class with shared utilities for all provider adapters.
 */
export abstract class BaseProviderAdapter implements ProviderAdapter {
  abstract id: string;
  abstract name: string;
  abstract collections: string[];

  abstract search(params: SearchParams): Promise<STACItemCollection>;
  abstract getScene(originalId: string): Promise<STACItem>;
  abstract getAssetUrl(originalId: string, assetKey: string): Promise<string>;

  /** Prefix an ID with the provider identifier */
  protected prefixId(originalId: string): string {
    return `${this.id}:${originalId}`;
  }

  /** Extract the original ID from an ASTRA-prefixed ID */
  protected stripPrefix(astraId: string): string {
    const prefix = `${this.id}:`;
    if (astraId.startsWith(prefix)) {
      return astraId.slice(prefix.length);
    }
    return astraId;
  }

  /** Make a fetch request with timeout and error handling */
  protected async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000); // 15s timeout

    try {
      const res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...init?.headers,
        },
      });

      if (!res.ok) {
        throw new Error(`${this.name} API error: ${res.status} ${res.statusText}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
