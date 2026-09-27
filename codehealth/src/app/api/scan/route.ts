import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { analyzeFiles } from "@/lib/analyzer";
import type { FileContent, AnalysisResult } from "@/lib/analyzer";
import { buildAnalysisContext } from "@/lib/ai/build-analysis-context";
import {
  analyzeCodebase,
  isOpenRouterConfigured,
  OpenRouterConfigError,
  OpenRouterAnalysisError,
} from "@/lib/ai/openrouter";

// We reference the aiAnalyses mutation to create a pending record after scan completion
// (the actual OpenRouter AI call happens in /api/ai-analysis in the background)

async function getGitHubToken(userId: string): Promise<string | undefined> {
  try {
    const client = await clerkClient();
    const response = await client.users.getUserOauthAccessToken(userId, "oauth_github");
    const tokens = response.data ?? response;
    const token = (tokens as { token?: string }[])[0]?.token;
    return token ?? process.env.GITHUB_TOKEN ?? undefined;
  } catch {
    return process.env.GITHUB_TOKEN ?? undefined;
  }
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Files and directories to skip entirely
const SKIP_DIRS = new Set([
  "node_modules", ".next", ".git", "dist", "build", "coverage",
  ".cache", ".turbo", "vendor", ".output", "__pycache__", ".pytest_cache",
  ".mypy_cache", "venv", ".venv", "env", ".env", "target", "out",
  "public", ".nuxt", ".svelte-kit",
]);

const SKIP_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".svg",
  ".pdf", ".zip", ".tar", ".gz", ".rar", ".7z",
  ".mp4", ".mov", ".avi", ".mkv", ".mp3", ".wav",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".exe", ".dll", ".so", ".dylib",
  ".lock",  // package-lock.json and yarn.lock are huge
]);

const MAX_FILE_SIZE = 150_000; // bytes
const MAX_FILES = 300;

function shouldSkip(path: string): boolean {
  const parts = path.split("/");
  if (parts.some((p) => SKIP_DIRS.has(p))) return true;
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  if (SKIP_EXTENSIONS.has(ext)) return true;
  // Skip lock files explicitly
  const filename = parts[parts.length - 1];
  if (filename === "package-lock.json" || filename === "yarn.lock" || filename === "pnpm-lock.yaml") return true;
  return false;
}

async function fetchRepositoryFiles(
  owner: string,
  repo: string,
  branch: string,
  octokit: Octokit
): Promise<FileContent[]> {
  // Get the tree recursively
  const { data: tree } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "true",
  });

  const blobs = tree.tree
    .filter((item) => item.type === "blob" && item.path && !shouldSkip(item.path))
    .slice(0, MAX_FILES);

  const files: FileContent[] = [];

  // Fetch file contents in parallel batches of 10
  const BATCH = 10;
  for (let i = 0; i < blobs.length; i += BATCH) {
    const batch = blobs.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        if (!item.path || !item.sha) return null;
        try {
          const { data } = await octokit.git.getBlob({
            owner,
            repo,
            file_sha: item.sha,
          });
          // Blobs come base64 encoded
          const buf = Buffer.from(data.content, "base64");
          if (buf.length > MAX_FILE_SIZE) return null;
          const content = buf.toString("utf-8");
          // Skip binary-looking files
          if (content.includes("\0")) return null;
          return {
            path: item.path,
            content,
            size: buf.length,
          } as FileContent;
        } catch {
          return null;
        }
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        files.push(r.value);
      }
    }
  }

  return files;
}

export async function POST(request: NextRequest) {
  // Auth check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { scanId: string; owner: string; repo: string; branch: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { scanId, owner, repo, branch } = body;
  if (!scanId || !owner || !repo || !branch) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Use user's GitHub OAuth token if linked, otherwise fall back to server token
  const githubToken = await getGitHubToken(userId);
  const octokit = new Octokit({ auth: githubToken });

  const typedScanId = scanId as Id<"scans">;

  try {
    // Mark as running
    await convex.mutation(api.scans.updateProgress, {
      id: typedScanId,
      status: "running",
      currentStage: "Fetching repository files",
      progress: 5,
    });

    // Fetch files
    let files: FileContent[];
    try {
      files = await fetchRepositoryFiles(owner, repo, branch, octokit);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch repository";
      await convex.mutation(api.scans.fail, {
        id: typedScanId,
        errorMessage: msg,
      });
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    if (files.length === 0) {
      await convex.mutation(api.scans.fail, {
        id: typedScanId,
        errorMessage: "No supported source files found in this repository.",
      });
      return NextResponse.json(
        { error: "No supported source files found." },
        { status: 422 }
      );
    }

    await convex.mutation(api.scans.updateProgress, {
      id: typedScanId,
      currentStage: "Analyzing code quality",
      progress: 30,
    });

    // Run analysis
    const result = analyzeFiles(files);

    await convex.mutation(api.scans.updateProgress, {
      id: typedScanId,
      currentStage: "Calculating health score",
      progress: 80,
    });

    // Persist the completed scan
    const scan = await convex.query(api.scans.get, { id: typedScanId });
    if (!scan) throw new Error("Scan not found");

    await convex.mutation(api.scans.complete, {
      id: typedScanId,
      healthScore: result.metrics.overall,
      codeQualityScore: result.metrics.codeQuality,
      testingScore: result.metrics.testing,
      documentationScore: result.metrics.documentation,
      complexityScore: result.metrics.complexity,
      maintainabilityScore: result.metrics.maintainability,
      securityScore: result.metrics.security,
      filesAnalyzed: result.filesAnalyzed,
      linesOfCode: result.linesOfCode,
      findingsCount: result.findings.length,
      criticalCount: result.findings.filter((f) => f.severity === "critical").length,
      highCount: result.findings.filter((f) => f.severity === "high").length,
      mediumCount: result.findings.filter((f) => f.severity === "medium").length,
      lowCount: result.findings.filter((f) => f.severity === "low").length,
    });

    // Persist findings
    if (result.findings.length > 0) {
      const typedRepoId = scan.repositoryId;
      await convex.mutation(api.findings.insertBatch, {
        findings: result.findings.map((f) => ({
          scanId: typedScanId,
          repositoryId: typedRepoId,
          userId,
          severity: f.severity,
          category: f.category,
          title: f.title,
          description: f.description,
          file: f.file,
          line: f.line,
          evidence: f.evidence,
          recommendation: f.recommendation,
          ruleId: f.ruleId,
          status: "open" as const,
          createdAt: Date.now(),
        })),
      });
    }

    // Update repository's last scan info
    await convex.mutation(api.repositories.updateLastScan, {
      id: scan.repositoryId,
      lastScanAt: Date.now(),
      lastHealthScore: result.metrics.overall,
      lastIssueCount: result.findings.length,
    });

    // Create activity
    await convex.mutation(api.activities.create, {
      userId,
      type: "scan_completed",
      message: `Scan completed: ${result.filesAnalyzed} files analyzed, health score ${result.metrics.overall}/100`,
      repositoryId: scan.repositoryId,
      scanId: typedScanId,
    });

    // ── AI analysis (awaited but non-blocking on failure) ───────
    // We await the AI call so the Next.js runtime doesn't terminate the
    // fetch to IBM Cloud IAM before it completes. AI failure is caught
    // and persisted — it never causes the scan response to fail.
    await (async () => {
      try {
        if (!isOpenRouterConfigured()) {
          const aiId = await convex.mutation(api.aiAnalyses.createPending, {
            scanId: typedScanId,
            repositoryId: scan.repositoryId,
            userId,
          });
          await convex.mutation(api.aiAnalyses.fail, {
            id: aiId,
            error: "OpenRouter AI is not configured. Set OPENROUTER_API_KEY.",
          });
          return;
        }

        const aiId = await convex.mutation(api.aiAnalyses.createPending, {
          scanId: typedScanId,
          repositoryId: scan.repositoryId,
          userId,
        });
        await convex.mutation(api.aiAnalyses.markRunning, { id: aiId });

        const aiAnalysisResult: AnalysisResult = {
          filesAnalyzed: result.filesAnalyzed,
          linesOfCode: result.linesOfCode,
          metrics: result.metrics,
          findings: result.findings,
          signals: result.signals,
        };
        const aiContext = buildAnalysisContext({
          owner,
          name: repo,
          branch,
          analysisResult: aiAnalysisResult,
        });

        const aiResult = await analyzeCodebase(aiContext);

        await convex.mutation(api.aiAnalyses.complete, {
          id: aiId,
          summary: aiResult.summary,
          strengths: aiResult.strengths,
          improvementAreas: aiResult.improvementAreas,
          recommendations: aiResult.recommendations,
          developerSummary: aiResult.developerSummary,
          modelId: aiResult.modelId,
        });

        await convex.mutation(api.activities.create, {
          userId,
          type: "analysis_done",
          message: `AI insights generated for ${owner}/${repo} (${branch})`,
          repositoryId: scan.repositoryId,
          scanId: typedScanId,
        });
      } catch (err: unknown) {
        let userMessage = "AI analysis could not be completed.";
        if (err instanceof OpenRouterConfigError) userMessage = err.message;
        else if (err instanceof OpenRouterAnalysisError) userMessage = err.message;
        console.error("[scan] AI analysis failed:", err instanceof Error ? err.message : err);

        try {
          const existing = await convex.query(api.aiAnalyses.getByScan, { scanId: typedScanId });
          if (existing && (existing.status === "running" || existing.status === "pending")) {
            await convex.mutation(api.aiAnalyses.fail, { id: existing._id, error: userMessage });
          }
        } catch {
          // best effort
        }
      }
    })();

    return NextResponse.json({
      success: true,
      scanId,
      healthScore: result.metrics.overall,
      filesAnalyzed: result.filesAnalyzed,
      findingsCount: result.findings.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Scan failed";
    try {
      await convex.mutation(api.scans.fail, {
        id: typedScanId,
        errorMessage: msg,
      });
    } catch {
      // best effort
    }
    console.error("[scan] Error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
