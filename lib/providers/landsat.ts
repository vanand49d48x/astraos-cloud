import { BaseProviderAdapter } from "./base";
import type { SearchParams, STACItem, STACItemCollection } from "@/lib/stac/types";
import {
  normalizeAssets,
  LANDSAT_BAND_MAP,
  extractCloudCover,
  normalizeDatetime,
  extractGsd,
} from "@/lib/stac/normalize";

const LANDSAT_STAC_URL = "https://landsatlook.usgs.gov/stac-server";

/**
 * USGS LandsatLook STAC Server adapter.
 * Landsat Collection 2 Level-2 Surface Reflectance.
 * Assets are typically COG-hosted — direct anonymous access usually works.
 */
export class LandsatAdapter extends BaseProviderAdapter {
  id = "landsat-c2-l2";
  name = "Landsat Collection 2 L2 (USGS)";
  collections = ["landsat-c2-l2"];

  async search(params: SearchParams): Promise<STACItemCollection> {
    const body: Record<string, any> = {
      bbox: params.bbox,
      datetime: params.datetime,
      limit: params.limit || 10,
      collections: ["landsat-c2l2-sr"],
    };

    // LandsatLook supports some query filtering
    if (params.cloudCoverLt !== undefined) {
      body.query = {
        "eo:cloud_cover": { lt: params.cloudCoverLt },
      };
    }

    try {
      const raw = await this.fetchJson<any>(`${LANDSAT_STAC_URL}/search`, {
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
      `${LANDSAT_STAC_URL}/collections/landsat-c2l2-sr/items/${originalId}`
    );
    return this.normalizeItem(raw);
  }

  async getAssetUrl(originalId: string, assetKey: string): Promise<string> {
    const scene = await this.getScene(originalId);
    const asset = scene.assets[assetKey];
    if (!asset) {
      throw new Error(`Asset "${assetKey}" not found for scene "${originalId}"`);
    }
    // Landsat assets are typically directly accessible
    return asset.href;
  }

  private normalizeItem(raw: any): STACItem {
    const cloudCover = extractCloudCover(raw.properties);
    const gsd = extractGsd(raw.properties) || 30; // Landsat default GSD
    const datetime = normalizeDatetime(raw.properties);

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
        platform: raw.properties?.platform || "landsat",
        gsd,
        "astra:provider": this.id,
        "astra:provider_name": this.name,
        "astra:original_id": raw.id,
      },
      assets: normalizeAssets(raw.assets || {}, LANDSAT_BAND_MAP),
      links: raw.links || [],
      collection: "landsat-c2-l2",
    };
  }
}
