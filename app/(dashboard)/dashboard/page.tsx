"use client";

import { MetricCard } from "@/components/dashboard/metric-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { Activity, Database, Key, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface DashboardData {
  totalCalls: number;
  dataVolume: string;
  activeKeys: number;
  plan: string;
  recentRequests: Array<{
    id: string;
    endpoint: string;
    method: string;
    statusCode: number;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Will show fallback data
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Fallback for when DB isn't connected yet
  const metrics = data || {
    totalCalls: 0,
    dataVolume: "0 B",
    activeKeys: 0,
    plan: "Free",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}
          </p>
        </div>
        <Link href="/dashboard/api-keys">
          <Button size="sm">
            <Key className="w-4 h-4 mr-2" />
            Manage Keys
          </Button>
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="API Calls (This Month)"
          value={metrics.totalCalls.toLocaleString()}
          change="+12%"
          changeType="positive"
          icon={Activity}
          description="vs last month"
        />
        <MetricCard
          title="Data Volume"
          value={metrics.dataVolume}
          change="+8%"
          changeType="positive"
          icon={Database}
          description="vs last month"
        />
        <MetricCard
          title="Active Keys"
          value={metrics.activeKeys.toString()}
          icon={Key}
          description="across all teams"
        />
        <MetricCard
          title="Current Plan"
          value={metrics.plan}
          icon={Zap}
          description={metrics.plan === "Free" ? "5,000 calls/mo" : ""}
        />
      </div>

      {/* Usage chart */}
      <UsageChart />

      {/* Recent activity + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-card border border-white/[0.06] rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          {data?.recentRequests && data.recentRequests.length > 0 ? (
            <div className="space-y-3">
              {data.recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded">
                      {req.method}
                    </span>
                    <span className="text-sm">{req.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono ${
                        req.statusCode < 400 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {req.statusCode}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                No recent activity. Make your first API call to see data here.
              </p>
              <Link href="/docs" className="text-primary text-sm hover:underline mt-2 inline-block">
                View documentation
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-card border border-white/[0.06] rounded-xl p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href="/dashboard/api-keys" className="block">
              <div className="p-3 rounded-lg border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5 transition-all">
                <p className="text-sm font-medium">Create API Key</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate a new key to start making requests
                </p>
              </div>
            </Link>
            <Link href="/dashboard/explorer" className="block">
              <div className="p-3 rounded-lg border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5 transition-all">
                <p className="text-sm font-medium">Open Explorer</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Search and browse satellite imagery
                </p>
              </div>
            </Link>
            <Link href="/docs" className="block">
              <div className="p-3 rounded-lg border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5 transition-all">
                <p className="text-sm font-medium">Read Docs</p>
                <p className="text-xs text-muted-foreground mt-1">
                  API reference and getting started guide
                </p>
              </div>
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="block">
              <div className="p-3 rounded-lg border border-white/[0.06] hover:border-primary/30 hover:bg-primary/5 transition-all">
                <p className="text-sm font-medium">Python SDK</p>
                <p className="text-xs text-muted-foreground mt-1">
                  pip install astra-sdk
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
