"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Cloud,
  Calendar,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { PRESET_LOCATIONS } from "@/lib/constants";

const ExplorerMap = dynamic(
  () => import("@/components/dashboard/explorer-map"),
  { ssr: false, loading: () => (
    <div className="w-full h-full bg-card flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  )}
);

interface STACItem {
  id: string;
  properties: {
    datetime: string;
    "eo:cloud_cover"?: number;
    gsd?: number;
    platform?: string;
    "astra:provider_name"?: string;
    [key: string]: unknown;
  };
  assets?: Record<string, { href: string; type?: string; title?: string }>;
  bbox?: number[];
  links?: Array<{ rel: string; href: string }>;
}

interface SearchResult {
  type: string;
  features: STACItem[];
  context?: { matched?: number; returned?: number };
  warnings?: string[];
}

export default function ExplorerPage() {
  const [bbox, setBbox] = useState("-122.52,37.70,-122.35,37.82");
  const [dateRange, setDateRange] = useState("2024-06-01/2024-12-31");
  const [cloudCover, setCloudCover] = useState("30");
  const [collections, setCollections] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [selectedScene, setSelectedScene] = useState<STACItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelectedScene(null);

    try {
      const params = new URLSearchParams({
        bbox,
        datetime: dateRange,
        cloud_cover_lt: cloudCover,
        limit: "20",
      });

      if (collections) {
        params.set("collections", collections);
      }

      const res = await fetch(`/api/v1/search?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Search failed");
      }

      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [bbox, dateRange, cloudCover, collections]);

  function applyPreset(preset: (typeof PRESET_LOCATIONS)[number]) {
    setBbox(preset.bbox.join(","));
  }

  function copySnippet() {
    const snippet = `curl "https://astraos.cloud/api/v1/search?bbox=${bbox}&datetime=${dateRange}&cloud_cover_lt=${cloudCover}&limit=20" \\
  -H "Authorization: Bearer astra_YOUR_KEY"`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Explorer</h1>
          <p className="text-muted-foreground">
            Search and browse real satellite imagery across all providers
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={copySnippet}>
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          Copy API Call
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Search panel */}
        <div className="space-y-4">
          {/* Search form */}
          <div className="bg-card border border-white/[0.06] rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-sm">Search Parameters</h3>

            {/* Preset locations */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                Quick Locations
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => applyPreset(loc)}
                    className="text-xs px-2.5 py-1 rounded-full border border-white/10 hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Bounding Box (W,S,E,N)"
              value={bbox}
              onChange={(e) => setBbox(e.target.value)}
              placeholder="-122.52,37.70,-122.35,37.82"
            />

            <Input
              label="Date Range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              placeholder="2024-01-01/2024-12-31"
            />

            <Input
              label="Max Cloud Cover (%)"
              type="number"
              value={cloudCover}
              onChange={(e) => setCloudCover(e.target.value)}
              placeholder="20"
              min={0}
              max={100}
            />

            <Input
              label="Collections (optional)"
              value={collections}
              onChange={(e) => setCollections(e.target.value)}
              placeholder="sentinel-2-l2a,landsat-c2-l2"
            />

            <Button onClick={handleSearch} className="w-full" loading={loading}>
              <Search className="w-4 h-4 mr-2" />
              Search Imagery
            </Button>
          </div>

          {/* Results summary */}
          {results && (
            <div className="bg-card border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Results</h3>
                <Badge variant="primary">
                  {results.context?.returned || results.features.length} scenes
                </Badge>
              </div>

              {results.warnings && results.warnings.length > 0 && (
                <div className="text-xs text-yellow-500/80 bg-yellow-500/10 rounded-lg px-3 py-2 mb-3">
                  {results.warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              )}

              {error && (
                <div className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2 mb-3">
                  {error}
                </div>
              )}

              {/* Scene list */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {results.features.map((scene) => (
                  <button
                    key={scene.id}
                    onClick={() => setSelectedScene(scene)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedScene?.id === scene.id
                        ? "border-primary/50 bg-primary/10"
                        : "border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono truncate">{scene.id}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {scene.properties["astra:provider_name"] && (
                            <Badge variant="outline" className="text-[10px]">
                              {scene.properties["astra:provider_name"]}
                            </Badge>
                          )}
                          {scene.properties.datetime && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(scene.properties.datetime).toLocaleDateString()}
                            </span>
                          )}
                          {scene.properties["eo:cloud_cover"] !== undefined && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Cloud className="w-3 h-3" />
                              {Math.round(scene.properties["eo:cloud_cover"])}%
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map + Scene detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Interactive satellite map */}
          <div className="bg-card border border-white/[0.06] rounded-xl overflow-hidden h-[400px]">
            <ExplorerMap
              bbox={bbox}
              loading={loading}
              sceneBboxes={results?.features.map((f) => f.bbox).filter(Boolean) as number[][] || []}
              selectedSceneBbox={selectedScene?.bbox || null}
            />
          </div>

          {/* Scene detail */}
          {selectedScene ? (
            <div className="bg-card border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Scene Details</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-1">
                    {selectedScene.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedScene(null)}
                  className="p-1 rounded hover:bg-white/5"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium mt-0.5">
                    {new Date(selectedScene.properties.datetime).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cloud Cover</p>
                  <p className="text-sm font-medium mt-0.5">
                    {selectedScene.properties["eo:cloud_cover"] !== undefined
                      ? `${Math.round(selectedScene.properties["eo:cloud_cover"])}%`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GSD</p>
                  <p className="text-sm font-medium mt-0.5">
                    {selectedScene.properties.gsd
                      ? `${selectedScene.properties.gsd}m`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <p className="text-sm font-medium mt-0.5">
                    {selectedScene.properties["astra:provider_name"] || "Unknown"}
                  </p>
                </div>
              </div>

              {/* Assets */}
              {selectedScene.assets && Object.keys(selectedScene.assets).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Available Assets</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(selectedScene.assets).map(([band, asset]) => (
                      <div
                        key={band}
                        className="p-2.5 rounded-lg border border-white/[0.06] hover:border-primary/30 transition-colors"
                      >
                        <p className="text-xs font-medium capitalize">{asset.title || band}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                          {asset.type || "GeoTIFF"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bounding box */}
              {selectedScene.bbox && (
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs text-muted-foreground">Bounding Box</p>
                  <p className="text-xs font-mono mt-1">
                    [{selectedScene.bbox.map((b) => b.toFixed(4)).join(", ")}]
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-white/[0.06] rounded-xl p-8 text-center">
              <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {results
                  ? "Select a scene to view details"
                  : "Search for satellite imagery to explore results"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
