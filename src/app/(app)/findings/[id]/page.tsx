"use client";

import { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Header } from "@/components/layout/header";
import { SeverityBadge } from "@/components/findings/severity-badge";
import { formatTimeAgo } from "@/lib/utils-app";
import type { Severity, FindingStatus } from "@/lib/types";
import {
  FileCode,
  ChevronLeft,
  ExternalLink,
  Sparkles,
  CheckCircle,
  ClipboardList,
  AlertTriangle,
  Loader2,
  Hash,
  Clock,
  Tag,
  EyeOff,
  RotateCcw,
  WifiOff,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

const categoryLabels: Record<string, string> = {
  security:        "Security",
  quality:         "Code Quality",
  maintainability: "Maintainability",
  complexity:      "Complexity",
  documentation:   "Documentation",
  testing:         "Testing",
};

const categoryBadgeStyle: Record<string, { bg: string; color: string; border: string }> = {
  security:        { bg: "rgba(255,77,109,0.12)",  color: "#FF4D6D", border: "rgba(255,77,109,0.25)"  },
  quality:         { bg: "rgba(78,158,255,0.12)",  color: "#4E9EFF", border: "rgba(78,158,255,0.25)"  },
  complexity:      { bg: "rgba(167,139,250,0.12)", color: "#A78BFA", border: "rgba(167,139,250,0.25)" },
  documentation:   { bg: "rgba(139,139,168,0.12)", color: "#8B8BA8", border: "rgba(139,139,168,0.25)" },
  testing:         { bg: "rgba(255,184,48,0.12)",  color: "#FFB830", border: "rgba(255,184,48,0.25)"  },
  maintainability: { bg: "rgba(29,223,107,0.12)",  color: "#1DDF6B", border: "rgba(29,223,107,0.25)"  },
};

export default function FindingDetailPage({ params }: Props) {
  const { id } = use(params);
  const { user } = useUser();
  const updateStatus = useMutation(api.findings.updateStatus);

  const finding = useQuery(api.findings.get, { id: id as Id<"findings"> });

  // Load the AI analysis for this finding's scan (if one exists)
  const aiAnalysis = useQuery(
    api.aiAnalyses.getByScan,
    finding?.scanId ? { scanId: finding.scanId as Id<"scans"> } : "skip"
  );

  if (finding === undefined) {
    return (
      <div className="flex flex-col min-h-screen" style={{ background: "#0D0D10" }}>
        <Header title="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1DDF6B" }} />
            <p className="text-sm font-semibold" style={{ color: "#4D4D66" }}>Loading finding…</p>
          </div>
        </div>
      </div>
    );
  }

  if (finding === null) notFound();

  const statusConfig: Record<FindingStatus, { bg: string; color: string; border: string; label: string }> = {
    open:     { bg: "rgba(255,140,50,0.12)",  color: "#FF8C32", border: "rgba(255,140,50,0.25)",  label: "Open"     },
    resolved: { bg: "rgba(29,223,107,0.12)",  color: "#1DDF6B", border: "rgba(29,223,107,0.25)",  label: "Resolved" },
    ignored:  { bg: "rgba(255,255,255,0.06)", color: "#8B8BA8", border: "rgba(255,255,255,0.12)", label: "Ignored"  },
  };
  const statusCfg = statusConfig[finding.status as FindingStatus] ?? statusConfig.open;
  const catStyle = categoryBadgeStyle[finding.category] ?? {
    bg: "rgba(255,255,255,0.06)", color: "#8B8BA8", border: "rgba(255,255,255,0.12)"
  };

  async function changeStatus(status: FindingStatus) {
    if (!user) return;
    await updateStatus({ id: finding!._id, status, userId: user.id });
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0D0D10" }}>
      <Header
        title={finding.title}
        subtitle={`${finding.file}${finding.line ? `:${finding.line}` : ""}`}
      >
        <Link
          href="/findings"
          className="hidden md:flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-white"
          style={{ color: "#8B8BA8" }}
        >
          <ChevronLeft className="h-4 w-4" />
          All Findings
        </Link>
      </Header>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* ── Hero meta card ── */}
          <div className="card-comic p-6">
            {/* Top row: badges + actions */}
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div className="flex flex-col gap-2">
                {/* Badge row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={finding.severity as Severity} />
                  <span
                    className="badge-comic text-[10px] font-black uppercase tracking-wider"
                    style={{ background: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}
                  >
                    {statusCfg.label}
                  </span>
                  <span
                    className="badge-comic text-[10px] font-black uppercase tracking-wider"
                    style={{ background: catStyle.bg, color: catStyle.color, borderColor: catStyle.border }}
                  >
                    {categoryLabels[finding.category] ?? finding.category}
                  </span>
                </div>
                {/* Title */}
                <h1 className="text-xl font-black text-white leading-tight max-w-xl">
                  {finding.title}
                </h1>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href="#"
                  className="btn-ghost flex items-center gap-2 text-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View in Repo
                </a>
                <button
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all hover:opacity-90"
                  style={{
                    background: "rgba(167,139,250,0.12)",
                    color: "#A78BFA",
                    border: "1.5px solid rgba(167,139,250,0.2)",
                    boxShadow: "0 3px 0 rgba(0,0,0,0.35)",
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask AI
                </button>
                {finding.status === "open" && (
                  <button
                    onClick={() => changeStatus("resolved")}
                    className="btn-primary flex items-center gap-2 text-sm"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark Resolved
                  </button>
                )}
                {finding.status === "open" && (
                  <button
                    onClick={() => changeStatus("ignored")}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "#8B8BA8",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 3px 0 rgba(0,0,0,0.3)",
                    }}
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    Ignore
                  </button>
                )}
                {finding.status !== "open" && (
                  <button
                    onClick={() => changeStatus("open")}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "#8B8BA8",
                      border: "1.5px solid rgba(255,255,255,0.1)",
                      boxShadow: "0 3px 0 rgba(0,0,0,0.3)",
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reopen
                  </button>
                )}
              </div>
            </div>

            {/* Info grid */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5"
              style={{ borderTop: "1.5px solid rgba(255,255,255,0.06)" }}
            >
              <InfoItem
                label="File"
                icon={<FileCode className="h-3.5 w-3.5" />}
                value={finding.file}
                mono
                truncate
              />
              <InfoItem
                label="Line"
                icon={<Hash className="h-3.5 w-3.5" />}
                value={finding.line ? `${finding.line}` : "—"}
                mono
              />
              <InfoItem
                label="Rule"
                icon={<Tag className="h-3.5 w-3.5" />}
                value={finding.ruleId ?? "—"}
                mono
              />
              <InfoItem
                label="Detected"
                icon={<Clock className="h-3.5 w-3.5" />}
                value={formatTimeAgo(new Date(finding.createdAt))}
              />
            </div>
          </div>

          {/* ── Two-column layout for description + recommendation ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Problem description */}
            <Section
              title="Problem"
              icon={<AlertTriangle className="h-4 w-4" style={{ color: "#FF4D6D" }} />}
              accent="#FF4D6D"
            >
              <p className="text-sm font-medium leading-relaxed" style={{ color: "#8B8BA8" }}>
                {finding.description}
              </p>
            </Section>

            {/* Recommendation */}
            {finding.recommendation && (
              <Section
                title="Recommended Action"
                icon={<CheckCircle className="h-4 w-4" style={{ color: "#1DDF6B" }} />}
                accent="#1DDF6B"
              >
                <p className="text-sm font-medium leading-relaxed" style={{ color: "#8B8BA8" }}>
                  {finding.recommendation}
                </p>
              </Section>
            )}
          </div>

          {/* ── Evidence / Code snippet ── */}
          {finding.evidence && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#14141A",
                border: "1.5px solid rgba(255,255,255,0.07)",
                boxShadow: "0 4px 0 rgba(0,0,0,0.4)",
              }}
            >
              {/* Code header */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1.5px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2">
                  {/* Traffic-light dots */}
                  <span className="h-3 w-3 rounded-full" style={{ background: "#FF4D6D", opacity: 0.7 }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: "#FFB830", opacity: 0.7 }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: "#1DDF6B", opacity: 0.7 }} />
                  <span
                    className="ml-2 text-sm font-mono font-semibold truncate max-w-[300px]"
                    style={{ color: "#8B8BA8" }}
                    title={`${finding.file}${finding.line ? `:${finding.line}` : ""}`}
                  >
                    {finding.file}
                    {finding.line ? (
                      <span style={{ color: "#FFB830" }}>:{finding.line}</span>
                    ) : null}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" style={{ color: "#FFB830" }} />
                  <span
                    className="text-[10px] font-black uppercase tracking-wider"
                    style={{ color: "#4D4D66" }}
                  >
                    Evidence
                  </span>
                </div>
              </div>

              {/* Code body */}
              <pre
                className="p-5 text-sm font-mono leading-relaxed overflow-x-auto"
                style={{ color: "#D1FAE5", background: "#0A0A0E" }}
              >
                <code>{finding.evidence}</code>
              </pre>
            </div>
          )}

          {/* ── AI Explanation ── */}
          <AIExplanationSection aiAnalysis={aiAnalysis} finding={finding} />

          {/* ── Rule details ── */}
          {finding.ruleId && (
            <div className="card-comic p-5">
              <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                <Tag className="h-4 w-4" style={{ color: "#4D4D66" }} />
                Rule Details
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="badge-comic font-mono text-xs"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "#8B8BA8",
                    borderColor: "rgba(255,255,255,0.12)",
                  }}
                >
                  {finding.ruleId}
                </span>
                <span className="text-sm font-medium" style={{ color: "#4D4D66" }}>
                  CodeHealth Static Analysis Engine
                </span>
              </div>
            </div>
          )}

          {/* ── Footer actions ── */}
          <div
            className="flex items-center justify-between pt-2 pb-4"
            style={{ borderTop: "1.5px solid rgba(255,255,255,0.06)" }}
          >
            <Link
              href="/findings"
              className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-white"
              style={{ color: "#8B8BA8" }}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Findings
            </Link>
            <button
              className="btn-ghost flex items-center gap-2 text-sm"
            >
              <ClipboardList className="h-4 w-4" />
              Create Task
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "#14141A",
        border: "1.5px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
      }}
    >
      <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
        {icon && (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: accent ? accent + "15" : "rgba(255,255,255,0.06)" }}
          >
            {icon}
          </span>
        )}
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span style={{ color: "#4D4D66" }}>{icon}</span>}
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#4D4D66" }}>
          {label}
        </p>
      </div>
      <p
        className={`text-sm font-bold text-white ${truncate ? "truncate" : ""} ${mono ? "font-mono text-xs" : ""}`}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}

// ── AI Explanation section ──────────────────────────────────────

type AIAnalysisDoc = {
  _id: string;
  status: "pending" | "running" | "completed" | "failed";
  summary?: string;
  strengths?: string[];
  improvementAreas?: string[];
  recommendations?: Array<{
    priority: number;
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    whyItMatters: string;
    action: string;
    affectedFiles: string[];
  }>;
  developerSummary?: string;
  modelId?: string;
  generatedAt?: number;
  error?: string;
};

type FindingDoc = {
  file: string;
  severity: string;
  title: string;
};

/**
 * Find the recommendation most relevant to this specific finding.
 * Matches by affected file first, then falls back to highest-priority recommendation.
 */
function findRelevantRecommendation(
  recs: NonNullable<AIAnalysisDoc["recommendations"]>,
  finding: FindingDoc
) {
  // Prefer a recommendation that explicitly references the finding's file
  const byFile = recs.find((r) =>
    r.affectedFiles.some((f) => f === finding.file || finding.file.endsWith(f) || f.endsWith(finding.file))
  );
  if (byFile) return byFile;
  // Prefer a recommendation with matching severity
  const bySeverity = recs.find((r) => r.severity === finding.severity);
  if (bySeverity) return bySeverity;
  // Highest priority (lowest number)
  return recs.slice().sort((a, b) => a.priority - b.priority)[0];
}

function AIExplanationSection({
  aiAnalysis,
  finding,
}: {
  aiAnalysis: AIAnalysisDoc | null | undefined;
  finding: FindingDoc;
}) {
  // Still loading
  if (aiAnalysis === undefined) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(167,139,250,0.05)",
          border: "1.5px solid rgba(167,139,250,0.15)",
          boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AIExplanationHeader />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#A78BFA" }} />
          <p className="text-sm font-medium" style={{ color: "#8B8BA8" }}>Loading AI explanation…</p>
        </div>
      </div>
    );
  }

  // No AI analysis exists for this scan yet
  if (aiAnalysis === null) {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(167,139,250,0.05)",
          border: "1.5px solid rgba(167,139,250,0.15)",
          boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AIExplanationHeader />
        </div>
        <p className="text-sm font-medium leading-relaxed" style={{ color: "#8B8BA8" }}>
          AI insights haven&apos;t been generated for this scan yet.{" "}
          <a href="/ai-insights" className="underline" style={{ color: "#A78BFA" }}>
            Go to AI Insights
          </a>{" "}
          to generate them.
        </p>
      </div>
    );
  }

  // AI analysis is in progress
  if (aiAnalysis.status === "pending" || aiAnalysis.status === "running") {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(167,139,250,0.05)",
          border: "1.5px solid rgba(167,139,250,0.15)",
          boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AIExplanationHeader status="running" />
        </div>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#A78BFA" }} />
          <p className="text-sm font-medium" style={{ color: "#8B8BA8" }}>
            AI analysis in progress… explanation will appear shortly.
          </p>
        </div>
      </div>
    );
  }

  // AI analysis failed
  if (aiAnalysis.status === "failed") {
    return (
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(167,139,250,0.05)",
          border: "1.5px solid rgba(167,139,250,0.15)",
          boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AIExplanationHeader status="failed" />
        </div>
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" style={{ color: "#8B8BA8" }} />
          <p className="text-sm font-medium" style={{ color: "#8B8BA8" }}>
            AI insights unavailable for this scan.{" "}
            <a href="/ai-insights" className="underline" style={{ color: "#A78BFA" }}>
              Retry from AI Insights
            </a>
            .
          </p>
        </div>
      </div>
    );
  }

  // AI analysis completed — show real explanation
  const recs = aiAnalysis.recommendations ?? [];
  const relevant = recs.length > 0 ? findRelevantRecommendation(recs, finding) : null;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(167,139,250,0.05)",
        border: "1.5px solid rgba(167,139,250,0.15)",
        boxShadow: "0 4px 0 rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <AIExplanationHeader status="completed" modelId={aiAnalysis.modelId} />
      </div>

      {/* Overall summary */}
      {aiAnalysis.summary && (
        <p className="text-sm font-medium leading-relaxed mb-4" style={{ color: "#8B8BA8" }}>
          {aiAnalysis.summary}
        </p>
      )}

      {/* Relevant recommendation for this specific finding */}
      {relevant && (
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.18)" }}
        >
          <p className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: "#A78BFA" }}>
            AI-generated explanation · Based on scan evidence
          </p>
          <p className="text-sm font-semibold text-white leading-snug">{relevant.title}</p>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "#6040A0" }}>
              Why this matters
            </p>
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: "#8B8BA8" }}>
              {relevant.whyItMatters}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "#6040A0" }}>
              Recommended action
            </p>
            <p className="text-[13px] font-medium leading-relaxed" style={{ color: "#8B8BA8" }}>
              {relevant.action}
            </p>
          </div>
        </div>
      )}

      {!relevant && (
        <p className="text-sm font-medium leading-relaxed" style={{ color: "#8B8BA8" }}>
          No specific AI recommendation was generated for this finding. View{" "}
          <a href="/ai-insights" className="underline" style={{ color: "#A78BFA" }}>
            AI Insights
          </a>{" "}
          for the full analysis.
        </p>
      )}
    </div>
  );
}

function AIExplanationHeader({
  status,
  modelId,
}: {
  status?: "running" | "failed" | "completed";
  modelId?: string;
}) {
  const badgeLabel =
    status === "completed"
      ? (modelId ? `watsonx.ai · ${modelId.split("/").pop()}` : "watsonx.ai")
      : status === "running"
      ? "Generating…"
      : status === "failed"
      ? "Unavailable"
      : "IBM watsonx.ai";

  const badgeBg =
    status === "failed"
      ? "rgba(240,64,96,0.12)"
      : "rgba(167,139,250,0.12)";
  const badgeColor =
    status === "failed" ? "#F04060" : "#A78BFA";
  const badgeBorder =
    status === "failed"
      ? "1.5px solid rgba(240,64,96,0.25)"
      : "1.5px solid rgba(167,139,250,0.25)";

  return (
    <>
      <div
        className="flex h-7 w-7 items-center justify-center rounded-xl flex-shrink-0"
        style={{ background: "rgba(167,139,250,0.15)", border: "1.5px solid rgba(167,139,250,0.2)" }}
      >
        <Sparkles className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} />
      </div>
      <h3 className="text-sm font-black text-white">AI Explanation</h3>
      <span
        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
        style={{ background: badgeBg, color: badgeColor, border: badgeBorder }}
      >
        {badgeLabel}
      </span>
    </>
  );
}
