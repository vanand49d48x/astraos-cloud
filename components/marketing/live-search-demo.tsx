"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRESET_LOCATIONS, EVENT_PRESETS } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import {
  Cloud,
  MapPin,
  Satellite,
  Search,
  Loader2,
  X,
  Maximize2,
  Layers,
  Calendar,
  Ruler,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Crosshair,
  Flame,
  CloudRain,
  Mountain,
  TreePine,
  ChevronDown,
  ChevronUp,
  Terminal,
  Braces,
  FileCode,
} from "lucide-react";
import { useState, useCallback, useRef } from "react";
import type { STACItemCollection, STACItem } from "@/lib/stac/types";

// ─────────────────────────────────────────────
// Tab types for search mode and code language
// ─────────────────────────────────────────────
type SearchMode = "presets" | "coordinates" | "events";
type CodeLang = "curl" | "python" | "javascript";

const EVENT_ICONS: Record<string, React.ReactNode> = {
  Flame: <Flame className="h-3.5 w-3.5" />,
  CloudRain: <CloudRain className="h-3.5 w-3.5" />,
  Mountain: <Mountain className="h-3.5 w-3.5" />,
  TreePine: <TreePine className="h-3.5 w-3.5" />,
};

export function LiveSearchDemo() {
  const [results, setResults] = useState<STACItemCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<STACItem | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>("presets");
  const [showApiResponse, setShowApiResponse] = useState(false);
  const [showCodeSnippets, setShowCodeSnippets] = useState(false);
  const [codeLang, setCodeLang] = useState<CodeLang>("curl");
  const [rawResponse, setRawResponse] = useState<string>("");

  // Custom coordinate form state
  const [latInput, setLatInput] = useState("37.77");
  const [lonInput, setLonInput] = useState("-122.42");
  const [radiusInput, setRadiusInput] = useState("0.1");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [cloudCover, setCloudCover] = useState("30");

  // Track the last search params for code snippets
  const lastSearchParams = useRef<{
    bbox: string;
    datetime: string;
    cloud_cover_lt: string;
    limit: string;
  } | null>(null);

  const doSearch = useCallback(
    async (
      bbox: [number, number, number, number],
      name: string,
      datetime?: string,
      cloudLt?: string
    ) => {
      setLoading(true);
      setActivePreset(name);
      setError(null);
      setResults(null);
      setSelectedScene(null);
      setShowApiResponse(false);

      try {
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const dt =
          datetime ||
          `${threeMonthsAgo.toISOString().split("T")[0]}/${now.toISOString().split("T")[0]}`;
        const cc = cloudLt || "30";

        const params = new URLSearchParams({
          bbox: bbox.join(","),
          datetime: dt,
          cloud_cover_lt: cc,
          limit: "6",
        });

        lastSearchParams.current = {
          bbox: bbox.join(","),
          datetime: dt,
          cloud_cover_lt: cc,
          limit: "6",
        };

        const res = await fetch(`/api/v1/search?${params}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Search failed");
        }

        setResults(data);
        setRawResponse(JSON.stringify(data, null, 2));
      } catch (err: any) {
        setError(err.message || "Search failed. Try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handlePresetSearch = (bbox: [number, number, number, number], name: string) => {
    doSearch(bbox, name);
  };

  const handleEventSearch = (
    bbox: [number, number, number, number],
    name: string,
    datetime: string
  ) => {
    doSearch(bbox, name, datetime);
  };

  const handleCoordinateSearch = () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    const r = parseFloat(radiusInput);

    if (isNaN(lat) || isNaN(lon) || isNaN(r)) {
      setError("Please enter valid numeric values for latitude, longitude, and radius.");
      return;
    }
    if (lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90.");
      return;
    }
    if (lon < -180 || lon > 180) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    const bbox: [number, number, number, number] = [
      lon - r,
      lat - r,
      lon + r,
      lat + r,
    ];
    const datetime = `${dateFrom}/${dateTo}`;
    doSearch(bbox, `${lat.toFixed(4)}, ${lon.toFixed(4)}`, datetime, cloudCover);
  };

  // Generate code snippets based on last search
  function getCodeSnippet(lang: CodeLang): string {
    const p = lastSearchParams.current;
    if (!p) return "// Run a search first to see the code snippet";

    switch (lang) {
      case "curl":
        return `curl "https://astraos.cloud/api/v1/search?bbox=${p.bbox}&datetime=${p.datetime}&cloud_cover_lt=${p.cloud_cover_lt}&limit=${p.limit}" \\
  -H "Authorization: Bearer astra_YOUR_API_KEY"`;

      case "python":
        return `import requests

response = requests.get(
    "https://astraos.cloud/api/v1/search",
    params={
        "bbox": "${p.bbox}",
        "datetime": "${p.datetime}",
        "cloud_cover_lt": ${p.cloud_cover_lt},
        "limit": ${p.limit},
    },
    headers={"Authorization": "Bearer astra_YOUR_API_KEY"},
)

scenes = response.json()
for scene in scenes["features"]:
    print(scene["id"], scene["properties"]["eo:cloud_cover"])`;

      case "javascript":
        return `const params = new URLSearchParams({
  bbox: "${p.bbox}",
  datetime: "${p.datetime}",
  cloud_cover_lt: "${p.cloud_cover_lt}",
  limit: "${p.limit}",
});

const res = await fetch(
  \`https://astraos.cloud/api/v1/search?\${params}\`,
  { headers: { Authorization: "Bearer astra_YOUR_API_KEY" } }
);

const { features: scenes } = await res.json();
scenes.forEach(s => console.log(s.id, s.properties["eo:cloud_cover"]));`;

      default:
        return "";
    }
  }

  return (
    <section className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="primary" className="mb-4">
            Live Demo
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Search satellite imagery in{" "}
            <span className="text-primary">real time</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Pick a location, enter coordinates, or explore historical events — see real
            results from Sentinel-2, Landsat, and Planetary Computer through one unified
            API.
          </p>
        </div>

        {/* ────────────────── Search Mode Tabs ────────────────── */}
        <div className="flex items-center justify-center gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1 max-w-fit mx-auto">
          {(
            [
              { key: "presets", label: "Preset Locations", icon: <MapPin className="h-3.5 w-3.5" /> },
              { key: "coordinates", label: "Coordinates", icon: <Crosshair className="h-3.5 w-3.5" /> },
              { key: "events", label: "Events & Disasters", icon: <Flame className="h-3.5 w-3.5" /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchMode(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all cursor-pointer",
                searchMode === tab.key
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ────────────────── Preset Location Buttons ────────────────── */}
        {searchMode === "presets" && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8 animate-fade-in">
            {PRESET_LOCATIONS.map((loc) => (
              <button
                key={loc.name}
                onClick={() => handlePresetSearch(loc.bbox, loc.name)}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all cursor-pointer",
                  "border",
                  activePreset === loc.name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 hover:bg-white/5"
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                {loc.name}
              </button>
            ))}
          </div>
        )}

        {/* ────────────────── Coordinate Search Form ────────────────── */}
        {searchMode === "coordinates" && (
          <div className="max-w-3xl mx-auto mb-8 animate-fade-in">
            <div className="rounded-xl border border-card-border bg-card p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {/* Latitude */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    placeholder="37.7749"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono"
                  />
                </div>

                {/* Longitude */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={lonInput}
                    onChange={(e) => setLonInput(e.target.value)}
                    placeholder="-122.4194"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono"
                  />
                </div>

                {/* Radius (degrees) */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    Radius (°)
                  </label>
                  <input
                    type="text"
                    value={radiusInput}
                    onChange={(e) => setRadiusInput(e.target.value)}
                    placeholder="0.1"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono"
                  />
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 [color-scheme:dark]"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 [color-scheme:dark]"
                  />
                </div>

                {/* Cloud Cover */}
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                    Max Cloud %
                  </label>
                  <input
                    type="text"
                    value={cloudCover}
                    onChange={(e) => setCloudCover(e.target.value)}
                    placeholder="30"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCoordinateSearch}
                  disabled={loading}
                  size="sm"
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                  Search
                </Button>
                <span className="text-xs text-muted-foreground">
                  Bbox: [{lonInput}−r, {latInput}−r, {lonInput}+r, {latInput}+r]
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────── Event-Based Presets ────────────────── */}
        {searchMode === "events" && (
          <div className="max-w-3xl mx-auto mb-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EVENT_PRESETS.map((evt) => (
                <button
                  key={evt.name}
                  onClick={() => handleEventSearch(evt.bbox, evt.name, evt.datetime)}
                  disabled={loading}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-all cursor-pointer",
                    "border",
                    activePreset === evt.name
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/5"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 p-1.5 rounded-md",
                      activePreset === evt.name
                        ? "bg-primary/20 text-primary"
                        : "bg-white/5 text-muted-foreground"
                    )}
                  >
                    {EVENT_ICONS[evt.icon] || <Flame className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        activePreset === evt.name ? "text-primary" : "text-foreground"
                      )}
                    >
                      {evt.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{evt.description}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                      {evt.datetime}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────── Results Area ────────────────── */}
        <div className="rounded-xl border border-card-border bg-card overflow-hidden min-h-[300px]">
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-card-border bg-white/[0.02]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              {activePreset ? (
                <span>
                  Searching <span className="text-foreground">{activePreset}</span>
                  {results && (
                    <span className="ml-1">
                      — {results.context?.returned || 0} scenes found
                      {results.context?.matched && results.context.matched > 0 && (
                        <span className="text-muted-foreground/60">
                          {" "}(of {results.context.matched} total)
                        </span>
                      )}
                    </span>
                  )}
                </span>
              ) : (
                <span>Select a location above to search</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {results && (
                <>
                  <button
                    onClick={() => setShowCodeSnippets(!showCodeSnippets)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer",
                      showCodeSnippets
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <Code2 className="h-3 w-3" />
                    <span className="hidden sm:inline">Code</span>
                  </button>
                  <button
                    onClick={() => setShowApiResponse(!showApiResponse)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer",
                      showApiResponse
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <Braces className="h-3 w-3" />
                    <span className="hidden sm:inline">API Response</span>
                  </button>
                </>
              )}
              {results?.warnings && results.warnings.length > 0 && (
                <Badge variant="warning">{results.warnings.length} warning(s)</Badge>
              )}
            </div>
          </div>

          {/* ──── Code Snippet Panel ──── */}
          {showCodeSnippets && results && (
            <CodeSnippetPanel
              codeLang={codeLang}
              setCodeLang={setCodeLang}
              getCodeSnippet={getCodeSnippet}
            />
          )}

          {/* ──── API Response Panel ──── */}
          {showApiResponse && results && (
            <ApiResponsePanel rawResponse={rawResponse} />
          )}

          {/* Content */}
          <div className="p-4">
            {!activePreset && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Satellite className="h-12 w-12 mb-4 opacity-30" />
                <p className="text-sm">Click a location to see live satellite search results</p>
                <p className="text-xs text-muted-foreground/50 mt-2">
                  Or switch to Coordinates tab to search by lat/lon
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-sm">Searching across providers...</p>
                <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono">
                  GET /api/v1/search?bbox={lastSearchParams.current?.bbox || "..."}
                </p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-destructive">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  The upstream satellite APIs may be temporarily unavailable.
                </p>
              </div>
            )}

            {results && results.features.length > 0 && !selectedScene && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.features.map((item) => (
                  <SceneCard
                    key={item.id}
                    item={item}
                    onSelect={() => setSelectedScene(item)}
                  />
                ))}
              </div>
            )}

            {/* Expanded scene detail panel */}
            {selectedScene && (
              <SceneDetail
                item={selectedScene}
                onClose={() => setSelectedScene(null)}
              />
            )}

            {results && results.features.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <p className="text-sm">No scenes found. Try a different location or date range.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Code Snippet Panel
// ─────────────────────────────────────────────
function CodeSnippetPanel({
  codeLang,
  setCodeLang,
  getCodeSnippet,
}: {
  codeLang: CodeLang;
  setCodeLang: (l: CodeLang) => void;
  getCodeSnippet: (l: CodeLang) => string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(getCodeSnippet(codeLang));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-b border-card-border bg-[#08080f] animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-1">
          {(
            [
              { key: "curl", label: "cURL", icon: <Terminal className="h-3 w-3" /> },
              { key: "python", label: "Python", icon: <FileCode className="h-3 w-3" /> },
              { key: "javascript", label: "JavaScript", icon: <Braces className="h-3 w-3" /> },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCodeLang(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-all cursor-pointer",
                codeLang === tab.key
                  ? "bg-white/[0.06] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono overflow-x-auto max-h-[200px] text-foreground/80 leading-relaxed">
        {getCodeSnippet(codeLang)}
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────
// API Response Panel
// ─────────────────────────────────────────────
function ApiResponsePanel({ rawResponse }: { rawResponse: string }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  function copy() {
    navigator.clipboard.writeText(rawResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Truncate for display
  const displayResponse = expanded
    ? rawResponse
    : rawResponse.slice(0, 2000) + (rawResponse.length > 2000 ? "\n..." : "");

  return (
    <div className="border-b border-card-border bg-[#08080f] animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Braces className="h-3 w-3" />
          Raw API Response
          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
            {(rawResponse.length / 1024).toFixed(1)} KB
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {rawResponse.length > 2000 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Expand
                </>
              )}
            </button>
          )}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-4 text-[11px] font-mono overflow-x-auto max-h-[300px] overflow-y-auto text-foreground/60 leading-relaxed">
        {displayResponse}
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────
// Scene Card
// ─────────────────────────────────────────────
function SceneCard({ item, onSelect }: { item: STACItem; onSelect: () => void }) {
  const cloudCover = item.properties["eo:cloud_cover"];
  const gsd = item.properties.gsd;
  const platform = item.properties.platform || "";

  const thumbnail =
    item.assets.thumbnail?.href ||
    item.assets.rendered_preview?.href ||
    item.assets.visual?.href;

  const bandCount = Object.keys(item.assets).filter(
    (k) => !["thumbnail", "rendered_preview", "visual", "tilejson", "info"].includes(k)
  ).length;

  return (
    <button
      onClick={onSelect}
      className="rounded-lg border border-card-border bg-white/[0.02] overflow-hidden hover:border-primary/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.08)] transition-all duration-300 text-left group cursor-pointer relative"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-accent relative overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`Satellite image — ${formatDate(item.properties.datetime)}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Satellite className="h-8 w-8 opacity-30" />
          </div>
        )}

        {/* Provider badge */}
        <Badge
          variant="default"
          className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-[10px]"
        >
          {item.properties["astra:provider"]}
        </Badge>

        {/* Expand icon on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-sm rounded-full p-2">
            <Maximize2 className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Hover tooltip */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-3 text-[10px] text-white/80">
            {platform && (
              <span className="flex items-center gap-1">
                <Satellite className="h-2.5 w-2.5" />
                {platform.replace(/-/g, " ")}
              </span>
            )}
            {bandCount > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="h-2.5 w-2.5" />
                {bandCount} bands
              </span>
            )}
            <span className="ml-auto text-primary/80">Click to explore →</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {formatDate(item.properties.datetime)}
          </span>
          {gsd && (
            <span className="text-[10px] text-muted-foreground/60">{gsd}m</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {cloudCover !== undefined && (
            <span className="flex items-center gap-1">
              <Cloud className="h-3 w-3" />
              {cloudCover.toFixed(0)}% cloud
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground/40 mt-1.5 truncate font-mono">
          {item.id}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// Scene Detail Panel
// ─────────────────────────────────────────────
function SceneDetail({ item, onClose }: { item: STACItem; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [detailCodeLang, setDetailCodeLang] = useState<CodeLang>("curl");

  const cloudCover = item.properties["eo:cloud_cover"];
  const gsd = item.properties.gsd;
  const platform = item.properties.platform || "Unknown";
  const provider = item.properties["astra:provider_name"] || item.properties["astra:provider"];
  const collection = item.collection || "";

  const thumbnail =
    item.assets.thumbnail?.href ||
    item.assets.rendered_preview?.href ||
    item.assets.visual?.href;

  // Categorize assets
  const spectralBands = Object.entries(item.assets).filter(
    ([k]) => !["thumbnail", "rendered_preview", "visual", "tilejson", "info", "scl"].includes(k)
  );

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  function getSceneCodeSnippet(lang: CodeLang): string {
    switch (lang) {
      case "curl":
        return `curl "https://astraos.cloud/api/v1/scenes/${item.id}" \\
  -H "Authorization: Bearer astra_YOUR_API_KEY"

# Get specific band as COG
curl "https://astraos.cloud/api/v1/assets?scene_id=${item.id}&bands=red,green,blue&format=cog" \\
  -H "Authorization: Bearer astra_YOUR_API_KEY"`;

      case "python":
        return `import requests

# Fetch scene metadata
scene = requests.get(
    "https://astraos.cloud/api/v1/scenes/${item.id}",
    headers={"Authorization": "Bearer astra_YOUR_API_KEY"},
).json()

# Get COG URLs for RGB bands
assets = requests.get(
    "https://astraos.cloud/api/v1/assets",
    params={"scene_id": "${item.id}", "bands": "red,green,blue", "format": "cog"},
    headers={"Authorization": "Bearer astra_YOUR_API_KEY"},
).json()

for asset in assets["assets"]:
    print(f"{asset['band']}: {asset['url']}")`;

      case "javascript":
        return `// Fetch scene metadata
const scene = await fetch(
  "https://astraos.cloud/api/v1/scenes/${item.id}",
  { headers: { Authorization: "Bearer astra_YOUR_API_KEY" } }
).then(r => r.json());

// Get COG URLs for RGB bands
const assets = await fetch(
  \`https://astraos.cloud/api/v1/assets?scene_id=${item.id}&bands=red,green,blue&format=cog\`,
  { headers: { Authorization: "Bearer astra_YOUR_API_KEY" } }
).then(r => r.json());

assets.assets.forEach(a => console.log(\`\${a.band}: \${a.url}\`));`;
      default:
        return "";
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors cursor-pointer"
      >
        ← Back to results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image */}
        <div className="rounded-lg overflow-hidden border border-card-border">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={`Satellite image — ${formatDate(item.properties.datetime)}`}
              className="w-full aspect-[4/3] object-cover"
            />
          ) : (
            <div className="w-full aspect-[4/3] bg-accent flex items-center justify-center">
              <Satellite className="h-12 w-12 text-muted-foreground opacity-30" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary">{provider}</Badge>
              {collection && (
                <Badge variant="outline" className="text-[10px]">{collection}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-muted-foreground break-all flex-1">
                {item.id}
              </code>
              <button
                onClick={() => copyText(item.id, "id")}
                className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 cursor-pointer"
              >
                {copied === "id" ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Key metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Captured</span>
              </div>
              <p className="text-sm font-medium">{formatDate(item.properties.datetime)}</p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Cloud className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Cloud Cover</span>
              </div>
              <p className="text-sm font-medium">
                {cloudCover !== undefined ? `${cloudCover.toFixed(1)}%` : "N/A"}
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Ruler className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Resolution</span>
              </div>
              <p className="text-sm font-medium">{gsd ? `${gsd}m GSD` : "N/A"}</p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Globe className="h-3 w-3" />
                <span className="text-[10px] uppercase tracking-wider">Platform</span>
              </div>
              <p className="text-sm font-medium capitalize">{platform.replace(/-/g, " ")}</p>
            </div>
          </div>

          {/* Bounding Box */}
          {item.bbox && (
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Bounding Box
                </span>
                <button
                  onClick={() => copyText(JSON.stringify(item.bbox), "bbox")}
                  className="p-1 rounded hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {copied === "bbox" ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              <code className="text-xs font-mono text-muted-foreground">
                [{item.bbox.map((b: number) => b.toFixed(4)).join(", ")}]
              </code>
            </div>
          )}

          {/* Available bands */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Available Bands ({spectralBands.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {spectralBands.map(([key, asset]) => (
                <span
                  key={key}
                  className="px-2 py-1 rounded text-[10px] font-mono bg-white/[0.04] border border-white/[0.06] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                  title={`${asset.title || key}${asset["astra:is_cog"] ? " (COG)" : ""} — ${asset.type || "GeoTIFF"}`}
                >
                  {key}
                  {asset["astra:is_cog"] && (
                    <span className="ml-1 text-primary/60">●</span>
                  )}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1.5">
              <span className="text-primary/60">●</span> = Cloud-Optimized GeoTIFF
            </p>
          </div>
        </div>
      </div>

      {/* ──── Scene-specific Code Snippets ──── */}
      <div className="mt-6 bg-[#0a0a14] border border-white/[0.06] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1">
            {(
              [
                { key: "curl", label: "cURL", icon: <Terminal className="h-3 w-3" /> },
                { key: "python", label: "Python", icon: <FileCode className="h-3 w-3" /> },
                { key: "javascript", label: "JavaScript", icon: <Braces className="h-3 w-3" /> },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setDetailCodeLang(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-all cursor-pointer",
                  detailCodeLang === tab.key
                    ? "bg-white/[0.06] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() =>
              copyText(getSceneCodeSnippet(detailCodeLang), "scene-code")
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
          >
            {copied === "scene-code" ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono overflow-x-auto text-foreground/80 leading-relaxed">
          {getSceneCodeSnippet(detailCodeLang)}
        </pre>
      </div>
    </div>
  );
}
