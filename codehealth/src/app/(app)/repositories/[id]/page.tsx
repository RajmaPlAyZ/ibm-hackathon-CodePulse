import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { HealthOverview } from "@/components/dashboard/health-overview";
import { FindingCard } from "@/components/findings/finding-card";
import { HealthTrend } from "@/components/dashboard/health-trend";
import { mockRepositories, mockFindings, mockHealthTrend } from "@/lib/mock-data";
import { getRepositoryStatusBadge, formatTimeAgo, getHealthColor, getLanguageColor } from "@/lib/utils-app";
import { Play, GitBranch, Clock, ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RepositoryDetailPage({ params }: Props) {
  const { id } = await params;
  const repo = mockRepositories.find((r) => r.id === id);
  if (!repo) notFound();

  const findings = mockFindings.filter((f) => f.repositoryId === id);
  const statusBadge = getRepositoryStatusBadge(repo.status);

  const metrics = [
    { label: "Code Quality", value: repo.metrics.codeQuality },
    { label: "Testing", value: repo.metrics.testCoverage },
    { label: "Documentation", value: repo.metrics.documentation },
    { label: "Complexity", value: repo.metrics.complexity },
    { label: "Security", value: repo.metrics.security },
    { label: "Maintainability", value: repo.metrics.maintainability },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header title={repo.name} subtitle={repo.fullName}>
        <Link
          href="/repositories"
          className="hidden md:flex items-center gap-1.5 text-sm transition-colors hover:text-white"
          style={{ color: "#6B7280" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Repositories
        </Link>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "#22C55E", color: "#0B0B0C" }}
        >
          <Play className="h-3.5 w-3.5" />
          Analyze Now
        </button>
      </Header>

      <div className="flex-1 p-6 space-y-6">
        {/* Repo info card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-white">{repo.name}</h2>
                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${statusBadge.className}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>{repo.description}</p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: getLanguageColor(repo.language) }} />
                  <span className="text-xs" style={{ color: "#9CA3AF" }}>{repo.language}</span>
                </div>
                <span className="flex items-center gap-1 text-xs" style={{ color: "#9CA3AF" }}>
                  <GitBranch className="h-3 w-3" />
                  {repo.branch}
                </span>
                {repo.lastScanAt && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#6B7280" }}>
                    <Clock className="h-3 w-3" />
                    Last analyzed {formatTimeAgo(repo.lastScanAt)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>Health Score</p>
              <p className="text-4xl font-bold" style={{ color: getHealthColor(repo.healthScore) }}>
                {repo.healthScore}
                <span className="text-lg font-medium text-gray-500">/100</span>
              </p>
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {metrics.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl p-3 text-center"
                style={{ background: "#0B0B0C", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <p className="text-xs mb-1" style={{ color: "#6B7280" }}>{label}</p>
                <p className="text-lg font-bold" style={{ color: getHealthColor(value) }}>{value}%</p>
                <div
                  className="h-1 rounded-full mt-2 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${value}%`, background: getHealthColor(value) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs (static UI) */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {["Overview", "Findings", "Files", "History", "AI Insights"].map((tab, i) => (
            <button
              key={tab}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={
                i === 0
                  ? { background: "#22C55E", color: "#0B0B0C" }
                  : { color: "#6B7280" }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <HealthOverview metrics={repo.metrics} />
          <HealthTrend data={mockHealthTrend} />
        </div>

        {/* Findings */}
        {findings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">
              Recent Findings ({findings.length})
            </h3>
            <div className="space-y-3">
              {findings.slice(0, 4).map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
