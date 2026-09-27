"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Header } from "@/components/layout/header";
import { HealthOverview } from "@/components/dashboard/health-overview";
import { HealthTrend } from "@/components/dashboard/health-trend";
import { FindingCard } from "@/components/findings/finding-card";
import { ScanProgress } from "@/components/scans/scan-progress";
import { useScan } from "@/hooks/useScan";
import { formatTimeAgo } from "@/lib/utils-app";
import type { HealthMetrics, HealthTrendPoint, Severity, FindingCategory, FindingStatus } from "@/lib/types";
import {
  Play, GitBranch, Clock, ChevronLeft,
  AlertTriangle, Loader2, CheckCircle2, X,
  Search, Sparkles, History, Brain, RefreshCw, WifiOff, Zap,
  FileCode, ArrowRight,
} from "lucide-react";

function getHealthColor(score: number) {
  if (score >= 80) return "#1DDF6B";
  if (score >= 60) return "#FFB830";
  return "#FF4D6D";
}

type Tab = "Overview" | "Findings" | "History" | "AI Insights";

const severityTabs: { label: string; value: Severity | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const severityColors: Record<string, string> = {
  critical: "#FF4D6D",
  high: "#FF8C32",
  medium: "#FFB830",
  low: "#4E9EFF",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function RepositoryDetailPage({ params }: Props) {
  const { id } = use(params);
  const repoId = id as Id<"repositories">;

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [findingSeverity, setFindingSeverity] = useState<Severity | "all">("all");
  const [findingSearch, setFindingSearch] = useState("");

  const repo = useQuery(api.repositories.get, { id: repoId });
  const scans = useQuery(api.scans.listByRepository, { repositoryId: repoId });
  const findings = useQuery(api.findings.listByRepository, { repositoryId: repoId });

  const { startScan, scan: liveScan, isStarting, isRunning, error: scanError, clearError } = useScan(
    repo ? {
      repositoryId: repoId,
      owner: repo.owner,
      repo: repo.name,
      branch: repo.selectedBranch,
    } : {
      repositoryId: repoId,
      owner: "",
      repo: "",
      branch: "",
    }
  );

  // Loading state
  if (repo === undefined) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#0D0D10" }}>
        <Header title="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1DDF6B" }} />
        </div>
      </div>
    );
  }

  if (repo === null) notFound();

  // Build metrics from latest scan
  const latestScan = scans
    ?.filter((s) => s.status === "completed")
    .sort((a, b) => b.startedAt - a.startedAt)[0];

  const metrics: HealthMetrics | null = latestScan
    ? {
        codeQuality: latestScan.codeQualityScore ?? 0,
        testCoverage: latestScan.testingScore ?? 0,
        documentation: latestScan.documentationScore ?? 0,
        complexity: latestScan.complexityScore ?? 0,
        security: latestScan.securityScore ?? 0,
        maintainability: latestScan.maintainabilityScore ?? 0,
      }
    : null;

  // Build trend data from completed scans
  const trendData: HealthTrendPoint[] = (scans ?? [])
    .filter((s) => s.status === "completed" && s.healthScore !== undefined)
    .sort((a, b) => a.startedAt - b.startedAt)
    .slice(-6)
    .map((s, i) => ({
      scanId: s._id,
      scanNumber: i + 1,
      date: new Date(s.startedAt),
      healthScore: s.healthScore!,
      metrics: {
        codeQuality: s.codeQualityScore ?? 0,
        testCoverage: s.testingScore ?? 0,
        documentation: s.documentationScore ?? 0,
        complexity: s.complexityScore ?? 0,
        security: s.securityScore ?? 0,
        maintainability: s.maintainabilityScore ?? 0,
      },
    }));

  // All findings mapped to UI type
  const allUIFindings = (findings ?? []).map((f) => ({
    id: f._id as string,
    repositoryId: f.repositoryId as string,
    repositoryName: repo.name,
    severity: f.severity as Severity,
    category: f.category as FindingCategory,
    title: f.title,
    description: f.description,
    file: f.file,
    line: f.line,
    status: f.status as FindingStatus,
    detectedAt: new Date(f.createdAt),
    ruleId: f.ruleId,
    codeSnippet: f.evidence,
    recommendedAction: f.recommendation,
  }));

  // Findings shown in Overview tab (first 6)
  const uiFindings = allUIFindings.slice(0, 6);

  // Filtered findings for Findings tab
  const filteredFindings = allUIFindings.filter((f) => {
    const matchSev = findingSeverity === "all" || f.severity === findingSeverity;
    const matchSearch =
      !findingSearch ||
      f.title.toLowerCase().includes(findingSearch.toLowerCase()) ||
      f.file.toLowerCase().includes(findingSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(findingSearch.toLowerCase());
    return matchSev && matchSearch;
  });

  const findingCounts: Record<string, number> = {
    all: allUIFindings.length,
    critical: allUIFindings.filter((f) => f.severity === "critical").length,
    high: allUIFindings.filter((f) => f.severity === "high").length,
    medium: allUIFindings.filter((f) => f.severity === "medium").length,
    low: allUIFindings.filter((f) => f.severity === "low").length,
  };

  // Determine active scan: live scan from hook or latest running scan from Convex
  const runningScan = liveScan ?? (scans ?? []).find(
    (s) => s.status === "running" || s.status === "queued"
  );

  const metricItems = [
    { label: "Code Quality", value: latestScan?.codeQualityScore },
    { label: "Testing", value: latestScan?.testingScore },
    { label: "Documentation", value: latestScan?.documentationScore },
    { label: "Complexity", value: latestScan?.complexityScore },
    { label: "Security", value: latestScan?.securityScore },
    { label: "Maintainability", value: latestScan?.maintainabilityScore },
  ];

  const healthScore = repo.lastHealthScore;
  const healthColor = healthScore ? getHealthColor(healthScore) : "#4D4D66";

  // Completed scans for History tab (most recent first)
  const completedScans = (scans ?? [])
    .filter((s) => s.status === "completed")
    .sort((a, b) => b.startedAt - a.startedAt);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0D0D10" }}>
      <Header title={repo.name} subtitle={repo.fullName}>
        <Link
          href="/repositories"
          className="hidden md:flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-white"
          style={{ color: "#8B8BA8" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Repositories
        </Link>
        <button
          onClick={startScan}
          disabled={isStarting || isRunning || !repo}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting || isRunning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {isStarting ? "Starting..." : isRunning ? "Scanning..." : "Analyze Now"}
        </button>
      </Header>

      <div className="flex-1 p-6 space-y-6">
        {/* Error banner */}
        {scanError && (
          <div
            className="flex items-start gap-3 rounded-2xl p-4"
            style={{ background: "rgba(255,77,109,0.1)", border: "1.5px solid rgba(255,77,109,0.25)" }}
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#FF4D6D" }} />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Scan Failed</p>
              <p className="text-sm mt-0.5" style={{ color: "#FF4D6D" }}>{scanError}</p>
            </div>
            <button onClick={clearError} className="text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Live scan progress */}
        {runningScan && (
          <div className="max-w-lg">
            <ScanProgress
              scan={{
                id: runningScan._id,
                scanNumber: 0,
                repositoryId: repo._id,
                repositoryName: repo.name,
                branch: runningScan.branch,
                status: runningScan.status as "running" | "queued",
                startedAt: new Date(runningScan.startedAt),
                findingsCount: 0,
                healthScore: 0,
                progress: runningScan.progress ?? 0,
                currentStage: runningScan.currentStage,
                stages: [
                  { name: "Repository connected", status: "completed" },
                  { name: "Fetching repository files", status: (runningScan.progress ?? 0) > 5 ? "completed" : "running" },
                  { name: "Analyzing code quality", status: (runningScan.progress ?? 0) > 30 ? "completed" : (runningScan.progress ?? 0) > 5 ? "running" : "pending" },
                  { name: "Calculating health score", status: (runningScan.progress ?? 0) > 80 ? "completed" : (runningScan.progress ?? 0) > 30 ? "running" : "pending" },
                  { name: "Saving results", status: (runningScan.progress ?? 0) >= 100 ? "completed" : (runningScan.progress ?? 0) > 80 ? "running" : "pending" },
                ],
              }}
            />
          </div>
        )}

        {/* Repo info card */}
        <div className="card-comic p-6">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-black text-white">{repo.name}</h2>
                {healthScore !== undefined && (
                  <span
                    className={`badge-comic ${
                      healthScore >= 80 ? "badge-green" :
                      healthScore >= 60 ? "badge-medium" : "badge-critical"
                    }`}
                  >
                    {healthScore >= 80 ? "Healthy" : healthScore >= 60 ? "Needs Attention" : "Critical"}
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="text-sm font-medium mb-2" style={{ color: "#8B8BA8" }}>
                  {repo.description}
                </p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {repo.language && (
                  <span className="text-xs font-bold" style={{ color: "#8B8BA8" }}>🔷 {repo.language}</span>
                )}
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#8B8BA8" }}>
                  <GitBranch className="h-3 w-3" />
                  {repo.selectedBranch}
                </span>
                {repo.lastScanAt && (
                  <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#4D4D66" }}>
                    <Clock className="h-3 w-3" />
                    Last analyzed {formatTimeAgo(new Date(repo.lastScanAt))}
                  </span>
                )}
              </div>
            </div>
            {healthScore !== undefined && (
              <div className="text-right">
                <p className="section-label mb-1">Health Score</p>
                <p
                  className="font-black leading-none"
                  style={{ fontSize: "2.5rem", color: healthColor, textShadow: `0 0 20px ${healthColor}40` }}
                >
                  {healthScore}
                  <span className="text-lg font-bold" style={{ color: "#4D4D66" }}>/100</span>
                </p>
              </div>
            )}
          </div>

          {/* Metric cards */}
          {latestScan ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {metricItems.map(({ label, value }) =>
                value !== undefined ? (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: "#0D0D10", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="section-label mb-1">{label}</p>
                    <p
                      className="text-lg font-black"
                      style={{ color: getHealthColor(value) }}
                    >
                      {value}%
                    </p>
                    <div className="progress-track h-1 mt-2">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${value}%`,
                          background: getHealthColor(value),
                        }}
                      />
                    </div>
                  </div>
                ) : null
              )}
            </div>
          ) : (
            <div
              className="rounded-xl p-5 text-center"
              style={{ background: "#0D0D10", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#8B8BA8" }}>
                No scan results yet. Click <strong className="text-white">Analyze Now</strong> to run your first scan.
              </p>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{ background: "#14141A", border: "1.5px solid rgba(255,255,255,0.07)" }}
        >
          {(["Overview", "Findings", "History", "AI Insights"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="rounded-lg px-4 py-2 text-sm font-bold transition-all"
              style={activeTab === tab
                ? { background: "#1DDF6B", color: "#0D0D10" }
                : { color: "#8B8BA8" }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "Overview" && (
          <>
            {metrics && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <HealthOverview metrics={metrics} />
                {trendData.length >= 2 && <HealthTrend data={trendData} />}
              </div>
            )}

            {uiFindings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-black text-white">
                    Recent Findings ({findings?.length ?? 0})
                  </h3>
                  <button
                    onClick={() => setActiveTab("Findings")}
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "#1DDF6B" }}
                  >
                    View all →
                  </button>
                </div>
                <div className="space-y-3">
                  {uiFindings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </div>
              </div>
            )}

            {latestScan && uiFindings.length === 0 && (
              <div
                className="flex items-center gap-3 rounded-2xl p-5"
                style={{ background: "#14141A", border: "1.5px solid rgba(29,223,107,0.15)" }}
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: "#1DDF6B" }} />
                <p className="text-sm font-semibold text-white">
                  No findings detected — this repository looks clean! 🎉
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Findings Tab ── */}
        {activeTab === "Findings" && (
          <div className="space-y-4">
            {/* Severity summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["critical", "high", "medium", "low"] as Severity[]).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFindingSeverity(sev)}
                  className="card-comic p-4 text-left transition-all"
                  style={findingSeverity === sev ? { borderColor: severityColors[sev] + "40" } : {}}
                >
                  <p className="section-label mb-1 capitalize">{sev}</p>
                  <p className="text-2xl font-black" style={{ color: severityColors[sev] }}>
                    {findingCounts[sev]}
                  </p>
                </button>
              ))}
            </div>

            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 max-w-sm"
              style={{ background: "#14141A", border: "1.5px solid rgba(255,255,255,0.08)" }}
            >
              <Search className="h-4 w-4 flex-shrink-0" style={{ color: "#4D4D66" }} />
              <input
                type="text"
                placeholder="Search findings..."
                value={findingSearch}
                onChange={(e) => setFindingSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-[#4D4D66]"
              />
            </div>

            {/* Severity filter tabs */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl w-fit"
              style={{ background: "#14141A", border: "1.5px solid rgba(255,255,255,0.07)" }}
            >
              {severityTabs.map((tab) => {
                const isActive = findingSeverity === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setFindingSeverity(tab.value)}
                    className="rounded-lg px-4 py-2 text-sm font-bold transition-all"
                    style={
                      isActive
                        ? {
                            background: tab.value === "all" ? "#1DDF6B" : severityColors[tab.value],
                            color: tab.value === "all" ? "#0D0D10" : "#fff",
                          }
                        : { color: "#8B8BA8" }
                    }
                  >
                    {tab.label}
                    <span className="ml-1.5 text-xs opacity-70">({findingCounts[tab.value]})</span>
                  </button>
                );
              })}
            </div>

            {/* Findings list */}
            {allUIFindings.length === 0 ? (
              <div
                className="flex items-center gap-3 rounded-2xl p-5"
                style={{ background: "#14141A", border: "1.5px solid rgba(29,223,107,0.15)" }}
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: "#1DDF6B" }} />
                <p className="text-sm font-semibold text-white">
                  No findings detected — this repository looks clean! 🎉
                </p>
              </div>
            ) : filteredFindings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold" style={{ color: "#8B8BA8" }}>
                  No findings match your filters.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFindings.map((finding) => (
                  <FindingCard key={finding.id} finding={finding} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === "History" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(29,223,107,0.1)", border: "1.5px solid rgba(29,223,107,0.2)" }}
              >
                <History className="h-5 w-5" style={{ color: "#1DDF6B" }} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Scan History</h3>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#4D4D66" }}>
                  {completedScans.length} completed scan{completedScans.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {completedScans.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "#14141A", border: "1.5px solid rgba(255,255,255,0.07)" }}
              >
                <History className="h-10 w-10 mx-auto mb-3" style={{ color: "#4D4D66" }} />
                <p className="text-sm font-black text-white mb-1">No scan history yet</p>
                <p className="text-xs font-semibold" style={{ color: "#4D4D66" }}>
                  Run a scan to start tracking health over time.
                </p>
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: "1.5px solid rgba(255,255,255,0.07)" }}
              >
                {/* Table header */}
                <div
                  className="grid text-[10px] font-bold uppercase tracking-wider px-4 py-3"
                  style={{
                    gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 1fr 0.8fr 0.8fr",
                    background: "#1C1C25",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    color: "#4D4D66",
                  }}
                >
                  <span>Scan Date</span>
                  <span>Branch</span>
                  <span>Status</span>
                  <span>Health Score</span>
                  <span>Files Analyzed</span>
                  <span>Findings</span>
                  <span>Duration</span>
                </div>

                {/* Table rows */}
                <div style={{ background: "#14141A" }}>
                  {completedScans.map((scan, idx) => {
                    const duration =
                      scan.completedAt && scan.startedAt
                        ? Math.round((scan.completedAt - scan.startedAt) / 1000)
                        : null;
                    const score = scan.healthScore;
                    return (
                      <div
                        key={scan._id}
                        className="grid items-center px-4 py-3 transition-colors hover:bg-white/[0.03]"
                        style={{
                          gridTemplateColumns: "1.5fr 1fr 0.8fr 0.8fr 1fr 0.8fr 0.8fr",
                          borderBottom:
                            idx < completedScans.length - 1
                              ? "1px solid rgba(255,255,255,0.04)"
                              : "none",
                        }}
                      >
                        {/* Scan date */}
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {new Date(scan.startedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-[11px]" style={{ color: "#4D4D66" }}>
                            {new Date(scan.startedAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Branch */}
                        <div className="flex items-center gap-1.5">
                          <GitBranch className="h-3 w-3 flex-shrink-0" style={{ color: "#4D4D66" }} />
                          <span className="text-xs font-semibold truncate" style={{ color: "#C8C8E0" }}>
                            {scan.branch}
                          </span>
                        </div>

                        {/* Status */}
                        <span className="badge-comic badge-green w-fit text-xs">
                          Completed
                        </span>

                        {/* Health score */}
                        <div>
                          {score !== undefined ? (
                            <p
                              className="text-sm font-black"
                              style={{ color: getHealthColor(score) }}
                            >
                              {score}
                              <span className="text-xs font-semibold ml-0.5" style={{ color: "#4D4D66" }}>
                                /100
                              </span>
                            </p>
                          ) : (
                            <span className="text-xs" style={{ color: "#4D4D66" }}>—</span>
                          )}
                        </div>

                        {/* Files analyzed */}
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {scan.filesAnalyzed !== undefined ? scan.filesAnalyzed.toLocaleString() : "—"}
                          </p>
                        </div>

                        {/* Findings count */}
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{
                              color: (scan.findingsCount ?? 0) > 0 ? "#FF8C32" : "#1DDF6B",
                            }}
                          >
                            {scan.findingsCount ?? 0}
                          </p>
                        </div>

                        {/* Duration */}
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "#8B8BA8" }}>
                            {duration !== null
                              ? duration < 60
                                ? `${duration}s`
                                : `${Math.floor(duration / 60)}m ${duration % 60}s`
                              : "—"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI Insights Tab ── */}
        {activeTab === "AI Insights" && (
          <AIInsightsTab
            owner={repo.owner}
            repoName={repo.name}
            branch={repo.selectedBranch}
            latestScan={latestScan}
          />
        )}
      </div>
    </div>
  );
}

// ── severity colour map (shared with AI Insights page) ──────────
const severityColorsAI: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  critical: { bg: "rgba(240,64,96,0.10)",  text: "#F04060", border: "rgba(240,64,96,0.25)",  glow: "rgba(240,64,96,0.15)"  },
  high:     { bg: "rgba(245,130,60,0.10)",  text: "#F5823C", border: "rgba(245,130,60,0.25)", glow: "rgba(245,130,60,0.12)" },
  medium:   { bg: "rgba(245,166,35,0.10)",  text: "#F5A623", border: "rgba(245,166,35,0.25)", glow: "rgba(245,166,35,0.10)" },
  low:      { bg: "rgba(77,158,255,0.10)",  text: "#4D9EFF", border: "rgba(77,158,255,0.25)", glow: "rgba(77,158,255,0.10)" },
};

type LatestScan = {
  _id: Id<"scans">;
  repositoryId: Id<"repositories">;
  status: string;
} | undefined;

function AIInsightsTab({
  owner,
  repoName,
  branch,
  latestScan,
}: {
  owner: string;
  repoName: string;
  branch: string;
  latestScan: LatestScan;
}) {
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load the AI analysis for the latest completed scan
  const aiAnalysis = useQuery(
    api.aiAnalyses.getByScan,
    latestScan?._id ? { scanId: latestScan._id } : "skip"
  );

  async function callAIRoute(retryId?: string) {
    if (!latestScan) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId: latestScan._id,
          owner,
          repo: repoName,
          branch,
          ...(retryId ? { retryId } : {}),
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string; detail?: string; code?: string };
        if (json.code === "NOT_CONFIGURED") {
          setActionError("IBM watsonx.ai is not configured. Add WATSONX_API_KEY and WATSONX_PROJECT_ID to .env.local and restart the dev server.");
        } else if (json.code === "SCAN_NOT_COMPLETED") {
          setActionError("The scan hasn't completed yet. Wait for the scan to finish before generating AI insights.");
        } else {
          setActionError(json.error ?? `Error ${res.status}`);
        }
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Network error");
    }
    setBusy(false);
  }

  // ── No scan yet ──────────────────────────────────────────────
  if (!latestScan) {
    return (
      <div
        className="rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-4"
        style={{ background: "#14141A", border: "1.5px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "rgba(155,126,255,0.10)", border: "1.5px solid rgba(155,126,255,0.22)" }}
        >
          <Brain className="h-7 w-7" style={{ color: "#9B7EFF" }} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white mb-1">No scan data yet</h3>
          <p className="text-sm font-medium max-w-sm" style={{ color: "#8B8BA8" }}>
            Run a scan first. AI insights are generated automatically after each scan completes.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading AI analysis from Convex ─────────────────────────
  if (aiAnalysis === undefined) {
    return (
      <div className="flex items-center justify-center py-16 gap-3">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#9B7EFF" }} />
        <p className="text-sm font-semibold" style={{ color: "#7878A0" }}>Loading AI insights…</p>
      </div>
    );
  }

  // ── No AI analysis record exists for this scan ───────────────
  if (aiAnalysis === null) {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
        style={{ background: "rgba(155,126,255,0.05)", border: "1.5px solid rgba(155,126,255,0.18)" }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "rgba(155,126,255,0.12)", border: "1.5px solid rgba(155,126,255,0.25)" }}
        >
          <Sparkles className="h-7 w-7" style={{ color: "#9B7EFF" }} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white mb-1">AI insights haven&apos;t been generated yet</h3>
          <p className="text-sm font-medium max-w-sm" style={{ color: "#8B8BA8" }}>
            Generate AI-powered explanations and recommendations based on this scan.
          </p>
        </div>
        <button
          onClick={() => callAIRoute()}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "rgba(155,126,255,0.15)", color: "#9B7EFF", border: "1.5px solid rgba(155,126,255,0.3)" }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate AI Insights
        </button>
        {actionError && (
          <p className="text-xs font-medium max-w-md text-center" style={{ color: "#F04060" }}>{actionError}</p>
        )}
      </div>
    );
  }

  // ── Pending / Running ────────────────────────────────────────
  if (aiAnalysis.status === "pending" || aiAnalysis.status === "running") {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
        style={{ background: "rgba(155,126,255,0.05)", border: "1.5px solid rgba(155,126,255,0.18)" }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "rgba(155,126,255,0.10)", border: "1.5px solid rgba(155,126,255,0.22)", boxShadow: "0 0 28px rgba(155,126,255,0.15)" }}
        >
          <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#9B7EFF" }} />
        </div>
        <div>
          <h3 className="text-sm font-black text-white mb-1">AI analysis in progress…</h3>
          <p className="text-sm font-medium" style={{ color: "#8B8BA8" }}>
            IBM watsonx.ai is interpreting your scan results. This usually takes 10–30 seconds.
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{ background: "rgba(155,126,255,0.10)", color: "#9B7EFF", border: "1px solid rgba(155,126,255,0.22)" }}
        >
          <Zap className="h-3 w-3" />
          IBM watsonx.ai · Generating
        </div>
      </div>
    );
  }

  // ── Failed ───────────────────────────────────────────────────
  if (aiAnalysis.status === "failed") {
    return (
      <div
        className="rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4"
        style={{ background: "rgba(240,64,96,0.05)", border: "1.5px solid rgba(240,64,96,0.18)" }}
      >
        <WifiOff className="h-10 w-10" style={{ color: "#F04060" }} />
        <div>
          <h3 className="text-sm font-black text-white mb-1">AI insights unavailable</h3>
          <p className="text-sm font-medium max-w-md" style={{ color: "#8B8BA8" }}>
            {aiAnalysis.error ?? "AI analysis could not be completed."}
          </p>
        </div>
        <button
          onClick={() => callAIRoute(aiAnalysis._id)}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "rgba(155,126,255,0.12)", color: "#9B7EFF", border: "1.5px solid rgba(155,126,255,0.25)" }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Retry AI Analysis
        </button>
        {actionError && (
          <p className="text-xs font-medium max-w-md text-center" style={{ color: "#F04060" }}>{actionError}</p>
        )}
      </div>
    );
  }

  // ── Completed — show real AI data ────────────────────────────
  const recs = aiAnalysis.recommendations ?? [];
  const strengths = aiAnalysis.strengths ?? [];
  const improvementAreas = aiAnalysis.improvementAreas ?? [];

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: "rgba(155,126,255,0.12)", border: "1px solid rgba(155,126,255,0.25)" }}
          >
            <Sparkles className="h-4.5 w-4.5" style={{ color: "#9B7EFF" }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white">AI Insights</h3>
              <span
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: "rgba(155,126,255,0.12)", color: "#9B7EFF", border: "1px solid rgba(155,126,255,0.22)" }}
              >
                <Zap style={{ width: 8, height: 8, display: "inline", marginRight: 3 }} />
                {aiAnalysis.modelId ?? "IBM watsonx.ai"}
              </span>
            </div>
            {aiAnalysis.generatedAt && (
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: "#4D4D66" }}>
                Generated {new Date(aiAnalysis.generatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => callAIRoute(aiAnalysis._id)}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "rgba(155,126,255,0.08)", color: "#9B7EFF", border: "1px solid rgba(155,126,255,0.18)" }}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Regenerate
        </button>
      </div>

      {actionError && (
        <div
          className="rounded-xl px-4 py-3 text-xs font-medium"
          style={{ background: "rgba(240,64,96,0.08)", color: "#F04060", border: "1px solid rgba(240,64,96,0.2)" }}
        >
          {actionError}
        </div>
      )}

      {/* Developer summary */}
      {aiAnalysis.developerSummary && (
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: "rgba(155,126,255,0.07)", border: "1px solid rgba(155,126,255,0.18)" }}
        >
          <p className="text-[13px] font-semibold italic" style={{ color: "#C4B0FF" }}>
            &ldquo;{aiAnalysis.developerSummary}&rdquo;
          </p>
        </div>
      )}

      {/* Summary + Strengths / Improvements */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "rgba(155,126,255,0.05)", border: "1.5px solid rgba(155,126,255,0.18)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4" style={{ color: "#9B7EFF" }} />
          <h4 className="text-[12px] font-black text-white uppercase tracking-wider">Codebase Summary</h4>
        </div>
        {aiAnalysis.summary && (
          <p className="text-[13px] font-medium leading-relaxed mb-4" style={{ color: "#8B8BA8" }}>
            {aiAnalysis.summary}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="rounded-xl p-4" style={{ background: "rgba(20,230,120,0.04)", border: "1px solid rgba(20,230,120,0.14)" }}>
            <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: "#14E678" }}>✦ Strengths</p>
            {strengths.length > 0 ? (
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] font-medium" style={{ color: "#7878A0" }}>
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#14E678" }} />
                    {s}
                  </li>
                ))}
              </ul>
            ) : <p className="text-[12px]" style={{ color: "#404060" }}>None identified.</p>}
          </div>
          {/* Improvement areas */}
          <div className="rounded-xl p-4" style={{ background: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.14)" }}>
            <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: "#F5A623" }}>⚑ Areas for Improvement</p>
            {improvementAreas.length > 0 ? (
              <ul className="space-y-2">
                {improvementAreas.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] font-medium" style={{ color: "#7878A0" }}>
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#F5A623" }} />
                    {w}
                  </li>
                ))}
              </ul>
            ) : <p className="text-[12px]" style={{ color: "#404060" }}>None identified.</p>}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[12px] font-black text-white uppercase tracking-wider">Recommended Actions</h4>
            <span className="text-[10px] font-bold" style={{ color: "#4D4D66" }}>{recs.length} items</span>
          </div>
          <div className="space-y-3">
            {recs.map((rec, i) => {
              const colors = severityColorsAI[rec.severity] ?? severityColorsAI.low;
              return (
                <div key={i} className="rounded-2xl p-4" style={{ background: "#14141A", border: "1.5px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                      style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, boxShadow: `0 0 10px ${colors.glow}` }}
                    >
                      {rec.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="badge-comic text-[9px]" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>
                          {rec.severity}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-white leading-snug mb-1">{rec.title}</p>
                      <p className="text-[12px] mb-1.5 leading-relaxed" style={{ color: "#404060" }}>
                        <span style={{ color: "#7878A0" }}>Why: </span>{rec.whyItMatters}
                      </p>
                      <p className="text-[12px] mb-2 leading-relaxed" style={{ color: "#7878A0" }}>
                        <span className="font-semibold text-white">Action: </span>{rec.action}
                      </p>
                      {rec.affectedFiles.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <FileCode className="h-3 w-3 flex-shrink-0" style={{ color: "#404060" }} />
                          {rec.affectedFiles.map((f) => (
                            <span key={f} className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "#7878A0", border: "1px solid rgba(255,255,255,0.07)" }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-[10px] font-semibold" style={{ color: "#404060" }}>
          AI-generated explanation based on deterministic scan evidence. Metrics are not changed by AI.
        </p>
        <Link
          href="/ai-insights"
          className="flex items-center gap-1 text-[11px] font-semibold transition-colors hover:opacity-90"
          style={{ color: "#9B7EFF" }}
        >
          Full AI Insights
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
