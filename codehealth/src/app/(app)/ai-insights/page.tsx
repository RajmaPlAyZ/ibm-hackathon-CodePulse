import { Header } from "@/components/layout/header";
import { mockAIInsight } from "@/lib/mock-data";
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Brain } from "lucide-react";

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
  high: { bg: "rgba(249,115,22,0.1)", text: "#F97316", border: "rgba(249,115,22,0.2)" },
  medium: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  low: { bg: "rgba(59,130,246,0.1)", text: "#3B82F6", border: "rgba(59,130,246,0.2)" },
};

export default function AIInsightsPage() {
  const insight = mockAIInsight;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header
        title="AI Insights"
        subtitle="AI-generated explanations and recommendations for your codebase."
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "#8B5CF6" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">AI Insights</h2>
              <span
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6" }}
              >
                Powered by IBM watsonx.ai (Beta)
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
              Mock data — real watsonx.ai integration coming soon
            </p>
          </div>
        </div>

        {/* Codebase Summary */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#151516",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5" style={{ color: "#8B5CF6" }} />
            <h3 className="text-base font-semibold text-white">Codebase Summary</h3>
          </div>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#9CA3AF" }}>
            {insight.summary.overallAssessment}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)" }}
            >
              <p className="text-xs font-semibold mb-2.5 uppercase tracking-wider" style={{ color: "#22C55E" }}>
                Strengths
              </p>
              <ul className="space-y-1.5">
                {insight.summary.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#9CA3AF" }}>
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}
            >
              <p className="text-xs font-semibold mb-2.5 uppercase tracking-wider" style={{ color: "#F59E0B" }}>
                Areas for Improvement
              </p>
              <ul className="space-y-1.5">
                {insight.summary.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#9CA3AF" }}>
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-4">Recommended Actions</h3>
          <div className="space-y-4">
            {insight.recommendations.map((rec, i) => {
              const colors = priorityColors[rec.priority] ?? priorityColors.low;
              return (
                <div
                  key={rec.id}
                  className="rounded-2xl p-5 transition-all hover:border-white/12"
                  style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold"
                        style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-semibold text-white">{rec.problem}</h4>
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-lg"
                          style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                        >
                          {rec.priority}
                        </span>
                        <span
                          className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-lg"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#6B7280" }}
                        >
                          {rec.estimatedEffort} effort
                        </span>
                      </div>
                      <p className="text-xs mb-2.5" style={{ color: "#6B7280" }}>
                        <span style={{ color: "#9CA3AF" }}>Why it matters: </span>
                        {rec.whyItMatters}
                      </p>
                      <p className="text-xs mb-3" style={{ color: "#9CA3AF" }}>
                        <span className="font-medium text-white">Action: </span>
                        {rec.suggestedAction}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {rec.affectedFiles.map((file) => (
                          <span
                            key={file}
                            className="text-[11px] font-mono px-2 py-0.5 rounded-md"
                            style={{ background: "rgba(255,255,255,0.06)", color: "#9CA3AF" }}
                          >
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-90 flex-shrink-0"
                      style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.2)" }}
                    >
                      View Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
