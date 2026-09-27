"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface UseScanOptions {
  repositoryId: Id<"repositories">;
  owner: string;
  repo: string;
  branch: string;
}

export function useScan({ repositoryId, owner, repo, branch }: UseScanOptions) {
  const { user } = useUser();
  const createScan = useMutation(api.scans.create);
  const [activeScanId, setActiveScanId] = useState<Id<"scans"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const scan = useQuery(
    api.scans.get,
    activeScanId ? { id: activeScanId } : "skip"
  );

  const isRunning =
    !!scan && (scan.status === "running" || scan.status === "queued");
  const isCompleted = !!scan && scan.status === "completed";
  const isFailed = !!scan && scan.status === "failed";

  // Poll completed by watching live scan status — Convex auto-updates reactively
  // No need for manual polling

  const startScan = useCallback(async () => {
    if (!user) return;
    setError(null);
    setIsStarting(true);
    try {
      const scanId = await createScan({
        repositoryId,
        userId: user.id,
        branch,
      });
      setActiveScanId(scanId);

      // Kick off server-side scan
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId, owner, repo, branch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scan failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start scan");
    } finally {
      setIsStarting(false);
    }
  }, [user, createScan, repositoryId, branch, owner, repo]);

  return {
    startScan,
    activeScanId,
    scan,
    isStarting,
    isRunning,
    isCompleted,
    isFailed,
    error,
    clearError: () => setError(null),
  };
}
