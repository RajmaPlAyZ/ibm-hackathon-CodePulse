import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { SeverityBadge } from "@/components/findings/severity-badge";
import { mockFindings } from "@/lib/mock-data";
import { formatTimeAgo, getFindingStatusBadge } from "@/lib/utils-app";
import { FileCode, ChevronLeft, ExternalLink, Sparkles, CheckCircle, ClipboardList } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FindingDetailPage({ params }: Props) {
  const { id } = await params;
  const finding = mockFindings.find((f) => f.id === id);
  if (!finding) notFound();

  const statusBadge = getFindingStatusBadge(finding.status);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#0B0B0C" }}>
      <Header title={finding.title} subtitle={`${finding.file}${finding.line ? `:${finding.line}` : ""}`}>
        <Link
          href="/findings"
          className="hidden md:flex items-center gap-1.5 text-sm transition-colors hover:text-white"
          style={{ color: "#6B7280" }}
        >
          <ChevronLeft className="h-4 w-4" />
          Findings
        </Link>
      </Header>

      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Meta card */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <SeverityBadge severity={finding.severity} />
                  <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white mb-1">{finding.title}</h1>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:bg-white/5"
                  style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9CA3AF" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Repository
                </button>
                <button
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: "rgba(139,92,246,0.12)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.2)" }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Ask AI
                </button>
                <button
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
                  style={{ background: "#22C55E", color: "#0B0B0C" }}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Mark Resolved
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <InfoItem label="File" value={finding.file} icon={<FileCode className="h-3.5 w-3.5" />} />
              <InfoItem label="Line" value={finding.line ? `Line ${finding.line}` : "N/A"} />
              <InfoItem label="Category" value={finding.category} />
              <InfoItem label="Detected" value={formatTimeAgo(finding.detectedAt)} />
            </div>
          </div>

          {/* Problem description */}
          <Section title="Problem">
            <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
              {finding.description}
            </p>
          </Section>

          {/* Code snippet */}
          {finding.codeSnippet && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" style={{ color: "#6B7280" }} />
                  <span className="text-sm font-mono" style={{ color: "#9CA3AF" }}>
                    {finding.file}
                    {finding.line ? `:${finding.line}` : ""}
                  </span>
                </div>
                <span className="text-xs" style={{ color: "#4B5563" }}>Technical Evidence</span>
              </div>
              <pre
                className="p-5 text-sm font-mono leading-relaxed overflow-x-auto"
                style={{ color: "#D1FAE5", background: "#0B0B0C" }}
              >
                <code>{finding.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* AI Explanation */}
          {finding.aiExplanation && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "#151516", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg"
                  style={{ background: "rgba(139,92,246,0.15)" }}
                >
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} />
                </div>
                <h3 className="text-sm font-semibold text-white">AI Explanation</h3>
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}>
                  Beta
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
                {finding.aiExplanation}
              </p>
            </div>
          )}

          {/* Recommended Action */}
          {finding.recommendedAction && (
            <Section title="Recommended Action">
              <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
                {finding.recommendedAction}
              </p>
            </Section>
          )}

          {/* Suggested Tests */}
          {finding.suggestedTests && finding.suggestedTests.length > 0 && (
            <Section title="Suggested Tests">
              <ul className="space-y-2">
                {finding.suggestedTests.map((test, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "#9CA3AF" }}>
                    <span
                      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}
                    >
                      {i + 1}
                    </span>
                    {test}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Create task button */}
          <div className="flex justify-end">
            <button
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#9CA3AF" }}
            >
              <ClipboardList className="h-4 w-4" />
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#151516", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs mb-0.5" style={{ color: "#4B5563" }}>{label}</p>
      <p className="text-sm font-medium text-white flex items-center gap-1.5">
        {icon}
        <span className="font-mono text-xs truncate">{value}</span>
      </p>
    </div>
  );
}
