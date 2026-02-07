"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Key, Plus, Copy, Trash2, Check, AlertTriangle } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  key?: string; // Only present on creation
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys);
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedKey(data.key);
        setNewKeyName("");
        fetchKeys();
      }
    } catch {
      // Handle error
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchKeys();
      }
    } catch {
      // Handle error
    } finally {
      setRevoking(null);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeKeys = keys.filter((k) => !k.revokedAt);
  const revokedKeys = keys.filter((k) => k.revokedAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your API keys for accessing the ASTRA OS API
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Key
        </Button>
      </div>

      {/* Created key banner */}
      {createdKey && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">
                Your new API key has been created. Copy it now — you won&apos;t be able
                to see it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black/30 px-3 py-2 rounded-lg text-sm font-mono break-all">
                  {createdKey}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(createdKey)}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Active keys */}
      <div className="bg-card border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="font-semibold">Active Keys ({activeKeys.length})</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Loading...</div>
        ) : activeKeys.length === 0 ? (
          <div className="p-8 text-center">
            <Key className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No active API keys</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first key to start making API requests
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {activeKeys.map((key) => (
              <div key={key.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Key className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{key.name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      {key.prefix}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-muted-foreground hidden sm:block">
                    <p>Created {new Date(key.createdAt).toLocaleDateString()}</p>
                    {key.lastUsedAt && (
                      <p>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <Badge variant="success">Active</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(key.id)}
                    loading={revoking === key.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div className="bg-card border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-muted-foreground">
              Revoked Keys ({revokedKeys.length})
            </h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {revokedKeys.map((key) => (
              <div key={key.id} className="px-6 py-4 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Key className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{key.name}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">
                      {key.prefix}
                    </p>
                  </div>
                </div>
                <Badge variant="destructive">Revoked</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create key dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Create API Key</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Give your key a descriptive name so you can identify it later.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Key Name"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production, Development, CI/CD"
              required
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={creating}>
                Create Key
              </Button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
}
