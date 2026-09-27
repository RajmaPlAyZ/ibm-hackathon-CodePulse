"use client";

import type { HealthMetrics } from "@/lib/types";

interface HealthOverviewProps {
  metrics: HealthMetrics;
}

const metricConfig: {
  key: keyof HealthMetrics;
  label: string;
  icon: string;
}[] = [
  { key: "codeQuality",     label: "Code Quality",    icon: "◆" },
  { key: "testCoverage",    label: "Test Coverage",   icon: "◈" },
  { key: "documentation",   label: "Documentation",   icon: "◉" },
  { key: "maintainability", label: "Maintainability", icon: "⬡" },
  { key: "complexity",      label: "Complexity",      icon: "◎" },
  { key: "security",        label: "Security",        icon: "◈" },
];

function getBarStyle(value: number): {
  fillClass: string;
  color: string;
  label: string;
} {
  if (value >= 80)
    return { fillClass: "progress-fill-green", color: "#14E678", label: "Good" };
  if (value >= 60)
    return { fillClass: "progress-fill-amber", color: "#F5A623", label: "Fair" };
  return { fillClass: "progress-fill-red", color: "#F04060", label: "Poor" };
}

export function HealthOverview({ metrics }: HealthOverviewProps) {
  return (
    <div className="card-glass p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="text-[13px] font-semibold leading-tight"
            style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}
          >
            Health Overview
          </h2>
          <p className="section-label mt-0.5">Current scan</p>
        </div>

        {/* Live badge */}
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{
            background: "rgba(20,230,120,0.08)",
            border: "1px solid rgba(20,230,120,0.18)",
          }}
        >
          <div
            className="h-1.5 w-1.5 rounded-full pulse-glow"
            style={{ background: "#14E678" }}
          />
          <span
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "#14E678" }}
          >
            Live
          </span>
        </div>
      </div>

      <div className="space-y-3.5">
        {metricConfig.map(({ key, label, icon }, i) => {
          const value = metrics[key];
          const { fillClass, color } = getBarStyle(value);
          return (
            <div
              key={key}
              className="fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[9px] leading-none"
                    style={{ color: "#2A2A50" }}
                  >
                    {icon}
                  </span>
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: "#7878A0" }}
                  >
                    {label}
                  </span>
                </div>
                <span
                  className="text-[12px] font-semibold tabular-nums"
                  style={{ color, letterSpacing: "-0.01em" }}
                >
                  {value}
                  <span style={{ color: "#404060", fontSize: "10px" }}>%</span>
                </span>
              </div>
              <div className="progress-track h-1.5">
                <div className={`h-full ${fillClass}`} style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
