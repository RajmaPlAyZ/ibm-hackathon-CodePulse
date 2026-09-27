"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Header } from "@/components/layout/header";
import { FindingCard } from "@/components/findings/finding-card";
import { AlertTriangle, Search, X } from "lucide-react";
import type { Severity, FindingCategory, FindingStatus } from "@/lib/types";
import Link from "next/link";

const severityTabs: { label: string; value: Severity | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const categoryFilters: { label: string; value: FindingCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Security", value: "security" },
  { label: "Quality", value: "quality" },
  { label: "Complexity", value: "complexity" },
  { label: "Documentation", value: "documentation" },
  { label: "Testing", value: "testing" },
  { label: "Maintainability", value: "maintainability" },
];

const statusFilters: { label: string; value: FindingStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "Ignored", value: "ignored" },
];

const tabColors: Record<string, string> = {
  critical: "#F04060",
  high:     "#F5823C",
  medium:   "#F5A623",
  low:      "#4D9EFF",
};

const categoryColors: Record<string, string> = {
  security:        "#F04060",
  quality:         "#4D9EFF",
  complexity:      "#9B7EFF",
  documentation:   "#7878A0",
  testing:         "#F5A623",
  maintainability: "#14E678",
  all:             "#14E678",
};

const statusColors: Record<string, string> = {
  open:     "#F5823C",
  resolved: "#14E678",
  ignored:  "#7878A0",
  all:      "#14E678",
};

export default function FindingsPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Severity | "all">("all");
  const [activeCategory, setActiveCategory] = useState<FindingCategory | "all">("all");
  const [activeStatus, setActiveStatus] = useState<FindingStatus | "all">("all");
  const [search, setSearch] = useState("");

  const convexFindings = useQuery(
    api.findings.listByUser,
    user ? { userId: user.id } : "skip"
  );

  const isLoading = convexFindings === undefined;

  const allFindings = (convexFindings ?? []).map((f) => ({
    id: f._id as string,
    repositoryId: f.repositoryId as string,
    repositoryName: "Repository",
    severity: f.severity as Severity,
    category: f.category as FindingCategory,
    title: f.title,
    description: f.description,
    file: f.file,
    line: f.line,
    status: f.status as FindingStatus,
    detectedAt: new Date(f.createdAt),
    ruleId: f.ruleId,
    codeSnippet: f.evidence,
    recommendedAction: f.recommendation,
  }));

  const filtered = allFindings.filter((f) => {
    const matchSeverity = activeTab === "all" || f.severity === activeTab;
    const matchCategory = activeCategory === "all" || f.category === activeCategory;
    const matchStatus = activeStatus === "all" || f.status === activeStatus;
    const matchSearch =
      !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.file.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase());
    return matchSeverity && matchCategory && matchStatus && matchSearch;
  });

  const counts: Record<string, number> = {
    all: allFindings.length,
    critical: allFindings.filter((f) => f.severity === "critical").length,
    high: allFindings.filter((f) => f.severity === "high").length,
    medium: allFindings.filter((f) => f.severity === "medium").length,
    low: allFindings.filter((f) => f.severity === "low").length,
  };

  const isFiltered =
    activeTab !== "all" ||
    activeCategory !== "all" ||
    activeStatus !== "all" ||
    search.trim() !== "";

  function clearFilters() {
    setActiveTab("all");
    setActiveCategory("all");
    setActiveStatus("all");
    setSearch("");
  }

  return (
    <div className="flex flex-col min-h-screen mesh-bg" style={{ background: "#080810" }}>
      <Header title="Findings" subtitle="Issues identified across your codebase." />

      <div className="flex-1 p-6 space-y-6">
        {/* Title row */}
        <div className="fade-up flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
            style={{ background: "rgba(240,64,96,0.10)", border: "1.5px solid rgba(240,64,96,0.2)" }}
          >
            <AlertTriangle className="h-5 w-5" style={{ color: "#F04060" }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white" style={{ letterSpacing: "-0.02em" }}>All Findings</h2>
            <p className="section-label mt-0.5">
              {isLoading ? "Loading..." : `${allFindings.length} findings across all repositories`}
            </p>
          </div>
        </div>

        {/* Severity summary cards */}
        <div className="fade-up grid grid-cols-2 md:grid-cols-4 gap-4" style={{ animationDelay: "60ms" }}>
          {(["critical", "high", "medium", "low"] as Severity[]).map((sev) => (
            <button
              key={sev}
              onClick={() => setActiveTab(sev === activeTab ? "all" : sev)}
              className="card-glass p-4 text-left transition-all duration-200 hover:scale-[1.02]"
              style={
                activeTab === sev
                  ? { borderColor: tabColors[sev] + "50", background: tabColors[sev] + "0A" }
                  : {}
              }
            >
              <p className="section-label mb-1 capitalize">{sev}</p>
              <p className="text-2xl font-bold" style={{ color: tabColors[sev], letterSpacing: "-0.04em" }}>
                {isLoading ? "—" : counts[sev]}
              </p>
            </button>
          ))}
        </div>

        {/* Search + Severity tabs row */}
        <div className="fade-up flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap" style={{ animationDelay: "80ms" }}>
          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1 min-w-[200px] max-w-sm input-glass"
          >
            <Search className="h-4 w-4 flex-shrink-0" style={{ color: "#404060" }} />
            <input
              type="text"
              placeholder="Search findings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[13px] font-medium text-white outline-none placeholder:text-[#404060]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="flex-shrink-0">
                <X className="h-3.5 w-3.5" style={{ color: "#404060" }} />
              </button>
            )}
          </div>

          {/* Severity tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl w-fit"
            style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.07)" }}
          >
            {severityTabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="rounded-lg px-3 py-2 text-[12px] font-semibold transition-all"
                  style={
                    isActive
                      ? {
                          background: tab.value === "all" ? "#14E678" : tabColors[tab.value],
                          color: tab.value === "all" ? "#080810" : "#fff",
                        }
                      : { color: "#7878A0" }
                  }
                >
                  {tab.label}
                  <span className="ml-1 text-[10px] opacity-60">({counts[tab.value]})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category filter row */}
        <div className="fade-up space-y-1.5" style={{ animationDelay: "100ms" }}>
          <p className="section-label">Category</p>
          <div className="flex items-center gap-2 flex-wrap">
            {categoryFilters.map((cat) => {
              const isActive = activeCategory === cat.value;
              const color = categoryColors[cat.value] ?? "#7878A0";
              return (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className="rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all"
                  style={
                    isActive
                      ? {
                          background: color + "18",
                          color: color,
                          border: `1.5px solid ${color}35`,
                        }
                      : {
                          background: "rgba(255,255,255,0.03)",
                          color: "#7878A0",
                          border: "1.5px solid rgba(255,255,255,0.07)",
                        }
                  }
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status filter row */}
        <div className="fade-up space-y-1.5" style={{ animationDelay: "120ms" }}>
          <p className="section-label">Status</p>
          <div className="flex items-center gap-2 flex-wrap">
            {statusFilters.map((st) => {
              const isActive = activeStatus === st.value;
              const color = statusColors[st.value] ?? "#7878A0";
              return (
                <button
                  key={st.value}
                  onClick={() => setActiveStatus(st.value)}
                  className="rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all"
                  style={
                    isActive
                      ? {
                          background: color + "18",
                          color: color,
                          border: `1.5px solid ${color}35`,
                        }
                      : {
                          background: "rgba(255,255,255,0.03)",
                          color: "#7878A0",
                          border: "1.5px solid rgba(255,255,255,0.07)",
                        }
                  }
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count + Clear filters */}
        {!isLoading && allFindings.length > 0 && (
          <div className="fade-up flex items-center justify-between" style={{ animationDelay: "140ms" }}>
            <p className="text-[13px] font-medium" style={{ color: "#7878A0" }}>
              <span className="text-white font-semibold">{filtered.length}</span>{" "}
              finding{filtered.length !== 1 ? "s" : ""} match
              {filtered.length !== 1 ? "" : "es"}
              {isFiltered && (
                <span style={{ color: "#404060" }}> your filters</span>
              )}
            </p>
            {isFiltered && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all"
                style={{
                  background: "rgba(240,64,96,0.08)",
                  color: "#F04060",
                  border: "1.5px solid rgba(240,64,96,0.2)",
                }}
              >
                <X className="h-3 w-3" />
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Findings list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-glass animate-pulse" style={{ height: 100 }}>
                <div className="p-5">
                  <div className="h-4 bg-white/5 rounded-lg mb-2 w-2/3" />
                  <div className="h-3 bg-white/5 rounded-lg w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : allFindings.length === 0 ? (
          <div className="fade-up flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="h-12 w-12 mb-4" style={{ color: "#404060" }} />
            <h3 className="text-lg font-bold text-white mb-2" style={{ letterSpacing: "-0.02em" }}>No findings yet</h3>
            <p className="text-[13px] mb-4" style={{ color: "#7878A0" }}>
              Run a scan on a repository to see findings here.
            </p>
            <Link href="/repositories" className="btn-primary">
              Go to Repositories
            </Link>
          </div>
        ) : (
          <div className="fade-up space-y-3" style={{ animationDelay: "160ms" }}>
            {filtered.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <AlertTriangle className="h-8 w-8 mx-auto" style={{ color: "#404060" }} />
                <p className="text-[13px] font-medium" style={{ color: "#7878A0" }}>
                  No findings match your filters.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "#7878A0",
                    border: "1.5px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              </div>
            ) : (
              filtered.map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
