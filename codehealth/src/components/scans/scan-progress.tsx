"use client";

import { CheckCircle2, Loader2, XCircle, Circle } from "lucide-react";
import type { Scan } from "@/lib/types";

interface ScanProgressProps {
  scan: Scan;
}

export function ScanProgress({ scan }: ScanProgressProps) {
  const progress = scan.progress ?? 0;

  return (
    <div
      className="card-comic-green p-6"
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full animate-pulse"
            style={{ background: "#1DDF6B", boxShadow: "0 0 8px #1DDF6B" }}
          />
          <h3 className="text-sm font-black text-white">Analyzing repository...</h3>
        </div>
        <span
          className="text-lg font-black"
          style={{ color: "#1DDF6B", textShadow: "0 0 12px rgba(29,223,107,0.4)" }}
        >
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-3 rounded-full overflow-hidden mb-1.5"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <div
          className="h-full rounded-full scan-shimmer"
          style={{ width: `${progress}%` }}
        />
      </div>

      {scan.currentStage && (
        <p className="text-[11px] font-semibold mb-5" style={{ color: "#4D4D66" }}>
          Current stage:{" "}
          <span style={{ color: "#1DDF6B" }}>{scan.currentStage}</span>
        </p>
      )}

      {/* Stages */}
      <div className="space-y-2 mt-4">
        {scan.stages.map((stage, i) => (
          <div key={i} className="flex items-center gap-3">
            {stage.status === "completed" ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#1DDF6B" }} />
            ) : stage.status === "running" ? (
              <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" style={{ color: "#4E9EFF" }} />
            ) : stage.status === "failed" ? (
              <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: "#FF4D6D" }} />
            ) : (
              <Circle className="h-4 w-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.12)" }} />
            )}
            <span
              className="text-sm font-semibold"
              style={{
                color:
                  stage.status === "completed" ? "#1DDF6B" :
                  stage.status === "running"   ? "#4E9EFF" :
                  stage.status === "failed"    ? "#FF4D6D" :
                  "#4D4D66",
              }}
            >
              {stage.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
