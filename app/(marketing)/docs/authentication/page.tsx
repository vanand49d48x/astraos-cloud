"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { Key, Shield, Gauge, AlertTriangle } from "lucide-react";

export default function AuthenticationDocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <Badge variant="primary" className="mb-4">
          Authentication
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          API Authentication
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          All ASTRA OS API requests require authentication via an API key passed
          in the <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header.
          Keys are scoped to your account and can be managed from the dashboard.
        </p>
      </div>

      {/* API Key Format */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          API Key Format
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          ASTRA OS API keys use a structured format that encodes the key type
          and environment:
        </p>
        <CodeBlock
          code={`astra_sk_live_abc123def456ghi789jkl012mno345pqr678`}
          language="text"
          filename="Key Format"
        />
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Segment
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Value
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  Prefix
                </td>
                <td className="px-4 py-3 font-mono text-xs">astra_</td>
                <td className="px-4 py-3">
                  Identifies this as an ASTRA OS key
                </td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  Type
                </td>
                <td className="px-4 py-3 font-mono text-xs">sk_</td>
                <td className="px-4 py-3">
                  Secret key (server-side only; never expose in client code)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-primary/80">
                  Environment
                </td>
                <td className="px-4 py-3 font-mono text-xs">live_ / test_</td>
                <td className="px-4 py-3">
                  <code className="bg-white/[0.06] px-1 rounded">live_</code>{" "}
                  keys hit production providers;{" "}
                  <code className="bg-white/[0.06] px-1 rounded">test_</code>{" "}
                  keys return mock data with no usage charges
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Passing the Key */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Passing the Key
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Include your API key in the{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            Authorization
          </code>{" "}
          header as a Bearer token on every request:
        </p>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">cURL</h3>
          <CodeBlock
            code={`curl https://astraos.cloud/api/v1/search \\
  -H "Authorization: Bearer astra_sk_live_your_key_here"`}
            language="bash"
            filename="terminal"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">Python</h3>
          <CodeBlock
            code={`import requests

headers = {
    "Authorization": "Bearer astra_sk_live_your_key_here"
}

response = requests.get(
    "https://astraos.cloud/api/v1/search",
    headers=headers,
    params={"bbox": "-122.5,37.5,-122.0,38.0"}
)`}
            language="python"
            filename="auth.py"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground">JavaScript</h3>
          <CodeBlock
            code={`const response = await fetch(
  "https://astraos.cloud/api/v1/search?bbox=-122.5,37.5,-122.0,38.0",
  {
    headers: {
      Authorization: "Bearer astra_sk_live_your_key_here",
    },
  }
);`}
            language="javascript"
            filename="auth.js"
          />
        </div>

        <div className="rounded-xl border border-warning/20 bg-warning/[0.05] p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-warning">Never expose your secret key in client-side code.</strong>{" "}
            API keys prefixed with <code className="bg-white/[0.06] px-1 rounded text-xs font-mono">sk_</code>{" "}
            are secret keys intended for server-side use only. If you need to
            make API calls from a browser, proxy them through your own backend.
          </div>
        </div>
      </section>

      {/* Key Management */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Key Management
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Manage your API keys from the{" "}
          <Link
            href="/dashboard/api-keys"
            className="text-primary hover:underline"
          >
            Dashboard &rarr; API Keys
          </Link>{" "}
          page. You can:
        </p>
        <ul className="space-y-2 text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1.5 text-xs">&#9679;</span>
            <span>
              <strong className="text-foreground">Create keys</strong> with
              optional labels to identify each integration
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1.5 text-xs">&#9679;</span>
            <span>
              <strong className="text-foreground">Revoke keys</strong> instantly
              to cut off access if a key is compromised
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1.5 text-xs">&#9679;</span>
            <span>
              <strong className="text-foreground">Roll keys</strong> to generate
              a replacement key while the old key remains active for a grace
              period (24 hours)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-1.5 text-xs">&#9679;</span>
            <span>
              <strong className="text-foreground">View usage</strong> per key
              including request count, last used timestamp, and error rate
            </span>
          </li>
        </ul>
      </section>

      {/* Error Responses */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          Authentication Errors
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          When authentication fails, the API returns a JSON error with a
          descriptive message:
        </p>
        <CodeBlock
          code={`// 401 Unauthorized — missing or invalid key
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid API key. Check that your key is correct and has not been revoked."
  }
}

// 403 Forbidden — key does not have access to this resource
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Your current plan does not include access to processing endpoints. Upgrade at astraos.cloud/dashboard/billing."
  }
}`}
          language="json"
          filename="error_responses.json"
        />
      </section>

      {/* Rate Limits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Rate Limits
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Rate limits vary by plan tier and are enforced per API key. Exceeding
          your limit returns a{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            429 Too Many Requests
          </code>{" "}
          response with a{" "}
          <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs font-mono">
            Retry-After
          </code>{" "}
          header.
        </p>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Plan
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Requests / minute
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Requests / day
                </th>
                <th className="text-left px-4 py-3 font-medium text-foreground">
                  Burst
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="outline">Free</Badge>
                </td>
                <td className="px-4 py-3">30</td>
                <td className="px-4 py-3">1,000</td>
                <td className="px-4 py-3">10</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="primary">Pro</Badge>
                </td>
                <td className="px-4 py-3">120</td>
                <td className="px-4 py-3">50,000</td>
                <td className="px-4 py-3">30</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="px-4 py-3">
                  <Badge variant="secondary">Scale</Badge>
                </td>
                <td className="px-4 py-3">600</td>
                <td className="px-4 py-3">500,000</td>
                <td className="px-4 py-3">100</td>
              </tr>
              <tr>
                <td className="px-4 py-3">
                  <Badge variant="warning">Enterprise</Badge>
                </td>
                <td className="px-4 py-3">Custom</td>
                <td className="px-4 py-3">Unlimited</td>
                <td className="px-4 py-3">Custom</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">
          Rate limit headers are included on every response:
        </p>
        <CodeBlock
          code={`X-RateLimit-Limit: 120
X-RateLimit-Remaining: 117
X-RateLimit-Reset: 1706140800
Retry-After: 12`}
          language="text"
          filename="Rate Limit Headers"
        />
      </section>

      {/* Next page link */}
      <div className="pt-8 border-t border-white/[0.06] flex justify-between items-center">
        <Link
          href="/docs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Getting Started
        </Link>
        <Link
          href="/docs/search"
          className="text-sm text-primary hover:underline"
        >
          Unified Search &rarr;
        </Link>
      </div>
    </div>
  );
}
