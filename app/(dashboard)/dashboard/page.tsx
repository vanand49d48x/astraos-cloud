"use client";

import { MetricCard } from "@/components/dashboard/metric-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import {
  Activity, Database, Key, Zap, Code2, Building2,
  BookOpen, Terminal, Search, CreditCard, Users, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface DashboardData {
  totalCalls: number;
  dataVolume: string;
  activeKeys: number;
  plan: string;
  userType: "developer" | "business" | null;
  useCase: string | null;
  recentRequests: Array<{
    id: string;
    endpoint: string;
    method: string;
    statusCode: number;
    timestamp: string;
  }>;
}

// ── Developer quick actions ────────────────────────────────────────────────────
const DEV_ACTIONS = [
  {
    href: "/dashboard/api-keys",
    icon: Key,
    title: "Create API Key",
    desc: "Generate a key to start making requests",
  },
  {
    href: "/dashboard/explorer",
    icon: Search,
    title: "Open Explorer",
    desc: "Search and preview satellite imagery",
  },
  {
    href: "/docs",
    icon: BookOpen,
    title: "Read the Docs",
    desc: "API reference, SDKs, and guides",
  },
];

const DEV_QUICKSTART = `# Install the Python SDK
pip install astra-sdk

# Make your first search
import astra
client = astra.create_client("YOUR_API_KEY")
results = client.search(
    bbox=(-122.5, 37.7, -122.3, 37.9),
    cloud_cover_lt=20,
)
print(f"Found {len(results.features)} scenes")`;

// ── Business quick actions ────────────────────────────────────────────────────
const BIZ_ACTIONS = [
  {
    href: "/dashboard/explorer",
    icon: Search,
    title: "Search an Area",
    desc: "Find satellite imagery for any location",
  },
  {
    href: "/dashboard/billing",
    icon: CreditCard,
    title: "Manage Billing",
    desc: "View your plan, invoices, and usage costs",
  },
  {
    href: "/dashboard/usage",
    icon: BarChart3,
    title: "View Usage Report",
    desc: "See API calls and data consumed",
  },
];

const BIZ_OUTCOMES = [
  { label: "Providers unified", value: "3+", sub: "Sentinel, Landsat & more" },
  { label: "Standard format", value: "COG", sub: "Ready for any GIS tool" },
  { label: "Single invoice", value: "1", sub: "One contract, all data" },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((json) => { if (!json.error) setData(json); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const metrics = data ?? { totalCalls: 0, dataVolume: "0 B", activeKeys: 0, plan: "Free" };
  const userType = data?.userType ?? null;
  const firstName = session?.user?.name?.split(" ")[0] ?? null;

  const isBusiness = userType === "business";
  const isDev = userType === "developer" || userType === null; // default to dev view

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">
              {firstName ? `Welcome back, ${firstName}` : "Dashboard"}
            </h1>
            {userType && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                isBusiness
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}>
                {isBusiness ? <Building2 className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
                {isBusiness ? "Business" : "Developer"}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {isBusiness
              ? "Your satellite intelligence workspace"
              : "Your API usage and developer tools"}
          </p>
        </div>

        {isDev ? (
          <Link href="/dashboard/api-keys">
            <Button size="sm">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard/explorer">
            <Button size="sm">
              <Search className="w-4 h-4 mr-2" />
              Search Imagery
            </Button>
          </Link>
        )}
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="API Calls (This Month)"
          value={loading ? "—" : metrics.totalCalls.toLocaleString()}
          change="+12%"
          changeType="positive"
          icon={Activity}
          description="vs last month"
        />
        <MetricCard
          title="Data Volume"
          value={loading ? "—" : metrics.dataVolume}
          change="+8%"
          changeType="positive"
          icon={Database}
          description="vs last month"
        />
        <MetricCard
          title={isBusiness ? "Team Members" : "Active API Keys"}
          value={loading ? "—" : metrics.activeKeys.toString()}
          icon={isBusiness ? Users : Key}
          description={isBusiness ? "in your workspace" : "across all projects"}
        />
        <MetricCard
          title="Current Plan"
          value={loading ? "—" : metrics.plan}
          icon={Zap}
          description={metrics.plan === "Free" ? "5,000 calls/mo" : "Active subscription"}
        />
      </div>

      {/* ── Usage chart ── */}
      <UsageChart />

      {/* ── Bottom section: differs by type ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-card border border-white/[0.06] rounded-xl p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          {data?.recentRequests && data.recentRequests.length > 0 ? (
            <div className="space-y-1">
              {data.recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono bg-white/5 px-2 py-1 rounded text-muted-foreground">
                      {req.method}
                    </span>
                    <span className="text-sm font-mono text-foreground/80">{req.endpoint}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-mono ${req.statusCode < 400 ? "text-green-400" : "text-red-400"}`}>
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
            <div className="text-center py-10">
              <div className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <Activity className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No activity yet.{" "}
                {isDev ? "Make your first API call to see data here." : "Search for imagery to get started."}
              </p>
              {isDev && (
                <Link href="/docs" className="text-primary text-sm hover:underline mt-2 inline-block">
                  View documentation →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right panel — differs by type */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="bg-card border border-white/[0.06] rounded-xl p-5">
            <h3 className="font-semibold mb-3 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              {(isBusiness ? BIZ_ACTIONS : DEV_ACTIONS).map((action) => (
                <Link key={action.href} href={action.href} className="block">
                  <div className="flex items-center gap-3 p-2.5 rounded-lg border border-white/[0.05] hover:border-primary/30 hover:bg-primary/5 transition-all group">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <action.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="text-xs text-muted-foreground">{action.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Developer: quickstart code snippet */}
          {isDev && (
            <div className="bg-[#08080f] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05]">
                <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Quickstart</span>
              </div>
              <pre className="p-4 text-[10.5px] font-mono text-foreground/60 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {DEV_QUICKSTART}
              </pre>
            </div>
          )}

          {/* Business: outcome stats */}
          {isBusiness && (
            <div className="bg-card border border-white/[0.06] rounded-xl p-5">
              <h3 className="font-semibold mb-3 text-sm">What ASTRA Delivers</h3>
              <div className="space-y-3">
                {BIZ_OUTCOMES.map((o) => (
                  <div key={o.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{o.label}</p>
                      <p className="text-[11px] text-muted-foreground/50">{o.sub}</p>
                    </div>
                    <span className="text-lg font-bold text-primary">{o.value}</span>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/billing">
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <Zap className="w-3.5 h-3.5 mr-2" />
                  Upgrade for more data
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
