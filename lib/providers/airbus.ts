import { BaseProviderAdapter } from "./base";
import type { SearchParams, STACItem, STACItemCollection } from "@/lib/stac/types";

const ONEATLAS_API = "https://api.oneatlas.airbus.com";

// Airbus constellation → GSD and ASTRA collection name
const CONSTELLATION_META: Record<string, { astra: string; gsd: number; platform: string }> = {
  PHR:  { astra: "airbus:phr",  gsd: 0.5,  platform: "pleiades" },
  PNEO: { astra: "airbus:pneo", gsd: 0.3,  platform: "pleiades-neo" },
  SPOT: { astra: "airbus:spot", gsd: 1.5,  platform: "spot" },
};

// Airbus band names → ASTRA normalized
const AIRBUS_BAND_MAP: Record<string, string> = {
  B0: "blue",
  B1: "green",
  B2: "red",
  B3: "nir",
  P:  "pan",
  PAN: "pan",
  MS:  "visual",
  thumbnail: "thumbnail",
};

export class AirbusAdapter extends BaseProviderAdapter {
  id = "airbus";
  name = "Airbus OneAtlas";
  collections = ["airbus:phr", "airbus:pneo", "airbus:spot"];

  private get apiKey(): string { return process.env.AIRBUS_API_KEY ?? ""; }

  async search(params: SearchParams): Promise<STACItemCollection> {
    if (!this.apiKey) {
      return { type: "FeatureCollection", features: [], context: { returned: 0 }, warnings: ["Airbus API key not configured"] };
    }

    // Map ASTRA collection names to Airbus constellation filter
    let constellations: string[] | undefined;
    if (params.collections?.length) {
      constellations = Object.entries(CONSTELLATION_META)
        .filter(([, v]) => params.collections!.includes(v.astra))
        .map(([k]) => k);
      if (constellations.length === 0) {
        return { type: "FeatureCollection", features: [], context: { returned: 0 } };
      }
    }

    const datetime = this.toRfc3339Interval(params.datetime);
    const [startDate, endDate] = datetime.split("/");
    const [w, s, e, n] = params.bbox;

    const body: Record<string, any> = {
      bbox: [w, s, e, n],
      startDate,
      endDate,
      itemsPerPage: params.limit || 10,
      page: 1,
    };

    if (params.cloudCoverLt !== undefined) {
      body.cloudCover = [0, params.cloudCoverLt];
    }

    if (constellations) {
      body.collections = constellations;
    }

    let raw: any;
    try {
      raw = await this.fetchJson<any>(`${ONEATLAS_API}/api/v1/opensearch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      return { type: "FeatureCollection", features: [], context: { returned: 0 }, warnings: [`Airbus: ${err.message}`] };
    }

    const features = (raw.features || []).map((f: any) => this.normalizeItem(f));

    return {
      type: "FeatureCollection",
      features,
      context: { matched: raw.totalResults, returned: features.length },
    };
  }

  async getScene(originalId: string): Promise<STACItem> {
    const raw = await this.fetchJson<any>(
      `${ONEATLAS_API}/api/v1/products/${originalId}`,
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );
    return this.normalizeItem(raw);
  }

  async getAssetUrl(originalId: string, assetKey: string): Promise<string> {
    const scene = await this.getScene(originalId);
    const asset = scene.assets[assetKey];
    if (!asset) throw new Error(`Asset "${assetKey}" not found`);
    return asset.href;
  }

  private normalizeItem(raw: any): STACItem {
    const props = raw.properties || {};
    const constellation = props.constellation || "PHR";
    const meta = CONSTELLATION_META[constellation] ?? CONSTELLATION_META.PHR;

    const cloudCover = props.cloudCover ?? props["eo:cloud_cover"];
    const datetime = props.acquisitionDate || props.datetime || new Date().toISOString();

    const assets: Record<string, any> = {};

    // Airbus quicklook / WMTS thumbnail
    if (props.quicklookUrl) {
      assets.thumbnail = {
        href: props.quicklookUrl,
        type: "image/jpeg",
        roles: ["thumbnail"],
        "astra:band_name": "thumbnail",
        "astra:requires_auth": false,
      };
    }

    // Airbus WMTS tile layer for preview overlay
    if (props.wmtsUrl) {
      assets.visual = {
        href: props.wmtsUrl,
        type: "image/png",
        roles: ["overview"],
        "astra:band_name": "visual",
        "astra:requires_auth": true,
      };
    }

    // Normalize any existing assets
    for (const [key, asset] of Object.entries(raw.assets || {})) {
      const a = asset as any;
      const bandName = AIRBUS_BAND_MAP[key] || key;
      assets[bandName] = {
        ...a,
        "astra:band_name": bandName,
        "astra:requires_auth": true,
      };
    }

    return {
      type: "Feature",
      stac_version: "1.0.0",
      id: this.prefixId(raw.id || props.id || props.productId),
      geometry: raw.geometry,
      bbox: raw.bbox ?? null,
      properties: {
        datetime,
        "eo:cloud_cover": cloudCover,
        platform: meta.platform,
        gsd: meta.gsd ?? props.resolution,
        instruments: [constellation],
        "astra:provider": this.id,
        "astra:provider_name": `${this.name} (${constellation})`,
        "astra:original_id": raw.id || props.id || props.productId,
      },
      assets,
      links: raw.links || [],
      collection: meta.astra,
    };
  }
}
