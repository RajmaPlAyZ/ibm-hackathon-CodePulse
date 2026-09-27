"use client";

import Link from "next/link";
import { GitBranch, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";
import { getRepositoryStatusBadge, formatTimeAgo, getLanguageColor } from "@/lib/utils-app";
import type { Repository } from "@/lib/types";

function getHealthTheme(score: number) {
  if (score >= 80)
    return { color: "#14E678", glow: "rgba(20,230,120,0.35)", dim: "rgba(20,230,120,0.08)", border: "rgba(20,230,120,0.2)", stop1: "#0FCC68", stop2: "#4DFFA0" };
  if (score >= 60)
    return { color: "#F5A623", glow: "rgba(245,166,35,0.35)", dim: "rgba(245,166,35,0.08)", border: "rgba(245,166,35,0.2)", stop1: "#D4880A", stop2: "#FBC94A" };
  return  { color: "#F04060", glow: "rgba(240,64,96,0.35)",  dim: "rgba(240,64,96,0.08)",  border: "rgba(240,64,96,0.2)",  stop1: "#C0253A", stop2: "#FF7090" };
}

interface MiniMetricProps {
  label: string;
  value: number;
}

function MiniMetric({ label, value }: MiniMetricProps) {
  const { color } = getHealthTheme(value);
  return (
    <div
      className="flex flex-col gap-0.5 rounded-lg px-2.5 py-1.5 min-w-0"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <span className="section-label">{label}</span>
      <span
        className="text-[13px] font-semibold tabular-nums"
        style={{ color, letterSpacing: "-0.02em" }}
      >
        {value}
        <span style={{ fontSize: 10, color: "#404060" }}>%</span>
      </span>
    </div>
  );
}

export function RepositoryCard({ repository }: { repository: Repository }) {
  const statusBadge = getRepositoryStatusBadge(repository.status);
  const theme = getHealthTheme(repository.healthScore);
  const gradId = `repo-ring-${repository.id}`;
  const ringRadius = 22;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - repository.healthScore / 100);

  return (
    <Link
      href={`/repositories/${repository.id}`}
      className="group block relative overflow-hidden rounded-2xl p-5 transition-all duration-200"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = theme.border;
        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.4), 0 0 20px ${theme.dim}, inset 0 1px 0 rgba(255,255,255,0.06)`;
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
    >
      {/* Hover glow corner */}
      <div
        className="pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)` }}
        aria-hidden
      />

      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3
              className="text-[13px] font-semibold leading-tight"
              style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}
            >
              {repository.name}
            </h3>
            <span
              className="badge-pill text-[9px]"
              style={
                repository.status === "healthy"
                  ? { background: "rgba(20,230,120,0.1)", color: "#14E678", borderColor: "rgba(20,230,120,0.2)" }
                  : repository.status === "needs-attention"
                  ? { background: "rgba(245,166,35,0.1)", color: "#F5A623", borderColor: "rgba(245,166,35,0.2)" }
                  : { background: "rgba(240,64,96,0.1)", color: "#F04060", borderColor: "rgba(240,64,96,0.2)" }
              }
            >
              {statusBadge.label}
            </span>
          </div>
          <p
            className="text-[11px] font-mono truncate"
            style={{ color: "#404060" }}
          >
            {repository.fullName}
          </p>
        </div>

        <ArrowUpRight
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
          style={{ width: 14, height: 14, color: theme.color }}
        />
      </div>

      {/* Score ring + metrics */}
      <div className="flex items-center gap-4 mb-4">
        {/* Mini ring */}
        <div className="relative flex-shrink-0" style={{ width: 56, height: 56 }}>
          <svg viewBox="0 0 56 56" className="-rotate-90" style={{ width: 56, height: 56 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={theme.stop1} />
                <stop offset="100%" stopColor={theme.stop2} />
              </linearGradient>
            </defs>
            <circle cx="28" cy="28" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
            <circle
              cx="28"
              cy="28"
              r={ringRadius}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="5"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 3px ${theme.glow})` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-[13px] font-semibold tabular-nums"
              style={{ color: theme.color, letterSpacing: "-0.03em" }}
            >
              {repository.healthScore}
            </span>
          </div>
        </div>

        {/* Mini metrics */}
        <div className="flex-1 grid grid-cols-2 gap-1.5">
          <MiniMetric label="Quality" value={repository.metrics.codeQuality} />
          <MiniMetric label="Testing" value={repository.metrics.testCoverage} />
          <MiniMetric label="Security" value={repository.metrics.security} />
          <MiniMetric label="Docs" value={repository.metrics.documentation} />
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{
                background: getLanguageColor(repository.language),
                boxShadow: `0 0 4px ${getLanguageColor(repository.language)}80`,
              }}
            />
            <span className="text-[11px] font-medium" style={{ color: "#7878A0" }}>
              {repository.language}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#7878A0" }}>
            <GitBranch style={{ width: 11, height: 11 }} />
            {repository.branch}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {repository.issueCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#F04060" }}>
              <AlertTriangle style={{ width: 10, height: 10 }} />
              {repository.issueCount}
            </div>
          )}
          {repository.lastScanAt && (
            <div className="flex items-center gap-1 text-[10px] font-medium" style={{ color: "#404060" }}>
              <Clock style={{ width: 10, height: 10 }} />
              {formatTimeAgo(repository.lastScanAt)}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
