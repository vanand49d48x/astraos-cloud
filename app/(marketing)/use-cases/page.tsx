import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { USE_CASES } from "@/lib/constants";
import { Leaf, Wheat, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Use Cases",
  description: "How climate tech, agriculture, and insurance teams use ASTRA OS to unify satellite data.",
};

const iconMap: Record<string, any> = { Leaf, Wheat, Shield };

const useCaseDetails = [
  {
    ...USE_CASES[0],
    longDescription:
      "Climate tech startups building carbon monitoring, deforestation tracking, or wildfire prediction tools need imagery from multiple satellite providers. Each provider has different formats, APIs, authentication, and data delivery methods. A single integration can take weeks of engineering time.",
    code: `# Before ASTRA OS: weeks of integration per provider
from sentinelsat import SentinelAPI
from landsatxplore import EarthExplorer
# ... custom format conversion, auth, normalization

# With ASTRA OS: one afternoon
import astra

scenes = astra.search(
    bbox=[-62, -4, -60, -2],  # Amazon region
    datetime="2025-01/2025-02",
    cloud_cover_lt=15
)

# Both Sentinel-2 and Landsat results, normalized
for scene in scenes:
    print(f"{scene.provider}: {scene.datetime} ({scene.gsd}m)")
    cog_url = scene.assets['nir'].url  # Always COG`,
    codeFile: "climate_startup.py",
  },
  {
    ...USE_CASES[1],
    longDescription:
      "Agricultural analytics companies need frequent optical imagery for crop monitoring and historical data for yield prediction. Sentinel-2 provides 5-day revisit for current conditions, while Landsat's 40-year archive enables long-term trend analysis. Building a unified time series across both requires significant data engineering.",
    code: `import astra

# Build a unified time series across providers
aoi = [10.5, 47.0, 11.5, 48.0]  # Agricultural region

# Sentinel-2: recent high-frequency data
recent = astra.search(
    bbox=aoi,
    datetime="2024-06/2024-09",
    collections=["sentinel-2-l2a"],
    cloud_cover_lt=20
)

# Landsat: long-term historical trend
historical = astra.search(
    bbox=aoi,
    datetime="2015-06/2024-09",
    collections=["landsat-c2-l2"]
)

# Same NDVI computation works on both
for scene in recent + historical:
    ndvi = scene.process("ndvi")
    # Unified time series, no format differences`,
    codeFile: "agri_analytics.py",
  },
  {
    ...USE_CASES[2],
    longDescription:
      "Insurance and reinsurance companies need satellite imagery for catastrophe modeling, property risk assessment, and claims verification. The challenge is discovering what imagery is available for a given location across all providers — and getting it in a consistent format for analysis.",
    code: `import astra

# Property risk assessment for underwriting
property_aoi = [-90.1, 29.9, -89.9, 30.1]  # New Orleans

# Search all available imagery for the area
all_scenes = astra.search(
    bbox=property_aoi,
    datetime="2024-01/2025-01",
    limit=50
)

print(f"Found {len(all_scenes)} scenes from "
      f"{len(set(s.provider for s in all_scenes))} providers")

# Get pre/post event imagery for claims
pre_event = astra.search(
    bbox=property_aoi,
    datetime="2024-08-01/2024-08-25"
)
post_event = astra.search(
    bbox=property_aoi,
    datetime="2024-09-01/2024-09-15"
)

# Automated change detection
delta = astra.process(
    operation="change_detection",
    before=pre_event[0].id,
    after=post_event[0].id
)`,
    codeFile: "insurance_risk.py",
  },
];

export default function UseCasesPage() {
  return (
    <div className="py-20 md:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <Badge variant="primary" className="mb-4">
            Use Cases
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Real solutions for{" "}
            <span className="text-primary">real teams</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how teams across climate tech, agriculture, and insurance use ASTRA OS
            to eliminate data engineering and focus on what matters.
          </p>
        </div>

        <div className="space-y-24">
          {useCaseDetails.map((uc, i) => {
            const Icon = iconMap[uc.icon] || Leaf;
            return (
              <div key={uc.title}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold">{uc.title}</h2>
                    </div>

                    <p className="text-muted-foreground leading-relaxed mb-6">
                      {uc.longDescription}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                        <div className="text-xs font-medium text-destructive uppercase tracking-wider mb-1">Problem</div>
                        <p className="text-sm text-muted-foreground">{uc.problem}</p>
                      </div>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div className="text-xs font-medium text-primary uppercase tracking-wider mb-1">With ASTRA OS</div>
                        <p className="text-sm text-foreground">{uc.solution}</p>
                      </div>
                      <div className="flex items-start gap-2 p-4 rounded-lg bg-success/5 border border-success/20">
                        <ArrowRight className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <p className="text-sm font-medium text-success">{uc.value}</p>
                      </div>
                    </div>
                  </div>

                  <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                    <CodeBlock
                      code={uc.code}
                      language="python"
                      filename={uc.codeFile}
                      showLineNumbers
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to start building?</h2>
          <p className="text-muted-foreground mb-8">
            Get started with the free tier — 5,000 API calls per month, no credit card required.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/docs">
              <Button variant="ghost" size="lg">Read the Docs</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
