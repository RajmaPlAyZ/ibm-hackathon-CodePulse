import { Header } from "@/components/layout/header";
import { HealthScoreRing } from "@/components/dashboard/health-score-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { HealthOverview } from "@/components/dashboard/health-overview";
import { HealthTrend } from "@/components/dashboard/health-trend";
import { PriorityFindings } from "@/components/dashboard/priority-findings";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { AIRecommendations } from "@/components/dashboard/ai-recommendations";
import {
  mockRepositories,
  mockFindings,
  mockActivity,
  mockAIInsight,
  mockHealthTrend,
} from "@/lib/mock-data";
import { greetingByTime } from "@/lib/utils-app";
import { Play, ChevronDown, Activity } from "lucide-react";

export default function DashboardPage() {
  const repo = mockRepositories[0];
  const greeting = greetingByTime();
  const criticalCount = mockFindings.filter(
    (f) => f.repositoryId === "repo-1" && f.severity === "critical"
  ).length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0D0D10" }}>
      <Header title="Dashboard" subtitle="CodeHealth Overview">
        {/* Repo selector */}
        <div
          className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer transition-all hover:bg-white/5"
          style={{
            border: "1.5px solid rgba(255,255,255,0.09)",
            boxShadow: "0 3px 0 rgba(0,0,0,0.35)",
          }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#4D4D66" }}>Repo:</span>
          <span className="text-sm font-black text-white">{repo.name}</span>
          <ChevronDown className="h-3.5 w-3.5" style={{ color: "#4D4D66" }} />
        </div>
        <div
          className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer transition-all hover:bg-white/5"
          style={{
            border: "1.5px solid rgba(29,223,107,0.2)",
            background: "rgba(29,223,107,0.05)",
            boxShadow: "0 3px 0 rgba(0,0,0,0.35)",
          }}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#4D4D66" }}>Branch:</span>
          <span className="text-sm font-black" style={{ color: "#1DDF6B" }}>{repo.branch}</span>
          <ChevronDown className="h-3.5 w-3.5" style={{ color: "#4D4D66" }} />
        </div>
      </Header>

      <div className="flex-1 p-6 space-y-6">
        {/* ── Greeting ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {greeting}, Developer! 👋
              </h2>
            </div>
            <p className="text-sm font-semibold" style={{ color: "#8B8BA8" }}>
              Here's the health of your codebases.
            </p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Play className="h-4 w-4" />
            Analyze Repository
          </button>
        </div>

        {/* ── Top metric cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Overall Health */}
          <div className="card-comic-green p-5">
            <p className="section-label mb-3">Overall Health</p>
            <div className="flex items-center gap-4">
              <HealthScoreRing score={repo.healthScore} size={80} strokeWidth={7} />
              <div>
                <span
                  className="inline-flex items-center gap-1.5 badge-comic badge-green text-xs mb-2"
                >
                  <Activity className="h-3 w-3" />
                  Healthy
                </span>
                <p className="text-[11px] font-semibold" style={{ color: "#4D4D66" }}>
                  +6 since last scan
                </p>
              </div>
            </div>
          </div>

          <MetricCard
            title="Code Quality"
            value={`${repo.metrics.codeQuality}%`}
            delta={4}
            deltaLabel="%"
            subtitle="vs. previous scan"
            accentColor="#1DDF6B"
          />

          <MetricCard
            title="Test Coverage"
            value={`${repo.metrics.testCoverage}%`}
            delta={8}
            deltaLabel="%"
            subtitle="vs. previous scan"
            accentColor="#FFB830"
          >
            <div className="progress-track h-2.5">
              <div
                className="h-full progress-fill-amber"
                style={{ width: `${repo.metrics.testCoverage}%` }}
              />
            </div>
          </MetricCard>

          {/* Open Issues */}
          <div className="card-comic p-5">
            <p className="section-label mb-3">Open Issues</p>
            <div className="mb-3">
              <span
                className="font-black leading-none"
                style={{
                  fontSize: "2rem",
                  letterSpacing: "-0.03em",
                  color: "#FF4D6D",
                  textShadow: "0 0 20px rgba(255,77,109,0.35)",
                }}
              >
                {repo.issueCount}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge-comic badge-critical">
                {criticalCount} critical
              </span>
              <span className="text-[11px] font-semibold" style={{ color: "#4D4D66" }}>
                across all categories
              </span>
            </div>
          </div>
        </div>

        {/* ── Health Overview + Priority Findings ── */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-2">
            <HealthOverview metrics={repo.metrics} />
          </div>
          <div className="xl:col-span-3">
            <PriorityFindings
              findings={mockFindings.filter((f) => f.repositoryId === "repo-1")}
            />
          </div>
        </div>

        {/* ── Health Trend ── */}
        <HealthTrend data={mockHealthTrend} />

        {/* ── Activity + AI Recommendations ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <RecentActivity activities={mockActivity} />
          <AIRecommendations recommendations={mockAIInsight.recommendations} />
        </div>
      </div>
    </div>
  );
}
