import { BaseProviderAdapter } from "./base";
import type { SearchParams, STACItem, STACItemCollection } from "@/lib/stac/types";
import {
  normalizeAssets,
  SENTINEL2_BAND_MAP,
  LANDSAT_BAND_MAP,
  extractCloudCover,
  normalizeDatetime,
  extractGsd,
} from "@/lib/stac/normalize";

const PC_STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1";
const PC_SIGN_URL = "https://planetarycomputer.microsoft.com/api/sas/v1/sign";

/**
 * Microsoft Planetary Computer adapter.
 * Fast path for MVP: COG-first assets, rich query support, well-documented signing.
 */
export class PlanetaryComputerAdapter extends BaseProviderAdapter {
  id = "planetary-computer";
  name = "Microsoft Planetary Computer";
  collections = ["sentinel-2-l2a", "landsat-c2-l2-sr"];

  async search(params: SearchParams): Promise<STACItemCollection> {
    const body: Record<string, any> = {
      bbox: params.bbox,
      datetime: params.datetime,
      limit: params.limit || 10,
      collections: params.collections?.length
        ? params.collections.filter((c) => this.collections.includes(c))
        : this.collections,
    };

    // PC supports cloud cover filtering via query
    if (params.cloudCoverLt !== undefined) {
      body.query = {
        "eo:cloud_cover": { lt: params.cloudCoverLt },
      };
    }

    // If no matching collections, return empty
    if (body.collections.length === 0) {
      return { type: "FeatureCollection", features: [], context: { returned: 0 } };
    }

    const raw = await this.fetchJson<any>(`${PC_STAC_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Normalize items and sign thumbnail URLs in parallel for display
    const features: STACItem[] = await Promise.all(
      (raw.features || []).map(async (f: any) => {
        const item = this.normalizeItem(f);
        await this.signThumbnails(item);
        return item;
      })
    );

    return {
      type: "FeatureCollection",
      features,
      context: {
        matched: raw.context?.matched,
        returned: features.length,
      },
    };
  }

  async getScene(originalId: string): Promise<STACItem> {
    // Try to determine the collection from the ID pattern
    const collection = originalId.startsWith("S2") ? "sentinel-2-l2a" : "landsat-c2-l2-sr";
    const raw = await this.fetchJson<any>(
      `${PC_STAC_URL}/collections/${collection}/items/${originalId}`
    );
    return this.normalizeItem(raw);
  }

  async getAssetUrl(originalId: string, assetKey: string): Promise<string> {
    const scene = await this.getScene(originalId);
    const asset = scene.assets[assetKey];
    if (!asset) {
      throw new Error(`Asset "${assetKey}" not found for scene "${originalId}"`);
    }
    // Sign the URL using PC's SAS token endpoint
    return this.signUrl(asset.href);
  }

  private async signThumbnails(item: STACItem): Promise<void> {
    const thumbKeys = ["thumbnail", "rendered_preview", "visual"];
    for (const key of thumbKeys) {
      if (item.assets[key]?.href && item.assets[key].href.includes("blob.core.windows.net")) {
        try {
          item.assets[key].href = await this.signUrl(item.assets[key].href);
        } catch {
          // Keep unsigned URL as fallback
        }
      }
    }
  }

  private async signUrl(url: string): Promise<string> {
    try {
      const result = await this.fetchJson<{ href: string }>(
        `${PC_SIGN_URL}?href=${encodeURIComponent(url)}`
      );
      return result.href;
    } catch {
      // If signing fails, return the original URL (some assets are public)
      return url;
    }
  }

  private normalizeItem(raw: any): STACItem {
    const collection = raw.collection || "";
    const bandMap = collection.includes("sentinel")
      ? SENTINEL2_BAND_MAP
      : LANDSAT_BAND_MAP;

    const cloudCover = extractCloudCover(raw.properties);
    const gsd = extractGsd(raw.properties);
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
        platform: raw.properties.platform || collection,
        gsd,
        "astra:provider": this.id,
        "astra:provider_name": this.name,
        "astra:original_id": raw.id,
      },
      assets: normalizeAssets(raw.assets || {}, bandMap),
      links: raw.links || [],
      collection,
    };
  }
}
