"use client";

import type { HealthMetrics } from "@/lib/types";

interface HealthOverviewProps {
  metrics: HealthMetrics;
}

const metricConfig: { key: keyof HealthMetrics; label: string; emoji: string }[] = [
  { key: "codeQuality",    label: "Code Quality",    emoji: "✦" },
  { key: "testCoverage",   label: "Testing",         emoji: "◈" },
  { key: "documentation",  label: "Documentation",   emoji: "⊡" },
  { key: "maintainability",label: "Maintainability", emoji: "⬡" },
  { key: "complexity",     label: "Complexity",      emoji: "◎" },
  { key: "security",       label: "Security",        emoji: "⬟" },
];

function getBarColor(value: number) {
  if (value >= 80) return { fill: "progress-fill-green", color: "#1DDF6B", glow: "rgba(29,223,107,0.5)" };
  if (value >= 60) return { fill: "progress-fill-amber", color: "#FFB830", glow: "rgba(255,184,48,0.4)" };
  return { fill: "progress-fill-red", color: "#FF4D6D", glow: "rgba(255,77,109,0.4)" };
}

export function HealthOverview({ metrics }: HealthOverviewProps) {
  return (
    <div className="card-comic p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-black text-white">Code Health Overview</h2>
          <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#4D4D66" }}>
            Current Scan
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{
            background: "rgba(29,223,107,0.1)",
            border: "1.5px solid rgba(29,223,107,0.2)",
            boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
          }}
        >
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#1DDF6B", boxShadow: "0 0 6px #1DDF6B" }} />
          <span className="text-[10px] font-bold" style={{ color: "#1DDF6B" }}>LIVE</span>
        </div>
      </div>

      <div className="space-y-4">
        {metricConfig.map(({ key, label, emoji }) => {
          const value = metrics[key];
          const { fill, color, glow } = getBarColor(value);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "#4D4D66" }}>{emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: "#8B8BA8" }}>{label}</span>
                </div>
                <span
                  className="text-xs font-black"
                  style={{ color, textShadow: `0 0 8px ${glow}` }}
                >
                  {value}%
                </span>
              </div>
              {/* Track */}
              <div className="progress-track h-2.5">
                <div
                  className={`h-full ${fill}`}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
