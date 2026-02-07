"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Search, AlertTriangle } from "lucide-react";

export default function SearchDocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-4">
          Unified Search
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Unified Search API
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Search across all connected satellite data providers in a single
          request. The search endpoint returns a STAC-compliant
          FeatureCollection with scenes from Sentinel-2, Landsat, and
          Planetary Computer.
        </p>
      </div>

      {/* Endpoint */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Endpoint
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="success">GET</Badge>
          <code className="text-sm font-mono text-foreground">
            /api/v1/search
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
          via Bearer token. Queries are dispatched to all active providers in
          parallel with a configurable timeout.
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
                  bbox
                </td>
                <td className="px-4 py-3 font-mono text-xs">string</td>
                <td className="px-4 py-3">
                  <Badge variant="warning">Required</Badge>
                </td>
                <td className="px-4 py-3">
                  Bounding box as four comma-separated coordinates:{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    west,south,east,north
                  </code>{" "}
                  in WGS84 (EPSG:4326). Example:{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    -122.5,37.5,-122.0,38.0
                  </code>
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  datetime
                </td>
                <td className="px-4 py-3 font-mono text-xs">string</td>
                <td className="px-4 py-3">
                  <Badge variant="warning">Required</Badge>
                </td>
                <td className="px-4 py-3">
                  ISO 8601 date or date range. Single date:{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    2025-01-15
                  </code>
                  . Range:{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    2025-01-01/2025-02-01
                  </code>
                  . Open range:{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    2025-01-01/..
                  </code>
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  collections
                </td>
                <td className="px-4 py-3 font-mono text-xs">string</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">Optional</Badge>
                </td>
                <td className="px-4 py-3">
                  Comma-separated collection IDs to filter providers. See{" "}
                  <Link
                    href="/docs/data-sources"
                    className="text-primary hover:underline"
                  >
                    Data Sources
                  </Link>{" "}
                  for valid IDs. Example:{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    sentinel-2-l2a,landsat-c2-l2
                  </code>
                  . Omit to search all collections.
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  cloud_cover_lt
                </td>
                <td className="px-4 py-3 font-mono text-xs">number</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">Optional</Badge>
                </td>
                <td className="px-4 py-3">
                  Maximum cloud cover percentage (0-100). Only returns scenes
                  with{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    eo:cloud_cover
                  </code>{" "}
                  below this value. Default: no filter.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  limit
                </td>
                <td className="px-4 py-3 font-mono text-xs">number</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">Optional</Badge>
                </td>
                <td className="px-4 py-3">
                  Maximum number of results to return. Range: 1-100. Default:
                  10. Results are sorted by datetime descending (most recent
                  first).
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Example Request */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Example Request
        </h2>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">cURL</h3>
          <CodeBlock
            code={`curl "https://astraos.cloud/api/v1/search?\\
  bbox=-122.5,37.5,-122.0,38.0&\\
  datetime=2025-01-01/2025-02-01&\\
  collections=sentinel-2-l2a&\\
  cloud_cover_lt=15&\\
  limit=3" \\
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
    "https://astraos.cloud/api/v1/search",
    params={
        "bbox": "-122.5,37.5,-122.0,38.0",
        "datetime": "2025-01-01/2025-02-01",
        "collections": "sentinel-2-l2a",
        "cloud_cover_lt": 15,
        "limit": 3,
    },
    headers={"Authorization": "Bearer astra_sk_live_your_key_here"},
)

data = response.json()
for scene in data["features"]:
    props = scene["properties"]
    print(f"{scene['id']}  cloud={props['eo:cloud_cover']}%  {props['datetime']}")`}
            language="python"
            filename="search_example.py"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">JavaScript</h3>
          <CodeBlock
            code={`const params = new URLSearchParams({
  bbox: "-122.5,37.5,-122.0,38.0",
  datetime: "2025-01-01/2025-02-01",
  collections: "sentinel-2-l2a",
  cloud_cover_lt: "15",
  limit: "3",
});

const res = await fetch(\`https://astraos.cloud/api/v1/search?\${params}\`, {
  headers: { Authorization: "Bearer astra_sk_live_your_key_here" },
});

const data = await res.json();
data.features.forEach((scene) => {
  const { datetime, "eo:cloud_cover": cloud } = scene.properties;
  console.log(\`\${scene.id}  cloud=\${cloud}%  \${datetime}\`);
});`}
            language="javascript"
            filename="search_example.js"
          />
        </div>
      </section>

      {/* Response Format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Response Format
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          The response is a STAC-compliant{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            FeatureCollection
          </code>{" "}
          containing an array of STAC Items, a context object, and a warnings
          array.
        </p>
        <CodeBlock
          code={`{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "stac_version": "1.0.0",
      "id": "sentinel-2:S2B_MSIL2A_20250115T184929",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-122.5,37.5],[-122.0,37.5],[-122.0,38.0],[-122.5,38.0],[-122.5,37.5]]]
      },
      "bbox": [-122.5, 37.5, -122.0, 38.0],
      "properties": {
        "datetime": "2025-01-15T18:49:29Z",
        "eo:cloud_cover": 8.2,
        "platform": "sentinel-2b",
        "constellation": "sentinel-2",
        "gsd": 10,
        "proj:epsg": 32610,
        "astra:provider": "copernicus",
        "astra:collection": "sentinel-2-l2a"
      },
      "assets": {
        "B02": { "href": "https://...", "type": "image/tiff; application=geotiff; profile=cloud-optimized", "eo:bands": [{"name": "B02", "common_name": "blue"}] },
        "B03": { "href": "https://...", "type": "image/tiff; application=geotiff; profile=cloud-optimized", "eo:bands": [{"name": "B03", "common_name": "green"}] },
        "B04": { "href": "https://...", "type": "image/tiff; application=geotiff; profile=cloud-optimized", "eo:bands": [{"name": "B04", "common_name": "red"}] },
        "B08": { "href": "https://...", "type": "image/tiff; application=geotiff; profile=cloud-optimized", "eo:bands": [{"name": "B08", "common_name": "nir"}] },
        "visual": { "href": "https://...", "type": "image/tiff; application=geotiff; profile=cloud-optimized" }
      },
      "links": [
        { "rel": "self", "href": "https://astraos.cloud/api/v1/scenes/sentinel-2:S2B_MSIL2A_20250115T184929" }
      ]
    }
  ],
  "context": {
    "matched": 12,
    "returned": 3,
    "limit": 3
  },
  "warnings": []
}`}
          language="json"
          filename="response.json"
          showLineNumbers
        />
      </section>

      {/* Context Object */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Context Object
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          The{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            context
          </code>{" "}
          field provides pagination metadata:
        </p>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Field
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Type
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  matched
                </td>
                <td className="px-4 py-3 font-mono text-xs">number</td>
                <td className="px-4 py-3">
                  Total number of scenes matching the query across all providers
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  returned
                </td>
                <td className="px-4 py-3 font-mono text-xs">number</td>
                <td className="px-4 py-3">
                  Number of scenes returned in this response (may be less than
                  limit)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  limit
                </td>
                <td className="px-4 py-3 font-mono text-xs">number</td>
                <td className="px-4 py-3">
                  The limit value used for this request
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Warnings */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Warnings Array
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          The{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            warnings
          </code>{" "}
          array contains non-fatal issues that occurred during the search.
          These do not prevent results from being returned, but may mean that
          some provider data is incomplete.
        </p>
        <CodeBlock
          code={`{
  "warnings": [
    {
      "provider": "planetary-computer",
      "code": "PROVIDER_TIMEOUT",
      "message": "Planetary Computer did not respond within 8s. Results may be incomplete."
    },
    {
      "provider": "copernicus",
      "code": "PARTIAL_RESULTS",
      "message": "Copernicus returned a partial result set. Retry for complete coverage."
    }
  ]
}`}
          language="json"
          filename="warnings_example.json"
        />
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
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
                <td className="px-4 py-3 font-mono text-xs text-warning">
                  PROVIDER_TIMEOUT
                </td>
                <td className="px-4 py-3">
                  An upstream provider did not respond within the timeout
                  window. Results from that provider may be missing.
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-warning">
                  PARTIAL_RESULTS
                </td>
                <td className="px-4 py-3">
                  A provider returned fewer results than expected. Pagination or
                  retry may yield additional data.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-warning">
                  PROVIDER_ERROR
                </td>
                <td className="px-4 py-3">
                  A provider returned an error. The error is isolated and does
                  not affect results from other providers.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-white/[0.06] flex justify-between items-center">
        <Link
          href="/docs/authentication"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Authentication
        </Link>
        <Link
          href="/docs/scenes"
          className="text-sm text-primary hover:underline"
        >
          Scene Details &rarr;
        </Link>
      </div>
    </div>
  );
}
