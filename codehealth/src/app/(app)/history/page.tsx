import { Header } from "@/components/layout/header";
import { mockHealthTrend } from "@/lib/mock-data";
import { HealthTrend } from "@/components/dashboard/health-trend";
import { History, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { getHealthColor } from "@/lib/utils-app";

export default function HistoryPage() {
  const trend = mockHealthTrend;
  const current = trend[trend.length - 1];
  const previous = trend[trend.length - 2];
  const delta = current.healthScore - previous.healthScore;

  const metricKeys = [
    { key: "codeQuality" as const, label: "Code Quality" },
    { key: "testCoverage" as const, label: "Testing" },
    { key: "documentation" as const, label: "Documentation" },
    { key: "complexity" as const, label: "Complexity" },
    { key: "security" as const, label: "Security" },
    { key: "maintainability" as const, label: "Maintainability" },
  ];

  const improvements = metricKeys.filter(
    (m) => current.metrics[m.key] > previous.metrics[m.key]
  );
  const regressions = metricKeys.filter(
    (m) => current.metrics[m.key] < previous.metrics[m.key]
  );

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header title="Health History" subtitle="Track how your codebase health evolves over time." />

      <div className="flex-1 p-6 space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <History className="h-5 w-5" style={{ color: "#22C55E" }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Health History</h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              ecommerce-platform · main · Last {trend.length} scans
            </p>
          </div>
        </div>

        {/* Comparison cards */}
        <div className="grid grid-cols-3 gap-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs mb-2" style={{ color: "#6B7280" }}>Previous Scan</p>
            <p className="text-3xl font-bold" style={{ color: getHealthColor(previous.healthScore) }}>
              {previous.healthScore}
            </p>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ background: "#151516", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <p className="text-xs mb-2" style={{ color: "#6B7280" }}>Current Scan</p>
            <p className="text-3xl font-bold" style={{ color: "#22C55E" }}>
              {current.healthScore}
            </p>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs mb-2" style={{ color: "#6B7280" }}>Improvement</p>
            <p
              className="text-3xl font-bold flex items-center gap-1"
              style={{ color: delta >= 0 ? "#22C55E" : "#EF4444" }}
            >
              {delta >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {delta >= 0 ? "+" : ""}{delta}
            </p>
          </div>
        </div>

        {/* Trend chart */}
        <HealthTrend data={trend} />

        {/* Per-metric trends */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h3 className="text-sm font-semibold text-white mb-4">Metric Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metricKeys.map(({ key, label }) => {
              const curr = current.metrics[key];
              const prev = previous.metrics[key];
              const d = curr - prev;
              const isUp = d >= 0;
              return (
                <div key={key} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-sm" style={{ color: "#9CA3AF" }}>{label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{curr}%</span>
                    <span
                      className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: isUp ? "#22C55E" : "#EF4444" }}
                    >
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isUp ? "+" : ""}{d}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Improvements / Regressions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="rounded-2xl p-5"
            style={{ background: "#151516", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            <h4 className="text-sm font-semibold mb-3" style={{ color: "#22C55E" }}>
              ✓ Improvements
            </h4>
            <ul className="space-y-2">
              {improvements.map(({ key, label }) => (
                <li key={key} className="flex items-center gap-2 text-sm" style={{ color: "#9CA3AF" }}>
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#22C55E" }} />
                  {label} +{current.metrics[key] - previous.metrics[key]}%
                </li>
              ))}
              {improvements.length === 0 && (
                <li className="text-sm" style={{ color: "#4B5563" }}>No improvements this scan</li>
              )}
            </ul>
          </div>
          <div
            className="rounded-2xl p-5"
            style={{ background: "#151516", border: "1px solid rgba(245,158,11,0.15)" }}
          >
            <h4 className="text-sm font-semibold mb-3" style={{ color: "#F59E0B" }}>
              ⚠ Regressions
            </h4>
            <ul className="space-y-2">
              {regressions.map(({ key, label }) => (
                <li key={key} className="flex items-center gap-2 text-sm" style={{ color: "#9CA3AF" }}>
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#F59E0B" }} />
                  {label} {current.metrics[key] - previous.metrics[key]}%
                </li>
              ))}
              {regressions.length === 0 && (
                <li className="text-sm" style={{ color: "#4B5563" }}>No regressions this scan 🎉</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
