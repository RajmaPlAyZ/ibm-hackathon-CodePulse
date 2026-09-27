"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/layout/header";
import { ScanTable } from "@/components/scans/scan-table";
import { ScanProgress } from "@/components/scans/scan-progress";
import { ScanLine } from "lucide-react";
import type { Scan } from "@/lib/types";
import Link from "next/link";

function convexScanToUIScan(s: {
  _id: string;
  repositoryId: string;
  branch: string;
  status: string;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  healthScore?: number;
  findingsCount?: number;
  currentStage?: string;
  progress?: number;
}, repoName: string, idx: number): Scan {
  return {
    id: s._id,
    scanNumber: 1000 + idx,
    repositoryId: s.repositoryId,
    repositoryName: repoName,
    branch: s.branch,
    status: s.status as Scan["status"],
    startedAt: new Date(s.startedAt),
    completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
    durationSeconds: s.durationMs ? Math.round(s.durationMs / 1000) : undefined,
    findingsCount: s.findingsCount ?? 0,
    healthScore: s.healthScore ?? 0,
    progress: s.progress,
    currentStage: s.currentStage,
    stages: [],
  };
}

export default function ScansPage() {
  const { user } = useUser();

  const scans = useQuery(
    api.scans.listByUser,
    user ? { userId: user.id } : "skip"
  );
  const repositories = useQuery(
    api.repositories.list,
    user ? { userId: user.id } : "skip"
  );

  const isLoading = scans === undefined;

  // Build repo id → name map
  const repoNameMap = new Map(
    (repositories ?? []).map((r) => [r._id as string, r.name])
  );

  const uiScans: Scan[] = (scans ?? []).map((s, i) =>
    convexScanToUIScan(s, repoNameMap.get(s.repositoryId as string) ?? "Unknown", i)
  );

  const completedScans = uiScans.filter((s) => s.status === "completed");
  const failedScans = uiScans.filter((s) => s.status === "failed");
  const runningScans = uiScans.filter(
    (s) => s.status === "running" || s.status === "queued"
  );

  const avgHealth =
    completedScans.length > 0
      ? Math.round(
          completedScans.reduce((sum, s) => sum + (s.healthScore ?? 0), 0) /
            completedScans.length
        )
      : null;

  return (
    <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
      <Header title="Repository Scans" subtitle="Analyze and review your scan history." />

      <div className="flex-1 p-6 space-y-6">
        {/* Title row */}
        <div className="fade-up flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(20,230,120,0.10)", border: "1.5px solid rgba(20,230,120,0.2)" }}
            >
              <ScanLine className="h-5 w-5" style={{ color: "#14E678" }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>Scan History</h2>
              <p className="section-label mt-0.5">
                {isLoading ? "Loading..." : `${uiScans.length} scans recorded`}
              </p>
            </div>
          </div>
          <Link href="/repositories" className="btn-primary flex items-center gap-2 text-sm">
            + Analyze Repository
          </Link>
        </div>

        {/* Running scans */}
        {runningScans.length > 0 && (
          <div className="fade-up space-y-4" style={{ animationDelay: "60ms" }}>
            <h3 className="text-[13px] font-semibold text-white">Active Scans</h3>
            {runningScans.map((s) => (
              <div key={s.id} className="max-w-lg">
                <ScanProgress scan={s} />
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="fade-up grid grid-cols-2 md:grid-cols-4 gap-4" style={{ animationDelay: "80ms" }}>
          {[
            { label: "Total Scans",      value: isLoading ? "—" : uiScans.length,         color: "#F0F0FF" },
            { label: "Completed",        value: isLoading ? "—" : completedScans.length,   color: "#14E678" },
            { label: "Failed",           value: isLoading ? "—" : failedScans.length,      color: "#F04060" },
            { label: "Avg Health Score", value: isLoading ? "—" : (avgHealth ?? "—"),      color: "#14E678" },
          ].map((stat) => (
            <div key={stat.label} className="card-glass p-4">
              <p className="section-label mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color, letterSpacing: "-0.04em" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!isLoading && uiScans.length === 0 && (
          <div className="fade-up flex flex-col items-center justify-center py-20 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-3xl mb-4"
              style={{
                background: "rgba(20,230,120,0.08)",
                border: "1.5px solid rgba(20,230,120,0.15)",
                boxShadow: "0 0 32px rgba(20,230,120,0.06)",
              }}
            >
              <ScanLine className="h-8 w-8" style={{ color: "#14E678" }} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>
              No scans yet
            </h3>
            <p className="text-sm mb-4" style={{ color: "#7878A0" }}>
              Connect a repository and run your first analysis.
            </p>
            <Link href="/repositories" className="btn-primary">
              Go to Repositories
            </Link>
          </div>
        )}

        {/* Scan table */}
        {uiScans.length > 0 && (
          <div className="fade-up overflow-x-auto" style={{ animationDelay: "120ms" }}>
            <ScanTable scans={uiScans} />
          </div>
        )}
      </div>
    </div>
  );
}
