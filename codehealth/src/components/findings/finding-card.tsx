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
  quality: "Code Quality",
  maintainability: "Maintainability",
  performance: "Performance",
  documentation: "Documentation",
  testing: "Testing",
  complexity: "Complexity",
};

const borderClasses: Record<string, string> = {
  critical: "finding-critical",
  high: "finding-high",
  medium: "finding-medium",
  low: "finding-low",
};

export function FindingCard({ finding }: FindingCardProps) {
  return (
    <Link
      href={`/findings/${finding.id}`}
      className={`group block rounded-2xl p-5 transition-all duration-200 card-comic ${borderClasses[finding.severity] ?? ""}`}
      style={{ borderRadius: "16px" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <SeverityBadge severity={finding.severity} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-white">{finding.title}</h3>
            <p className="text-[13px] mt-1 leading-relaxed line-clamp-2 font-medium" style={{ color: "#8B8BA8" }}>
              {finding.description}
            </p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span
                className="flex items-center gap-1.5 text-[11px] font-mono font-semibold rounded-lg px-2 py-0.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#8B8BA8",
                }}
              >
                <FileCode className="h-3 w-3" />
                {finding.file}
                {finding.line !== undefined && `:${finding.line}`}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1.5px solid rgba(255,255,255,0.09)",
                  color: "#8B8BA8",
                  boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
                }}
              >
                {categoryLabels[finding.category] ?? finding.category}
              </span>
              <span className="text-[11px] font-semibold" style={{ color: "#4D4D66" }}>
                {formatTimeAgo(finding.detectedAt)}
              </span>
            </div>
          </div>
        </div>
        <div
          className="flex-shrink-0 h-8 w-8 rounded-xl items-center justify-center hidden group-hover:flex transition-all"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1.5px solid rgba(255,255,255,0.1)",
          }}
        >
          <ChevronRight className="h-4 w-4" style={{ color: "#8B8BA8" }} />
        </div>
      </div>
    </Link>
  );
}
