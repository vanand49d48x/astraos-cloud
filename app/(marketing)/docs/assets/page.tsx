"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Image, ArrowRight } from "lucide-react";

export default function AssetsDocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-4">
          Asset Resolver
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Asset Resolver API
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Resolve download URLs for specific spectral bands and output formats.
          The asset resolver handles COG routing, band selection, and format
          conversion so you always get consistent, analysis-ready data.
        </p>
      </div>

      {/* Endpoint */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          Endpoint
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="success">GET</Badge>
          <code className="text-sm font-mono text-foreground">
            /api/v1/assets
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

      {/* Parameters */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Query Parameters
        </h2>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Parameter
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Required
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  scene_id
                </td>
                <td className="px-4 py-3 font-mono text-xs">string</td>
                <td className="px-4 py-3">
                  <Badge variant="warning">Required</Badge>
                </td>
                <td className="px-4 py-3">
                  The provider-scoped scene ID (e.g.,{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    sentinel-2:S2B_MSIL2A_20250115T184929
                  </code>
                  ). See{" "}
                  <Link
                    href="/docs/scenes"
                    className="text-primary hover:underline"
                  >
                    Scene Details
                  </Link>{" "}
                  for ID format.
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  bands
                </td>
                <td className="px-4 py-3 font-mono text-xs">string</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">Optional</Badge>
                </td>
                <td className="px-4 py-3">
                  Comma-separated list of band names to include. Accepts both
                  native names (
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    B04,B08
                  </code>
                  ) and common names (
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    red,nir
                  </code>
                  ). Omit to return all available bands.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  format
                </td>
                <td className="px-4 py-3 font-mono text-xs">string</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">Optional</Badge>
                </td>
                <td className="px-4 py-3">
                  Output format. One of:{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    cog
                  </code>{" "}
                  (default),{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    geotiff
                  </code>
                  ,{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    png
                  </code>
                  ,{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    jpeg
                  </code>
                  . COG is recommended for analysis workflows.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* COG Routing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          COG Routing Logic
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          The asset resolver intelligently routes requests to the most
          efficient data source based on the scene provider and requested
          format. This is handled transparently so you always get a direct
          download URL.
        </p>
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              How it works
            </h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-foreground">Scene lookup</strong> --
                  The resolver identifies the upstream provider and original
                  asset catalog for the given scene ID.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-foreground">Band mapping</strong> --
                  Common band names (e.g.,{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    nir
                  </code>
                  ) are translated to provider-specific names (e.g., Sentinel-2{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    B08
                  </code>
                  , Landsat{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    B05
                  </code>
                  ).
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-foreground">COG preference</strong> --
                  If the provider already serves COGs (e.g., Planetary Computer),
                  the resolver returns the direct URL. If the source format is
                  not COG, it routes through the ASTRA conversion pipeline.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-foreground">Signed URLs</strong> --
                  All returned URLs are pre-signed with a 1-hour expiry. No
                  additional authentication is needed to download the assets.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Example Request
        </h2>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">cURL</h3>
          <CodeBlock
            code={`curl "https://astraos.cloud/api/v1/assets?\\
  scene_id=sentinel-2:S2B_MSIL2A_20250115T184929&\\
  bands=red,nir&\\
  format=cog" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"`}
            language="bash"
            filename="terminal"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Python</h3>
          <CodeBlock
            code={`import requests

response = requests.get(
    "https://astraos.cloud/api/v1/assets",
    params={
        "scene_id": "sentinel-2:S2B_MSIL2A_20250115T184929",
        "bands": "red,nir",
        "format": "cog",
    },
    headers={"Authorization": "Bearer astra_sk_live_your_key_here"},
)

assets = response.json()
for band_name, asset in assets["assets"].items():
    print(f"{band_name}: {asset['href']}")

# Download the red band COG
import urllib.request
red_url = assets["assets"]["B04"]["href"]
urllib.request.urlretrieve(red_url, "red_band.tif")`}
            language="python"
            filename="assets_example.py"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">JavaScript</h3>
          <CodeBlock
            code={`const params = new URLSearchParams({
  scene_id: "sentinel-2:S2B_MSIL2A_20250115T184929",
  bands: "red,nir",
  format: "cog",
});

const res = await fetch(\`https://astraos.cloud/api/v1/assets?\${params}\`, {
  headers: { Authorization: "Bearer astra_sk_live_your_key_here" },
});

const data = await res.json();
Object.entries(data.assets).forEach(([band, asset]) => {
  console.log(\`\${band}: \${asset.href}\`);
});`}
            language="javascript"
            filename="assets_example.js"
          />
        </div>
      </section>

      {/* Response Format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Response Format
        </h2>
        <CodeBlock
          code={`{
  "scene_id": "sentinel-2:S2B_MSIL2A_20250115T184929",
  "format": "cog",
  "assets": {
    "B04": {
      "href": "https://storage.astraos.cloud/assets/abc123/B04.tif?sig=...",
      "type": "image/tiff; application=geotiff; profile=cloud-optimized",
      "title": "Red (B04) - 10m",
      "file:size": 52428800,
      "eo:bands": [{ "name": "B04", "common_name": "red", "center_wavelength": 0.665 }],
      "expires_at": "2025-01-15T20:00:00Z"
    },
    "B08": {
      "href": "https://storage.astraos.cloud/assets/abc123/B08.tif?sig=...",
      "type": "image/tiff; application=geotiff; profile=cloud-optimized",
      "title": "NIR (B08) - 10m",
      "file:size": 52428800,
      "eo:bands": [{ "name": "B08", "common_name": "nir", "center_wavelength": 0.842 }],
      "expires_at": "2025-01-15T20:00:00Z"
    }
  },
  "metadata": {
    "crs": "EPSG:32610",
    "resolution": 10,
    "source_provider": "copernicus",
    "routing": "direct"
  }
}`}
          language="json"
          filename="response.json"
          showLineNumbers
        />
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Field
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  assets[].href
                </td>
                <td className="px-4 py-3">
                  Pre-signed download URL. Valid for 1 hour. No additional auth
                  required.
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  assets[].file:size
                </td>
                <td className="px-4 py-3">
                  File size in bytes for the resolved asset.
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  assets[].expires_at
                </td>
                <td className="px-4 py-3">
                  ISO 8601 timestamp when the signed URL expires.
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  metadata.routing
                </td>
                <td className="px-4 py-3">
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    direct
                  </code>{" "}
                  if the provider natively serves COGs;{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    converted
                  </code>{" "}
                  if ASTRA ran a format conversion.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  metadata.resolution
                </td>
                <td className="px-4 py-3">
                  Ground sample distance in meters for the resolved bands.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Band Name Mapping */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Common Band Names
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You can use either provider-native band names or STAC common names.
          The resolver maps common names to the correct provider band
          automatically.
        </p>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Common Name
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Sentinel-2
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Landsat 8/9
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs">blue</td>
                <td className="px-4 py-3 font-mono text-xs">B02</td>
                <td className="px-4 py-3 font-mono text-xs">B02</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs">green</td>
                <td className="px-4 py-3 font-mono text-xs">B03</td>
                <td className="px-4 py-3 font-mono text-xs">B03</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs">red</td>
                <td className="px-4 py-3 font-mono text-xs">B04</td>
                <td className="px-4 py-3 font-mono text-xs">B04</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs">nir</td>
                <td className="px-4 py-3 font-mono text-xs">B08</td>
                <td className="px-4 py-3 font-mono text-xs">B05</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs">swir16</td>
                <td className="px-4 py-3 font-mono text-xs">B11</td>
                <td className="px-4 py-3 font-mono text-xs">B06</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">swir22</td>
                <td className="px-4 py-3 font-mono text-xs">B12</td>
                <td className="px-4 py-3 font-mono text-xs">B07</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-white/[0.06] flex justify-between items-center">
        <Link
          href="/docs/scenes"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Scene Details
        </Link>
        <Link
          href="/docs/processing"
          className="text-sm text-primary hover:underline"
        >
          Processing &rarr;
        </Link>
      </div>
    </div>
  );
}
