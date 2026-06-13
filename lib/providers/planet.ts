import { BaseProviderAdapter } from "./base";
import type { SearchParams, STACItem, STACItemCollection } from "@/lib/stac/types";
import { extractCloudCover, normalizeDatetime } from "@/lib/stac/normalize";

const PLANET_API = "https://api.planet.com/data/v1";

// Planet PSScene band names → ASTRA normalized
const PLANET_BAND_MAP: Record<string, string> = {
  blue:    "blue",
  green:   "green",
  red:     "red",
  nir:     "nir",
  // analytic_sr asset naming varies by item type
  B1: "blue",
  B2: "green",
  B3: "red",
  B4: "nir",
  thumbnail: "thumbnail",
};

function bboxToPolygon(bbox: [number, number, number, number]) {
  const [w, s, e, n] = bbox;
  return {
    type: "Polygon",
    coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
  };
}

function parseDateRange(datetime: string): { gte: string; lte: string } {
  const [start, end] = datetime.split("/");
  return {
    gte: start || "2020-01-01T00:00:00Z",
    lte: end   || new Date().toISOString(),
  };
}

export class PlanetAdapter extends BaseProviderAdapter {
  id = "planet";
  name = "Planet Labs";
  collections = ["planet:psscene", "planet:skysat"];

  private get apiKey(): string {
    return process.env.PLANET_API_KEY ?? "";
  }

  private get authHeader(): string {
    return "Basic " + Buffer.from(`${this.apiKey}:`).toString("base64");
  }

  async search(params: SearchParams): Promise<STACItemCollection> {
    if (!this.apiKey) {
      return { type: "FeatureCollection", features: [], context: { returned: 0 }, warnings: ["Planet API key not configured"] };
    }

    // Determine which Planet item types to search
    const wantsSkysat = params.collections?.some((c) => c.includes("skysat"));
    const wantsPlanet = !params.collections || params.collections.some((c) => c.includes("planet") || c.includes("ps"));
    if (!wantsPlanet && !wantsSkysat) {
      return { type: "FeatureCollection", features: [], context: { returned: 0 } };
    }

    const itemTypes: string[] = [];
    if (wantsPlanet || !params.collections?.length) itemTypes.push("PSScene");
    if (wantsSkysat) itemTypes.push("SkySatScene");

    const { gte, lte } = parseDateRange(this.toRfc3339Interval(params.datetime));

    const andFilters: any[] = [
      {
        type: "GeometryFilter",
        field_name: "geometry",
        config: bboxToPolygon(params.bbox),
      },
      {
        type: "DateRangeFilter",
        field_name: "acquired",
        config: { gte, lte },
      },
    ];

    if (params.cloudCoverLt !== undefined) {
      andFilters.push({
        type: "RangeFilter",
        field_name: "cloud_cover",
        config: { lte: params.cloudCoverLt / 100 }, // Planet uses 0-1, ASTRA uses 0-100
      });
    }

    const body = {
      item_types: itemTypes,
      filter: { type: "AndFilter", config: andFilters },
    };

    let raw: any;
    try {
      raw = await this.fetchJson<any>(`${PLANET_API}/quick-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
        },
        body: JSON.stringify(body),
      });
    } catch (err: any) {
      return { type: "FeatureCollection", features: [], context: { returned: 0 }, warnings: [`Planet: ${err.message}`] };
    }

    const limit = params.limit || 10;
    const features = (raw.features || [])
      .slice(0, limit)
      .map((f: any) => this.normalizeItem(f));

    return {
      type: "FeatureCollection",
      features,
      context: { returned: features.length },
    };
  }

  async getScene(originalId: string): Promise<STACItem> {
    // Need to know item type — try PSScene first
    for (const itemType of ["PSScene", "SkySatScene"]) {
      try {
        const raw = await this.fetchJson<any>(
          `${PLANET_API}/item-types/${itemType}/items/${originalId}`,
          { headers: { Authorization: this.authHeader } }
        );
        return this.normalizeItem(raw);
      } catch {
        continue;
      }
    }
    throw new Error(`Planet scene not found: ${originalId}`);
  }

  async getAssetUrl(originalId: string, assetKey: string): Promise<string> {
    // Planet requires activating assets before download
    const scene = await this.getScene(originalId);
    const asset = scene.assets[assetKey];
    if (!asset) throw new Error(`Asset "${assetKey}" not found`);
    return asset.href;
  }

  private normalizeItem(raw: any): STACItem {
    const props = raw.properties || {};
    const cloudCoverRaw = props.cloud_cover;
    const cloudCover = typeof cloudCoverRaw === "number"
      ? cloudCoverRaw > 1 ? cloudCoverRaw : cloudCoverRaw * 100  // normalize 0-1 → 0-100
      : undefined;

    const collection = props.item_type === "SkySatScene" ? "planet:skysat" : "planet:psscene";
    const gsd = props.gsd ?? props.pixel_resolution;

    // Normalize assets
    const assets: Record<string, any> = {};
    for (const [key, asset] of Object.entries(raw.assets || {})) {
      const bandName = PLANET_BAND_MAP[key] || key;
      assets[bandName] = {
        ...(asset as any),
        "astra:band_name": bandName,
        "astra:requires_auth": true,
      };
    }

    // Thumbnail from _links if not in assets
    if (!assets.thumbnail && raw._links?.thumbnail) {
      assets.thumbnail = {
        href: raw._links.thumbnail,
        type: "image/png",
        roles: ["thumbnail"],
        "astra:band_name": "thumbnail",
        "astra:requires_auth": true,
      };
    }

    return {
      type: "Feature",
      stac_version: "1.0.0",
      id: this.prefixId(raw.id),
      geometry: raw.geometry,
      bbox: raw.bbox ?? null,
      properties: {
        datetime: props.acquired || props.published || new Date().toISOString(),
        "eo:cloud_cover": cloudCover,
        platform: props.satellite_id ?? "dove",
        gsd,
        instruments: ["PS2"],
        "astra:provider": this.id,
        "astra:provider_name": this.name,
        "astra:original_id": raw.id,
      },
      assets,
      links: raw._links ? [{ href: raw._links._self, rel: "self" }] : [],
      collection,
    };
  }
}
