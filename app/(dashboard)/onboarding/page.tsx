"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Key,
  Code,
  ArrowRight,
  Check,
  Copy,
  Terminal,
} from "lucide-react";

const STEPS = [
  { id: "welcome", title: "Welcome", icon: Rocket },
  { id: "team", title: "Your Team", icon: Key },
  { id: "quickstart", title: "Quick Start", icon: Code },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [keyName, setKeyName] = useState("Development");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreateKey() {
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.key);
      }
    } catch {
      // Handle error
    } finally {
      setCreating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      {/* Progress */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                i <= step
                  ? "bg-primary text-black"
                  : "bg-white/5 text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i <= step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 h-px ${
                  i < step ? "bg-primary" : "bg-white/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-8">
        {step === 0 && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">
              Welcome to ASTRA OS
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              You&apos;re about to unlock unified access to the world&apos;s satellite
              imagery. Let&apos;s get you set up in 60 seconds.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "3 Providers", sub: "Sentinel, Landsat, PC" },
                { label: "One API", sub: "Unified STAC search" },
                { label: "COG Output", sub: "Always cloud-optimized" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
            <Button onClick={() => setStep(1)}>
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Create your API key</h2>
            <p className="text-muted-foreground mb-6">
              You&apos;ll need an API key to authenticate your requests. Name it
              something memorable.
            </p>

            {!apiKey ? (
              <div className="space-y-4">
                <Input
                  label="Key Name"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g., Development"
                />
                <Button onClick={handleCreateKey} loading={creating} className="w-full">
                  <Key className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <p className="text-xs text-primary font-medium mb-2">
                    Save this key — you won&apos;t see it again
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono break-all bg-black/20 px-3 py-2 rounded">
                      {apiKey}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey)}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button onClick={() => setStep(2)} className="w-full">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Make your first search</h2>
            <p className="text-muted-foreground mb-6">
              Copy this code to search for satellite imagery over San Francisco.
            </p>

            <div className="bg-[#0a0a14] border border-white/[0.06] rounded-lg overflow-hidden mb-6">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">cURL</span>
              </div>
              <pre className="p-4 text-sm font-mono overflow-x-auto">
                <code className="text-foreground/80">
{`curl "https://astraos.cloud/api/v1/search\\
  ?bbox=-122.5,37.5,-122.0,38.0\\
  &datetime=2024-01-01/2024-12-31\\
  &cloud_cover_lt=20\\
  &limit=5" \\
  -H "Authorization: Bearer ${apiKey || "astra_YOUR_KEY"}"`}
                </code>
              </pre>
            </div>

            <div className="bg-[#0a0a14] border border-white/[0.06] rounded-lg overflow-hidden mb-6">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Python</span>
              </div>
              <pre className="p-4 text-sm font-mono overflow-x-auto">
                <code className="text-foreground/80">
{`import requests

response = requests.get(
    "https://astraos.cloud/api/v1/search",
    params={
        "bbox": "-122.5,37.5,-122.0,38.0",
        "datetime": "2024-01-01/2024-12-31",
        "cloud_cover_lt": 20,
        "limit": 5,
    },
    headers={
        "Authorization": "Bearer ${apiKey || "astra_YOUR_KEY"}"
    }
)

scenes = response.json()["features"]
print(f"Found {len(scenes)} scenes")`}
                </code>
              </pre>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/docs")}
                className="flex-1"
              >
                Read the Docs
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="flex-1"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
