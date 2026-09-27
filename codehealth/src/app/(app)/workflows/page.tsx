"use client";

import { Header } from "@/components/layout/header";
import { mockWorkflows } from "@/lib/mock-data";
import { Workflow, Play, ArrowDown, Clock, Zap, CheckCircle2 } from "lucide-react";

const workflowAccents: Record<string, { color: string; glow: string; dim: string; border: string }> = {
  "wf-1": { color: "#14E678", glow: "rgba(20,230,120,0.3)",  dim: "rgba(20,230,120,0.08)",  border: "rgba(20,230,120,0.2)"  },
  "wf-2": { color: "#4D9EFF", glow: "rgba(77,158,255,0.3)",  dim: "rgba(77,158,255,0.08)",  border: "rgba(77,158,255,0.2)"  },
  "wf-3": { color: "#F5A623", glow: "rgba(245,166,35,0.3)",  dim: "rgba(245,166,35,0.08)",  border: "rgba(245,166,35,0.2)"  },
};

const statusConfig: Record<string, { bg: string; color: string; border: string }> = {
  ready:     { bg: "rgba(20,230,120,0.08)",  color: "#14E678", border: "rgba(20,230,120,0.2)"  },
  running:   { bg: "rgba(77,158,255,0.08)",  color: "#4D9EFF", border: "rgba(77,158,255,0.2)"  },
  completed: { bg: "rgba(20,230,120,0.08)",  color: "#14E678", border: "rgba(20,230,120,0.2)"  },
  failed:    { bg: "rgba(240,64,96,0.08)",   color: "#F04060", border: "rgba(240,64,96,0.2)"   },
};

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
      <Header
        title="Analysis Workflows"
        subtitle="Automated workflows that analyze and improve your codebase."
      />

      <div className="flex-1 p-6 space-y-6">

        {/* ── Title row ── */}
        <div className="fade-up flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
              style={{
                background: "rgba(20,230,120,0.10)",
                border: "1px solid rgba(20,230,120,0.2)",
                boxShadow: "0 0 16px rgba(20,230,120,0.06)",
              }}
            >
              <Workflow className="h-5 w-5" style={{ color: "#14E678" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-lg font-semibold"
                  style={{ color: "#F0F0FF", letterSpacing: "-0.02em" }}
                >
                  Analysis Workflows
                </h2>
                <span
                  className="badge-pill"
                  style={{
                    background: "rgba(155,126,255,0.1)",
                    color: "#9B7EFF",
                    borderColor: "rgba(155,126,255,0.22)",
                  }}
                >
                  <Zap style={{ width: 9, height: 9, display: "inline", marginRight: 3 }} />
                  IBM watsonx Orchestrate ready
                </span>
              </div>
              <p className="section-label mt-0.5">
                Connect IBM watsonx Orchestrate to automate these workflows
              </p>
            </div>
          </div>
        </div>

        {/* ── Workflow cards ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {mockWorkflows.map((workflow, idx) => {
            const accent = workflowAccents[workflow.id] ?? workflowAccents["wf-1"];
            const status = statusConfig[workflow.status] ?? statusConfig.ready;

            return (
              <div
                key={workflow.id}
                className="fade-up flex flex-col rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: `linear-gradient(135deg, ${accent.dim} 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid ${accent.border}`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.35), 0 0 20px ${accent.dim}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                  animationDelay: `${60 + idx * 60}ms`,
                }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-3">
                    <h3
                      className="text-[13px] font-semibold leading-tight mb-1.5"
                      style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}
                    >
                      {workflow.name}
                    </h3>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ color: "#7878A0" }}
                    >
                      {workflow.description}
                    </p>
                  </div>
                  <span
                    className="badge-pill flex-shrink-0 capitalize"
                    style={{ background: status.bg, color: status.color, borderColor: status.border }}
                  >
                    {workflow.status}
                  </span>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-5">
                  <div
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <Clock className="h-3 w-3 flex-shrink-0" style={{ color: "#7878A0" }} />
                    <span className="text-[11px] font-medium" style={{ color: "#7878A0" }}>
                      ~{workflow.estimatedDurationMinutes}m
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <Zap className="h-3 w-3 flex-shrink-0" style={{ color: "#7878A0" }} />
                    <span className="text-[11px] font-medium" style={{ color: "#7878A0" }}>
                      {workflow.steps.length} steps
                    </span>
                  </div>
                </div>

                {/* Steps */}
                <div className="flex-1 space-y-1 mb-5">
                  {workflow.steps.map((step, i) => (
                    <div key={step.id}>
                      <div
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/4"
                      >
                        <div
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{ background: accent.dim, color: accent.color }}
                        >
                          {i + 1}
                        </div>
                        <span
                          className="text-[12px] font-medium"
                          style={{ color: "#7878A0" }}
                        >
                          {step.name}
                        </span>
                        {step.status === "completed" && (
                          <CheckCircle2
                            className="h-3.5 w-3.5 ml-auto flex-shrink-0"
                            style={{ color: "#14E678" }}
                          />
                        )}
                      </div>
                      {i < workflow.steps.length - 1 && (
                        <div className="flex justify-center py-0.5 ml-6">
                          <ArrowDown
                            className="h-3 w-3"
                            style={{ color: "rgba(255,255,255,0.08)" }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Run button */}
                <button
                  className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-[13px] font-semibold transition-all hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${accent.color}CC 0%, ${accent.color} 100%)`,
                    color: "#080810",
                    boxShadow: `0 0 16px ${accent.dim}`,
                  }}
                >
                  <Play className="h-3.5 w-3.5" />
                  Run Workflow
                </button>
              </div>
            );
          })}
        </div>

        {/* ── IBM watsonx notice ── */}
        <div className="fade-up card-glass-purple p-5" style={{ animationDelay: "240ms" }}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: "rgba(155,126,255,0.15)", border: "1px solid rgba(155,126,255,0.25)" }}
            >
              <Zap className="h-4 w-4" style={{ color: "#9B7EFF" }} />
            </div>
            <div>
              <p
                className="text-[13px] font-semibold mb-1"
                style={{ color: "#F0F0FF", letterSpacing: "-0.01em" }}
              >
                IBM watsonx Orchestrate Integration
              </p>
              <p className="text-[12px] leading-relaxed" style={{ color: "#7878A0" }}>
                These workflows are designed to integrate with IBM watsonx Orchestrate for enterprise
                automation. Each workflow step maps to an Orchestrate action that can be triggered
                manually, on a schedule, or via GitHub webhooks. Connect your IBM Cloud credentials
                to activate automated orchestration.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
