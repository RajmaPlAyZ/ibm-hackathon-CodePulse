"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Header } from "@/components/layout/header";
import { HealthScoreRing } from "@/components/dashboard/health-score-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { HealthOverview } from "@/components/dashboard/health-overview";
import { HealthTrend } from "@/components/dashboard/health-trend";
import { PriorityFindings } from "@/components/dashboard/priority-findings";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AIRecommendations } from "@/components/dashboard/ai-recommendations";
import type { RealAIRecommendation } from "@/components/dashboard/ai-recommendations";
import { greetingByTime } from "@/lib/utils-app";
import type { Finding, Activity, HealthTrendPoint, HealthMetrics } from "@/lib/types";
import { Play, ChevronDown, Activity as ActivityIcon, FolderGit2, Plus, GitBranch, Check } from "lucide-react";
import Link from "next/link";

// ── Convert Convex finding → UI Finding ─────────────────────────
function toUIFinding(f: {
  _id: string;
  repositoryId: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  file: string;
  line?: number;
  status: string;
  createdAt: number;
  recommendation: string;
  ruleId: string;
  evidence?: string;
}): Finding {
  return {
    id: f._id,
    repositoryId: f.repositoryId,
    repositoryName: "",
    severity: f.severity,
    category: f.category as Finding["category"],
    title: f.title,
    description: f.description,
    file: f.file,
    line: f.line,
    status: f.status as Finding["status"],
    detectedAt: new Date(f.createdAt),
    ruleId: f.ruleId,
    recommendedAction: f.recommendation,
    codeSnippet: f.evidence,
  };
}

// ── Convert Convex activity → UI Activity ───────────────────────
function toUIActivity(a: {
  _id: string;
  type: string;
  message: string;
  createdAt: number;
}): Activity {
  const typeMap: Record<string, Activity["type"]> = {
    scan_completed: "scan_completed",
    scan_failed: "warning",
    repository_connected: "analysis_done",
    finding_detected: "finding_detected",
    health_improved: "health_improved",
    health_declined: "warning",
    analysis_done: "analysis_done",
  };
  return {
    id: a._id,
    type: typeMap[a.type] ?? "analysis_done",
    message: a.message,
    timestamp: new Date(a.createdAt),
  };
}

// ── Build trend points from a list of completed scans ───────────
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
  }>
): HealthTrendPoint[] {
  return scans
    .filter((s) => s.healthScore !== undefined)
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

// ── Dropdown component ───────────────────────────────────────────
function Dropdown({
  label,
  value,
  options,
  onChange,
  accent = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  accent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all hover:bg-white/5"
        style={
          accent
            ? {
                border: "1.5px solid rgba(20,230,120,0.2)",
                background: open ? "rgba(20,230,120,0.08)" : "rgba(20,230,120,0.05)",
              }
            : {
                border: "1.5px solid rgba(255,255,255,0.09)",
                background: open ? "rgba(255,255,255,0.05)" : "transparent",
              }
        }
      >
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#404060" }}>
          {label}:
        </span>
        <span
          className="text-sm font-semibold max-w-[140px] truncate"
          style={{ color: accent ? "#14E678" : "#F0F0FF" }}
        >
          {options.find((o) => o.value === value)?.label ?? value}
        </span>
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform"
          style={{ color: "#404060", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-xl overflow-hidden py-1"
          style={{
            background: "#14141C",
            border: "1.5px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-[13px] transition-colors hover:bg-white/6"
            >
              <span
                className="font-semibold truncate"
                style={{ color: opt.value === value ? (accent ? "#14E678" : "#F0F0FF") : "#7878A0" }}
              >
                {opt.label}
              </span>
              {opt.value === value && (
                <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: accent ? "#14E678" : "#F0F0FF" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const greeting = greetingByTime();
  const updateSelectedBranch = useMutation(api.repositories.updateSelectedBranch);

  // ── Queries ──────────────────────────────────────────────
  const repositories = useQuery(
    api.repositories.list,
    user ? { userId: user.id } : "skip"
  );
  const activities = useQuery(
    api.activities.listByUser,
    user ? { userId: user.id, limit: 8 } : "skip"
  );

  // ── Selected repo state ───────────────────────────────────
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);

  // Derive featuredRepo: use explicit selection if set, otherwise first repo.
  // No useEffect needed — this is a pure derivation from query state.
  const featuredRepo =
    (selectedRepoId ? repositories?.find((r) => r._id === selectedRepoId) : undefined)
    ?? repositories?.[0];

  // ── Branch state (local, synced to Convex on change) ─────
  const [localBranch, setLocalBranch] = useState<string | null>(null);
  const activeBranch = localBranch ?? featuredRepo?.selectedBranch ?? "";

  async function handleBranchChange(branch: string) {
    setLocalBranch(branch);
    if (featuredRepo) {
      await updateSelectedBranch({
        id: featuredRepo._id as Id<"repositories">,
        selectedBranch: branch,
      });
    }
  }

  // ── Queries scoped to selected repo ──────────────────────
  const latestScan = useQuery(
    api.scans.getLatestCompleted,
    featuredRepo ? { repositoryId: featuredRepo._id } : "skip"
  );

  const recentScans = useQuery(
    api.scans.listByRepository,
    featuredRepo ? { repositoryId: featuredRepo._id } : "skip"
  );

  const recentFindings = useQuery(
    api.findings.listByRepository,
    featuredRepo ? { repositoryId: featuredRepo._id } : "skip"
  );

  // AI analysis for the latest completed scan
  const latestAiAnalysis = useQuery(
    api.aiAnalyses.getByScan,
    latestScan?._id ? { scanId: latestScan._id } : "skip"
  );

  const isLoading = repositories === undefined;
  const hasRepos = (repositories?.length ?? 0) > 0;
  const hasScans = !!latestScan;

  // ── Derived data ─────────────────────────────────────────
  const uiFindings: Finding[] = (recentFindings ?? []).map(toUIFinding);
  const openFindings = uiFindings.filter((f) => f.status === "open");
  const criticalCount = openFindings.filter((f) => f.severity === "critical").length;

  const uiActivities: Activity[] = (activities ?? []).map(toUIActivity);

  const completedScans = (recentScans ?? []).filter((s) => s.status === "completed");
  const trendPoints = buildTrend(completedScans.slice(0, 8));

  // ── Metrics from latest scan ─────────────────────────────
  const metrics: HealthMetrics = latestScan
    ? {
        codeQuality: latestScan.codeQualityScore ?? 0,
        testCoverage: latestScan.testingScore ?? 0,
        documentation: latestScan.documentationScore ?? 0,
        complexity: latestScan.complexityScore ?? 0,
        security: latestScan.securityScore ?? 0,
        maintainability: latestScan.maintainabilityScore ?? 0,
      }
    : { codeQuality: 0, testCoverage: 0, documentation: 0, complexity: 0, security: 0, maintainability: 0 };

  const prevScan = completedScans[1];
  const healthDelta =
    latestScan && prevScan
      ? (latestScan.healthScore ?? 0) - (prevScan.healthScore ?? 0)
      : null;

  // ── Dropdown options ──────────────────────────────────────
  const repoOptions = (repositories ?? []).map((r) => ({
    value: r._id,
    label: r.name,
  }));

  const branchOptions = (featuredRepo?.branches ?? (featuredRepo?.selectedBranch ? [featuredRepo.selectedBranch] : [])).map(
    (b) => ({ value: b, label: b })
  );

  // ── Empty state ───────────────────────────────────────────
  if (!isLoading && !hasRepos) {
    return (
      <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
        <Header title="Dashboard" subtitle="CodeHealth Overview" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-3xl mb-6"
            style={{
              background: "rgba(20,230,120,0.08)",
              border: "1.5px solid rgba(20,230,120,0.15)",
              boxShadow: "0 0 32px rgba(20,230,120,0.06)",
            }}
          >
            <FolderGit2 className="h-12 w-12" style={{ color: "#14E678" }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: "-0.03em" }}>
            {greeting}, {user?.firstName ?? "Developer"}! 👋
          </h2>
          <p className="text-sm mb-8 max-w-md" style={{ color: "#7878A0" }}>
            Welcome to CodeHealth. Connect a GitHub repository to start analyzing
            its code health, quality, and security.
          </p>
          <Link href="/repositories" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Connect Your First Repository
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#080810" }}>
        <Header title="Dashboard" subtitle="CodeHealth Overview" />
        <div className="flex-1 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-glass p-5 animate-pulse" style={{ height: 120 }}>
                <div className="h-3 bg-white/5 rounded w-1/2 mb-3" />
                <div className="h-8 bg-white/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
      <Header title="Dashboard" subtitle="CodeHealth Overview">
        {featuredRepo && (
          <>
            <Dropdown
              label="Repo"
              value={featuredRepo._id}
              options={repoOptions}
              onChange={(id) => {
                setSelectedRepoId(id);
                setLocalBranch(null); // reset branch when switching repos
              }}
            />
            {branchOptions.length > 0 && (
              <Dropdown
                label="Branch"
                value={activeBranch}
                options={branchOptions}
                onChange={handleBranchChange}
                accent
              />
            )}
            {branchOptions.length === 0 && activeBranch && (
              <div
                className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
                style={{
                  border: "1.5px solid rgba(20,230,120,0.2)",
                  background: "rgba(20,230,120,0.05)",
                }}
              >
                <GitBranch className="h-3.5 w-3.5" style={{ color: "#404060" }} />
                <span className="text-sm font-semibold" style={{ color: "#14E678" }}>{activeBranch}</span>
              </div>
            )}
          </>
        )}
      </Header>

      <div className="flex-1 p-6 space-y-6">
        {/* ── Greeting ── */}
        <div className="fade-up flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.03em" }}>
              {greeting}, {user?.firstName ?? "Developer"}! 👋
            </h2>
            <p className="text-[13px] font-medium mt-1" style={{ color: "#7878A0" }}>
              {featuredRepo
                ? <>Showing <span className="font-semibold" style={{ color: "#F0F0FF" }}>{featuredRepo.name}</span> · <span style={{ color: "#14E678" }}>{activeBranch}</span></>
                : "Here's the health of your codebases."}
            </p>
          </div>
          <Link href={featuredRepo ? `/repositories/${featuredRepo._id}` : "/repositories"} className="btn-primary flex items-center gap-2">
            <Play className="h-4 w-4" />
            Analyze Repository
          </Link>
        </div>

        {/* ── Top metric cards ── */}
        <div className="fade-up grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" style={{ animationDelay: "60ms" }}>
          {/* Overall Health */}
          <div className="card-glass-green p-5">
            <p className="section-label mb-3">Overall Health</p>
            <div className="flex items-center gap-4">
              <HealthScoreRing score={latestScan?.healthScore ?? 0} size={80} strokeWidth={7} />
              <div>
                {hasScans ? (
                  <span className="inline-flex items-center gap-1.5 badge-pill badge-green text-xs mb-2">
                    <ActivityIcon className="h-3 w-3" />
                    {(latestScan?.healthScore ?? 0) >= 80 ? "Healthy" : (latestScan?.healthScore ?? 0) >= 60 ? "Needs Attention" : "Critical"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 badge-pill text-xs mb-2" style={{ background: "rgba(255,255,255,0.05)", color: "#7878A0", borderColor: "rgba(255,255,255,0.1)" }}>
                    No scans yet
                  </span>
                )}
                {healthDelta !== null && (
                  <p className="text-[11px] font-semibold" style={{ color: healthDelta >= 0 ? "#14E678" : "#F04060" }}>
                    {healthDelta >= 0 ? "+" : ""}{healthDelta} since last scan
                  </p>
                )}
              </div>
            </div>
          </div>

          <MetricCard
            title="Code Quality"
            value={hasScans ? `${metrics.codeQuality}%` : "—"}
            delta={null}
            deltaLabel="%"
            subtitle={hasScans ? "latest scan" : "run a scan to see data"}
            accentColor="#14E678"
          />

          <MetricCard
            title="Test Coverage"
            value={hasScans ? `${metrics.testCoverage}%` : "—"}
            delta={null}
            deltaLabel="%"
            subtitle={hasScans ? "latest scan" : "run a scan to see data"}
            accentColor="#F5A623"
          >
            {hasScans && (
              <div className="progress-track h-2.5">
                <div
                  className="h-full progress-fill-amber"
                  style={{ width: `${metrics.testCoverage}%` }}
                />
              </div>
            )}
          </MetricCard>

          {/* Open Issues */}
          <div className="card-glass p-5">
            <p className="section-label mb-3">Open Issues</p>
            <div className="mb-3">
              <span
                className="font-bold leading-none"
                style={{
                  fontSize: "2rem",
                  letterSpacing: "-0.04em",
                  color: openFindings.length > 0 ? "#F04060" : "#14E678",
                  textShadow: openFindings.length > 0
                    ? "0 0 20px rgba(240,64,96,0.3)"
                    : "0 0 20px rgba(20,230,120,0.3)",
                }}
              >
                {openFindings.length}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {criticalCount > 0 && (
                <span className="badge-pill badge-critical">{criticalCount} critical</span>
              )}
              <span className="text-[11px] font-medium" style={{ color: "#404060" }}>
                {openFindings.length === 0 ? "No open issues" : "across all categories"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Health Overview + Priority Findings ── */}
        <div className="fade-up grid grid-cols-1 xl:grid-cols-5 gap-4" style={{ animationDelay: "100ms" }}>
          <div className="xl:col-span-2">
            <HealthOverview metrics={metrics} />
          </div>
          <div className="xl:col-span-3">
            <PriorityFindings findings={openFindings} />
          </div>
        </div>

        {/* ── Health Trend ── */}
        <div className="fade-up" style={{ animationDelay: "140ms" }}>
          {trendPoints.length >= 2 ? (
            <HealthTrend data={trendPoints} />
          ) : (
            <div
              className="card-glass p-6 flex flex-col items-center justify-center text-center"
              style={{ minHeight: 160 }}
            >
              <p className="text-[13px] font-semibold text-white mb-1">Health Trend</p>
              <p className="text-[12px]" style={{ color: "#404060" }}>
                Run at least 2 scans to see the health trend chart.
              </p>
            </div>
          )}
        </div>

        {/* ── Activity + AI Recommendations ── */}
        <div className="fade-up grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ animationDelay: "180ms" }}>
          <RecentActivity activities={uiActivities} />
          <AIRecommendations
            status={latestAiAnalysis?.status}
            recommendations={(latestAiAnalysis?.recommendations ?? []) as RealAIRecommendation[]}
            developerSummary={latestAiAnalysis?.developerSummary}
            error={latestAiAnalysis?.error}
          />
        </div>
      </div>
    </div>
  );
}
