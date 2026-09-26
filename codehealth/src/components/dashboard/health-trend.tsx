"use client";

import type { HealthTrendPoint } from "@/lib/types";

interface HealthTrendProps {
  data: HealthTrendPoint[];
}

export function HealthTrend({ data }: HealthTrendProps) {
  if (data.length === 0) return null;

  const scores = data.map((d) => d.healthScore);
  const min = Math.max(0, Math.min(...scores) - 12);
  const max = Math.min(100, Math.max(...scores) + 8);
  const range = max - min;

  const width = 500;
  const height = 130;
  const padding = { top: 14, right: 14, bottom: 24, left: 34 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * chartW + padding.left,
    y: chartH - ((d.healthScore - min) / range) * chartH + padding.top,
    score: d.healthScore,
    label: `Scan ${d.scanNumber}`,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  const current = data[data.length - 1];
  const previous = data[data.length - 2];
  const delta = current.healthScore - previous.healthScore;

  return (
    <div className="card-comic p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-black text-white">Health Trend</h2>
          <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#4D4D66" }}>
            Last {data.length} scans
          </p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { label: "Current", value: current.healthScore, color: "#1DDF6B" },
            { label: "Previous", value: previous.healthScore, color: "#8B8BA8" },
            {
              label: "Change",
              value: `${delta >= 0 ? "+" : ""}${delta}`,
              color: delta >= 0 ? "#1DDF6B" : "#FF4D6D",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl px-3 py-2 text-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1.5px solid rgba(255,255,255,0.07)",
                boxShadow: "0 3px 0 rgba(0,0,0,0.3)",
              }}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#4D4D66" }}>
                {label}
              </p>
              <p
                className="text-base font-black"
                style={{ color, textShadow: `0 0 12px ${color}40` }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-hidden rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 130 }}>
          <defs>
            <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1DDF6B" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#1DDF6B" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#1DDF6B" stopOpacity="0" />
            </linearGradient>
            <filter id="lineGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Horizontal grid lines */}
          {[20, 40, 60, 80, 100].map((v) => {
            const y = chartH - ((v - min) / range) * chartH + padding.top;
            if (y < padding.top || y > height - padding.bottom) return null;
            return (
              <g key={v}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text x={padding.left - 6} y={y + 4} fill="#4D4D66" fontSize="9" textAnchor="end" fontWeight="700">
                  {v}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#trendAreaGrad)" />

          {/* Glow line (blurred) */}
          <path
            d={pathD}
            fill="none"
            stroke="#1DDF6B"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.2"
            filter="url(#lineGlow)"
          />

          {/* Main line */}
          <path
            d={pathD}
            fill="none"
            stroke="#1DDF6B"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => {
            const isLast = i === points.length - 1;
            return (
              <g key={i}>
                {/* Outer glow ring */}
                {isLast && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={10}
                    fill="#1DDF6B"
                    opacity="0.12"
                  />
                )}
                {/* Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isLast ? 5.5 : 3.5}
                  fill={isLast ? "#1DDF6B" : "#14141A"}
                  stroke="#1DDF6B"
                  strokeWidth={isLast ? 0 : 2}
                />
                {/* Score label above last point */}
                {isLast && (
                  <text
                    x={p.x}
                    y={p.y - 10}
                    fill="#1DDF6B"
                    fontSize="10"
                    fontWeight="800"
                    textAnchor="middle"
                  >
                    {p.score}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
