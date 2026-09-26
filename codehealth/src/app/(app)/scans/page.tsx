"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ScanTable } from "@/components/scans/scan-table";
import { ScanProgress } from "@/components/scans/scan-progress";
import { mockScans, mockRunningScan } from "@/lib/mock-data";
import { Play, ScanLine } from "lucide-react";

export default function ScansPage() {
  const [showRunning, setShowRunning] = useState(false);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header title="Repository Scans" subtitle="Analyze and review your scan history." />

      <div className="flex-1 p-6 space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <ScanLine className="h-5 w-5" style={{ color: "#22C55E" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Scan History</h2>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {mockScans.length} scans recorded
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRunning(!showRunning)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#22C55E", color: "#0B0B0C" }}
          >
            <Play className="h-4 w-4" />
            Start New Scan
          </button>
        </div>

        {/* Running scan demo */}
        {showRunning && (
          <div className="max-w-lg">
            <ScanProgress scan={mockRunningScan} />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Scans",
              value: mockScans.length,
              color: "#F0F0F2",
            },
            {
              label: "Completed",
              value: mockScans.filter((s) => s.status === "completed").length,
              color: "#22C55E",
            },
            {
              label: "Failed",
              value: mockScans.filter((s) => s.status === "failed").length,
              color: "#EF4444",
            },
            {
              label: "Avg Health Score",
              value: Math.round(
                mockScans
                  .filter((s) => s.status === "completed")
                  .reduce((sum, s) => sum + s.healthScore, 0) /
                  mockScans.filter((s) => s.status === "completed").length
              ),
              color: "#22C55E",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4"
              style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs mb-1" style={{ color: "#6B7280" }}>{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Scan table — wrap for mobile */}
        <div className="overflow-x-auto">
          <ScanTable scans={mockScans} />
        </div>
      </div>
    </div>
  );
}
