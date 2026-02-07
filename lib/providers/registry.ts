import type { ProviderAdapter } from "./base";
import type { SearchParams, STACItem, STACItemCollection } from "@/lib/stac/types";
import { SentinelAdapter } from "./sentinel";
import { LandsatAdapter } from "./landsat";
import { PlanetaryComputerAdapter } from "./planetary-computer";

// Register all providers here.
// Adding a new provider = instantiate + add to this map. Zero API changes for users.
const providers = new Map<string, ProviderAdapter>();

const sentinel = new SentinelAdapter();
const landsat = new LandsatAdapter();
const pc = new PlanetaryComputerAdapter();

providers.set(sentinel.id, sentinel);
providers.set(landsat.id, landsat);
providers.set(pc.id, pc);

/**
 * Get all registered providers.
 */
export function getAllProviders(): ProviderAdapter[] {
  return Array.from(providers.values());
}

/**
 * Get a specific provider by ID.
 */
export function getProvider(id: string): ProviderAdapter | undefined {
  return providers.get(id);
}

/**
 * Get the provider for an ASTRA-prefixed scene ID.
 * E.g., "sentinel-2-l2a:S2A_MSIL2A_..." → SentinelAdapter
 */
export function getProviderForScene(astraId: string): { provider: ProviderAdapter; originalId: string } | null {
  const colonIndex = astraId.indexOf(":");
  if (colonIndex === -1) return null;

  const providerId = astraId.slice(0, colonIndex);
  const originalId = astraId.slice(colonIndex + 1);
  const provider = providers.get(providerId);

  if (!provider) return null;
  return { provider, originalId };
}

/**
 * Unified search across all (or filtered) providers.
 * Uses Promise.allSettled for resilience — partial results + warnings if a provider fails.
 */
export async function unifiedSearch(params: SearchParams): Promise<STACItemCollection> {
  // Determine which providers to query
  let targetProviders: ProviderAdapter[];

  if (params.collections && params.collections.length > 0) {
    // Filter to providers that serve the requested collections
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

  // Fan out to all providers with Promise.allSettled
  const results = await Promise.allSettled(
    targetProviders.map((provider) => provider.search(params))
  );

  const allFeatures: STACItem[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const provider = targetProviders[i];

    if (result.status === "fulfilled") {
      allFeatures.push(...result.value.features);
      if (result.value.warnings) {
        warnings.push(...result.value.warnings);
      }
    } else {
      warnings.push(`${provider.name}: ${result.reason?.message || "request failed"}`);
    }
  }

  // Post-filter for cloud cover (provider may not have filtered)
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

  // Apply limit
  const limit = params.limit || 10;
  const limited = filtered.slice(0, limit);

  return {
    type: "FeatureCollection",
    features: limited,
    context: {
      matched: filtered.length,
      returned: limited.length,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
