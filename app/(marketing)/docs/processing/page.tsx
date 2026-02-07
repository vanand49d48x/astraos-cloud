"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Cpu, Clock, ArrowRight } from "lucide-react";

export default function ProcessingDocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-4">
          Processing
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Processing API
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          Run server-side analytics on satellite imagery. Submit processing
          jobs for NDVI computation, change detection, and more. Jobs run
          asynchronously and results are delivered as COG files with a download
          URL.
        </p>
      </div>

      {/* Architecture overview */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Async Job Architecture
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Processing jobs follow a submit-then-poll pattern. You submit a job
          definition, receive a job ID, and poll for status until the job
          completes.
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-card p-5 space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-foreground">Submit</strong> --{" "}
                <code className="bg-white/[0.06] px-1 rounded text-xs">
                  POST /api/v1/process
                </code>{" "}
                with the operation type, scene IDs, and parameters. Returns a{" "}
                <code className="bg-white/[0.06] px-1 rounded text-xs">
                  job_id
                </code>{" "}
                immediately.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-foreground">Poll</strong> --{" "}
                <code className="bg-white/[0.06] px-1 rounded text-xs">
                  GET /api/v1/process/{"{jobId}"}
                </code>{" "}
                to check job status. Status progresses:{" "}
                <Badge variant="outline" className="text-xs mx-0.5">
                  queued
                </Badge>
                <ArrowRight className="inline h-3 w-3 mx-0.5 text-muted" />
                <Badge variant="warning" className="text-xs mx-0.5">
                  processing
                </Badge>
                <ArrowRight className="inline h-3 w-3 mx-0.5 text-muted" />
                <Badge variant="success" className="text-xs mx-0.5">
                  completed
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-foreground">Download</strong> -- When
                status is{" "}
                <code className="bg-white/[0.06] px-1 rounded text-xs">
                  completed
                </code>
                , the response includes a{" "}
                <code className="bg-white/[0.06] px-1 rounded text-xs">
                  result
                </code>{" "}
                object with a pre-signed download URL for the output file.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit endpoint */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Submit a Job
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">POST</Badge>
          <code className="text-sm font-mono text-foreground">
            /api/v1/process
          </code>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Requires{" "}
          <Link
            href="/docs/authentication"
            className="text-primary hover:underline"
          >
            authentication
          </Link>
          . Send a JSON body with the operation type and input scenes.
        </p>

        <h3 className="text-lg font-semibold mt-6">Request Body</h3>
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
                  operation
                </td>
                <td className="px-4 py-3 font-mono text-xs">string</td>
                <td className="px-4 py-3">
                  <Badge variant="warning">Required</Badge>
                </td>
                <td className="px-4 py-3">
                  The processing operation. One of:{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    ndvi
                  </code>
                  ,{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    change_detection
                  </code>
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  scene_ids
                </td>
                <td className="px-4 py-3 font-mono text-xs">string[]</td>
                <td className="px-4 py-3">
                  <Badge variant="warning">Required</Badge>
                </td>
                <td className="px-4 py-3">
                  Array of scene IDs to process. NDVI requires 1 scene; change
                  detection requires exactly 2 (before and after).
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  params
                </td>
                <td className="px-4 py-3 font-mono text-xs">object</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">Optional</Badge>
                </td>
                <td className="px-4 py-3">
                  Operation-specific parameters. See individual operation docs
                  below.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  webhook_url
                </td>
                <td className="px-4 py-3 font-mono text-xs">string</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">Optional</Badge>
                </td>
                <td className="px-4 py-3">
                  URL to receive a POST callback when the job completes. The
                  callback body includes the full job status response.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Operations */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Operations</h2>

        {/* NDVI */}
        <div className="rounded-xl border border-white/[0.06] bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="success">ndvi</Badge>
            <h3 className="text-lg font-semibold">
              Normalized Difference Vegetation Index
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Computes NDVI from the red and NIR bands of a single scene. Output
            is a single-band COG with values ranging from -1.0 to 1.0. Bands
            are automatically resolved from the scene metadata.
          </p>
          <CodeBlock
            code={`{
  "operation": "ndvi",
  "scene_ids": ["sentinel-2:S2B_MSIL2A_20250115T184929"],
  "params": {
    "colormap": "rdylgn"
  }
}`}
            language="json"
            filename="ndvi_request.json"
          />
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 font-medium text-foreground">
                    Param
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-foreground">
                    Default
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-foreground">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-primary/80">
                    colormap
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">none</td>
                  <td className="px-4 py-3">
                    Optional colormap to apply. Options:{" "}
                    <code className="bg-white/[0.06] px-1 rounded text-xs">
                      rdylgn
                    </code>
                    ,{" "}
                    <code className="bg-white/[0.06] px-1 rounded text-xs">
                      viridis
                    </code>
                    ,{" "}
                    <code className="bg-white/[0.06] px-1 rounded text-xs">
                      greens
                    </code>
                    . If omitted, output is raw float values.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Change Detection */}
        <div className="rounded-xl border border-white/[0.06] bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">change_detection</Badge>
            <h3 className="text-lg font-semibold">Change Detection</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Compares two scenes of the same area at different times to detect
            changes. Requires exactly 2 scene IDs (before and after). Output
            is a classified change map with categories: no change, vegetation
            gain, vegetation loss, built-up gain, water change.
          </p>
          <CodeBlock
            code={`{
  "operation": "change_detection",
  "scene_ids": [
    "sentinel-2:S2B_MSIL2A_20240715T184929",
    "sentinel-2:S2B_MSIL2A_20250115T184929"
  ],
  "params": {
    "threshold": 0.15,
    "bands": ["red", "nir", "swir16"]
  }
}`}
            language="json"
            filename="change_detection_request.json"
          />
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 font-medium text-foreground">
                    Param
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-foreground">
                    Default
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-foreground">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-white/[0.06]">
                  <td className="px-4 py-3 font-mono text-xs text-primary/80">
                    threshold
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">0.1</td>
                  <td className="px-4 py-3">
                    Minimum spectral difference to classify as a change (0.0 -
                    1.0). Lower values detect more subtle changes.
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-primary/80">
                    bands
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    ["red","nir"]
                  </td>
                  <td className="px-4 py-3">
                    Bands to use for the comparison. More bands improve
                    classification accuracy but increase processing time.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Full Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Complete Example: NDVI
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Submit an NDVI job, poll for completion, and download the result.
        </p>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">cURL</h3>
          <CodeBlock
            code={`# Step 1: Submit the job
curl -X POST "https://astraos.cloud/api/v1/process" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "operation": "ndvi",
    "scene_ids": ["sentinel-2:S2B_MSIL2A_20250115T184929"],
    "params": { "colormap": "rdylgn" }
  }'

# Response: { "job_id": "job_abc123", "status": "queued", ... }

# Step 2: Poll for status
curl "https://astraos.cloud/api/v1/process/job_abc123" \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"

# Response when complete:
# { "job_id": "job_abc123", "status": "completed", "result": { "href": "https://..." } }`}
            language="bash"
            filename="terminal"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Python</h3>
          <CodeBlock
            code={`import requests
import time

API_KEY = "astra_sk_live_your_key_here"
BASE = "https://astraos.cloud/api/v1"
headers = {"Authorization": f"Bearer {API_KEY}"}

# Step 1: Submit the job
job = requests.post(
    f"{BASE}/process",
    headers={**headers, "Content-Type": "application/json"},
    json={
        "operation": "ndvi",
        "scene_ids": ["sentinel-2:S2B_MSIL2A_20250115T184929"],
        "params": {"colormap": "rdylgn"},
    },
).json()

print(f"Job submitted: {job['job_id']} (status: {job['status']})")

# Step 2: Poll until complete
while job["status"] in ("queued", "processing"):
    time.sleep(3)
    job = requests.get(
        f"{BASE}/process/{job['job_id']}",
        headers=headers,
    ).json()
    print(f"  Status: {job['status']}")

# Step 3: Download result
if job["status"] == "completed":
    url = job["result"]["href"]
    print(f"Downloading NDVI result from: {url}")
    import urllib.request
    urllib.request.urlretrieve(url, "ndvi_output.tif")
    print("Saved to ndvi_output.tif")
else:
    print(f"Job failed: {job.get('error', {}).get('message', 'Unknown error')}")`}
            language="python"
            filename="ndvi_example.py"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">JavaScript</h3>
          <CodeBlock
            code={`const API_KEY = "astra_sk_live_your_key_here";
const BASE = "https://astraos.cloud/api/v1";
const headers = { Authorization: \`Bearer \${API_KEY}\` };

// Step 1: Submit the job
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
console.log(\`Job submitted: \${job.job_id} (status: \${job.status})\`);

// Step 2: Poll until complete
while (job.status === "queued" || job.status === "processing") {
  await new Promise((r) => setTimeout(r, 3000));
  const pollRes = await fetch(\`\${BASE}/process/\${job.job_id}\`, { headers });
  job = await pollRes.json();
  console.log(\`  Status: \${job.status}\`);
}

// Step 3: Use the result
if (job.status === "completed") {
  console.log(\`Result URL: \${job.result.href}\`);
} else {
  console.error(\`Job failed: \${job.error?.message}\`);
}`}
            language="javascript"
            filename="ndvi_example.js"
          />
        </div>
      </section>

      {/* Poll endpoint */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Poll Job Status
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="success">GET</Badge>
          <code className="text-sm font-mono text-foreground">
            /api/v1/process/{"{jobId}"}
          </code>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Returns the current status and metadata for a processing job.
        </p>
        <CodeBlock
          code={`{
  "job_id": "job_abc123",
  "status": "completed",
  "operation": "ndvi",
  "scene_ids": ["sentinel-2:S2B_MSIL2A_20250115T184929"],
  "created_at": "2025-01-15T19:00:00Z",
  "completed_at": "2025-01-15T19:00:12Z",
  "duration_ms": 12340,
  "result": {
    "href": "https://storage.astraos.cloud/jobs/job_abc123/ndvi_output.tif?sig=...",
    "type": "image/tiff; application=geotiff; profile=cloud-optimized",
    "file:size": 8388608,
    "expires_at": "2025-01-16T19:00:00Z"
  }
}`}
          language="json"
          filename="job_status_response.json"
          showLineNumbers
        />

        <h3 className="text-lg font-semibold mt-6">Job Statuses</h3>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="outline">queued</Badge>
                </td>
                <td className="px-4 py-3">
                  Job is in the queue waiting to be picked up by a worker.
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="warning">processing</Badge>
                </td>
                <td className="px-4 py-3">
                  Job is currently being executed. Input data has been fetched
                  and computation is running.
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="success">completed</Badge>
                </td>
                <td className="px-4 py-3">
                  Job finished successfully. The{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    result
                  </code>{" "}
                  field contains the output download URL.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <Badge variant="destructive">failed</Badge>
                </td>
                <td className="px-4 py-3">
                  Job encountered an error. The{" "}
                  <code className="bg-white/[0.06] px-1 rounded text-xs">
                    error
                  </code>{" "}
                  field contains a code and message describing the failure.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation */}
      <div className="pt-8 border-t border-white/[0.06] flex justify-between items-center">
        <Link
          href="/docs/assets"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Asset Resolver
        </Link>
        <Link
          href="/docs/data-sources"
          className="text-sm text-primary hover:underline"
        >
          Data Sources &rarr;
        </Link>
      </div>
    </div>
  );
}
