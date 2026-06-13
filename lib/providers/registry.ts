import type { ProviderAdapter } from "./base";
import type { SearchParams, STACItem, STACItemCollection } from "@/lib/stac/types";
import { SentinelAdapter } from "./sentinel";
import { LandsatAdapter } from "./landsat";
import { PlanetaryComputerAdapter } from "./planetary-computer";
import { PlanetAdapter } from "./planet";
import { UP42Adapter } from "./up42";
import { AirbusAdapter } from "./airbus";

const providers = new Map<string, ProviderAdapter>();

// ── Free / open-data providers (always registered) ─────────────────────────
const sentinel = new SentinelAdapter();
const landsat  = new LandsatAdapter();
const pc       = new PlanetaryComputerAdapter();
providers.set(sentinel.id, sentinel);
providers.set(landsat.id,  landsat);
providers.set(pc.id,       pc);

// ── Commercial providers (registered only if credentials are present) ───────
if (process.env.PLANET_API_KEY) {
  const planet = new PlanetAdapter();
  providers.set(planet.id, planet);
}

if (process.env.UP42_PROJECT_ID && process.env.UP42_PROJECT_API_KEY) {
  const up42 = new UP42Adapter();
  providers.set(up42.id, up42);
}

if (process.env.AIRBUS_API_KEY) {
  const airbus = new AirbusAdapter();
  providers.set(airbus.id, airbus);
}

export function getAllProviders(): ProviderAdapter[] {
  return Array.from(providers.values());
}

export function getProvider(id: string): ProviderAdapter | undefined {
  return providers.get(id);
}

export function getProviderForScene(astraId: string): { provider: ProviderAdapter; originalId: string } | null {
  const colonIndex = astraId.indexOf(":");
  if (colonIndex === -1) return null;
  const providerId = astraId.slice(0, colonIndex);
  const originalId = astraId.slice(colonIndex + 1);
  const provider = providers.get(providerId);
  if (!provider) return null;
  return { provider, originalId };
}

/** Returns metadata about all registered providers — used by the dashboard. */
export function getProviderManifest() {
  return Array.from(providers.values()).map((p) => ({
    id:          p.id,
    name:        p.name,
    collections: p.collections,
    commercial:  !["sentinel", "landsat", "planetary-computer"].includes(p.id),
  }));
}

export async function unifiedSearch(params: SearchParams): Promise<STACItemCollection> {
  let targetProviders: ProviderAdapter[];

  if (params.collections && params.collections.length > 0) {
    targetProviders = getAllProviders().filter((p) =>
      p.collections.some((c) => params.collections!.includes(c))
    );
  } else {
    targetProviders = getAllProviders();
  }

  if (targetProviders.length === 0) {
    return {
      type: "FeatureCollection",
      features: [],
      context: { returned: 0 },
      warnings: ["No providers match the requested collections"],
    };
  }

  const results = await Promise.allSettled(
    targetProviders.map((provider) => provider.search(params))
  );

  const allFeatures: STACItem[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result   = results[i];
    const provider = targetProviders[i];

    if (result.status === "fulfilled") {
      allFeatures.push(...result.value.features);
      if (result.value.warnings) warnings.push(...result.value.warnings);
    } else {
      warnings.push(`${provider.name}: ${result.reason?.message || "request failed"}`);
    }
  }

  // Post-filter cloud cover
  let filtered = allFeatures;
  if (params.cloudCoverLt !== undefined) {
    filtered = allFeatures.filter((item) => {
      const cc = item.properties["eo:cloud_cover"];
      return cc === undefined || cc < params.cloudCoverLt!;
    });
  }

  // Sort by datetime descending (most recent first)
  filtered.sort((a, b) => {
    const da = new Date(a.properties.datetime).getTime();
    const db = new Date(b.properties.datetime).getTime();
    return db - da;
  });

  const limit   = params.limit || 10;
  const limited = filtered.slice(0, limit);

  return {
    type: "FeatureCollection",
    features: limited,
    context: { matched: filtered.length, returned: limited.length },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
