"use client";

import { Sparkles, ArrowRight, Loader2, WifiOff } from "lucide-react";
import Link from "next/link";

// ── Real shape from aiAnalyses Convex table ─────────────────────
export interface RealAIRecommendation {
  priority: number;           // 1 = most important
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  whyItMatters: string;
  action: string;
  affectedFiles: string[];
}

export type AIAnalysisStatus = "pending" | "running" | "completed" | "failed";

interface AIRecommendationsProps {
  /** undefined = still loading from Convex */
  status: AIAnalysisStatus | undefined;
  recommendations: RealAIRecommendation[];
  developerSummary?: string;
  error?: string;
}

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#F04060", bg: "rgba(240,64,96,0.10)",  border: "rgba(240,64,96,0.22)"  },
  high:     { color: "#F5823C", bg: "rgba(245,130,60,0.10)", border: "rgba(245,130,60,0.22)" },
  medium:   { color: "#F5A623", bg: "rgba(245,166,35,0.10)", border: "rgba(245,166,35,0.22)" },
  low:      { color: "#4D9EFF", bg: "rgba(77,158,255,0.10)", border: "rgba(77,158,255,0.22)" },
};

export function AIRecommendations({
  status,
  recommendations,
  developerSummary,
  error,
}: AIRecommendationsProps) {
  return (
    <div className="card-glass-purple p-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.8), rgba(167,139,250,0.8))",
              boxShadow: "0 0 14px rgba(155,126,255,0.25)",
              border: "1px solid rgba(155,126,255,0.4)",
            }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
              AI Recommendations
            </h2>
            <p className="section-label mt-0.5" style={{ color: "#6040A0" }}>IBM watsonx.ai</p>
          </div>
        </div>
        <span
          className="badge-pill"
          style={{ background: "rgba(155,126,255,0.10)", color: "#9B7EFF", borderColor: "rgba(155,126,255,0.22)" }}
        >
          Beta
        </span>
      </div>

      {/* ── Loading ── */}
      {status === undefined && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" style={{ color: "#9B7EFF" }} />
          <p className="text-[12px] font-medium" style={{ color: "#7878A0" }}>Loading AI analysis…</p>
        </div>
      )}

      {/* ── Pending / Running ── */}
      {(status === "pending" || status === "running") && (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" style={{ color: "#9B7EFF" }} />
          <p className="text-[12px] font-medium" style={{ color: "#7878A0" }}>
            AI analysis in progress…
          </p>
        </div>
      )}

      {/* ── Failed ── */}
      {status === "failed" && (
        <div className="flex items-center gap-2 py-4">
          <WifiOff className="h-4 w-4 flex-shrink-0" style={{ color: "#8B8BA8" }} />
          <p className="text-[12px] font-medium" style={{ color: "#7878A0" }}>
            {error ?? "AI insights unavailable for this scan."}
          </p>
        </div>
      )}

      {/* ── Completed — show recommendations ── */}
      {status === "completed" && recommendations.length > 0 && (
        <>
          {/* Developer summary (one-liner) */}
          {developerSummary && (
            <p
              className="text-[12px] font-medium italic mb-3 leading-relaxed"
              style={{ color: "#9B7EFF" }}
            >
              &ldquo;{developerSummary}&rdquo;
            </p>
          )}

          <ol className="space-y-2 mb-4">
            {recommendations.slice(0, 4).map((rec, i) => {
              const cfg = severityConfig[rec.severity] ?? severityConfig.low;
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/4"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {rec.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-white leading-snug">{rec.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="badge-pill"
                        style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                      >
                        {rec.severity}
                      </span>
                      {rec.affectedFiles[0] && (
                        <span className="text-[10px] font-mono truncate" style={{ color: "#404060" }}>
                          {rec.affectedFiles[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {/* ── Completed but no recommendations ── */}
      {status === "completed" && recommendations.length === 0 && (
        <p className="text-[12px] font-medium py-4" style={{ color: "#7878A0" }}>
          No recommendations generated.
        </p>
      )}

      {/* ── Not configured / no analysis yet ── */}
      {status === undefined && recommendations.length === 0 && (
        <p className="text-[12px] font-medium py-4" style={{ color: "#7878A0" }}>
          Run a scan to generate AI recommendations.
        </p>
      )}

      {/* ── CTA ── */}
      <Link
        href="/ai-insights"
        className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-[12px] font-semibold transition-all hover:opacity-90"
        style={{
          background: "rgba(155,126,255,0.10)",
          color: "#9B7EFF",
          border: "1px solid rgba(155,126,255,0.22)",
        }}
      >
        View All Recommendations
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
