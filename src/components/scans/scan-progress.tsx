"use client";

import { CheckCircle2, Loader2, XCircle, Circle } from "lucide-react";
import type { Scan } from "@/lib/types";

interface ScanProgressProps {
  scan: Scan;
}

export function ScanProgress({ scan }: ScanProgressProps) {
  const progress = scan.progress ?? 0;

  return (
    <div className="card-glass-green p-6">
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full pulse-glow"
            style={{ background: "#14E678" }}
          />
          <h3 className="text-[13px] font-semibold text-white" style={{ letterSpacing: "-0.01em" }}>
            Analyzing repository…
          </h3>
        </div>
        <span
          className="text-lg font-bold"
          style={{ color: "#14E678", textShadow: "0 0 12px rgba(20,230,120,0.35)" }}
        >
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-track h-3 mb-1.5">
        <div className="h-full scan-shimmer rounded-full" style={{ width: `${progress}%` }} />
      </div>

      {scan.currentStage && (
        <p className="text-[11px] font-medium mb-4" style={{ color: "#404060" }}>
          Stage:{" "}
          <span style={{ color: "#14E678" }}>{scan.currentStage}</span>
        </p>
      )}

      {/* Stages */}
      {scan.stages && scan.stages.length > 0 && (
        <div className="space-y-2 mt-4">
          {scan.stages.map((stage, i) => (
            <div key={i} className="flex items-center gap-3">
              {stage.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#14E678" }} />
              ) : stage.status === "running" ? (
                <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" style={{ color: "#4D9EFF" }} />
              ) : stage.status === "failed" ? (
                <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#F04060" }} />
              ) : (
                <Circle className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.1)" }} />
              )}
              <span
                className="text-[12px] font-medium"
                style={{
                  color:
                    stage.status === "completed" ? "#14E678" :
                    stage.status === "running"   ? "#4D9EFF" :
                    stage.status === "failed"    ? "#F04060" :
                    "#404060",
                }}
              >
                {stage.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
