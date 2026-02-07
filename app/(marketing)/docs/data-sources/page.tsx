"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Database, Globe, Satellite } from "lucide-react";

export default function DataSourcesDocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-4">
          Data Sources
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Data Sources
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          ASTRA OS aggregates satellite imagery from multiple upstream
          providers into a single search and access layer. Each provider is
          available as one or more collections that you can filter using the{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            collections
          </code>{" "}
          parameter on the{" "}
          <Link
            href="/docs/search"
            className="text-primary hover:underline"
          >
            search endpoint
          </Link>
          .
        </p>
      </div>

      {/* Sentinel-2 */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Satellite className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Sentinel-2 L2A
            </h2>
            <p className="text-sm text-muted-foreground">
              European Space Agency via Copernicus Data Space
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Collection ID
              </p>
              <p className="font-mono text-primary text-xs">
                sentinel-2-l2a
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Resolution
              </p>
              <p className="font-medium">10m / 20m / 60m</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Revisit Time
              </p>
              <p className="font-medium">5 days</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Coverage
              </p>
              <p className="font-medium">Global land</p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sentinel-2 provides 13 spectral bands from visible to SWIR.
              L2A products are atmospherically corrected (bottom-of-atmosphere
              reflectance). This is the most commonly used optical satellite
              dataset for land monitoring, agriculture, and environmental
              applications.
            </p>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Available bands
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "B01 (Coastal)",
                "B02 (Blue)",
                "B03 (Green)",
                "B04 (Red)",
                "B05 (Veg Red Edge 1)",
                "B06 (Veg Red Edge 2)",
                "B07 (Veg Red Edge 3)",
                "B08 (NIR)",
                "B8A (Narrow NIR)",
                "B09 (Water Vapour)",
                "B11 (SWIR 1)",
                "B12 (SWIR 2)",
                "SCL (Scene Classification)",
              ].map((band) => (
                <Badge key={band} variant="outline" className="text-xs">
                  {band}
                </Badge>
              ))}
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Capabilities
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="success" className="text-xs">
                Search
              </Badge>
              <Badge variant="success" className="text-xs">
                Scene Details
              </Badge>
              <Badge variant="success" className="text-xs">
                Asset Download
              </Badge>
              <Badge variant="success" className="text-xs">
                NDVI Processing
              </Badge>
              <Badge variant="success" className="text-xs">
                Change Detection
              </Badge>
            </div>
          </div>
        </div>
        <CodeBlock
          code={`curl "https://astraos.cloud/api/v1/search?\\
  bbox=-122.5,37.5,-122.0,38.0&\\
  datetime=2025-01-01/2025-02-01&\\
  collections=sentinel-2-l2a&\\
  cloud_cover_lt=15" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"`}
          language="bash"
          filename="Search Sentinel-2"
        />
      </section>

      {/* Landsat */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary/10">
            <Globe className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Landsat 8 &amp; 9
            </h2>
            <p className="text-sm text-muted-foreground">
              U.S. Geological Survey (USGS)
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Collection ID
              </p>
              <p className="font-mono text-primary text-xs">landsat-c2-l2</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Resolution
              </p>
              <p className="font-medium">30m (15m pan)</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Revisit Time
              </p>
              <p className="font-medium">8 days (combined)</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Coverage
              </p>
              <p className="font-medium">Global</p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Landsat provides the longest continuous satellite record of
              Earth's land surface (50+ years of combined Landsat archive).
              Collection 2 Level-2 products include surface reflectance and
              surface temperature. Landsat 8 and 9 operate in tandem to
              provide 8-day combined revisit.
            </p>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Available bands
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "B01 (Coastal/Aerosol)",
                "B02 (Blue)",
                "B03 (Green)",
                "B04 (Red)",
                "B05 (NIR)",
                "B06 (SWIR 1)",
                "B07 (SWIR 2)",
                "B08 (Pan)",
                "B10 (Thermal)",
                "QA_PIXEL",
              ].map((band) => (
                <Badge key={band} variant="outline" className="text-xs">
                  {band}
                </Badge>
              ))}
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Capabilities
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="success" className="text-xs">
                Search
              </Badge>
              <Badge variant="success" className="text-xs">
                Scene Details
              </Badge>
              <Badge variant="success" className="text-xs">
                Asset Download
              </Badge>
              <Badge variant="success" className="text-xs">
                NDVI Processing
              </Badge>
              <Badge variant="success" className="text-xs">
                Change Detection
              </Badge>
            </div>
          </div>
        </div>
        <CodeBlock
          code={`curl "https://astraos.cloud/api/v1/search?\\
  bbox=-122.5,37.5,-122.0,38.0&\\
  datetime=2025-01-01/2025-02-01&\\
  collections=landsat-c2-l2&\\
  cloud_cover_lt=20" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"`}
          language="bash"
          filename="Search Landsat"
        />
      </section>

      {/* Planetary Computer */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
            <Database className="h-5 w-5 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Planetary Computer
            </h2>
            <p className="text-sm text-muted-foreground">
              Microsoft Planetary Computer
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Collection ID
              </p>
              <p className="font-mono text-primary text-xs">
                planetary-computer
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Resolution
              </p>
              <p className="font-medium">Varies by dataset</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Revisit Time
              </p>
              <p className="font-medium">Varies by dataset</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
                Coverage
              </p>
              <p className="font-medium">Global</p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Microsoft Planetary Computer hosts a wide collection of
              environmental monitoring data including Sentinel-2, Landsat,
              NAIP, and more. It serves all assets as Cloud-Optimized GeoTIFFs
              natively, making it ideal for direct COG access with no format
              conversion overhead. ASTRA OS uses Planetary Computer as a
              secondary source for Sentinel-2 and Landsat data.
            </p>
          </div>
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Capabilities
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="success" className="text-xs">
                Search
              </Badge>
              <Badge variant="success" className="text-xs">
                Scene Details
              </Badge>
              <Badge variant="success" className="text-xs">
                Asset Download (COG native)
              </Badge>
              <Badge variant="success" className="text-xs">
                NDVI Processing
              </Badge>
              <Badge variant="success" className="text-xs">
                Change Detection
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Quick Reference
        </h2>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Collection
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Provider
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Resolution
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Revisit
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Native COG
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  sentinel-2-l2a
                </td>
                <td className="px-4 py-3">Copernicus</td>
                <td className="px-4 py-3">10m</td>
                <td className="px-4 py-3">5 days</td>
                <td className="px-4 py-3">
                  <Badge variant="warning" className="text-xs">
                    Converted
                  </Badge>
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  landsat-c2-l2
                </td>
                <td className="px-4 py-3">USGS</td>
                <td className="px-4 py-3">30m</td>
                <td className="px-4 py-3">8 days</td>
                <td className="px-4 py-3">
                  <Badge variant="warning" className="text-xs">
                    Converted
                  </Badge>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  planetary-computer
                </td>
                <td className="px-4 py-3">Microsoft</td>
                <td className="px-4 py-3">Varies</td>
                <td className="px-4 py-3">Varies</td>
                <td className="px-4 py-3">
                  <Badge variant="success" className="text-xs">
                    Native
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Coming Soon</h2>
        <p className="text-muted-foreground leading-relaxed">
          The following commercial data sources are on the roadmap for ASTRA
          OS. These will be available through the same search and access API
          with pay-per-scene pricing.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              name: "Planet",
              description:
                "PlanetScope (3m daily), SkySat (0.5m tasking)",
              badge: "2025",
            },
            {
              name: "Maxar",
              description:
                "WorldView Legion (0.3m), archive and tasking",
              badge: "2025",
            },
            {
              name: "Capella Space",
              description:
                "SAR imagery (0.5m), all-weather day/night capability",
              badge: "2025",
            },
          ].map((source) => (
            <div
              key={source.name}
              className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">{source.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {source.badge}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {source.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-white/[0.06] flex justify-between items-center">
        <Link
          href="/docs/processing"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Processing
        </Link>
        <Link
          href="/docs/sdks"
          className="text-sm text-primary hover:underline"
        >
          SDKs &amp; Examples &rarr;
        </Link>
      </div>
    </div>
  );
}
