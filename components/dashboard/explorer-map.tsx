"use client";

import { useEffect, useRef, useState } from "react";
import { Layers, Loader2, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ExplorerMapProps {
  bbox: string;
  loading: boolean;
  sceneBboxes?: number[][];
  selectedSceneBbox?: number[] | null;
  onBboxChange?: (bbox: string) => void;
}

export default function ExplorerMap({
  bbox,
  loading,
  sceneBboxes = [],
  selectedSceneBbox,
}: ExplorerMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bboxLayerRef = useRef<L.Rectangle | null>(null);
  const scenesLayerRef = useRef<L.LayerGroup | null>(null);
  const selectedLayerRef = useRef<L.Rectangle | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37.76, -122.44],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark satellite tile layer (Esri World Imagery — free)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 18,
      }
    ).addTo(map);

    // Add zoom control to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Add attribution at bottom
    L.control
      .attribution({ position: "bottomright" })
      .addAttribution("Esri, Maxar, Earthstar Geographics")
      .addTo(map);

    // Layer group for scene footprints
    const scenesLayer = L.layerGroup().addTo(map);
    scenesLayerRef.current = scenesLayer;

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

    // Remove old bbox
    if (bboxLayerRef.current) {
      bboxLayerRef.current.remove();
      bboxLayerRef.current = null;
    }

    if (!bbox) return;

    const parts = bbox.split(",").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return;

    const [west, south, east, north] = parts;
    const bounds: L.LatLngBoundsExpression = [
      [south, west],
      [north, east],
    ];

    const rect = L.rectangle(bounds, {
      color: "#00d4ff",
      weight: 2,
      fillColor: "#00d4ff",
      fillOpacity: 0.1,
      dashArray: "6 4",
    }).addTo(mapRef.current);

    bboxLayerRef.current = rect;
    mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [bbox, mapReady]);

  // Update scene footprints
  useEffect(() => {
    if (!scenesLayerRef.current || !mapReady) return;

    scenesLayerRef.current.clearLayers();

    sceneBboxes.forEach((sBbox) => {
      if (sBbox.length !== 4) return;
      const [west, south, east, north] = sBbox;
      L.rectangle(
        [
          [south, west],
          [north, east],
        ],
        {
          color: "#8b5cf6",
          weight: 1,
          fillColor: "#8b5cf6",
          fillOpacity: 0.06,
        }
      ).addTo(scenesLayerRef.current!);
    });
  }, [sceneBboxes, mapReady]);

  // Highlight selected scene
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if (selectedLayerRef.current) {
      selectedLayerRef.current.remove();
      selectedLayerRef.current = null;
    }

    if (!selectedSceneBbox || selectedSceneBbox.length !== 4) return;

    const [west, south, east, north] = selectedSceneBbox;
    const bounds: L.LatLngBoundsExpression = [
      [south, west],
      [north, east],
    ];

    const rect = L.rectangle(bounds, {
      color: "#22c55e",
      weight: 2,
      fillColor: "#22c55e",
      fillOpacity: 0.15,
    }).addTo(mapRef.current);

    selectedLayerRef.current = rect;
    mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
  }, [selectedSceneBbox, mapReady]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Layer label */}
      <div className="absolute bottom-3 left-3 z-[1000]">
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur border border-white/10 rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          <Layers className="w-3 h-3" />
          Satellite View
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[1000]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
    </div>
  );
}
