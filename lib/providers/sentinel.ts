import { BaseProviderAdapter } from "./base";
import type { SearchParams, STACItem, STACItemCollection } from "@/lib/stac/types";
import {
  normalizeAssets,
  SENTINEL2_BAND_MAP,
  extractCloudCover,
  normalizeDatetime,
  extractGsd,
} from "@/lib/stac/normalize";

const CDSE_STAC_URL = "https://stac.dataspace.copernicus.eu/v1";

/**
 * Copernicus Data Space Ecosystem (CDSE) Sentinel-2 adapter.
 * Discovery via STAC (bbox + datetime only, limited query support).
 * Cloud cover filtering done as post-filter in ASTRA OS.
 * Assets are often JP2/SAFE, not COG — may require auth + conversion.
 */
export class SentinelAdapter extends BaseProviderAdapter {
  id = "sentinel-2-l2a";
  name = "Sentinel-2 L2A (Copernicus)";
  collections = ["sentinel-2-l2a"];

  async search(params: SearchParams): Promise<STACItemCollection> {
    // CDSE STAC: use bbox + datetime for discovery
    // Cloud cover filtering is NOT reliably supported server-side
    const body: Record<string, any> = {
      bbox: params.bbox,
      datetime: params.datetime,
      limit: params.limit || 10,
      collections: ["sentinel-2-l2a"],
    };

    try {
      const raw = await this.fetchJson<any>(`${CDSE_STAC_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const features: STACItem[] = (raw.features || []).map((f: any) =>
        this.normalizeItem(f)
      );

      return {
        type: "FeatureCollection",
        features,
        context: {
          matched: raw.context?.matched || raw.numberMatched,
          returned: features.length,
        },
      };
    } catch (err: any) {
      // Return empty with warning rather than failing the entire search
      return {
        type: "FeatureCollection",
        features: [],
        context: { returned: 0 },
        warnings: [`${this.name}: ${err.message || "search failed"}`],
      };
    }
  }

  async getScene(originalId: string): Promise<STACItem> {
    const raw = await this.fetchJson<any>(
      `${CDSE_STAC_URL}/collections/sentinel-2-l2a/items/${originalId}`
    );
    return this.normalizeItem(raw);
  }

  async getAssetUrl(originalId: string, assetKey: string): Promise<string> {
    const scene = await this.getScene(originalId);
    const asset = scene.assets[assetKey];
    if (!asset) {
      throw new Error(`Asset "${assetKey}" not found for scene "${originalId}"`);
    }

    // CDSE assets may require authentication
    // For now, return the direct URL. In production, this would use
    // COPERNICUS_CLIENT_ID/SECRET to get a signed/authed URL.
    return asset.href;
  }

  private normalizeItem(raw: any): STACItem {
    const cloudCover = extractCloudCover(raw.properties);
    const gsd = extractGsd(raw.properties) || 10; // Sentinel-2 default GSD
    const datetime = normalizeDatetime(raw.properties);

    const assets = normalizeAssets(raw.assets || {}, SENTINEL2_BAND_MAP);
    // Mark CDSE assets as requiring auth and potentially non-COG
    for (const asset of Object.values(assets)) {
      asset["astra:requires_auth"] = true;
      // Most CDSE assets are JP2, not COG
      if (!asset["astra:is_cog"]) {
        asset["astra:is_cog"] = false;
      }
    }

    return {
      type: "Feature",
      stac_version: raw.stac_version || "1.0.0",
      id: this.prefixId(raw.id),
      geometry: raw.geometry,
      bbox: raw.bbox,
      properties: {
        ...raw.properties,
        datetime,
        "eo:cloud_cover": cloudCover,
        platform: raw.properties?.platform || "sentinel-2",
        gsd,
        "astra:provider": this.id,
        "astra:provider_name": this.name,
        "astra:original_id": raw.id,
      },
      assets,
      links: raw.links || [],
      collection: "sentinel-2-l2a",
    };
  }
}
