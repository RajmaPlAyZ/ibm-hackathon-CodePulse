"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/layout/header";
import { AddRepositoryDialog } from "@/components/repositories/add-repository-dialog";
import Link from "next/link";
import { Plus, FolderGit2, GitBranch, Clock, AlertTriangle, Activity } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils-app";

function getHealthColor(score: number) {
  if (score >= 80) return { color: "#14E678", glow: "rgba(20,230,120,0.35)" };
  if (score >= 60) return { color: "#F5A623", glow: "rgba(245,166,35,0.35)" };
  return { color: "#F04060", glow: "rgba(240,64,96,0.35)" };
}

export default function RepositoriesPage() {
  const { user } = useUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  const repositories = useQuery(
    api.repositories.list,
    user ? { userId: user.id } : "skip"
  );

  const isLoading = repositories === undefined;
  const repos = repositories ?? [];

  const healthyCount = repos.filter(
    (r) => r.lastHealthScore !== undefined && r.lastHealthScore >= 80
  ).length;
  const attentionCount = repos.filter(
    (r) => r.lastHealthScore !== undefined && r.lastHealthScore < 80
  ).length;
  const totalIssues = repos.reduce((s, r) => s + (r.lastIssueCount ?? 0), 0);

  return (
    <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
      <Header
        title="Repositories"
        subtitle="Monitor the health of your connected codebases."
      />

      <div className="flex-1 p-6">
        {/* Header row */}
        <div className="fade-up flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(20,230,120,0.10)", border: "1.5px solid rgba(20,230,120,0.2)" }}
            >
              <FolderGit2 className="h-5 w-5" style={{ color: "#14E678" }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>All Repositories</h2>
              <p className="section-label mt-0.5">
                {isLoading ? "Loading..." : `${repos.length} connected`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Repository
          </button>
        </div>

        {/* Stats */}
        <div className="fade-up grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" style={{ animationDelay: "60ms" }}>
          {[
            { label: "Total Repos",      value: isLoading ? "—" : repos.length,       color: "#F0F0FF" },
            { label: "Healthy",          value: isLoading ? "—" : healthyCount,        color: "#14E678" },
            { label: "Needs Attention",  value: isLoading ? "—" : attentionCount,      color: "#F5A623" },
            { label: "Total Issues",     value: isLoading ? "—" : totalIssues,         color: "#F04060" },
          ].map((stat) => (
            <div key={stat.label} className="card-glass p-4">
              <p className="section-label mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color, letterSpacing: "-0.04em" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Repository grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card-glass p-5 animate-pulse"
                style={{ height: 200 }}
              >
                <div className="h-4 bg-white/5 rounded-lg mb-3 w-3/4" />
                <div className="h-3 bg-white/5 rounded-lg mb-2 w-1/2" />
                <div className="h-3 bg-white/5 rounded-lg w-2/3" />
              </div>
            ))}
          </div>
        ) : repos.length === 0 ? (
          /* Empty state */
          <div className="fade-up flex flex-col items-center justify-center py-20 text-center">
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
              No repositories connected yet
            </h3>
            <p className="text-sm mb-6 max-w-sm" style={{ color: "#7878A0" }}>
              Connect a public GitHub repository to start analyzing its code health.
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Connect Your First Repository
            </button>
          </div>
        ) : (
          <div className="fade-up grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" style={{ animationDelay: "120ms" }}>
            {repos.map((repo) => {
              const { color, glow } = repo.lastHealthScore
                ? getHealthColor(repo.lastHealthScore)
                : { color: "#404060", glow: "transparent" };

              return (
                <Link
                  key={repo._id}
                  href={`/repositories/${repo._id}`}
                  className="group card-glass p-5 transition-all duration-200 hover:scale-[1.02]"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-semibold text-white truncate" style={{ letterSpacing: "-0.01em" }}>
                        {repo.name}
                      </h3>
                      <p className="text-[11px] font-mono truncate mt-0.5" style={{ color: "#404060" }}>
                        {repo.fullName}
                      </p>
                    </div>
                    {repo.lastHealthScore !== undefined ? (
                      <span
                        className={`badge-pill text-[9px] ${
                          repo.lastHealthScore >= 80 ? "badge-green" :
                          repo.lastHealthScore >= 60 ? "badge-medium" : "badge-critical"
                        }`}
                      >
                        {repo.lastHealthScore >= 80 ? "Healthy" :
                         repo.lastHealthScore >= 60 ? "Needs Attention" : "Critical"}
                      </span>
                    ) : (
                      <span
                        className="badge-pill text-[9px]"
                        style={{ background: "rgba(255,255,255,0.05)", color: "#7878A0", borderColor: "rgba(255,255,255,0.1)" }}
                      >
                        Not Scanned
                      </span>
                    )}
                  </div>

                  {/* Health score */}
                  {repo.lastHealthScore !== undefined ? (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative h-14 w-14 flex-shrink-0">
                        <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
                          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                          <circle
                            cx="32" cy="32" r="26" fill="none"
                            stroke={color} strokeWidth="6"
                            strokeDasharray={2 * Math.PI * 26}
                            strokeDashoffset={2 * Math.PI * 26 * (1 - repo.lastHealthScore / 100)}
                            strokeLinecap="round"
                            style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold" style={{ color, textShadow: `0 0 8px ${glow}` }}>
                            {repo.lastHealthScore}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white">{repo.lastHealthScore}/100</p>
                        <p className="section-label mt-0.5">Health Score</p>
                        {repo.lastIssueCount !== undefined && (
                          <p className="flex items-center gap-1 text-[10px] font-semibold mt-1" style={{ color: "#F04060" }}>
                            <AlertTriangle className="h-3 w-3" />
                            {repo.lastIssueCount} issues
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 rounded-xl p-3 mb-4"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <Activity className="h-4 w-4" style={{ color: "#404060" }} />
                      <p className="text-[11px] font-medium" style={{ color: "#404060" }}>
                        Run a scan to see health metrics
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div
                    className="flex items-center justify-between pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div className="flex items-center gap-3">
                      {repo.language && (
                        <span className="text-[11px] font-medium" style={{ color: "#7878A0" }}>
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#7878A0" }}>
                        <GitBranch className="h-3 w-3" />
                        {repo.selectedBranch}
                      </span>
                    </div>
                    {repo.lastScanAt && (
                      <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: "#404060" }}>
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(new Date(repo.lastScanAt))}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Add repo CTA */}
            <button
              onClick={() => setDialogOpen(true)}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center transition-all hover:bg-white/3"
              style={{ background: "rgba(255,255,255,0.02)", border: "2px dashed rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Plus className="h-5 w-5" style={{ color: "#7878A0" }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">Connect Repository</p>
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: "#404060" }}>
                  Add a GitHub repository to analyze
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      <AddRepositoryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConnected={() => setDialogOpen(false)}
      />
    </div>
  );
}
