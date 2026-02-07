"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import {
  ArrowRight,
  Rocket,
  Key,
  Search,
  FileJson,
  Layers,
} from "lucide-react";

export default function DocsGettingStartedPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-4">
          Getting Started
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          ASTRA OS Documentation
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          ASTRA OS is a unified API for satellite earth observation data.
          Search, access, and process imagery from Sentinel-2, Landsat, and
          Planetary Computer through a single REST endpoint. All responses
          follow the STAC specification and imagery is delivered as
          Cloud-Optimized GeoTIFFs.
        </p>
      </div>

      {/* Quick overview */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Quick Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Unified Search",
              description:
                "Query Sentinel-2, Landsat 8/9, and Planetary Computer in a single API call.",
              href: "/docs/search",
            },
            {
              title: "Scene Details",
              description:
                "Retrieve complete STAC metadata for any scene by its provider-scoped ID.",
              href: "/docs/scenes",
            },
            {
              title: "Asset Resolver",
              description:
                "Get download URLs for specific bands and formats, with automatic COG routing.",
              href: "/docs/assets",
            },
            {
              title: "Processing",
              description:
                "Run NDVI, change detection, and other analytics on imagery via async jobs.",
              href: "/docs/processing",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-5 rounded-xl border border-white/[0.06] bg-card hover:border-primary/30 hover:bg-primary/[0.03] transition-all group"
            >
              <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Step 1: Sign up */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold">
            1
          </span>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Sign Up and Get an API Key
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Create an account at{" "}
          <Link href="/dashboard" className="text-primary hover:underline">
            astraos.cloud/dashboard
          </Link>{" "}
          and navigate to the <strong>API Keys</strong> section. Click{" "}
          <strong>Create Key</strong> to generate your first key. All keys
          follow the format:
        </p>
        <CodeBlock
          code={`astra_sk_live_abc123def456...`}
          language="text"
          filename="API Key Format"
        />
        <p className="text-sm text-muted-foreground">
          Your key starts with <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">astra_</code> and
          grants access to all API endpoints. Keep it secret. See the{" "}
          <Link
            href="/docs/authentication"
            className="text-primary hover:underline"
          >
            Authentication
          </Link>{" "}
          page for rate limits and key management details.
        </p>
      </section>

      {/* Step 2: Make first request */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold">
            2
          </span>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Make Your First Search Request
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          The search endpoint queries all connected satellite data sources at
          once. Pass a bounding box and date range to find available scenes.
        </p>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">cURL</h3>
          <CodeBlock
            code={`curl "https://astraos.cloud/api/v1/search?bbox=-122.5,37.5,-122.0,38.0&datetime=2025-01-01/2025-02-01&cloud_cover_lt=20&limit=5" \\
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
        "cloud_cover_lt": 20,
        "limit": 5,
    },
    headers={
        "Authorization": "Bearer astra_sk_live_your_key_here"
    },
)

data = response.json()
print(f"Found {data['context']['matched']} scenes")
for feature in data["features"]:
    print(f"  {feature['id']} — {feature['properties']['datetime']}")`}
            language="python"
            filename="search.py"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">JavaScript</h3>
          <CodeBlock
            code={`const params = new URLSearchParams({
  bbox: "-122.5,37.5,-122.0,38.0",
  datetime: "2025-01-01/2025-02-01",
  cloud_cover_lt: "20",
  limit: "5",
});

const response = await fetch(
  \`https://astraos.cloud/api/v1/search?\${params}\`,
  {
    headers: {
      Authorization: "Bearer astra_sk_live_your_key_here",
    },
  }
);

const data = await response.json();
console.log(\`Found \${data.context.matched} scenes\`);
data.features.forEach((f) => {
  console.log(\`  \${f.id} — \${f.properties.datetime}\`);
});`}
            language="javascript"
            filename="search.js"
          />
        </div>
      </section>

      {/* Step 3: Understand the response */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold">
            3
          </span>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            Understand the Response
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          All search results are returned as a STAC-compliant{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            FeatureCollection
          </code>
          . Each feature represents a satellite scene with full metadata,
          geometry, and asset links.
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
      "properties": {
        "datetime": "2025-01-15T18:49:29Z",
        "eo:cloud_cover": 12.4,
        "platform": "sentinel-2b",
        "constellation": "sentinel-2",
        "gsd": 10,
        "astra:provider": "copernicus",
        "astra:collection": "sentinel-2-l2a"
      },
      "assets": {
        "B04": { "href": "https://...", "type": "image/tiff; application=geotiff; profile=cloud-optimized" },
        "B08": { "href": "https://...", "type": "image/tiff; application=geotiff; profile=cloud-optimized" },
        "visual": { "href": "https://...", "type": "image/tiff; application=geotiff; profile=cloud-optimized" }
      },
      "links": [
        { "rel": "self", "href": "https://astraos.cloud/api/v1/scenes/sentinel-2:S2B_MSIL2A_20250115T184929" }
      ]
    }
  ],
  "context": {
    "matched": 23,
    "returned": 5,
    "limit": 5
  },
  "warnings": []
}`}
          language="json"
          filename="response.json"
          showLineNumbers
        />
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Key Response Fields
          </h3>
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
                    features[]
                  </td>
                  <td className="px-4 py-3">
                    Array of STAC Items, one per matched satellite scene
                  </td>
                </tr>
                <tr className="border-b border-white/[0.06]">
                  <td className="px-4 py-3 font-mono text-xs text-primary/80">
                    features[].id
                  </td>
                  <td className="px-4 py-3">
                    Provider-scoped ID in the format{" "}
                    <code className="bg-white/[0.06] px-1 rounded">
                      provider:original_id
                    </code>
                  </td>
                </tr>
                <tr className="border-b border-white/[0.06]">
                  <td className="px-4 py-3 font-mono text-xs text-primary/80">
                    features[].properties
                  </td>
                  <td className="px-4 py-3">
                    Metadata including datetime, cloud cover, GSD, and ASTRA
                    provider info
                  </td>
                </tr>
                <tr className="border-b border-white/[0.06]">
                  <td className="px-4 py-3 font-mono text-xs text-primary/80">
                    features[].assets
                  </td>
                  <td className="px-4 py-3">
                    Direct download URLs for individual bands and composites
                  </td>
                </tr>
                <tr className="border-b border-white/[0.06]">
                  <td className="px-4 py-3 font-mono text-xs text-primary/80">
                    context
                  </td>
                  <td className="px-4 py-3">
                    Pagination info: total matched, returned count, and limit
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-primary/80">
                    warnings
                  </td>
                  <td className="px-4 py-3">
                    Array of non-fatal issues (e.g., a provider timeout)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Next steps */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-bold">
            4
          </span>
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Next Steps
          </h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          You have the basics down. Explore the rest of the API to build your
          integration.
        </p>
        <div className="space-y-2">
          {[
            {
              title: "Authentication",
              description: "API key formats, rate limits, and key management",
              href: "/docs/authentication",
            },
            {
              title: "Unified Search",
              description:
                "Full reference for query parameters and response format",
              href: "/docs/search",
            },
            {
              title: "Scene Details",
              description: "Fetch complete metadata for a specific scene",
              href: "/docs/scenes",
            },
            {
              title: "Asset Resolver",
              description:
                "Download individual bands in COG format with band selection",
              href: "/docs/assets",
            },
            {
              title: "Processing",
              description:
                "NDVI computation, change detection, and async job management",
              href: "/docs/processing",
            },
            {
              title: "Data Sources",
              description:
                "Supported satellites, resolutions, and collection IDs",
              href: "/docs/data-sources",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between p-4 rounded-lg border border-white/[0.06] hover:border-primary/30 hover:bg-primary/[0.03] transition-all group"
            >
              <div>
                <h3 className="font-medium group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
