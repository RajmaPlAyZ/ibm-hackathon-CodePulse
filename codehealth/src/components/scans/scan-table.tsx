"use client";

import { GitBranch, Clock, AlertTriangle } from "lucide-react";
import { getScanStatusBadge, formatDate, formatDuration } from "@/lib/utils-app";
import type { Scan } from "@/lib/types";

interface ScanTableProps {
  scans: Scan[];
}

function getHealthColor(score: number) {
  if (score >= 80) return "#1DDF6B";
  if (score >= 60) return "#FFB830";
  return "#FF4D6D";
}

const statusBadgeClass: Record<string, string> = {
  Completed: "badge-comic badge-green",
  Running:   "badge-comic badge-low",
  Failed:    "badge-comic badge-critical",
  Pending:   "badge-comic",
};

export function ScanTable({ scans }: ScanTableProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "#14141A",
        border: "1.5px solid rgba(255,255,255,0.09)",
        boxShadow: "0 4px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Header row */}
      <div
        className="grid grid-cols-7 gap-4 px-5 py-3"
        style={{ borderBottom: "1.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
      >
        {["Scan ID", "Repository", "Branch", "Started", "Duration", "Findings", "Score / Status"].map((h) => (
          <span key={h} className="section-label col-span-1">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div>
        {scans.map((scan, i) => {
          const statusBadge = getScanStatusBadge(scan.status);
          const badgeClass = statusBadgeClass[statusBadge.label] ?? "badge-comic";
          return (
            <div
              key={scan.id}
              className="grid grid-cols-7 gap-4 px-5 py-4 items-center transition-colors hover:bg-white/3"
              style={{ borderBottom: i < scans.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            >
              {/* Scan ID */}
              <span
                className="col-span-1 text-sm font-black font-mono"
                style={{ color: "#1DDF6B", textShadow: "0 0 8px rgba(29,223,107,0.25)" }}
              >
                #{String(scan.scanNumber).padStart(4, "0")}
              </span>

              {/* Repo */}
              <span className="col-span-1 text-sm font-bold text-white truncate">
                {scan.repositoryName}
              </span>

              {/* Branch */}
              <span className="col-span-1 flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#8B8BA8" }}>
                <GitBranch className="h-3 w-3 flex-shrink-0" />
                {scan.branch}
              </span>

              {/* Started */}
              <span className="col-span-1 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "#8B8BA8" }}>
                <Clock className="h-3 w-3 flex-shrink-0" />
                {formatDate(scan.startedAt)}
              </span>

              {/* Duration */}
              <span className="col-span-1 text-[12px] font-semibold" style={{ color: "#8B8BA8" }}>
                {scan.durationSeconds ? formatDuration(scan.durationSeconds) : "—"}
              </span>

              {/* Findings */}
              <span className="col-span-1 flex items-center gap-1.5 text-[12px] font-bold" style={{ color: "#FF4D6D" }}>
                <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                {scan.findingsCount}
              </span>

              {/* Score + Status */}
              <div className="col-span-1 flex items-center gap-2">
                {scan.status === "completed" && (
                  <span
                    className="text-sm font-black"
                    style={{
                      color: getHealthColor(scan.healthScore),
                      textShadow: `0 0 8px ${getHealthColor(scan.healthScore)}40`,
                    }}
                  >
                    {scan.healthScore}
                  </span>
                )}
                <span className={badgeClass}>
                  {statusBadge.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
