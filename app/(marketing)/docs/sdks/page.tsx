"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Code, Terminal, Braces } from "lucide-react";

export default function SDKsDocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-4">
          SDKs &amp; Libraries
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          SDKs &amp; Code Examples
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Integrate ASTRA OS into your application using any HTTP client. Below
          are complete examples in Python, JavaScript/TypeScript, and cURL for
          every major API operation. Official SDKs are on the roadmap.
        </p>
      </div>

      {/* SDK Status */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          SDK Availability
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                Python
              </h3>
              <Badge variant="outline" className="text-xs">
                Planned
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <code className="bg-white/[0.06] px-1 rounded text-xs">
                pip install astraos
              </code>{" "}
              — Official Python SDK with type hints and async support.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Braces className="h-4 w-4 text-primary" />
                JavaScript / TypeScript
              </h3>
              <Badge variant="outline" className="text-xs">
                Planned
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <code className="bg-white/[0.06] px-1 rounded text-xs">
                npm install @astraos/sdk
              </code>{" "}
              — TypeScript SDK for Node.js and browser environments.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <Code className="h-4 w-4 text-primary" />
                REST API
              </h3>
              <Badge variant="success" className="text-xs">
                Available
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Use any HTTP client with the examples below. The REST API is the
              primary interface for all integrations.
            </p>
          </div>
        </div>
      </section>

      {/* Python Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          Python Examples
        </h2>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Search for satellite scenes
          </h3>
          <CodeBlock
            code={`import requests

API_KEY = "astra_sk_live_your_key_here"
BASE = "https://astraos.cloud/api/v1"
headers = {"Authorization": f"Bearer {API_KEY}"}

# Search for Sentinel-2 scenes over San Francisco
response = requests.get(
    f"{BASE}/search",
    headers=headers,
    params={
        "bbox": "-122.5,37.5,-122.0,38.0",
        "datetime": "2025-01-01/2025-02-01",
        "collections": "sentinel-2-l2a",
        "cloud_cover_lt": 20,
        "limit": 5,
    },
)

data = response.json()
print(f"Found {data['context']['matched']} scenes")

for scene in data["features"]:
    props = scene["properties"]
    print(f"  {scene['id']}")
    print(f"    Date: {props['datetime']}")
    print(f"    Cloud: {props['eo:cloud_cover']}%")
    print(f"    Bands: {list(scene['assets'].keys())}")
    print()`}
            language="python"
            filename="search_scenes.py"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Get scene details and download bands
          </h3>
          <CodeBlock
            code={`import requests

API_KEY = "astra_sk_live_your_key_here"
BASE = "https://astraos.cloud/api/v1"
headers = {"Authorization": f"Bearer {API_KEY}"}

scene_id = "sentinel-2:S2B_MSIL2A_20250115T184929"

# Get full scene metadata
scene = requests.get(
    f"{BASE}/scenes/{scene_id}",
    headers=headers,
).json()

print(f"Platform: {scene['properties']['platform']}")
print(f"Cloud cover: {scene['properties']['eo:cloud_cover']}%")

# Resolve red and NIR band COG URLs
assets = requests.get(
    f"{BASE}/assets",
    headers=headers,
    params={
        "scene_id": scene_id,
        "bands": "red,nir",
        "format": "cog",
    },
).json()

for band_name, asset in assets["assets"].items():
    print(f"{band_name}: {asset['href'][:80]}...")`}
            language="python"
            filename="scene_detail.py"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Submit an NDVI processing job
          </h3>
          <CodeBlock
            code={`import requests
import time

API_KEY = "astra_sk_live_your_key_here"
BASE = "https://astraos.cloud/api/v1"
headers = {"Authorization": f"Bearer {API_KEY}"}

# Submit NDVI job
job = requests.post(
    f"{BASE}/process",
    headers={**headers, "Content-Type": "application/json"},
    json={
        "operation": "ndvi",
        "scene_ids": ["sentinel-2:S2B_MSIL2A_20250115T184929"],
        "params": {"colormap": "rdylgn"},
    },
).json()

print(f"Job {job['job_id']} submitted (status: {job['status']})")

# Poll until complete
while job["status"] in ("queued", "processing"):
    time.sleep(3)
    job = requests.get(
        f"{BASE}/process/{job['job_id']}",
        headers=headers,
    ).json()
    print(f"  Status: {job['status']}")

if job["status"] == "completed":
    print(f"Result: {job['result']['href']}")
else:
    print(f"Failed: {job.get('error', 'Unknown error')}")`}
            language="python"
            filename="ndvi_job.py"
          />
        </div>
      </section>

      {/* JavaScript Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Braces className="h-5 w-5 text-primary" />
          JavaScript / TypeScript Examples
        </h2>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Search for satellite scenes
          </h3>
          <CodeBlock
            code={`const API_KEY = "astra_sk_live_your_key_here";
const BASE = "https://astraos.cloud/api/v1";
const headers = { Authorization: \`Bearer \${API_KEY}\` };

// Search for Sentinel-2 scenes over San Francisco
const params = new URLSearchParams({
  bbox: "-122.5,37.5,-122.0,38.0",
  datetime: "2025-01-01/2025-02-01",
  collections: "sentinel-2-l2a",
  cloud_cover_lt: "20",
  limit: "5",
});

const res = await fetch(\`\${BASE}/search?\${params}\`, { headers });
const data = await res.json();

console.log(\`Found \${data.context.matched} scenes\`);
data.features.forEach((scene) => {
  console.log(\`  \${scene.id}\`);
  console.log(\`    Date: \${scene.properties.datetime}\`);
  console.log(\`    Cloud: \${scene.properties["eo:cloud_cover"]}%\`);
  console.log(\`    Bands: \${Object.keys(scene.assets).join(", ")}\`);
});`}
            language="javascript"
            filename="search_scenes.ts"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Get scene details and resolve assets
          </h3>
          <CodeBlock
            code={`const API_KEY = "astra_sk_live_your_key_here";
const BASE = "https://astraos.cloud/api/v1";
const headers = { Authorization: \`Bearer \${API_KEY}\` };

const sceneId = "sentinel-2:S2B_MSIL2A_20250115T184929";

// Get full scene metadata
const sceneRes = await fetch(\`\${BASE}/scenes/\${sceneId}\`, { headers });
const scene = await sceneRes.json();

console.log("Platform:", scene.properties.platform);
console.log("Cloud cover:", scene.properties["eo:cloud_cover"] + "%");

// Resolve red and NIR band COG URLs
const assetParams = new URLSearchParams({
  scene_id: sceneId,
  bands: "red,nir",
  format: "cog",
});

const assetRes = await fetch(\`\${BASE}/assets?\${assetParams}\`, { headers });
const assets = await assetRes.json();

Object.entries(assets.assets).forEach(([band, asset]) => {
  console.log(\`\${band}: \${asset.href}\`);
});`}
            language="javascript"
            filename="scene_detail.ts"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Submit an NDVI processing job
          </h3>
          <CodeBlock
            code={`const API_KEY = "astra_sk_live_your_key_here";
const BASE = "https://astraos.cloud/api/v1";
const headers = { Authorization: \`Bearer \${API_KEY}\` };

// Submit NDVI job
const submitRes = await fetch(\`\${BASE}/process\`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({
    operation: "ndvi",
    scene_ids: ["sentinel-2:S2B_MSIL2A_20250115T184929"],
    params: { colormap: "rdylgn" },
  }),
});
let job = await submitRes.json();
console.log(\`Job \${job.job_id} submitted (status: \${job.status})\`);

// Poll until complete
while (job.status === "queued" || job.status === "processing") {
  await new Promise((r) => setTimeout(r, 3000));
  const pollRes = await fetch(\`\${BASE}/process/\${job.job_id}\`, { headers });
  job = await pollRes.json();
  console.log(\`  Status: \${job.status}\`);
}

if (job.status === "completed") {
  console.log(\`Result: \${job.result.href}\`);
} else {
  console.error(\`Failed: \${job.error?.message}\`);
}`}
            language="javascript"
            filename="ndvi_job.ts"
          />
        </div>
      </section>

      {/* cURL Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          cURL Quick Reference
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Copy-paste these commands into your terminal. Replace the API key with
          your own from the{" "}
          <Link
            href="/dashboard/api-keys"
            className="text-primary hover:underline"
          >
            dashboard
          </Link>
          .
        </p>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Search</h3>
          <CodeBlock
            code={`curl "https://astraos.cloud/api/v1/search?bbox=-122.5,37.5,-122.0,38.0&datetime=2025-01-01/2025-02-01&limit=5" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"`}
            language="bash"
            filename="terminal"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Scene Details
          </h3>
          <CodeBlock
            code={`curl "https://astraos.cloud/api/v1/scenes/sentinel-2:S2B_MSIL2A_20250115T184929" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"`}
            language="bash"
            filename="terminal"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Resolve Assets
          </h3>
          <CodeBlock
            code={`curl "https://astraos.cloud/api/v1/assets?scene_id=sentinel-2:S2B_MSIL2A_20250115T184929&bands=red,nir&format=cog" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"`}
            language="bash"
            filename="terminal"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Submit Processing Job
          </h3>
          <CodeBlock
            code={`curl -X POST "https://astraos.cloud/api/v1/process" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"operation": "ndvi", "scene_ids": ["sentinel-2:S2B_MSIL2A_20250115T184929"]}'`}
            language="bash"
            filename="terminal"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">
            Poll Job Status
          </h3>
          <CodeBlock
            code={`curl "https://astraos.cloud/api/v1/process/job_abc123" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"`}
            language="bash"
            filename="terminal"
          />
        </div>
      </section>

      {/* Error Handling */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Error Handling
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          All API errors return a consistent JSON structure. Check the HTTP
          status code and the{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            error.code
          </code>{" "}
          field to handle specific error types programmatically.
        </p>
        <CodeBlock
          code={`{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "bbox parameter is required. Expected format: west,south,east,north",
    "details": {
      "parameter": "bbox",
      "received": null
    }
  }
}`}
          language="json"
          filename="error_response.json"
        />
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  HTTP Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Error Code
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="warning">400</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  VALIDATION_ERROR
                </td>
                <td className="px-4 py-3">
                  Invalid or missing request parameters
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="destructive">401</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">UNAUTHORIZED</td>
                <td className="px-4 py-3">
                  Missing or invalid API key
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="destructive">403</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">FORBIDDEN</td>
                <td className="px-4 py-3">
                  Key does not have access to this resource
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="warning">404</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">NOT_FOUND</td>
                <td className="px-4 py-3">
                  Scene or job not found
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <Badge variant="destructive">429</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  RATE_LIMITED
                </td>
                <td className="px-4 py-3">
                  Too many requests. Check{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    Retry-After
                  </code>{" "}
                  header.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-white/[0.06] flex justify-between items-center">
        <Link
          href="/docs/data-sources"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Data Sources
        </Link>
        <Link
          href="/docs"
          className="text-sm text-primary hover:underline"
        >
          Back to Getting Started &rarr;
        </Link>
      </div>
    </div>
  );
}
