"use client";

import { GitBranch, Clock, AlertTriangle } from "lucide-react";
import { getScanStatusBadge, formatDate, formatDuration } from "@/lib/utils-app";
import type { Scan } from "@/lib/types";

interface ScanTableProps {
  scans: Scan[];
}

function getHealthColor(score: number): string {
  if (score >= 80) return "#14E678";
  if (score >= 60) return "#F5A623";
  return "#F04060";
}

export function ScanTable({ scans }: ScanTableProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Header row */}
      <div
        className="grid grid-cols-7 gap-4 px-5 py-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.025)",
        }}
      >
        {["Scan ID", "Repository", "Branch", "Started", "Duration", "Findings", "Score / Status"].map((h) => (
          <span key={h} className="section-label col-span-1">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div>
        {scans.map((scan, i) => {
          const statusBadge = getScanStatusBadge(scan.status);
          const badgeClass =
            scan.status === "completed" ? "badge-pill badge-green" :
            scan.status === "running"   ? "badge-pill badge-low" :
            scan.status === "failed"    ? "badge-pill badge-critical" :
            "badge-pill";
          return (
            <div
              key={scan.id}
              className="grid grid-cols-7 gap-4 px-5 py-4 items-center transition-colors hover:bg-white/3"
              style={{ borderBottom: i < scans.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
            >
              {/* Scan ID */}
              <span
                className="col-span-1 text-[12px] font-bold font-mono"
                style={{ color: "#14E678", textShadow: "0 0 8px rgba(20,230,120,0.2)" }}
              >
                #{String(scan.scanNumber).padStart(4, "0")}
              </span>

              {/* Repo */}
              <span className="col-span-1 text-[13px] font-semibold text-white truncate">
                {scan.repositoryName}
              </span>

              {/* Branch */}
              <span
                className="col-span-1 flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: "#7878A0" }}
              >
                <GitBranch className="h-3 w-3 flex-shrink-0" />
                {scan.branch}
              </span>

              {/* Started */}
              <span
                className="col-span-1 flex items-center gap-1.5 text-[11px] font-medium"
                style={{ color: "#7878A0" }}
              >
                <Clock className="h-3 w-3 flex-shrink-0" />
                {formatDate(scan.startedAt)}
              </span>

              {/* Duration */}
              <span className="col-span-1 text-[11px] font-medium" style={{ color: "#7878A0" }}>
                {scan.durationSeconds ? formatDuration(scan.durationSeconds) : "—"}
              </span>

              {/* Findings */}
              <span
                className="col-span-1 flex items-center gap-1.5 text-[12px] font-semibold"
                style={{ color: scan.findingsCount > 0 ? "#F04060" : "#14E678" }}
              >
                {scan.findingsCount > 0 && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
                {scan.findingsCount}
              </span>

              {/* Score + Status */}
              <div className="col-span-1 flex items-center gap-2">
                {scan.status === "completed" && (
                  <span
                    className="text-[13px] font-bold"
                    style={{
                      color: getHealthColor(scan.healthScore),
                      textShadow: `0 0 8px ${getHealthColor(scan.healthScore)}40`,
                    }}
                  >
                    {scan.healthScore}
                  </span>
                )}
                <span className={badgeClass}>{statusBadge.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
