import { Header } from "@/components/layout/header";
import { RepositoryCard } from "@/components/repositories/repository-card";
import { mockRepositories } from "@/lib/mock-data";
import { Plus, FolderGit2 } from "lucide-react";

export default function RepositoriesPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header title="Repositories" subtitle="Monitor the health of your connected codebases." />

      <div className="flex-1 p-6">
        {/* Page title row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
            >
              <FolderGit2 className="h-5 w-5" style={{ color: "#22C55E" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">All Repositories</h2>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {mockRepositories.length} repositories connected
              </p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#22C55E", color: "#0B0B0C" }}
          >
            <Plus className="h-4 w-4" />
            Add Repository
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Repos", value: mockRepositories.length, color: "#F0F0F2" },
            {
              label: "Healthy",
              value: mockRepositories.filter((r) => r.status === "healthy").length,
              color: "#22C55E",
            },
            {
              label: "Needs Attention",
              value: mockRepositories.filter((r) => r.status === "needs-attention").length,
              color: "#F59E0B",
            },
            {
              label: "Total Issues",
              value: mockRepositories.reduce((s, r) => s + r.issueCount, 0),
              color: "#EF4444",
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

        {/* Repository grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockRepositories.map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}

          {/* Add repo CTA */}
          <button
            className="flex flex-col items-center justify-center gap-3 rounded-2xl p-8 text-center transition-all hover:bg-white/3"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "2px dashed rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <Plus className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Connect Repository</p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                Add a GitHub repository to analyze
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
