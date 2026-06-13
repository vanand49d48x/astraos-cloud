"use client";

import { useEffect, useRef, useState } from "react";
import { Layers, Loader2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface STACItem {
  id: string;
  bbox?: number[];
  assets?: Record<string, { href: string; type?: string; title?: string }>;
  properties: {
    datetime: string;
    "eo:cloud_cover"?: number;
    platform?: string;
    "astra:provider_name"?: string;
    [key: string]: unknown;
  };
}

interface ExplorerMapProps {
  bbox: string;
  loading: boolean;
  scenes?: STACItem[];
  selectedScene?: STACItem | null;
  onSceneClick?: (scene: STACItem) => void;
}

// Extract the best available thumbnail URL from a STAC item
function getThumbnail(scene: STACItem): string | null {
  const assets = scene.assets ?? {};
  const candidates = ["rendered_preview", "thumbnail", "overview", "visual"];
  for (const key of candidates) {
    if (assets[key]?.href) return assets[key].href;
  }
  return null;
}

export default function ExplorerMap({
  bbox,
  loading,
  scenes = [],
  selectedScene,
  onSceneClick,
}: ExplorerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bboxLayerRef = useRef<L.Rectangle | null>(null);
  const scenesLayerRef = useRef<L.LayerGroup | null>(null);
  const thumbnailsLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedLayerRef = useRef<L.Rectangle | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [thumbsVisible, setThumbsVisible] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37.76, -122.44],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 18 }
    ).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control
      .attribution({ position: "bottomright" })
      .addAttribution("Esri, Maxar, Earthstar Geographics")
      .addTo(map);

    const scenesLayer = L.layerGroup().addTo(map);
    const thumbnailsLayer = L.layerGroup().addTo(map);
    scenesLayerRef.current = scenesLayer;
    thumbnailsLayerRef.current = thumbnailsLayer;
    mapRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Update search bbox rectangle
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (bboxLayerRef.current) { bboxLayerRef.current.remove(); bboxLayerRef.current = null; }
    if (!bbox) return;

    const parts = bbox.split(",").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return;
    const [west, south, east, north] = parts;
    const bounds: L.LatLngBoundsExpression = [[south, west], [north, east]];

    bboxLayerRef.current = L.rectangle(bounds, {
      color: "#00d4ff", weight: 2,
      fillColor: "#00d4ff", fillOpacity: 0.08, dashArray: "6 4",
    }).addTo(mapRef.current);

    mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [bbox, mapReady]);

  // Render scene footprints + thumbnail overlays
  useEffect(() => {
    if (!scenesLayerRef.current || !thumbnailsLayerRef.current || !mapReady) return;

    scenesLayerRef.current.clearLayers();
    thumbnailsLayerRef.current.clearLayers();

    scenes.forEach((scene) => {
      if (!scene.bbox || scene.bbox.length !== 4) return;
      const [west, south, east, north] = scene.bbox;
      const bounds: L.LatLngBoundsExpression = [[south, west], [north, east]];

      // Footprint outline
      const footprint = L.rectangle(bounds, {
        color: "#8b5cf6", weight: 1.5,
        fillColor: "#8b5cf6", fillOpacity: 0.04,
        className: "scene-footprint",
      });

      footprint.on("click", () => onSceneClick?.(scene));
      footprint.bindTooltip(
        `<div style="font-size:11px;line-height:1.4">
          <b>${scene.properties["astra:provider_name"] ?? "Scene"}</b><br/>
          ${new Date(scene.properties.datetime).toLocaleDateString()}<br/>
          ☁ ${Math.round(scene.properties["eo:cloud_cover"] ?? 0)}% cloud
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      footprint.addTo(scenesLayerRef.current!);

      // Thumbnail image overlay
      if (thumbsVisible) {
        const thumbUrl = getThumbnail(scene);
        if (thumbUrl) {
          const overlay = L.imageOverlay(thumbUrl, bounds, {
            opacity: 0.85,
            interactive: true,
            className: "scene-thumbnail",
          });
          overlay.on("click", () => onSceneClick?.(scene));
          overlay.addTo(thumbnailsLayerRef.current!);
        }
      }
    });
  }, [scenes, mapReady, thumbsVisible, onSceneClick]);

  // Highlight selected scene
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (selectedLayerRef.current) { selectedLayerRef.current.remove(); selectedLayerRef.current = null; }
    if (!selectedScene?.bbox || selectedScene.bbox.length !== 4) return;

    const [west, south, east, north] = selectedScene.bbox;
    const bounds: L.LatLngBoundsExpression = [[south, west], [north, east]];

    selectedLayerRef.current = L.rectangle(bounds, {
      color: "#22c55e", weight: 2.5,
      fillColor: "#22c55e", fillOpacity: 0.12,
    }).addTo(mapRef.current);

    mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  }, [selectedScene, mapReady]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Controls bottom-left */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2">
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur border border-white/10 rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          <Layers className="w-3 h-3" />
          Satellite View
        </div>

        {scenes.length > 0 && (
          <button
            onClick={() => setThumbsVisible((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all backdrop-blur ${
              thumbsVisible
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-card/80 border-white/10 text-muted-foreground"
            }`}
          >
            {thumbsVisible ? "📡 Thumbnails on" : "🗺 Thumbnails off"}
          </button>
        )}
      </div>

      {/* Scene count badge */}
      {scenes.length > 0 && (
        <div className="absolute top-3 left-3 z-[1000]">
          <div className="bg-card/90 backdrop-blur border border-white/10 rounded-lg px-2.5 py-1 text-xs font-medium text-foreground">
            {scenes.length} scenes
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[1000]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
    </div>
  );
}
