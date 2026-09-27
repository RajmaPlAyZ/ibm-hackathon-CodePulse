"use client";

import Link from "next/link";
import { ChevronRight, FileCode } from "lucide-react";
import { SeverityBadge } from "./severity-badge";
import { formatTimeAgo } from "@/lib/utils-app";
import type { Finding } from "@/lib/types";

interface FindingCardProps {
  finding: Finding;
}

const categoryLabels: Record<string, string> = {
  security: "Security",
  quality: "Quality",
  maintainability: "Maintainability",
  performance: "Performance",
  documentation: "Docs",
  testing: "Testing",
  complexity: "Complexity",
};

/** Colored badge config per category */
const categoryBadgeStyle: Record<string, { bg: string; color: string; border: string }> = {
  security:        { bg: "rgba(255,77,109,0.12)",    color: "#FF4D6D", border: "rgba(255,77,109,0.25)" },
  quality:         { bg: "rgba(78,158,255,0.12)",    color: "#4E9EFF", border: "rgba(78,158,255,0.25)" },
  complexity:      { bg: "rgba(167,139,250,0.12)",   color: "#A78BFA", border: "rgba(167,139,250,0.25)" },
  documentation:   { bg: "rgba(139,139,168,0.12)",   color: "#8B8BA8", border: "rgba(139,139,168,0.25)" },
  testing:         { bg: "rgba(255,184,48,0.12)",    color: "#FFB830", border: "rgba(255,184,48,0.25)" },
  maintainability: { bg: "rgba(29,223,107,0.12)",    color: "#1DDF6B", border: "rgba(29,223,107,0.25)" },
  performance:     { bg: "rgba(255,140,50,0.12)",    color: "#FF8C32", border: "rgba(255,140,50,0.25)" },
};

const statusBadgeStyle: Record<string, { bg: string; color: string; border: string }> = {
  open:     { bg: "rgba(255,140,50,0.10)",  color: "#FF8C32", border: "rgba(255,140,50,0.2)"  },
  resolved: { bg: "rgba(29,223,107,0.10)",  color: "#1DDF6B", border: "rgba(29,223,107,0.2)"  },
  ignored:  { bg: "rgba(255,255,255,0.05)", color: "#8B8BA8", border: "rgba(255,255,255,0.1)" },
};

const borderClasses: Record<string, string> = {
  critical: "finding-critical",
  high:     "finding-high",
  medium:   "finding-medium",
  low:      "finding-low",
};

/** Shorten a file path to last 2 segments to keep it compact */
function truncateFilePath(filePath: string): string {
  if (!filePath) return "";
  const parts = filePath.replace(/\\/g, "/").split("/");
  if (parts.length <= 2) return filePath;
  return "…/" + parts.slice(-2).join("/");
}

export function FindingCard({ finding }: FindingCardProps) {
  const catStyle = categoryBadgeStyle[finding.category] ?? {
    bg: "rgba(255,255,255,0.06)",
    color: "#8B8BA8",
    border: "rgba(255,255,255,0.12)",
  };
  const stStyle = statusBadgeStyle[finding.status] ?? statusBadgeStyle.open;

  return (
    <Link
      href={`/findings/${finding.id}`}
      className={`group block rounded-2xl p-5 transition-all duration-200 card-comic ${borderClasses[finding.severity] ?? ""} hover:scale-[1.005]`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left — main content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Severity badge */}
          <SeverityBadge severity={finding.severity} className="mt-0.5 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-sm font-black text-white leading-snug group-hover:text-[#1DDF6B] transition-colors">
              {finding.title}
            </h3>

            {/* Description */}
            <p
              className="text-[13px] mt-1 leading-relaxed font-medium line-clamp-2"
              style={{ color: "#8B8BA8" }}
            >
              {finding.description}
            </p>

            {/* Recommendation (if present) — 2-line truncate */}
            {finding.recommendedAction && (
              <p
                className="text-[12px] mt-1.5 leading-relaxed font-medium line-clamp-2 italic"
                style={{ color: "#4D4D66" }}
              >
                {finding.recommendedAction}
              </p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {/* File path + line */}
              <span
                className="flex items-center gap-1.5 text-[11px] font-mono font-semibold rounded-lg px-2 py-0.5 max-w-[200px]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#8B8BA8",
                }}
                title={finding.file}
              >
                <FileCode className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{truncateFilePath(finding.file)}</span>
                {finding.line !== undefined && (
                  <span style={{ color: "#FFB830", flexShrink: 0 }}>:{finding.line}</span>
                )}
              </span>

              {/* Category badge */}
              <span
                className="text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5 flex-shrink-0"
                style={{
                  background: catStyle.bg,
                  color: catStyle.color,
                  border: `1.5px solid ${catStyle.border}`,
                  boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
                }}
              >
                {categoryLabels[finding.category] ?? finding.category}
              </span>

              {/* Status badge */}
              <span
                className="text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5 flex-shrink-0"
                style={{
                  background: stStyle.bg,
                  color: stStyle.color,
                  border: `1.5px solid ${stStyle.border}`,
                  boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
                }}
              >
                {finding.status}
              </span>

              {/* Time */}
              <span className="text-[11px] font-semibold" style={{ color: "#4D4D66" }}>
                {formatTimeAgo(finding.detectedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Right — chevron */}
        <div
          className="flex-shrink-0 h-8 w-8 rounded-xl items-center justify-center hidden group-hover:flex transition-all"
          style={{
            background: "rgba(29,223,107,0.08)",
            border: "1.5px solid rgba(29,223,107,0.2)",
          }}
        >
          <ChevronRight className="h-4 w-4" style={{ color: "#1DDF6B" }} />
        </div>
      </div>
    </Link>
  );
}
