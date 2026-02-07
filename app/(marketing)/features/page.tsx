import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Database, ShoppingCart, Cpu, ArrowRight, Layers, Zap, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description: "ASTRA OS platform architecture: Unified Data Access, Data Brokerage, and Analytics Primitives.",
};

const layers = [
  {
    icon: Database,
    badge: "Layer 1",
    badgeColor: "primary" as const,
    title: "Unified Data Access",
    subtitle: "One API for all satellite data",
    description:
      "Search, discover, and access satellite imagery from Sentinel-2, Landsat, and Planetary Computer through a single REST API. Consistent STAC metadata and COG output format regardless of the upstream provider.",
    features: [
      "Unified catalog search across all providers (spatial, temporal, spectral)",
      "Automatic format normalization to Cloud-Optimized GeoTIFF (COG)",
      "STAC-compliant metadata for interoperability",
      "One API key, one set of docs, one integration",
    ],
    code: `# Search across all providers at once
curl "https://astraos.cloud/api/v1/search?\\
  bbox=-122.5,37.5,-122.0,38.0&\\
  datetime=2025-01-01/2025-02-01&\\
  cloud_cover_lt=20&\\
  limit=10" \\
  -H "Authorization: Bearer astra_your_key"`,
    codeLanguage: "bash",
    codeFile: "terminal",
  },
  {
    icon: ShoppingCart,
    badge: "Layer 2",
    badgeColor: "secondary" as const,
    title: "Data Brokerage",
    subtitle: "Coming Soon — Commercial data marketplace",
    description:
      "Purchase commercial imagery from Planet, Maxar, Airbus, Capella, and ICEYE through ASTRA OS. One contract replaces five vendor relationships. Intelligent source selection for the best available imagery.",
    features: [
      "One contract replaces five vendor relationships",
      "Intelligent source selection (best imagery for time, location, budget)",
      "Volume discounts from negotiated provider agreements",
      "15-25% margin on commercial data transactions",
    ],
    code: `# Same API, commercial data included
scenes = astra.search(
    bbox=[-122.5, 37.5, -122.0, 38.0],
    datetime="2025-01/2025-02",
    collections=["planet-psscene", "maxar-wv"],
    resolution_lt=3  # sub-3m resolution
)`,
    codeLanguage: "python",
    codeFile: "commercial_search.py",
  },
  {
    icon: Cpu,
    badge: "Layer 3",
    badgeColor: "success" as const,
    title: "Analytics Primitives",
    subtitle: "Server-side processing via API",
    description:
      "Pre-built processing functions that developers call via the API, eliminating the need to build common geospatial operations from scratch. NDVI, change detection, cloud masking, and more — all as callable endpoints.",
    features: [
      "NDVI and vegetation index computation",
      "Change detection between time periods",
      "Cloud masking and atmospheric correction",
      "Multi-resolution fusion and co-registration",
      "Custom model hosting (deploy your own ML models)",
    ],
    code: `# Compute NDVI — no local processing needed
job = astra.process(
    operation="ndvi",
    scene_id="sentinel-2-l2a:S2A_MSIL2A_20250115T...",
    bbox=[-122.5, 37.5, -122.0, 38.0]
)

# Poll until complete
result = job.wait()
result.download("ndvi_output.tif")`,
    codeLanguage: "python",
    codeFile: "process_ndvi.py",
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <Badge variant="primary" className="mb-4">
            Platform Architecture
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Three layers,{" "}
            <span className="text-primary">one platform</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            ASTRA OS operates as a three-layer platform. Each layer builds on the one below,
            and each is independently valuable.
          </p>
        </div>

        {/* Architecture diagram */}
        <div className="mb-20 flex justify-center">
          <div className="inline-flex flex-col gap-2 w-full max-w-xl">
            {[
              { label: "Layer 3: Analytics Primitives", color: "bg-success/20 border-success/30 text-success" },
              { label: "Layer 2: Data Brokerage", color: "bg-secondary/20 border-secondary/30 text-secondary" },
              { label: "Layer 1: Unified Data Access", color: "bg-primary/20 border-primary/30 text-primary" },
            ].map((layer, i) => (
              <div
                key={layer.label}
                className={`text-center py-4 rounded-xl border font-semibold text-sm ${layer.color}`}
              >
                {layer.label}
              </div>
            ))}
            <div className="text-center py-3 rounded-xl border border-card-border bg-card text-muted-foreground text-sm">
              Satellite Providers (Sentinel, Landsat, Planet, Maxar, ...)
            </div>
          </div>
        </div>

        {/* Layer details */}
        <div className="space-y-24">
          {layers.map((layer, i) => (
            <div key={layer.title} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <Badge variant={layer.badgeColor} className="mb-3">
                  {layer.badge}
                </Badge>
                <h2 className="text-3xl font-bold mb-2">{layer.title}</h2>
                <p className="text-muted-foreground mb-1">{layer.subtitle}</p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {layer.description}
                </p>
                <ul className="space-y-3">
                  {layer.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <CodeBlock
                  code={layer.code}
                  language={layer.codeLanguage}
                  filename={layer.codeFile}
                  showLineNumbers
                />
              </div>
            </div>
          ))}
        </div>

        {/* Key differentiators */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">Why ASTRA OS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Layers,
                title: "Provider-Agnostic",
                description: "Add Sentinel today, Landsat tomorrow, Planet later. Zero API changes for users. The adapter pattern means new providers are invisible to your code.",
              },
              {
                icon: Zap,
                title: "COG + STAC Always",
                description: "Every output is Cloud-Optimized GeoTIFF with STAC metadata. Even if the upstream provider delivers JP2 or SAFE format, we normalize it for you.",
              },
              {
                icon: Globe,
                title: "Built for Scale",
                description: "Postgres-backed caching, async job processing, and controlled concurrency to upstream providers. The same architecture that scales from demo to production.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-card-border bg-card p-6">
                <item.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
