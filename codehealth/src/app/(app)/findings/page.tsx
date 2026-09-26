"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { FindingCard } from "@/components/findings/finding-card";
import { mockFindings } from "@/lib/mock-data";
import { AlertTriangle, Search } from "lucide-react";
import type { Severity } from "@/lib/types";

const tabs: { label: string; value: Severity | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const tabColors: Record<string, string> = {
  critical: "#EF4444",
  high: "#F97316",
  medium: "#F59E0B",
  low: "#3B82F6",
};

export default function FindingsPage() {
  const [activeTab, setActiveTab] = useState<Severity | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = mockFindings.filter((f) => {
    const matchTab = activeTab === "all" || f.severity === activeTab;
    const matchSearch =
      !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.file.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts: Record<string, number> = {
    all: mockFindings.length,
    critical: mockFindings.filter((f) => f.severity === "critical").length,
    high: mockFindings.filter((f) => f.severity === "high").length,
    medium: mockFindings.filter((f) => f.severity === "medium").length,
    low: mockFindings.filter((f) => f.severity === "low").length,
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header
        title="Findings"
        subtitle="Issues identified across your codebase."
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Title row */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <AlertTriangle className="h-5 w-5" style={{ color: "#EF4444" }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">All Findings</h2>
            <p className="text-xs" style={{ color: "#6B7280" }}>
              {mockFindings.length} findings across all repositories
            </p>
          </div>
        </div>

        {/* Severity summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["critical", "high", "medium", "low"] as Severity[]).map((sev) => (
            <button
              key={sev}
              onClick={() => setActiveTab(sev)}
              className="rounded-2xl p-4 text-left transition-all hover:border-white/12"
              style={{
                background: "#151516",
                border: `1px solid ${activeTab === sev ? tabColors[sev] + "40" : "rgba(255,255,255,0.07)"}`,
              }}
            >
              <p className="text-xs capitalize mb-1" style={{ color: "#6B7280" }}>{sev}</p>
              <p className="text-2xl font-bold" style={{ color: tabColors[sev] }}>
                {counts[sev]}
              </p>
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 max-w-sm"
            style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: "#6B7280" }} />
            <input
              type="text"
              placeholder="Search findings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                style={
                  isActive
                    ? {
                        background: tab.value === "all" ? "#22C55E" : tabColors[tab.value],
                        color: "#fff",
                      }
                    : { color: "#6B7280" }
                }
              >
                {tab.label}
                <span
                  className="ml-1.5 text-xs opacity-70"
                >
                  ({counts[tab.value]})
                </span>
              </button>
            );
          })}
        </div>

        {/* Findings list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: "#6B7280" }}>No findings match your filters.</p>
            </div>
          ) : (
            filtered.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
