"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Activity, Database, Clock, AlertTriangle } from "lucide-react";

interface UsageData {
  totalCalls: number;
  totalVolume: string;
  avgLatency: number;
  errorRate: number;
  byEndpoint: Array<{ endpoint: string; count: number; percentage: number }>;
  daily: Array<{ date: string; calls: number; volume: number }>;
}

export default function UsagePage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch(`/api/usage?period=${period}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Fallback to empty
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, [period]);

  const metrics = data || {
    totalCalls: 0,
    totalVolume: "0 B",
    avgLatency: 0,
    errorRate: 0,
    byEndpoint: [],
    daily: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usage Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your API usage and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-white/[0.06] rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                period === p
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total API Calls"
          value={metrics.totalCalls.toLocaleString()}
          icon={Activity}
          description={`Last ${period}`}
        />
        <MetricCard
          title="Data Volume"
          value={metrics.totalVolume}
          icon={Database}
          description={`Last ${period}`}
        />
        <MetricCard
          title="Avg Latency"
          value={`${metrics.avgLatency}ms`}
          icon={Clock}
          description="per request"
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(1)}%`}
          icon={AlertTriangle}
          changeType={metrics.errorRate > 5 ? "negative" : "positive"}
          description={`Last ${period}`}
        />
      </div>

      {/* Usage by endpoint */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <h3 className="font-semibold mb-4">Usage by Endpoint</h3>

        {metrics.byEndpoint.length > 0 ? (
          <div className="space-y-3">
            {metrics.byEndpoint.map((ep) => (
              <div key={ep.endpoint} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-sm font-mono">{ep.endpoint}</code>
                    <span className="text-sm text-muted-foreground">
                      {ep.count.toLocaleString()} calls
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2">
                    <div
                      className="bg-primary/60 h-2 rounded-full transition-all"
                      style={{ width: `${ep.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No usage data yet. Make API calls to see analytics.
            </p>
          </div>
        )}
      </div>

      {/* Plan usage */}
      <div className="bg-card border border-white/[0.06] rounded-xl p-6">
        <h3 className="font-semibold mb-4">Plan Usage</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">API Calls</span>
              <span className="text-sm text-muted-foreground">
                {metrics.totalCalls.toLocaleString()} / 5,000
              </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (metrics.totalCalls / 5000) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Free plan — resets monthly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
