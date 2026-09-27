"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/layout/header";
import { HealthTrend } from "@/components/dashboard/health-trend";
import {
  History,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Plus,
} from "lucide-react";
import type { HealthTrendPoint, HealthMetrics } from "@/lib/types";
import Link from "next/link";

function getHealthTheme(score: number): { color: string; glow: string } {
  if (score >= 80) return { color: "#14E678", glow: "rgba(20,230,120,0.3)" };
  if (score >= 60) return { color: "#F5A623", glow: "rgba(245,166,35,0.3)" };
  return { color: "#F04060", glow: "rgba(240,64,96,0.3)" };
}

function buildTrend(
  scans: Array<{
    _id: string;
    healthScore?: number;
    codeQualityScore?: number;
    testingScore?: number;
    documentationScore?: number;
    complexityScore?: number;
    securityScore?: number;
    maintainabilityScore?: number;
    completedAt?: number;
    status: string;
  }>
): HealthTrendPoint[] {
  return scans
    .filter((s) => s.status === "completed" && s.healthScore !== undefined)
    .slice()
    .reverse()
    .map((s, i) => ({
      scanId: s._id,
      scanNumber: i + 1,
      date: new Date(s.completedAt ?? Date.now()),
      healthScore: s.healthScore!,
      metrics: {
        codeQuality: s.codeQualityScore ?? 0,
        testCoverage: s.testingScore ?? 0,
        documentation: s.documentationScore ?? 0,
        complexity: s.complexityScore ?? 0,
        security: s.securityScore ?? 0,
        maintainability: s.maintainabilityScore ?? 0,
      } as HealthMetrics,
    }));
}

const metricKeys: Array<{ key: keyof HealthMetrics; label: string; icon: string }> = [
  { key: "codeQuality",     label: "Code Quality",    icon: "◆" },
  { key: "testCoverage",    label: "Testing",         icon: "◈" },
  { key: "documentation",   label: "Documentation",   icon: "◉" },
  { key: "complexity",      label: "Complexity",      icon: "◎" },
  { key: "security",        label: "Security",        icon: "◈" },
  { key: "maintainability", label: "Maintainability", icon: "⬡" },
];

export default function HistoryPage() {
  const { user } = useUser();

  const repositories = useQuery(
    api.repositories.list,
    user ? { userId: user.id } : "skip"
  );
  const featuredRepo = repositories?.[0];
  const scans = useQuery(
    api.scans.listByRepository,
    featuredRepo ? { repositoryId: featuredRepo._id } : "skip"
  );

  const isLoading = repositories === undefined || (featuredRepo && scans === undefined);
  const hasRepos = (repositories?.length ?? 0) > 0;

  // ── Loading ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#080810" }}>
        <Header title="Health History" subtitle="Track how your codebase evolves over time." />
        <div className="flex-1 p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-glass animate-pulse" style={{ height: 120 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── No repos ─────────────────────────────────────────────────────
  if (!hasRepos) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#080810" }}>
        <Header title="Health History" subtitle="Track how your codebase evolves over time." />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl mb-6"
            style={{
              background: "rgba(20,230,120,0.08)",
              border: "1.5px solid rgba(20,230,120,0.15)",
              boxShadow: "0 0 32px rgba(20,230,120,0.06)",
            }}
          >
            <FolderGit2 className="h-10 w-10" style={{ color: "#14E678" }} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
            No repositories connected
          </h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: "#7878A0" }}>
            Connect a repository and run scans to see health history here.
          </p>
          <Link href="/repositories" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Connect a Repository
          </Link>
        </div>
      </div>
    );
  }

  const trend = buildTrend(scans ?? []);

  // ── No scans yet ─────────────────────────────────────────────────
  if (trend.length === 0) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#080810" }}>
        <Header title="Health History" subtitle="Track how your codebase evolves over time." />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-3xl mb-6"
            style={{
              background: "rgba(20,230,120,0.08)",
              border: "1.5px solid rgba(20,230,120,0.15)",
              boxShadow: "0 0 32px rgba(20,230,120,0.06)",
            }}
          >
            <History className="h-10 w-10" style={{ color: "#14E678" }} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
            No scan history yet
          </h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: "#7878A0" }}>
            Run at least one scan on{" "}
            <span className="font-semibold" style={{ color: "#F0F0FF" }}>{featuredRepo!.name}</span>{" "}
            to start tracking its health over time.
          </p>
          <Link href={`/repositories/${featuredRepo!._id}`} className="btn-primary flex items-center gap-2">
            <History className="h-4 w-4" />
            Analyze Repository
          </Link>
        </div>
      </div>
    );
  }

  const current = trend[trend.length - 1];
  const previous = trend.length >= 2 ? trend[trend.length - 2] : null;
  const delta = previous ? current.healthScore - previous.healthScore : null;
  const currentTheme = getHealthTheme(current.healthScore);
  const prevTheme = previous ? getHealthTheme(previous.healthScore) : currentTheme;

  const improvements = previous
    ? metricKeys.filter((m) => current.metrics[m.key] > previous.metrics[m.key])
    : [];
  const regressions = previous
    ? metricKeys.filter((m) => current.metrics[m.key] < previous.metrics[m.key])
    : [];

  return (
    <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
      <Header title="Health History" subtitle="Track how your codebase evolves over time." />

      <div className="flex-1 p-6 space-y-6">

        {/* ── Title row ── */}
        <div className="fade-up flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "rgba(20,230,120,0.10)",
              border: "1px solid rgba(20,230,120,0.2)",
              boxShadow: "0 0 16px rgba(20,230,120,0.06)",
            }}
          >
            <History className="h-5 w-5" style={{ color: "#14E678" }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#F0F0FF", letterSpacing: "-0.02em" }}>
              Health History
            </h2>
            <p className="section-label mt-0.5">
              {featuredRepo!.name} · {featuredRepo!.selectedBranch} · Last {trend.length} scan{trend.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── Comparison score cards ── */}
        <div className="fade-up grid grid-cols-3 gap-4" style={{ animationDelay: "60ms" }}>
          {/* Previous */}
          <div
            className="card-glass p-5"
          >
            <p className="section-label mb-3">{previous ? "Previous Scan" : "First Scan"}</p>
            <p
              className="font-bold leading-none"
              style={{
                fontSize: "2.25rem",
                letterSpacing: "-0.04em",
                color: prevTheme.color,
                textShadow: `0 0 20px ${prevTheme.glow}`,
              }}
            >
              {previous?.healthScore ?? current.healthScore}
            </p>
            <p className="text-[11px] font-medium mt-2" style={{ color: "#404060" }}>/ 100</p>
          </div>

          {/* Current */}
          <div className="card-glass-green p-5">
            <p className="section-label mb-3" style={{ color: "#14E678" }}>Current Scan</p>
            <p
              className="font-bold leading-none"
              style={{
                fontSize: "2.25rem",
                letterSpacing: "-0.04em",
                color: currentTheme.color,
                textShadow: `0 0 20px ${currentTheme.glow}`,
              }}
            >
              {current.healthScore}
            </p>
            <p className="text-[11px] font-medium mt-2" style={{ color: "#404060" }}>/ 100</p>
          </div>

          {/* Delta */}
          <div className="card-glass p-5">
            <p className="section-label mb-3">Change</p>
            {delta !== null ? (
              <>
                <p
                  className="font-bold leading-none flex items-center gap-1"
                  style={{
                    fontSize: "2.25rem",
                    letterSpacing: "-0.04em",
                    color: delta >= 0 ? "#14E678" : "#F04060",
                    textShadow: `0 0 20px ${delta >= 0 ? "rgba(20,230,120,0.3)" : "rgba(240,64,96,0.3)"}`,
                  }}
                >
                  {delta >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {delta >= 0 ? "+" : ""}{delta}
                </p>
                <p className="text-[11px] font-medium mt-2" style={{ color: "#404060" }}>vs prev scan</p>
              </>
            ) : (
              <p
                className="font-bold leading-none"
                style={{ fontSize: "2.25rem", letterSpacing: "-0.04em", color: "#14E678" }}
              >
                —
              </p>
            )}
          </div>
        </div>

        {/* ── Trend chart ── */}
        <div className="fade-up" style={{ animationDelay: "120ms" }}>
          {trend.length >= 2 ? (
            <HealthTrend data={trend} />
          ) : (
            <div
              className="card-glass p-6 flex flex-col items-center justify-center text-center"
              style={{ minHeight: 160 }}
            >
              <p className="text-[13px] font-semibold" style={{ color: "#F0F0FF" }}>Health Trend</p>
              <p className="text-[12px] mt-1" style={{ color: "#404060" }}>
                Run at least 2 scans to see the trend chart.
              </p>
            </div>
          )}
        </div>

        {/* ── Per-metric trends ── */}
        {previous && (
          <div className="fade-up card-glass p-5" style={{ animationDelay: "160ms" }}>
            <h3 className="text-[13px] font-semibold mb-5" style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}>
              Metric Trends
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
              {metricKeys.map(({ key, label, icon }, i) => {
                const curr = current.metrics[key];
                const prev = previous.metrics[key];
                const d = curr - prev;
                const isUp = d >= 0;
                const theme = getHealthTheme(curr);
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[9px]" style={{ color: "#2A2A50" }}>{icon}</span>
                      <span className="text-[12px] font-medium" style={{ color: "#7878A0" }}>{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[13px] font-semibold tabular-nums"
                        style={{ color: theme.color, letterSpacing: "-0.01em" }}
                      >
                        {curr}%
                      </span>
                      <span
                        className="flex items-center gap-0.5 text-[11px] font-semibold tabular-nums"
                        style={{ color: isUp ? "#14E678" : "#F04060" }}
                      >
                        {isUp ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isUp ? "+" : ""}{d}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Improvements / Regressions ── */}
        {previous && (
          <div className="fade-up grid grid-cols-1 md:grid-cols-2 gap-4" style={{ animationDelay: "200ms" }}>
            {/* Improvements */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(20,230,120,0.04)",
                border: "1px solid rgba(20,230,120,0.15)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(20,230,120,0.05)",
              }}
            >
              <h4 className="text-[12px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#14E678" }}>
                <CheckCircle2 className="h-4 w-4" />
                Improvements
              </h4>
              <ul className="space-y-2">
                {improvements.map(({ key, label }) => (
                  <li key={key} className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "#7878A0" }}>
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#14E678" }} />
                    {label}{" "}
                    <span style={{ color: "#14E678" }}>
                      +{current.metrics[key] - previous.metrics[key]}%
                    </span>
                  </li>
                ))}
                {improvements.length === 0 && (
                  <li className="text-[12px]" style={{ color: "#404060" }}>No improvements this scan</li>
                )}
              </ul>
            </div>

            {/* Regressions */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(245,166,35,0.04)",
                border: "1px solid rgba(245,166,35,0.15)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(245,166,35,0.05)",
              }}
            >
              <h4 className="text-[12px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: "#F5A623" }}>
                <AlertTriangle className="h-4 w-4" />
                Regressions
              </h4>
              <ul className="space-y-2">
                {regressions.map(({ key, label }) => (
                  <li key={key} className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "#7878A0" }}>
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#F5A623" }} />
                    {label}{" "}
                    <span style={{ color: "#F04060" }}>
                      {current.metrics[key] - previous.metrics[key]}%
                    </span>
                  </li>
                ))}
                {regressions.length === 0 && (
                  <li className="text-[12px]" style={{ color: "#404060" }}>No regressions this scan 🎉</li>
                )}
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
