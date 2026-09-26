import { Header } from "@/components/layout/header";
import { mockWorkflows } from "@/lib/mock-data";
import { Workflow, Play, CheckCircle2, ArrowDown, Clock, Zap } from "lucide-react";

const workflowIcons: Record<string, string> = {
  "wf-1": "#22C55E",
  "wf-2": "#3B82F6",
  "wf-3": "#F59E0B",
};

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header
        title="Analysis Workflows"
        subtitle="Automated workflows that analyze and improve your codebase."
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <Workflow className="h-5 w-5" style={{ color: "#22C55E" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Analysis Workflows</h2>
              <span
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
              >
                IBM watsonx Orchestrate ready
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
              Connect IBM watsonx Orchestrate to automate these workflows
            </p>
          </div>
        </div>

        {/* Workflow cards */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {mockWorkflows.map((workflow) => {
            const accentColor = workflowIcons[workflow.id] ?? "#22C55E";
            return (
              <div
                key={workflow.id}
                className="rounded-2xl p-5 flex flex-col transition-all hover:border-white/12"
                style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{workflow.name}</h3>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6B7280" }}>
                      {workflow.description}
                    </p>
                  </div>
                  <span
                    className="ml-3 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg"
                    style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
                  >
                    {workflow.status}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
                    <Clock className="h-3 w-3" />
                    ~{workflow.estimatedDurationMinutes}m
                  </span>
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "#6B7280" }}>
                    <Zap className="h-3 w-3" />
                    {workflow.steps.length} steps
                  </span>
                </div>

                {/* Steps */}
                <div className="flex-1 space-y-1 mb-5">
                  {workflow.steps.map((step, i) => (
                    <div key={step.id}>
                      <div className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-white/4 transition-colors">
                        <div
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{ background: `${accentColor}18`, color: accentColor }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-xs font-medium text-white">{step.name}</span>
                      </div>
                      {i < workflow.steps.length - 1 && (
                        <div className="flex justify-center py-0.5">
                          <ArrowDown className="h-3 w-3" style={{ color: "rgba(255,255,255,0.12)" }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Run button */}
                <button
                  className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: accentColor, color: "#0B0B0C" }}
                >
                  <Play className="h-4 w-4" />
                  Run Workflow
                </button>
              </div>
            );
          })}
        </div>

        {/* IBM notice */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
            <div>
              <p className="text-sm font-semibold text-white mb-1">IBM watsonx Orchestrate Integration</p>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                These workflows are designed to integrate with IBM watsonx Orchestrate for enterprise automation.
                Each workflow step maps to an Orchestrate action that can be triggered manually, on a schedule,
                or via GitHub webhooks. Connect your IBM Cloud credentials to activate automated orchestration.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
