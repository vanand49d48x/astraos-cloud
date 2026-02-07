"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Layers } from "lucide-react";

export default function ScenesDocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-4">
          Scene Details
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Scene Details API
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Retrieve complete STAC metadata for a single satellite scene by its
          provider-scoped ID. Use this endpoint to get full property details,
          geometry, and asset download links for a known scene.
        </p>
      </div>

      {/* Endpoint */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Endpoint
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="success">GET</Badge>
          <code className="text-sm font-mono text-foreground">
            /api/v1/scenes/{"{id}"}
          </code>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Requires{" "}
          <Link
            href="/docs/authentication"
            className="text-primary hover:underline"
          >
            authentication
          </Link>{" "}
          via Bearer token.
        </p>
      </section>

      {/* ID Format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Scene ID Format
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Scene IDs in ASTRA OS use a provider-scoped format to ensure
          uniqueness across data sources:
        </p>
        <CodeBlock
          code={`provider:original_id`}
          language="text"
          filename="ID Format"
        />
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Provider
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Example ID
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">Sentinel-2 (Copernicus)</td>
                <td className="px-4 py-3 font-mono text-xs">
                  sentinel-2:S2B_MSIL2A_20250115T184929_N0511_R070_T10SEG_20250115T213616
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">Landsat (USGS)</td>
                <td className="px-4 py-3 font-mono text-xs">
                  landsat:LC09_L2SP_044034_20250110_20250112_02_T1
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">Planetary Computer</td>
                <td className="px-4 py-3 font-mono text-xs">
                  planetary-computer:S2B_MSIL2A_20250115T184929_R070_T10SEG
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          The{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            id
          </code>{" "}
          field returned in{" "}
          <Link
            href="/docs/search"
            className="text-primary hover:underline"
          >
            search results
          </Link>{" "}
          is already in this format and can be passed directly to this endpoint.
        </p>
      </section>

      {/* Example Request */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Example Request
        </h2>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">cURL</h3>
          <CodeBlock
            code={`curl "https://astraos.cloud/api/v1/scenes/sentinel-2:S2B_MSIL2A_20250115T184929" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"`}
            language="bash"
            filename="terminal"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Python</h3>
          <CodeBlock
            code={`import requests

scene_id = "sentinel-2:S2B_MSIL2A_20250115T184929"
response = requests.get(
    f"https://astraos.cloud/api/v1/scenes/{scene_id}",
    headers={"Authorization": "Bearer astra_sk_live_your_key_here"},
)

scene = response.json()
print(f"Platform: {scene['properties']['platform']}")
print(f"Cloud cover: {scene['properties']['eo:cloud_cover']}%")
print(f"Available bands: {list(scene['assets'].keys())}")`}
            language="python"
            filename="scene_detail.py"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">JavaScript</h3>
          <CodeBlock
            code={`const sceneId = "sentinel-2:S2B_MSIL2A_20250115T184929";

const res = await fetch(
  \`https://astraos.cloud/api/v1/scenes/\${sceneId}\`,
  {
    headers: { Authorization: "Bearer astra_sk_live_your_key_here" },
  }
);

const scene = await res.json();
console.log("Platform:", scene.properties.platform);
console.log("Cloud cover:", scene.properties["eo:cloud_cover"] + "%");
console.log("Available bands:", Object.keys(scene.assets));`}
            language="javascript"
            filename="scene_detail.js"
          />
        </div>
      </section>

      {/* Response Format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Response: STAC Item
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          The response is a single STAC Item conforming to the STAC 1.0.0
          specification. It includes complete geometry, all available properties,
          and direct asset download URLs.
        </p>
        <CodeBlock
          code={`{
  "type": "Feature",
  "stac_version": "1.0.0",
  "stac_extensions": [
    "https://stac-extensions.github.io/eo/v1.1.0/schema.json",
    "https://stac-extensions.github.io/projection/v1.1.0/schema.json",
    "https://stac-extensions.github.io/view/v1.0.0/schema.json"
  ],
  "id": "sentinel-2:S2B_MSIL2A_20250115T184929",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[-122.52,37.48],[-121.98,37.48],[-121.98,38.02],[-122.52,38.02],[-122.52,37.48]]]
  },
  "bbox": [-122.52, 37.48, -121.98, 38.02],
  "properties": {
    "datetime": "2025-01-15T18:49:29Z",
    "created": "2025-01-15T22:00:00Z",
    "updated": "2025-01-15T22:00:00Z",
    "eo:cloud_cover": 8.2,
    "platform": "sentinel-2b",
    "constellation": "sentinel-2",
    "instruments": ["msi"],
    "gsd": 10,
    "proj:epsg": 32610,
    "view:sun_azimuth": 162.3,
    "view:sun_elevation": 28.1,
    "astra:provider": "copernicus",
    "astra:collection": "sentinel-2-l2a"
  },
  "assets": {
    "B02": {
      "href": "https://storage.astraos.cloud/scenes/.../B02.tif",
      "type": "image/tiff; application=geotiff; profile=cloud-optimized",
      "title": "Blue (B02) - 10m",
      "eo:bands": [{ "name": "B02", "common_name": "blue", "center_wavelength": 0.49 }]
    },
    "B03": {
      "href": "https://storage.astraos.cloud/scenes/.../B03.tif",
      "type": "image/tiff; application=geotiff; profile=cloud-optimized",
      "title": "Green (B03) - 10m",
      "eo:bands": [{ "name": "B03", "common_name": "green", "center_wavelength": 0.56 }]
    },
    "B04": {
      "href": "https://storage.astraos.cloud/scenes/.../B04.tif",
      "type": "image/tiff; application=geotiff; profile=cloud-optimized",
      "title": "Red (B04) - 10m",
      "eo:bands": [{ "name": "B04", "common_name": "red", "center_wavelength": 0.665 }]
    },
    "B08": {
      "href": "https://storage.astraos.cloud/scenes/.../B08.tif",
      "type": "image/tiff; application=geotiff; profile=cloud-optimized",
      "title": "NIR (B08) - 10m",
      "eo:bands": [{ "name": "B08", "common_name": "nir", "center_wavelength": 0.842 }]
    },
    "visual": {
      "href": "https://storage.astraos.cloud/scenes/.../visual.tif",
      "type": "image/tiff; application=geotiff; profile=cloud-optimized",
      "title": "True Color Composite (RGB)"
    },
    "thumbnail": {
      "href": "https://storage.astraos.cloud/scenes/.../thumbnail.png",
      "type": "image/png",
      "title": "Thumbnail"
    }
  },
  "links": [
    { "rel": "self", "href": "https://astraos.cloud/api/v1/scenes/sentinel-2:S2B_MSIL2A_20250115T184929" },
    { "rel": "parent", "href": "https://astraos.cloud/api/v1/search" },
    { "rel": "root", "href": "https://astraos.cloud/api/v1" }
  ]
}`}
          language="json"
          filename="stac_item.json"
          showLineNumbers
        />
      </section>

      {/* Error handling */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Error Responses
        </h2>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Code
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="warning">404</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">SCENE_NOT_FOUND</td>
                <td className="px-4 py-3">
                  No scene with the given ID exists. Verify the ID format and
                  that the scene has not been archived.
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="destructive">400</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">INVALID_ID_FORMAT</td>
                <td className="px-4 py-3">
                  The ID does not match the expected{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    provider:original_id
                  </code>{" "}
                  format.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <Badge variant="destructive">401</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">UNAUTHORIZED</td>
                <td className="px-4 py-3">
                  Missing or invalid API key. See{" "}
                  <Link
                    href="/docs/authentication"
                    className="text-primary hover:underline"
                  >
                    Authentication
                  </Link>
                  .
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-white/[0.06] flex justify-between items-center">
        <Link
          href="/docs/search"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Unified Search
        </Link>
        <Link
          href="/docs/assets"
          className="text-sm text-primary hover:underline"
        >
          Asset Resolver &rarr;
        </Link>
      </div>
    </div>
  );
}
