"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Plus,
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface IndexChange {
  index: string;
  baseline: number;
  latest: number;
  change: number;
  changePct: number;
}

interface Report {
  id: string;
  baselineDate: string;
  latestDate: string;
  significance: "none" | "low" | "medium" | "high" | "critical";
  summary: string;
  llmAnalysis: string;
  indexChanges: IndexChange[];
  rawData: { recommendations: string[]; daysDelta: number };
  createdAt: string;
}

interface Monitor {
  id: string;
  name: string;
  watchFor: string;
  aoiBbox: string;
  indices: string[];
  collections: string[];
  cloudCoverLt: number;
  active: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
  _count: { reports: number };
  reports: Array<{ significance: string; summary: string; createdAt: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const SIG_CONFIG = {
  none:     { label: "No change",  color: "text-muted-foreground", bg: "bg-white/5",      dot: "bg-zinc-500" },
  low:      { label: "Low",        color: "text-blue-400",         bg: "bg-blue-500/10",  dot: "bg-blue-400" },
  medium:   { label: "Medium",     color: "text-yellow-400",       bg: "bg-yellow-500/10",dot: "bg-yellow-400" },
  high:     { label: "High",       color: "text-orange-400",       bg: "bg-orange-500/10",dot: "bg-orange-400" },
  critical: { label: "Critical",   color: "text-red-400",          bg: "bg-red-500/10",   dot: "bg-red-500" },
};

function SignificanceBadge({ sig }: { sig: string }) {
  const cfg = SIG_CONFIG[sig as keyof typeof SIG_CONFIG] ?? SIG_CONFIG.none;
  return (
    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ChangeBar({ change, max }: { change: number; max: number }) {
  const pct = max === 0 ? 0 : Math.min(100, (Math.abs(change) / max) * 100);
  const positive = change >= 0;
  return (
    <div className="flex items-center gap-2">
      {positive ? (
        <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
      ) : (
        <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
      )}
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${positive ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Create Monitor Dialog ────────────────────────────────────────────────────

const DEFAULT_INDICES = ["ndvi", "nbr", "ndwi"];
const ALL_INDICES = ["ndvi", "evi", "ndwi", "ndsi", "nbr"];
const INDEX_LABELS: Record<string, string> = {
  ndvi: "NDVI – Vegetation",
  evi:  "EVI – Enhanced Vegetation",
  ndwi: "NDWI – Water Content",
  ndsi: "NDSI – Snow/Ice",
  nbr:  "NBR – Burn Severity",
};

function CreateMonitorDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (m: Monitor) => void;
}) {
  const [name, setName] = useState("");
  const [watchFor, setWatchFor] = useState("");
  const [aoiBbox, setAoiBbox] = useState("");
  const [indices, setIndices] = useState<string[]>(DEFAULT_INDICES);
  const [cloudCoverLt, setCloudCoverLt] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleIndex = (idx: string) =>
    setIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );

  const submit = async () => {
    setError("");
    if (!name || !watchFor || !aoiBbox) {
      setError("Name, monitoring goal, and bounding box are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, watchFor, aoiBbox, indices, cloudCoverLt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(data.error));
      onCreate(data.monitor);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <h2 className="text-lg font-semibold">New Monitor</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Monitor name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amazon Rainforest — Sector 7"
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">What to watch for</label>
            <textarea
              value={watchFor}
              onChange={(e) => setWatchFor(e.target.value)}
              rows={3}
              placeholder="Detect deforestation, illegal logging, and vegetation loss in this area. Alert me if green cover drops significantly."
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Natural language description — be specific about what changes matter to you.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Bounding box (west, south, east, north)</label>
            <input
              type="text"
              value={aoiBbox}
              onChange={(e) => setAoiBbox(e.target.value)}
              placeholder="-62.5,-10.5,-60.5,-8.5"
              className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use the Explorer to find coordinates. Format: west,south,east,north
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Spectral indices to track</label>
            <div className="flex flex-wrap gap-2">
              {ALL_INDICES.map((idx) => (
                <button
                  key={idx}
                  onClick={() => toggleIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    indices.includes(idx)
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-white/5 text-muted-foreground border border-white/[0.08] hover:bg-white/10"
                  }`}
                >
                  {INDEX_LABELS[idx]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Max cloud cover: <span className="text-primary">{cloudCoverLt}%</span>
            </label>
            <input
              type="range"
              min={5}
              max={80}
              value={cloudCoverLt}
              onChange={(e) => setCloudCoverLt(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Monitor
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Report Detail ────────────────────────────────────────────────────────────

function ReportDetail({ report }: { report: Report }) {
  const maxChange = Math.max(...report.indexChanges.map((c) => Math.abs(c.change)), 0.001);
  const recs = report.rawData?.recommendations ?? [];

  return (
    <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
      <div className="flex items-start gap-3">
        <SignificanceBadge sig={report.significance} />
        <p className="text-sm text-muted-foreground">{report.summary}</p>
      </div>

      {/* Index changes */}
      <div className="bg-white/[0.03] rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Spectral Changes</p>
        {report.indexChanges.map((c) => (
          <div key={c.index} className="grid grid-cols-[80px_1fr_80px] items-center gap-3">
            <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">
              {c.index}
            </span>
            <ChangeBar change={c.change} max={maxChange} />
            <span className={`text-xs font-mono text-right ${c.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {c.change >= 0 ? "+" : ""}{c.change.toFixed(3)}
            </span>
          </div>
        ))}
      </div>

      {/* LLM analysis */}
      {report.llmAnalysis && (
        <div className="bg-white/[0.03] rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Analysis</p>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{report.llmAnalysis}</p>
        </div>
      )}

      {/* Recommendations */}
      {recs.length > 0 && (
        <div className="bg-white/[0.03] rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recommendations</p>
          <ul className="space-y-1.5">
            {recs.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Baseline: <span className="text-foreground">{report.baselineDate}</span></span>
        <span>Latest: <span className="text-foreground">{report.latestDate}</span></span>
        {report.rawData?.daysDelta && (
          <span>Span: <span className="text-foreground">{report.rawData.daysDelta} days</span></span>
        )}
      </div>
    </div>
  );
}

// ── Monitor Card ─────────────────────────────────────────────────────────────

function MonitorCard({
  monitor,
  onDelete,
  onToggle,
}: {
  monitor: Monitor;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [runError, setRunError] = useState("");
  const [loadingReports, setLoadingReports] = useState(false);
  const latestReport = monitor.reports[0];

  const loadReports = useCallback(async () => {
    if (reports.length > 0) return;
    setLoadingReports(true);
    const res = await fetch(`/api/monitors/${monitor.id}/reports`);
    const data = await res.json();
    setReports(data.reports ?? []);
    setLoadingReports(false);
  }, [monitor.id, reports.length]);

  const handleExpand = () => {
    if (!expanded) loadReports();
    setExpanded(!expanded);
  };

  const runNow = async () => {
    setRunning(true);
    setRunError("");
    try {
      const res = await fetch(`/api/monitors/${monitor.id}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Run failed");
      // Prepend the new report
      setReports((prev) => [data.report, ...prev]);
      if (!expanded) setExpanded(true);
    } catch (e: any) {
      setRunError(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-card border border-white/[0.06] rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm">{monitor.name}</h3>
            {monitor.active ? (
              <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full">Active</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-white/5 text-muted-foreground rounded-full">Paused</span>
            )}
            {latestReport && <SignificanceBadge sig={latestReport.significance} />}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{monitor.watchFor}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />{monitor.aoiBbox}
            </span>
            <span>{monitor._count.reports} report{monitor._count.reports !== 1 ? "s" : ""}</span>
            {monitor.lastCheckedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(monitor.lastCheckedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={runNow}
            disabled={running}
            title="Run analysis now"
            className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onToggle(monitor.id, !monitor.active)}
            title={monitor.active ? "Pause monitor" : "Resume monitor"}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
          >
            {monitor.active ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(monitor.id)}
            title="Delete monitor"
            className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleExpand}
            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {runError && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {runError}
        </div>
      )}

      {/* Indices chips */}
      <div className="flex flex-wrap gap-1.5">
        {monitor.indices.map((idx) => (
          <span key={idx} className="text-xs px-2 py-0.5 bg-white/[0.06] text-muted-foreground rounded-md font-mono uppercase">
            {idx}
          </span>
        ))}
        <span className="text-xs px-2 py-0.5 bg-white/[0.06] text-muted-foreground rounded-md">
          ≤{monitor.cloudCoverLt}% cloud
        </span>
      </div>

      {/* Latest report summary */}
      {latestReport && !expanded && (
        <div className="text-sm text-muted-foreground border-t border-white/[0.06] pt-3">
          <span className="text-foreground/70">Latest: </span>{latestReport.summary}
        </div>
      )}

      {/* Expanded reports */}
      {expanded && (
        <div className="space-y-4">
          {loadingReports && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading reports...
            </div>
          )}
          {!loadingReports && reports.length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No reports yet. Click <Play className="w-3 h-3 inline" /> to run your first analysis.
            </div>
          )}
          {reports.map((r) => (
            <div key={r.id} className="border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{new Date(r.createdAt).toLocaleString()}</span>
                <span>{r.baselineDate} → {r.latestDate}</span>
              </div>
              <ReportDetail report={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/monitors")
      .then((r) => r.json())
      .then((d) => setMonitors(d.monitors ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = (m: Monitor) => setMonitors((prev) => [m, ...prev]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this monitor and all its reports?")) return;
    await fetch(`/api/monitors/${id}`, { method: "DELETE" });
    setMonitors((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggle = async (id: string, active: boolean) => {
    await fetch(`/api/monitors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    setMonitors((prev) => prev.map((m) => (m.id === id ? { ...m, active } : m)));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" />
            Change Monitors
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Watch areas over time. AI compares satellite imagery and reports significant changes.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Monitor
        </button>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            step: "1",
            title: "Define an area",
            body: "Set a bounding box and describe what you're watching for — deforestation, construction progress, flooding, or any change.",
          },
          {
            step: "2",
            title: "Daily satellite comparison",
            body: "ASTRA fetches Sentinel-2 scenes from two time periods, computes spectral indices (NDVI, NBR, NDWI) and measures change.",
          },
          {
            step: "3",
            title: "AI-generated report",
            body: "Claude analyzes the index changes in context of your monitoring goal and rates significance (Low → Critical) with actionable insights.",
          },
        ].map((s) => (
          <div key={s.step} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center mb-3">
              {s.step}
            </div>
            <p className="font-medium text-sm mb-1">{s.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      {/* Monitor list */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading monitors...
        </div>
      ) : monitors.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/[0.12] rounded-xl">
          <Eye className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            No monitors yet. Create one to start tracking changes over time.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Create your first monitor
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {monitors.map((m) => (
            <MonitorCard
              key={m.id}
              monitor={m}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateMonitorDialog onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
