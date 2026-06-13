import { BaseProviderAdapter } from "./base";
import type { SearchParams, STACItem, STACItemCollection } from "@/lib/stac/types";

const UP42_API = "https://api.up42.com";

// UP42 collection names → ASTRA normalized display names
const UP42_COLLECTIONS: Record<string, { astra: string; gsd: number; platform: string }> = {
  "phr-ortho":       { astra: "airbus:phr",  gsd: 0.5, platform: "pleiades-1" },
  "pneo-ortho":      { astra: "airbus:pneo", gsd: 0.3, platform: "pleiades-neo" },
  "spot-ortho":      { astra: "airbus:spot", gsd: 1.5, platform: "spot-6-7" },
  "blacksky-scene":  { astra: "blacksky:global", gsd: 1.0, platform: "blacksky" },
  "sar-icye1-grd":   { astra: "iceye:sar",   gsd: 1.0, platform: "iceye" },
};

// Default collections to search if no filter provided
const DEFAULT_UP42_COLLECTIONS = ["phr-ortho", "pneo-ortho", "spot-ortho", "blacksky-scene"];

export class UP42Adapter extends BaseProviderAdapter {
  id = "up42";
  name = "UP42";
  collections = Object.values(UP42_COLLECTIONS).map((c) => c.astra);

  private tokenCache: { token: string; expiresAt: number } | null = null;

  private get projectId(): string   { return process.env.UP42_PROJECT_ID ?? ""; }
  private get projectKey(): string  { return process.env.UP42_PROJECT_API_KEY ?? ""; }
  private get configured(): boolean { return !!(this.projectId && this.projectKey); }

  private async getToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const credentials = Buffer.from(`${this.projectId}:${this.projectKey}`).toString("base64");
    const res = await fetch(`${UP42_API}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`UP42 auth failed: ${res.status}`);
    const data = await res.json() as { access_token: string; expires_in: number };

    this.tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 1 min early
    };
    return data.access_token;
  }

  async search(params: SearchParams): Promise<STACItemCollection> {
    if (!this.configured) {
      return { type: "FeatureCollection", features: [], context: { returned: 0 }, warnings: ["UP42 credentials not configured"] };
    }

    // Map ASTRA collection names back to UP42 collection names
    let up42Collections: string[];
    if (params.collections?.length) {
      up42Collections = Object.entries(UP42_COLLECTIONS)
        .filter(([, v]) => params.collections!.includes(v.astra))
        .map(([k]) => k);
      if (up42Collections.length === 0) {
        return { type: "FeatureCollection", features: [], context: { returned: 0 } };
      }
    } else {
      up42Collections = DEFAULT_UP42_COLLECTIONS;
    }

    let token: string;
    try {
      token = await this.getToken();
    } catch (err: any) {
      return { type: "FeatureCollection", features: [], context: { returned: 0 }, warnings: [`UP42 auth: ${err.message}`] };
    }

    const queryFilter: Record<string, any> = {};
    if (params.cloudCoverLt !== undefined) {
      queryFilter.cloudCoverage = { lte: params.cloudCoverLt };
    }

    const body: Record<string, any> = {
      datetime: this.toRfc3339Interval(params.datetime),
      bbox: params.bbox,
      collections: up42Collections,
      limit: params.limit || 10,
    };
    if (Object.keys(queryFilter).length > 0) body.query = queryFilter;

    let raw: any;
    try {
      raw = await this.fetchJson<any>(`${UP42_API}/catalog/stac/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      return { type: "FeatureCollection", features: [], context: { returned: 0 }, warnings: [`UP42: ${err.message}`] };
    }

    const features = (raw.features || []).map((f: any) => this.normalizeItem(f));

    return {
      type: "FeatureCollection",
      features,
      context: { matched: raw.context?.matched, returned: features.length },
    };
  }

  async getScene(originalId: string): Promise<STACItem> {
    const token = await this.getToken();
    const raw = await this.fetchJson<any>(
      `${UP42_API}/catalog/stac/collections/phr-ortho/items/${originalId}`,
      { headers: { Authorization: `Bearer ${token}` } }
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
    const up42Collection = raw.collection || "";
    const meta = UP42_COLLECTIONS[up42Collection] ?? { astra: `up42:${up42Collection}`, gsd: undefined, platform: "unknown" };

    const cloudCover = props.cloudCoverage ?? props["eo:cloud_cover"] ?? undefined;
    const datetime = props.datetime || props.acquisitionDate || new Date().toISOString();

    const assets: Record<string, any> = {};
    for (const [key, asset] of Object.entries(raw.assets || {})) {
      const a = asset as any;
      const bandName = key === "data" ? "visual" : key;
      assets[bandName] = {
        ...a,
        "astra:band_name": bandName,
        "astra:requires_auth": true,
      };
    }

    // UP42 quicklook as thumbnail
    if (props.quicklookUrl || props.preview_url) {
      assets.thumbnail = {
        href: props.quicklookUrl || props.preview_url,
        type: "image/jpeg",
        roles: ["thumbnail"],
        "astra:band_name": "thumbnail",
        "astra:requires_auth": false,
      };
    }

    return {
      type: "Feature",
      stac_version: "1.0.0",
      id: this.prefixId(raw.id),
      geometry: raw.geometry,
      bbox: raw.bbox ?? null,
      properties: {
        datetime,
        "eo:cloud_cover": cloudCover,
        platform: meta.platform,
        gsd: meta.gsd ?? props.resolution,
        "astra:provider": this.id,
        "astra:provider_name": `${this.name} / ${up42Collection}`,
        "astra:original_id": raw.id,
      },
      assets,
      links: raw.links || [],
      collection: meta.astra,
    };
  }
}
