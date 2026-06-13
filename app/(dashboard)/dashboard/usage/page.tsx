"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Activity, Database, Clock, AlertTriangle, Key, Zap } from "lucide-react";
import Link from "next/link";

interface DailyPoint { date: string; calls: number; errors: number }
interface EndpointRow { endpoint: string; count: number; avgLatency: number; percentage: number }
interface KeyRow {
  apiKeyId: string | null;
  name: string;
  prefix: string;
  revoked: boolean;
  count: number;
  percentage: number;
}

interface UsageData {
  totalCalls: number;
  totalVolume: string;
  avgLatency: number;
  errorRate: number;
  byEndpoint: EndpointRow[];
  byKey: KeyRow[];
  daily: DailyPoint[];
  plan: string;
  callLimit: number;
  period: string;
}

type Period = "7d" | "30d" | "90d";

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/usage?period=${period}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const m = data ?? {
    totalCalls: 0, totalVolume: "0 B", avgLatency: 0, errorRate: 0,
    byEndpoint: [], byKey: [], daily: [], plan: "free", callLimit: 5000, period,
  };

  const limitPct = m.callLimit > 0 ? Math.min(100, (m.totalCalls / m.callLimit) * 100) : 0;
  const nearLimit = limitPct >= 80;

  // Daily chart dimensions
  const chartH = 64;
  const maxDaily = Math.max(...m.daily.map((d) => d.calls), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usage Analytics</h1>
          <p className="text-muted-foreground">Monitor your API usage and performance metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-white/[0.06] rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                period === p ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total API Calls" value={m.totalCalls.toLocaleString()} icon={Activity} description={`Last ${period}`} />
        <MetricCard title="Data Volume" value={m.totalVolume} icon={Database} description={`Last ${period}`} />
        <MetricCard title="Avg Latency" value={`${m.avgLatency}ms`} icon={Clock} description="per request" />
        <MetricCard
          title="Error Rate"
          value={`${m.errorRate.toFixed(1)}%`}
          icon={AlertTriangle}
          changeType={m.errorRate > 5 ? "negative" : "positive"}
          description={`Last ${period}`}
        />
      </div>

      {/* Plan usage */}
      <div className={`rounded-xl p-5 border ${nearLimit ? "border-yellow-500/30 bg-yellow-500/5" : "border-white/[0.06] bg-card"}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="font-semibold text-sm capitalize">{m.plan} plan</span>
            <span className="text-muted-foreground text-sm ml-2">·</span>
            <span className="text-muted-foreground text-sm ml-2">
              {m.totalCalls.toLocaleString()} / {m.callLimit.toLocaleString()} calls
            </span>
          </div>
          <div className="flex items-center gap-2">
            {nearLimit && (
              <Badge variant="warning" className="text-[10px]">
                {Math.round(limitPct)}% used
              </Badge>
            )}
            {m.plan !== "pro" && m.plan !== "enterprise" && (
              <Link href="/dashboard/billing">
                <Button size="sm" className="gap-1.5 text-xs">
                  <Zap className="w-3 h-3" />
                  Upgrade
                </Button>
              </Link>
            )}
          </div>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${nearLimit ? "bg-yellow-500" : "bg-primary"}`}
            style={{ width: `${limitPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">Resets monthly</p>
      </div>

      {/* Daily trend chart */}
      {m.daily.length > 0 && (
        <div className="bg-card border border-white/[0.06] rounded-xl p-6">
          <h3 className="font-semibold mb-4">Daily Calls</h3>
          <div className="flex items-end gap-1" style={{ height: chartH }}>
            {m.daily.map((d) => {
              const h = Math.max(2, (d.calls / maxDaily) * chartH);
              const errH = d.calls > 0 ? (d.errors / d.calls) * h : 0;
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                  <div
                    className="w-full rounded-sm bg-primary/60 hover:bg-primary/80 transition-colors relative overflow-hidden"
                    style={{ height: h }}
                    title={`${d.date}: ${d.calls} calls${d.errors ? `, ${d.errors} errors` : ""}`}
                  >
                    {errH > 0 && (
                      <div
                        className="absolute bottom-0 w-full bg-destructive/60"
                        style={{ height: errH }}
                      />
                    )}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-popover border border-white/10 rounded px-2 py-1 text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                    <p className="font-medium">{d.date}</p>
                    <p>{d.calls.toLocaleString()} calls</p>
                    {d.errors > 0 && <p className="text-destructive">{d.errors} errors</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
            <span>{m.daily[0]?.date}</span>
            <span>{m.daily[m.daily.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Two-column: endpoint + key breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By endpoint */}
        <div className="bg-card border border-white/[0.06] rounded-xl p-6">
          <h3 className="font-semibold mb-4">Usage by Endpoint</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : m.byEndpoint.length === 0 ? (
            <div className="text-center py-6">
              <Activity className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No calls yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {m.byEndpoint.map((ep) => (
                <div key={ep.endpoint}>
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-xs font-mono text-foreground">{ep.endpoint}</code>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{ep.avgLatency}ms avg</span>
                      <span>{ep.count.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="bg-primary/60 h-1.5 rounded-full" style={{ width: `${ep.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By API key */}
        <div className="bg-card border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Usage by API Key</h3>
            <Link href="/dashboard/api-keys">
              <Button variant="ghost" size="sm" className="text-xs gap-1.5">
                <Key className="w-3 h-3" />
                Manage keys
              </Button>
            </Link>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : m.byKey.length === 0 ? (
            <div className="text-center py-6">
              <Key className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No API key calls yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Calls from the Explorer appear as "Dashboard"
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {m.byKey.map((k, i) => (
                <div key={k.apiKeyId ?? `session-${i}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium truncate">{k.name}</span>
                      {k.prefix && (
                        <code className="text-[10px] text-muted-foreground font-mono">{k.prefix}</code>
                      )}
                      {k.revoked && <Badge variant="destructive" className="text-[9px] px-1">Revoked</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {k.count.toLocaleString()} ({k.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${k.revoked ? "bg-destructive/40" : "bg-violet-500/60"}`}
                      style={{ width: `${k.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
