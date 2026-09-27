"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  GitBranch,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  Globe,
  Lock,
  Star,
  GitFork,
  ChevronDown,
  Code2,
  Check,
} from "lucide-react";

interface GitHubRepoMeta {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  language: string;
  defaultBranch: string;
  isPrivate: boolean;
  url: string;
  stargazersCount: number;
  forksCount: number;
  branches: string[];
}

interface AddRepositoryDialogProps {
  open: boolean;
  onClose: () => void;
  onConnected?: (repositoryId: string) => void;
}

type Step = "url" | "metadata" | "connecting" | "done";

// ── Custom branch dropdown (native <select> is invisible on dark bg) ──
function BranchDropdown({
  branches,
  value,
  defaultBranch,
  onChange,
}: {
  branches: string[];
  value: string;
  defaultBranch: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 rounded-xl px-3 py-3 transition-all"
        style={{
          background: "#1C1C25",
          border: open
            ? "1.5px solid rgba(29,223,107,0.35)"
            : "1.5px solid rgba(255,255,255,0.09)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        <GitBranch className="h-4 w-4 flex-shrink-0" style={{ color: "#4D4D66" }} />
        <span className="flex-1 text-left text-sm font-semibold text-white">
          {value}
          {value === defaultBranch && (
            <span className="ml-1.5 text-xs font-medium" style={{ color: "#4D4D66" }}>
              (default)
            </span>
          )}
        </span>
        <ChevronDown
          className="h-4 w-4 flex-shrink-0 transition-transform"
          style={{
            color: "#4D4D66",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden py-1"
          style={{
            background: "#1A1A22",
            border: "1.5px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {branches.map((branch) => (
            <button
              key={branch}
              type="button"
              onClick={() => { onChange(branch); setOpen(false); }}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#4D4D66" }} />
                <span
                  className="font-semibold truncate"
                  style={{ color: branch === value ? "#1DDF6B" : "#C8C8E0" }}
                >
                  {branch}
                </span>
                {branch === defaultBranch && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
                    style={{ color: "#4D4D66" }}
                  >
                    default
                  </span>
                )}
              </div>
              {branch === value && (
                <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#1DDF6B" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AddRepositoryDialog({
  open,
  onClose,
  onConnected,
}: AddRepositoryDialogProps) {
  const { user } = useUser();
  const router = useRouter();
  const createRepo = useMutation(api.repositories.create);

  const [step, setStep] = useState<Step>("url");
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<GitHubRepoMeta | null>(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedId, setConnectedId] = useState<string | null>(null);

  function reset() {
    setStep("url");
    setUrl("");
    setMeta(null);
    setSelectedBranch("");
    setLoading(false);
    setError(null);
    setConnectedId(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function fetchMetadata() {
    if (!url.trim()) {
      setError("Please enter a GitHub repository URL.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/github/repo?url=${encodeURIComponent(url.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to fetch repository.");
        return;
      }
      setMeta(data as GitHubRepoMeta);
      setSelectedBranch(data.defaultBranch);
      setStep("metadata");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function connectRepository() {
    if (!meta || !user) return;
    setStep("connecting");
    setLoading(true);
    setError(null);
    try {
      const id = await createRepo({
        userId: user.id,
        owner: meta.owner,
        name: meta.name,
        fullName: meta.fullName,
        url: meta.url,
        description: meta.description || undefined,
        language: meta.language || undefined,
        defaultBranch: meta.defaultBranch,
        selectedBranch,
        branches: meta.branches,
        isPrivate: meta.isPrivate,
      });
      setConnectedId(id);
      setStep("done");
      onConnected?.(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect repository."
      );
      setStep("metadata");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        className="relative w-full max-w-lg rounded-2xl p-6"
        style={{
          background: "#14141A",
          border: "1.5px solid rgba(255,255,255,0.1)",
          boxShadow: "0 8px 0 rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: "rgba(29,223,107,0.12)",
                border: "1.5px solid rgba(29,223,107,0.25)",
              }}
            >
              <Code2 className="h-4.5 w-4.5" style={{ color: "#1DDF6B" }} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {step === "done" ? "Repository Connected!" : "Connect Repository"}
              </h2>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#4D4D66" }}>
                {step === "url" && "Enter a public GitHub URL"}
                {step === "metadata" && "Confirm repository details"}
                {step === "connecting" && "Connecting..."}
                {step === "done" && "Ready to analyze"}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-2 transition-colors hover:bg-white/8"
            style={{ color: "#8B8BA8" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Step 1: URL input ── */}
        {step === "url" && (
          <div className="space-y-4">
            <div>
              <label className="section-label block mb-2">GitHub Repository URL</label>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-3"
                style={{
                  background: "#1C1C25",
                  border: "1.5px solid rgba(255,255,255,0.09)",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                <Code2 className="h-4 w-4 flex-shrink-0" style={{ color: "#4D4D66" }} />
                <input
                  type="url"
                  placeholder="https://github.com/owner/repository"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && fetchMetadata()}
                  className="flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-[#4D4D66]"
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 mt-3 rounded-xl p-3" style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)" }}>
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#FF4D6D" }} />
                  <p className="text-sm" style={{ color: "#FF4D6D" }}>{error}</p>
                </div>
              )}
              <p className="text-xs mt-2 font-medium" style={{ color: "#4D4D66" }}>
                Public and private repos supported. For private repos, connect your GitHub account in Settings first.
              </p>
            </div>

            <button
              onClick={fetchMetadata}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Fetching repository...</>
              ) : (
                <><Code2 className="h-4 w-4" /> Fetch Repository Info</>
              )}
            </button>
          </div>
        )}

        {/* ── Step 2: Metadata confirmation ── */}
        {step === "metadata" && meta && (
          <div className="space-y-4">
            {/* Repo info card */}
            <div
              className="rounded-xl p-4"
              style={{ background: "#1C1C25", border: "1.5px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                {meta.isPrivate ? (
                  <Lock className="h-3.5 w-3.5" style={{ color: "#FFB830" }} />
                ) : (
                  <Globe className="h-3.5 w-3.5" style={{ color: "#1DDF6B" }} />
                )}
                <span className="text-base font-black text-white">{meta.fullName}</span>
              </div>
              {meta.description && (
                <p className="text-xs font-medium mb-3 leading-relaxed" style={{ color: "#8B8BA8" }}>
                  {meta.description}
                </p>
              )}
              <div className="flex items-center gap-4 flex-wrap">
                {meta.language && (
                  <span className="text-xs font-bold" style={{ color: "#8B8BA8" }}>
                    🔷 {meta.language}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#8B8BA8" }}>
                  <Star className="h-3 w-3" /> {meta.stargazersCount}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#8B8BA8" }}>
                  <GitFork className="h-3 w-3" /> {meta.forksCount}
                </span>
              </div>
            </div>

            {/* Branch selector — custom dropdown, dark-theme friendly */}
            <div>
              <label className="section-label block mb-2">Select Branch</label>
              <BranchDropdown
                branches={meta.branches}
                value={selectedBranch}
                defaultBranch={meta.defaultBranch}
                onChange={setSelectedBranch}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)" }}>
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#FF4D6D" }} />
                <p className="text-sm" style={{ color: "#FF4D6D" }}>{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setStep("url"); setError(null); }}
                className="btn-ghost flex-1"
              >
                Back
              </button>
              <button
                onClick={connectRepository}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Connect Repository
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Connecting ── */}
        {step === "connecting" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(29,223,107,0.1)",
                border: "1.5px solid rgba(29,223,107,0.25)",
                boxShadow: "0 0 20px rgba(29,223,107,0.15)",
              }}
            >
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#1DDF6B" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-white">Connecting repository...</p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#4D4D66" }}>
                Saving to your workspace
              </p>
            </div>
          </div>
        )}

        {/* ── Step 4: Done ── */}
        {step === "done" && meta && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #0F8040, #1DDF6B)",
                  boxShadow: "0 4px 0 #0A4D28, 0 0 20px rgba(29,223,107,0.3)",
                }}
              >
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <p className="text-base font-black text-white">{meta.fullName}</p>
                <p className="text-xs font-semibold mt-1" style={{ color: "#1DDF6B" }}>
                  Successfully connected! Branch: {selectedBranch}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleClose} className="btn-ghost flex-1">
                Close
              </button>
              <button
                onClick={() => {
                  handleClose();
                  if (connectedId) {
                    router.push(`/repositories/${connectedId}`);
                  }
                }}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Code2 className="h-4 w-4" />
                View Repository
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
