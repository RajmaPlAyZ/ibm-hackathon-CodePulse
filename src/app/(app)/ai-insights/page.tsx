"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Header } from "@/components/layout/header";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Zap,
  Loader2,
  RefreshCw,
  WifiOff,
  FileCode,
} from "lucide-react";

// ── Severity colour map ─────────────────────────────────────────
const severityColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  critical: { bg: "rgba(240,64,96,0.10)",  text: "#F04060", border: "rgba(240,64,96,0.25)",  glow: "rgba(240,64,96,0.15)"  },
  high:     { bg: "rgba(245,130,60,0.10)",  text: "#F5823C", border: "rgba(245,130,60,0.25)", glow: "rgba(245,130,60,0.12)" },
  medium:   { bg: "rgba(245,166,35,0.10)",  text: "#F5A623", border: "rgba(245,166,35,0.25)", glow: "rgba(245,166,35,0.10)" },
  low:      { bg: "rgba(77,158,255,0.10)",  text: "#4D9EFF", border: "rgba(77,158,255,0.25)", glow: "rgba(77,158,255,0.10)" },
};

// ── Retry helper ────────────────────────────────────────────────
async function triggerRetry(params: {
  aiAnalysisId: string;
  scanId: string;
  owner: string;
  repo: string;
  branch: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/ai-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scanId: params.scanId,
        owner: params.owner,
        repo: params.repo,
        branch: params.branch,
        retryId: params.aiAnalysisId,
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string };
      return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

// ── Generate (first time) helper ────────────────────────────────
async function triggerGenerate(params: {
  scanId: string;
  owner: string;
  repo: string;
  branch: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/ai-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string; detail?: string; code?: string };
      if (json.code === "NOT_CONFIGURED") {
        return { ok: false, error: "OpenRouter AI is not configured. Set OPENROUTER_API_KEY in your environment." };
      }
      return { ok: false, error: json.error ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export default function AIInsightsPage() {
  const { user } = useUser();

  // Latest AI analysis for this user
  const aiAnalyses = useQuery(
    api.aiAnalyses.listByUser,
    user ? { userId: user.id } : "skip"
  );

  // Latest completed scan for context (owner/repo/branch needed for retry)
  const latestScanId = aiAnalyses?.[0]?.scanId as Id<"scans"> | undefined;
  const latestScan = useQuery(
    api.scans.get,
    latestScanId ? { id: latestScanId } : "skip"
  );
  const latestRepo = useQuery(
    api.repositories.get,
    latestScan?.repositoryId ? { id: latestScan.repositoryId } : "skip"
  );

  const [retrying, setRetrying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Pick the most recent AI analysis
  const aiAnalysis = aiAnalyses?.[0] ?? null;
  const isLoading = aiAnalyses === undefined;

  const handleRetry = useCallback(async () => {
    if (!aiAnalysis || !latestScan || !latestRepo) return;
    setRetrying(true);
    setActionError(null);
    const result = await triggerRetry({
      aiAnalysisId: aiAnalysis._id,
      scanId: latestScan._id,
      owner: latestRepo.owner,
      repo: latestRepo.name,
      branch: latestScan.branch,
    });
    if (!result.ok) setActionError(result.error ?? "Retry failed");
    setRetrying(false);
  }, [aiAnalysis, latestScan, latestRepo]);

  const handleGenerate = useCallback(async () => {
    if (!latestScan || !latestRepo) return;
    setGenerating(true);
    setActionError(null);
    const result = await triggerGenerate({
      scanId: latestScan._id,
      owner: latestRepo.owner,
      repo: latestRepo.name,
      branch: latestScan.branch,
    });
    if (!result.ok) setActionError(result.error ?? "Generation failed");
    setGenerating(false);
  }, [latestScan, latestRepo]);

  // ── Loading ─────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
        <Header title="AI Insights" subtitle="Nemotron powered analysis" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#9B7EFF" }} />
            <p className="text-sm font-semibold" style={{ color: "#404060" }}>Loading AI insights…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── No analyses at all ──────────────────────────────────────
  if (!aiAnalysis) {
    return (
      <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
        <Header title="AI Insights" subtitle="Nemotron powered analysis" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-5">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(155,126,255,0.10)", border: "1.5px solid rgba(155,126,255,0.22)" }}
          >
            <Brain className="h-8 w-8" style={{ color: "#9B7EFF" }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-2">No AI insights yet</h2>
            <p className="text-sm max-w-sm" style={{ color: "#7878A0" }}>
              Run a repository scan to automatically generate AI insights, or configure
              your OpenRouter API key and generate insights for an existing scan.
            </p>
          </div>
          {latestScan && latestRepo && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "rgba(155,126,255,0.15)", color: "#9B7EFF", border: "1.5px solid rgba(155,126,255,0.3)" }}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate AI Insights
            </button>
          )}
          {actionError && (
            <p className="text-sm max-w-sm text-center" style={{ color: "#F04060" }}>{actionError}</p>
          )}
        </div>
      </div>
    );
  }

  // ── AI analysis is pending or running ───────────────────────
  if (aiAnalysis.status === "pending" || aiAnalysis.status === "running") {
    return (
      <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
        <Header title="AI Insights" subtitle="Nemotron powered analysis" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-5">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(155,126,255,0.10)", border: "1.5px solid rgba(155,126,255,0.22)", boxShadow: "0 0 32px rgba(155,126,255,0.15)" }}
          >
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#9B7EFF" }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-2">AI analysis in progress…</h2>
            <p className="text-sm max-w-sm" style={{ color: "#7878A0" }}>
              Nemotron is interpreting your scan results. This usually takes 10–30 seconds.
              The page will update automatically.
            </p>
          </div>
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
            style={{ background: "rgba(155,126,255,0.10)", color: "#9B7EFF", border: "1px solid rgba(155,126,255,0.22)" }}
          >
            <Zap className="h-3 w-3" />
            Nemotron · Generating
          </div>
        </div>
      </div>
    );
  }

  // ── AI analysis failed ──────────────────────────────────────
  if (aiAnalysis.status === "failed") {
    return (
      <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
        <Header title="AI Insights" subtitle="Nemotron powered analysis" />
        <div className="flex-1 p-6 space-y-6">
          <PageTitleRow />
          <div
            className="rounded-2xl p-6 flex flex-col items-center text-center gap-4"
            style={{ background: "rgba(240,64,96,0.06)", border: "1.5px solid rgba(240,64,96,0.18)" }}
          >
            <WifiOff className="h-10 w-10" style={{ color: "#F04060" }} />
            <div>
              <h3 className="text-sm font-bold text-white mb-1">AI insights unavailable</h3>
              <p className="text-sm max-w-md" style={{ color: "#7878A0" }}>
                {aiAnalysis.error ?? "AI analysis could not be completed."}
              </p>
            </div>
            {latestScan && latestRepo && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(155,126,255,0.12)", color: "#9B7EFF", border: "1.5px solid rgba(155,126,255,0.25)" }}
              >
                {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Retry AI Analysis
              </button>
            )}
            {actionError && (
              <p className="text-sm" style={{ color: "#F04060" }}>{actionError}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Completed — show real AI data ───────────────────────────
  const recs = aiAnalysis.recommendations ?? [];
  const strengths = aiAnalysis.strengths ?? [];
  const improvementAreas = aiAnalysis.improvementAreas ?? [];

  return (
    <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
      <Header title="AI Insights" subtitle="Nemotron powered analysis" />

      <div className="flex-1 p-6 space-y-6">

        {/* ── Page title row ── */}
        <div className="fade-up flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
              style={{
                background: "rgba(155,126,255,0.12)",
                border: "1px solid rgba(155,126,255,0.22)",
                boxShadow: "0 0 20px rgba(155,126,255,0.1)",
              }}
            >
              <Sparkles className="h-5 w-5" style={{ color: "#9B7EFF" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold" style={{ color: "#F0F0FF", letterSpacing: "-0.02em" }}>
                  AI Insights
                </h2>
                <span
                  className="badge-pill"
                  style={{ background: "rgba(155,126,255,0.1)", color: "#9B7EFF", borderColor: "rgba(155,126,255,0.22)" }}
                >
                  <Zap style={{ width: 9, height: 9, display: "inline", marginRight: 3 }} />
                  Nemotron · {aiAnalysis.modelId ?? "Nemotron"}
                </span>
              </div>
              {aiAnalysis.generatedAt && (
                <p className="text-[11px] font-medium mt-0.5" style={{ color: "#404060" }}>
                  AI-generated explanation · Based on latest scan ·{" "}
                  {new Date(aiAnalysis.generatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Retry button (always available for a completed analysis) */}
          {latestScan && latestRepo && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "rgba(155,126,255,0.08)", color: "#9B7EFF", border: "1px solid rgba(155,126,255,0.18)" }}
            >
              {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </button>
          )}
        </div>

        {actionError && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(240,64,96,0.08)", color: "#F04060", border: "1px solid rgba(240,64,96,0.2)" }}
          >
            {actionError}
          </div>
        )}

        {/* ── Developer summary pill ── */}
        {aiAnalysis.developerSummary && (
          <div
            className="fade-up rounded-2xl px-5 py-4"
            style={{ background: "rgba(155,126,255,0.07)", border: "1px solid rgba(155,126,255,0.18)", animationDelay: "40ms" }}
          >
            <p className="text-[13px] font-semibold italic" style={{ color: "#C4B0FF" }}>
              &ldquo;{aiAnalysis.developerSummary}&rdquo;
            </p>
          </div>
        )}

        {/* ── Codebase Summary ── */}
        <div className="card-glass-purple fade-up p-6" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2.5 mb-5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: "rgba(155,126,255,0.15)", border: "1px solid rgba(155,126,255,0.25)" }}
            >
              <Brain className="h-4 w-4" style={{ color: "#9B7EFF" }} />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold leading-tight" style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}>
                Codebase Summary
              </h3>
              <p className="section-label mt-0.5">Holistic AI assessment · Based on scan evidence</p>
            </div>
          </div>

          <p className="text-[13px] leading-relaxed mb-6" style={{ color: "#7878A0" }}>
            {aiAnalysis.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(20,230,120,0.04)", border: "1px solid rgba(20,230,120,0.14)" }}
            >
              <p className="section-label mb-3" style={{ color: "#14E678" }}>✦ Strengths</p>
              {strengths.length > 0 ? (
                <ul className="space-y-2">
                  {strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] font-medium" style={{ color: "#7878A0" }}>
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#14E678" }} />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px]" style={{ color: "#404060" }}>No strengths identified.</p>
              )}
            </div>

            {/* Areas for improvement */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "rgba(245,166,35,0.04)", border: "1px solid rgba(245,166,35,0.14)" }}
            >
              <p className="section-label mb-3" style={{ color: "#F5A623" }}>⚑ Areas for Improvement</p>
              {improvementAreas.length > 0 ? (
                <ul className="space-y-2">
                  {improvementAreas.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] font-medium" style={{ color: "#7878A0" }}>
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#F5A623" }} />
                      {w}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px]" style={{ color: "#404060" }}>No improvement areas identified.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Recommendations ── */}
        {recs.length > 0 && (
          <div className="fade-up" style={{ animationDelay: "120ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-semibold" style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}>
                Recommended Actions
              </h3>
              <span
                className="badge-pill"
                style={{ background: "rgba(255,255,255,0.04)", color: "#7878A0", borderColor: "rgba(255,255,255,0.09)" }}
              >
                {recs.length} {recs.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="space-y-4">
              {recs.map((rec, i) => {
                const colors = severityColors[rec.severity] ?? severityColors.low;
                return (
                  <div
                    key={i}
                    className="card-glass p-5 transition-all duration-200 hover:scale-[1.005]"
                  >
                    <div className="flex items-start gap-4">
                      {/* Priority number badge */}
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                        style={{
                          background: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          boxShadow: `0 0 12px ${colors.glow}`,
                        }}
                      >
                        {rec.priority}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="badge-pill"
                            style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
                          >
                            {rec.severity}
                          </span>
                          <span
                            className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(155,126,255,0.08)", color: "#9B7EFF", border: "1px solid rgba(155,126,255,0.15)" }}
                          >
                            AI recommendation
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-[13px] font-semibold mb-1.5 leading-snug" style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}>
                          {rec.title}
                        </h4>

                        {/* Why it matters */}
                        <p className="text-[12px] mb-2 leading-relaxed" style={{ color: "#404060" }}>
                          <span style={{ color: "#7878A0" }}>Why it matters: </span>
                          {rec.whyItMatters}
                        </p>

                        {/* Action */}
                        <p className="text-[12px] mb-3 leading-relaxed" style={{ color: "#7878A0" }}>
                          <span className="font-semibold" style={{ color: "#F0F0FF" }}>Action: </span>
                          {rec.action}
                        </p>

                        {/* Affected files */}
                        {rec.affectedFiles.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <FileCode className="h-3 w-3 flex-shrink-0" style={{ color: "#404060" }} />
                            {rec.affectedFiles.map((file) => (
                              <span
                                key={file}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                                style={{ background: "rgba(255,255,255,0.04)", color: "#7878A0", border: "1px solid rgba(255,255,255,0.07)" }}
                              >
                                {file}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <button
                        className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all hover:opacity-90 flex-shrink-0"
                        style={{ background: "rgba(155,126,255,0.1)", color: "#9B7EFF", border: "1px solid rgba(155,126,255,0.2)" }}
                      >
                        Details
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Provenance footer ── */}
        <div className="card-glass-purple fade-up p-5" style={{ animationDelay: "200ms" }}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: "rgba(155,126,255,0.15)", border: "1px solid rgba(155,126,255,0.25)" }}
            >
              <Zap className="h-4 w-4" style={{ color: "#9B7EFF" }} />
            </div>
            <div>
              <p className="text-[13px] font-semibold mb-1" style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}>
                Generated with Nemotron via OpenRouter
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: "#7878A0" }}>
                These insights are AI-generated explanations based on deterministic scan results.
                Metrics and findings were calculated by the CodeHealth static analysis engine —
                not by the AI. The AI&apos;s role is interpretation, prioritisation, and recommending
                developer actions based on the supplied evidence.
                {aiAnalysis.modelId && (
                  <> Model: <span style={{ color: "#9B7EFF" }}>{aiAnalysis.modelId}</span>.</>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function PageTitleRow() {
  return (
    <div className="fade-up flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
        style={{
          background: "rgba(155,126,255,0.12)",
          border: "1px solid rgba(155,126,255,0.22)",
          boxShadow: "0 0 20px rgba(155,126,255,0.1)",
        }}
      >
        <Sparkles className="h-5 w-5" style={{ color: "#9B7EFF" }} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold" style={{ color: "#F0F0FF", letterSpacing: "-0.02em" }}>
            AI Insights
          </h2>
          <span
            className="badge-pill"
            style={{ background: "rgba(155,126,255,0.1)", color: "#9B7EFF", borderColor: "rgba(155,126,255,0.22)" }}
          >
            <Zap style={{ width: 9, height: 9, display: "inline", marginRight: 3 }} />
            Nemotron
          </span>
        </div>
      </div>
    </div>
  );
}
