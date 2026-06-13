"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
} from "recharts";

export interface ChartPoint {
  date: string;
  [index: string]: number | null | string;
}

export interface TrendLine {
  slope: number;
  changePer30Days: number;
  totalChange: number;
  direction: "increasing" | "stable" | "decreasing";
  rSquared: number;
}

export interface Anomaly {
  date: string;
  index: string;
  value: number;
  expectedMean: number;
  zScore: number;
  direction: "above" | "below";
}

interface Props {
  points: ChartPoint[];
  trends: Record<string, TrendLine>;
  anomalies: Anomaly[];
  indices: string[];
}

const INDEX_COLORS: Record<string, string> = {
  ndvi: "#22c55e",
  evi:  "#16a34a",
  ndwi: "#38bdf8",
  ndsi: "#a78bfa",
  nbr:  "#f97316",
};

const INDEX_LABELS: Record<string, string> = {
  ndvi: "NDVI",
  evi:  "EVI",
  ndwi: "NDWI",
  ndsi: "NDSI",
  nbr:  "NBR",
};

const DIRECTION_ICON: Record<string, string> = {
  increasing: "↑",
  decreasing: "↓",
  stable:     "→",
};

const DIRECTION_COLOR: Record<string, string> = {
  increasing: "text-green-400",
  decreasing: "text-red-400",
  stable:     "text-muted-foreground",
};

function CustomTooltip({ active, payload, label, anomalies }: any) {
  if (!active || !payload?.length) return null;

  const dateAnomalies = anomalies.filter((a: Anomaly) => a.date === label);

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-lg p-3 text-xs shadow-xl min-w-[160px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 mb-0.5">
          <span style={{ color: entry.color }}>{INDEX_LABELS[entry.dataKey] ?? entry.dataKey}</span>
          <span className="font-mono">
            {entry.value != null ? entry.value.toFixed(4) : "—"}
          </span>
        </div>
      ))}
      {dateAnomalies.map((a: Anomaly) => (
        <div
          key={a.index}
          className={`mt-1.5 text-xs px-1.5 py-0.5 rounded ${
            a.direction === "above" ? "bg-orange-500/20 text-orange-300" : "bg-blue-500/20 text-blue-300"
          }`}
        >
          {INDEX_LABELS[a.index]} anomaly (z={a.zScore > 0 ? "+" : ""}{a.zScore})
        </div>
      ))}
    </div>
  );
}

function CustomDot(props: any) {
  const { cx, cy, payload, dataKey, anomalies } = props;
  const isAnomaly = anomalies.some(
    (a: Anomaly) => a.date === payload.date && a.index === dataKey
  );
  if (!isAnomaly || payload[dataKey] == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#f97316"
      stroke="#fff"
      strokeWidth={1.5}
    />
  );
}

export function TimeSeriesChart({ points, trends, anomalies, indices }: Props) {
  // Filter out fully missing points for chart
  const chartData = points.map((p) => ({ ...p }));

  // Anomaly vertical lines (unique dates)
  const anomalyDates = [...new Set(anomalies.map((a) => a.date))];

  return (
    <div className="space-y-4">
      {/* Trend summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {indices.map((idx) => {
          const t = trends[idx];
          if (!t) return null;
          return (
            <div
              key={idx}
              className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-bold uppercase"
                  style={{ color: INDEX_COLORS[idx] ?? "#fff" }}
                >
                  {INDEX_LABELS[idx] ?? idx}
                </span>
                <span className={`text-sm font-bold ${DIRECTION_COLOR[t.direction]}`}>
                  {DIRECTION_ICON[t.direction]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t.changePer30Days > 0 ? "+" : ""}
                {t.changePer30Days.toFixed(4)} / 30 days
              </p>
              <p className="text-xs text-muted-foreground">
                Total: {t.totalChange > 0 ? "+" : ""}
                {t.totalChange.toFixed(3)} · R²={t.rSquared.toFixed(2)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main line chart */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickFormatter={(v) => {
                const d = new Date(v + "T00:00:00Z");
                return `${d.toLocaleString("default", { month: "short" })} '${String(d.getUTCFullYear()).slice(2)}`;
              }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fill: "#71717a" }}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <Tooltip
              content={<CustomTooltip anomalies={anomalies} />}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: INDEX_COLORS[value] ?? "#fff", fontSize: 11 }}>
                  {INDEX_LABELS[value] ?? value}
                </span>
              )}
            />
            {/* Anomaly reference lines */}
            {anomalyDates.map((d) => (
              <ReferenceLine
                key={d}
                x={d}
                stroke="rgba(249,115,22,0.3)"
                strokeDasharray="4 2"
              />
            ))}
            {indices.map((idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={idx}
                stroke={INDEX_COLORS[idx] ?? "#fff"}
                strokeWidth={2}
                dot={(props: any) => (
                  <CustomDot {...props} dataKey={idx} anomalies={anomalies} />
                )}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly list */}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Detected anomalies ({anomalies.length})
          </p>
          {anomalies.map((a, i) => (
            <div
              key={i}
              className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                a.direction === "above"
                  ? "bg-orange-500/10 text-orange-300"
                  : "bg-blue-500/10 text-blue-300"
              }`}
            >
              <span>
                {a.date} — {INDEX_LABELS[a.index] ?? a.index}{" "}
                {a.direction === "above" ? "unusually high" : "unusually low"}
              </span>
              <span className="font-mono ml-4">
                {a.value.toFixed(3)} vs avg {a.expectedMean.toFixed(3)} (z={a.zScore > 0 ? "+" : ""}{a.zScore})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
