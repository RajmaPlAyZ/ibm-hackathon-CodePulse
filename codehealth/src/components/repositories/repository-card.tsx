"use client";

import Link from "next/link";
import { GitBranch, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { getRepositoryStatusBadge, formatTimeAgo, getLanguageColor } from "@/lib/utils-app";
import type { Repository } from "@/lib/types";

function getHealthColor(score: number) {
  if (score >= 80) return { color: "#1DDF6B", glow: "rgba(29,223,107,0.4)", shadow: "#0A5C2E" };
  if (score >= 60) return { color: "#FFB830", glow: "rgba(255,184,48,0.4)", shadow: "#6B4800" };
  return { color: "#FF4D6D", glow: "rgba(255,77,109,0.4)", shadow: "#6B001A" };
}

function MetricPill({ label, value }: { label: string; value: number }) {
  const { color } = getHealthColor(value);
  return (
    <div
      className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#4D4D66" }}>{label}</span>
      <span className="text-[11px] font-black" style={{ color }}>{value}%</span>
    </div>
  );
}

export function RepositoryCard({ repository }: { repository: Repository }) {
  const statusBadge = getRepositoryStatusBadge(repository.status);
  const { color, glow, shadow } = getHealthColor(repository.healthScore);

  return (
    <Link
      href={`/repositories/${repository.id}`}
      className="group block card-comic p-5 transition-all"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-sm font-black text-white">{repository.name}</h3>
            <span
              className={`badge-comic ${
                repository.status === "healthy" ? "badge-green" :
                repository.status === "needs-attention" ? "badge-medium" : "badge-critical"
              }`}
            >
              {statusBadge.label}
            </span>
          </div>
          <p className="text-[11px] font-mono font-semibold truncate" style={{ color: "#4D4D66" }}>
            {repository.fullName}
          </p>
        </div>
        <ChevronRight
          className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "#8B8BA8" }}
        />
      </div>

      {/* Health ring + metrics */}
      <div className="flex items-center gap-4 mb-4">
        {/* Ring */}
        <div className="relative h-16 w-16 flex-shrink-0">
          <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - repository.healthScore / 100)}
              strokeLinecap="round"
              filter={`drop-shadow(0 0 4px ${glow})`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-sm font-black leading-none"
              style={{ color, textShadow: `0 0 8px ${glow}` }}
            >
              {repository.healthScore}
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex-1 grid grid-cols-2 gap-1.5">
          <MetricPill label="Quality" value={repository.metrics.codeQuality} />
          <MetricPill label="Testing" value={repository.metrics.testCoverage} />
          <MetricPill label="Security" value={repository.metrics.security} />
          <MetricPill label="Docs" value={repository.metrics.documentation} />
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: "1.5px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: getLanguageColor(repository.language), boxShadow: `0 0 5px ${getLanguageColor(repository.language)}80` }}
            />
            <span className="text-[11px] font-bold" style={{ color: "#8B8BA8" }}>{repository.language}</span>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#8B8BA8" }}>
            <GitBranch className="h-3 w-3" />
            {repository.branch}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold" style={{ color: "#FF4D6D" }}>
            <AlertTriangle className="h-3 w-3" />
            {repository.issueCount}
          </span>
          {repository.lastScanAt && (
            <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "#4D4D66" }}>
              <Clock className="h-3 w-3" />
              {formatTimeAgo(repository.lastScanAt)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
