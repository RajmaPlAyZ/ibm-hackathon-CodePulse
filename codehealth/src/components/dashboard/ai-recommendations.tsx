"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import type { AIRecommendation } from "@/lib/types";

interface AIRecommendationsProps {
  recommendations: AIRecommendation[];
}

const priorityConfig: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#FF4D6D", bg: "rgba(255,77,109,0.12)", border: "rgba(255,77,109,0.25)" },
  high:     { color: "#FF8C32", bg: "rgba(255,140,50,0.12)", border: "rgba(255,140,50,0.25)" },
  medium:   { color: "#FFB830", bg: "rgba(255,184,48,0.12)", border: "rgba(255,184,48,0.25)" },
  low:      { color: "#4E9EFF", bg: "rgba(78,158,255,0.12)", border: "rgba(78,158,255,0.25)" },
};

export function AIRecommendations({ recommendations }: AIRecommendationsProps) {
  return (
    <div className="card-comic-purple p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #A78BFA)",
              boxShadow: "0 3px 0 #4C1D95, 0 0 14px rgba(167,139,250,0.3)",
              border: "1.5px solid rgba(167,139,250,0.5)",
            }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">AI Recommendations</h2>
            <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#4D4D66" }}>
              IBM watsonx.ai
            </p>
          </div>
        </div>
        <span
          className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{
            background: "rgba(167,139,250,0.12)",
            color: "#A78BFA",
            border: "1.5px solid rgba(167,139,250,0.25)",
            boxShadow: "0 2px 0 rgba(0,0,0,0.3)",
          }}
        >
          Beta
        </span>
      </div>

      {/* Recommendations list */}
      <ol className="space-y-2.5 mb-4">
        {recommendations.slice(0, 4).map((rec, i) => {
          const cfg = priorityConfig[rec.priority] ?? priorityConfig.low;
          return (
            <li
              key={rec.id}
              className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-black"
                style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}` }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{rec.problem}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className="badge-comic text-[9px]"
                    style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
                  >
                    {rec.priority}
                  </span>
                  <span className="text-[11px] font-mono truncate" style={{ color: "#4D4D66" }}>
                    {rec.affectedFiles[0]}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* CTA */}
      <a
        href="/ai-insights"
        className="flex items-center justify-center gap-2 w-full rounded-2xl py-3 text-sm font-black transition-all hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(167,139,250,0.2))",
          color: "#A78BFA",
          border: "1.5px solid rgba(167,139,250,0.3)",
          boxShadow: "0 4px 0 rgba(0,0,0,0.4)",
        }}
      >
        View All Recommendations
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
