"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  Webhook,
  Plus,
  Trash2,
  Play,
  Copy,
  Check,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface WebhookRecord {
  id: string;
  name: string;
  url: string;
  events: string[];
  aoiBbox: string | null;
  cloudCoverLt: number | null;
  collections: string[];
  active: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
  secret?: string; // only on creation
  _count: { deliveries: number };
  deliveries: Array<{
    success: boolean;
    statusCode: number | null;
    attemptedAt: string;
  }>;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; statusCode?: number; error?: string }>>({});

  // Form state
  const [form, setForm] = useState({
    name: "",
    url: "",
    aoiBbox: "",
    cloudCoverLt: "",
  });

  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks");
      if (res.ok) setWebhooks(await res.json().then((d) => d.webhooks));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    const body: Record<string, unknown> = {
      name: form.name,
      url: form.url,
      events: ["imagery.available"],
    };
    if (form.aoiBbox) body.aoiBbox = form.aoiBbox;
    if (form.cloudCoverLt) body.cloudCoverLt = Number(form.cloudCoverLt);

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? "Failed to create"); return; }
      setNewSecret(data.secret);
      setShowCreate(false);
      setForm({ name: "", url: "", aoiBbox: "", cloudCoverLt: "" });
      fetchWebhooks();
    } catch {
      setCreateError("Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, active: boolean) {
    await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    fetchWebhooks();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    fetchWebhooks();
  }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult((prev) => ({ ...prev, [id]: data }));
    } finally {
      setTestingId(null);
    }
  }

  function copySecret(s: string) {
    navigator.clipboard.writeText(s);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Get notified when new satellite imagery is available over your areas of interest
          </p>
        </div>
        <Button onClick={() => { setCreateError(null); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Webhook
        </Button>
      </div>

      {/* New secret banner */}
      {newSecret && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">
                Save your signing secret — it won&apos;t be shown again.
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Use this to verify the <code>X-ASTRA-Signature</code> header on incoming requests.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/30 px-3 py-2 rounded-lg text-sm font-mono break-all">
                  {newSecret}
                </code>
                <Button variant="ghost" size="sm" onClick={() => copySecret(newSecret)}>
                  {copiedSecret ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <button onClick={() => setNewSecret(null)} className="text-muted-foreground hover:text-foreground">
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Webhook list */}
      <div className="bg-card border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="font-semibold">Configured Webhooks ({webhooks.length})</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Loading...</div>
        ) : webhooks.length === 0 ? (
          <div className="p-10 text-center">
            <Webhook className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">No webhooks yet</p>
            <p className="text-sm text-muted-foreground">
              Create a webhook to get notified when new imagery arrives over your AOI.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {webhooks.map((wh) => {
              const lastDelivery = wh.deliveries[0];
              const result = testResult[wh.id];
              return (
                <div key={wh.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium">{wh.name}</span>
                        <Badge variant={wh.active ? "success" : "outline"}>
                          {wh.active ? "Active" : "Paused"}
                        </Badge>
                        {wh.events.map((ev) => (
                          <Badge key={ev} variant="primary" className="text-[10px]">
                            {ev}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-sm font-mono text-muted-foreground truncate">{wh.url}</p>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {wh.aoiBbox && (
                          <span>AOI: <code className="text-foreground">{wh.aoiBbox}</code></span>
                        )}
                        {wh.cloudCoverLt != null && (
                          <span>☁ &lt; {wh.cloudCoverLt}%</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {wh.lastTriggeredAt
                            ? `Last fired ${new Date(wh.lastTriggeredAt).toLocaleString()}`
                            : "Never fired"}
                        </span>
                        <span>{wh._count.deliveries} deliveries</span>

                        {lastDelivery && (
                          <span className="flex items-center gap-1">
                            {lastDelivery.success
                              ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                              : <XCircle className="w-3 h-3 text-destructive" />}
                            Last: {lastDelivery.statusCode ?? "—"}
                          </span>
                        )}

                        {result && (
                          <span className={`flex items-center gap-1 ${result.success ? "text-green-500" : "text-destructive"}`}>
                            {result.success
                              ? <><CheckCircle2 className="w-3 h-3" /> Test: {result.statusCode}</>
                              : <><XCircle className="w-3 h-3" /> Test failed: {result.error}</>}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTest(wh.id)}
                        loading={testingId === wh.id}
                        title="Send test event"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(wh.id, wh.active)}
                        title={wh.active ? "Pause" : "Enable"}
                      >
                        {wh.active
                          ? <ToggleRight className="w-4 h-4 text-primary" />
                          : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(wh.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <h3 className="font-semibold mb-3">How webhooks work</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div>
            <p className="text-foreground font-medium mb-1">1. Register an AOI</p>
            <p>Set a bounding box and optional cloud cover threshold for the area you want to monitor.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">2. New imagery detected</p>
            <p>ASTRA OS checks for new scenes over your AOI every hour and fires your endpoint when matches are found.</p>
          </div>
          <div>
            <p className="text-foreground font-medium mb-1">3. Verify the signature</p>
            <p>Check the <code className="text-foreground">X-ASTRA-Signature</code> header (HMAC-SHA256) against your secret to confirm authenticity.</p>
          </div>
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">New Webhook</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ASTRA OS will POST to your URL when new imagery arrives over your AOI.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Farm monitor, Daily Paris check"
              required
            />
            <Input
              label="Endpoint URL"
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://your-server.com/hooks/astra"
              required
            />
            <Input
              label="Bounding Box (W,S,E,N) — optional, leave blank to match globally"
              value={form.aoiBbox}
              onChange={(e) => setForm((f) => ({ ...f, aoiBbox: e.target.value }))}
              placeholder="-122.52,37.70,-122.35,37.82"
            />
            <Input
              label="Max Cloud Cover % — optional"
              type="number"
              min={0}
              max={100}
              value={form.cloudCoverLt}
              onChange={(e) => setForm((f) => ({ ...f, cloudCoverLt: e.target.value }))}
              placeholder="20"
            />

            <div className="text-xs text-muted-foreground bg-white/[0.03] rounded-lg px-3 py-2">
              Event: <code>imagery.available</code> — fired when new scenes are found over your AOI
            </div>

            {createError && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{createError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" loading={creating}>Create Webhook</Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
