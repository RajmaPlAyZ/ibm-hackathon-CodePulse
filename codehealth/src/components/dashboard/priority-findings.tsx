"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { SeverityBadge } from "@/components/findings/severity-badge";
import { formatTimeAgo } from "@/lib/utils-app";
import type { Finding } from "@/lib/types";

interface PriorityFindingsProps {
  findings: Finding[];
}

export function PriorityFindings({ findings }: PriorityFindingsProps) {
  return (
    <div className="card-comic p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-black text-white">Priority Findings</h2>
          <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#4D4D66" }}>
            Requires attention
          </p>
        </div>
        <Link
          href="/findings"
          className="text-[10px] font-bold uppercase tracking-wider rounded-full px-3 py-1.5 transition-all hover:opacity-80"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1.5px solid rgba(255,255,255,0.1)",
            color: "#8B8BA8",
            boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
          }}
        >
          View all →
        </Link>
      </div>

      <div className="space-y-1.5">
        {findings.slice(0, 5).map((finding) => (
          <Link
            key={finding.id}
            href={`/findings/${finding.id}`}
            className="group flex items-center gap-3 rounded-xl p-3 transition-all duration-150 hover:bg-white/5"
          >
            <SeverityBadge severity={finding.severity} className="flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{finding.title}</p>
              <p className="text-[11px] font-mono truncate mt-0.5" style={{ color: "#4D4D66" }}>
                {finding.file}
                {finding.line ? `:${finding.line}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-semibold" style={{ color: "#4D4D66" }}>
                {formatTimeAgo(finding.detectedAt)}
              </span>
              <ChevronRight
                className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: "#8B8BA8" }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
