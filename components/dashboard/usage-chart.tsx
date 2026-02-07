"use client";

import { useEffect, useState } from "react";

interface DataPoint {
  date: string;
  calls: number;
}

// Generate realistic-looking usage data for the past 30 days
function generateUsageData(): DataPoint[] {
  const data: DataPoint[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Base usage with some variance and a general upward trend
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const base = 50 + (29 - i) * 3; // Upward trend
    const noise = Math.floor(Math.random() * 40) - 20;
    const weekendDip = isWeekend ? -20 : 0;
    const calls = Math.max(10, base + noise + weekendDip);

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      calls,
    });
  }

  return data;
}

export function UsageChart() {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    setData(generateUsageData());
  }, []);

  if (data.length === 0) return null;

  const maxCalls = Math.max(...data.map((d) => d.calls));
  const chartHeight = 200;

  return (
    <div className="bg-card border border-white/[0.06] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold">API Calls</h3>
          <p className="text-sm text-muted-foreground">Last 30 days</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">Requests</span>
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <svg
          viewBox={`0 0 ${data.length * 24} ${chartHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Gradient fill */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(0, 212, 255)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(0, 212, 255)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`
              M 0 ${chartHeight}
              ${data
                .map(
                  (d, i) =>
                    `L ${i * 24 + 12} ${chartHeight - (d.calls / maxCalls) * (chartHeight - 20)}`
                )
                .join(" ")}
              L ${(data.length - 1) * 24 + 12} ${chartHeight}
              Z
            `}
            fill="url(#chartGradient)"
          />

          {/* Line */}
          <path
            d={data
              .map(
                (d, i) =>
                  `${i === 0 ? "M" : "L"} ${i * 24 + 12} ${chartHeight - (d.calls / maxCalls) * (chartHeight - 20)}`
              )
              .join(" ")}
            fill="none"
            stroke="rgb(0, 212, 255)"
            strokeWidth="2"
          />

          {/* Dots */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={i * 24 + 12}
              cy={chartHeight - (d.calls / maxCalls) * (chartHeight - 20)}
              r="2"
              fill="rgb(0, 212, 255)"
              className="opacity-0 hover:opacity-100 transition-opacity"
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground pointer-events-none">
          <span>{maxCalls}</span>
          <span>{Math.round(maxCalls / 2)}</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
