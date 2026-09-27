/**
 * POST /api/ai-analysis
 *
 * Triggers or retries AI analysis for a completed scan.
 * This route is server-side only — OpenRouter credentials never reach the browser.
 *
 * Body:
 *   { scanId: string, owner: string, repo: string, branch: string, retryId?: string }
 *
 * The scan must already be completed before AI analysis can run.
 * If the scan is not completed, this returns 409.
 *
 * If retryId is provided, the existing AI analysis record is reset and retried.
 * Otherwise a new pending record is created.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { buildAnalysisContext } from "@/lib/ai/build-analysis-context";
import {
  analyzeCodebase,
  isOpenRouterConfigured,
  OpenRouterConfigError,
  OpenRouterAnalysisError,
} from "@/lib/ai/openrouter";
import type { AnalysisResult } from "@/lib/analyzer";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ──────────────────────────────────────────────
  let body: {
    scanId: string;
    owner: string;
    repo: string;
    branch: string;
    retryId?: string;
  };
  try {
    body = await request.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { scanId, owner, repo, branch, retryId } = body;
  if (!scanId || !owner || !repo || !branch) {
    return NextResponse.json({ error: "Missing required fields: scanId, owner, repo, branch" }, { status: 400 });
  }

  // ── Check OpenRouter configuration upfront ──────────────────
  if (!isOpenRouterConfigured()) {
    const missing = [];
    if (!process.env.OPENROUTER_API_KEY) missing.push("OPENROUTER_API_KEY");
    console.error(`[ai-analysis] OpenRouter not configured. Missing: ${missing.join(", ")}`);
    return NextResponse.json(
      {
        error: "OpenRouter AI is not configured.",
        detail: `Set ${missing.join(" and ")} in your .env.local and restart the dev server.`,
        code: "NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  // ── Fetch scan from Convex ───────────────────────────────────
  const typedScanId = scanId as Id<"scans">;
  const scan = await convex.query(api.scans.get, { id: typedScanId });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  // Authorization: only the scan owner can request AI analysis
  if (scan.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // AI analysis only makes sense for completed scans
  if (scan.status !== "completed") {
    return NextResponse.json(
      { error: "Scan is not completed. AI analysis requires a completed scan.", code: "SCAN_NOT_COMPLETED" },
      { status: 409 }
    );
  }

  // ── Create or reset AI analysis record ──────────────────────
  let aiAnalysisId: Id<"aiAnalyses">;

  if (retryId) {
    // Retry: reset existing record
    aiAnalysisId = retryId as Id<"aiAnalyses">;
    try {
      await convex.mutation(api.aiAnalyses.resetForRetry, {
        id: aiAnalysisId,
        userId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset AI analysis";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  } else {
    // New: create pending record (idempotent)
    aiAnalysisId = await convex.mutation(api.aiAnalyses.createPending, {
      scanId: typedScanId,
      repositoryId: scan.repositoryId,
      userId,
    });
  }

  // Mark as running
  await convex.mutation(api.aiAnalyses.markRunning, { id: aiAnalysisId });

  // ── Reconstruct AnalysisResult from stored scan + findings ──
  // We need the findings for the context builder.
  // The scan has all metrics; we fetch findings from Convex.
  const rawFindings = await convex.query(api.findings.listByScan, { scanId: typedScanId });

  // Map Convex findings back to RawFinding shape for the context builder
  const findings: AnalysisResult["findings"] = rawFindings.map((f) => ({
    severity: f.severity,
    category: f.category,
    title: f.title,
    description: f.description,
    file: f.file,
    line: f.line,
    evidence: f.evidence,
    recommendation: f.recommendation,
    ruleId: f.ruleId,
  }));

  const analysisResult: AnalysisResult = {
    filesAnalyzed: scan.filesAnalyzed ?? 0,
    linesOfCode: scan.linesOfCode ?? 0,
    metrics: {
      overall: scan.healthScore ?? 0,
      codeQuality: scan.codeQualityScore ?? 0,
      testing: scan.testingScore ?? 0,
      documentation: scan.documentationScore ?? 0,
      complexity: scan.complexityScore ?? 0,
      maintainability: scan.maintainabilityScore ?? 0,
      security: scan.securityScore ?? 0,
    },
    findings,
    signals: {
      sourceFiles: 0,
      testFiles: 0,
      totalLines: scan.linesOfCode ?? 0,
      todoCount: 0,
      consoleCount: 0,
      complexFunctionCount: 0,
      hasReadme: false,
      readmeLengthLines: 0,
      hasDocsDir: false,
      securityIssues: scan.criticalCount ?? 0,
      coverageAvailable: false,
    },
  };

  // ── Build AI context (sanitized, token-efficient) ────────────
  const aiContext = buildAnalysisContext({
    owner,
    name: repo,
    branch,
    analysisResult,
  });

  // ── Call OpenRouter ──────────────────────────────────────────
  try {
    const result = await analyzeCodebase(aiContext);

    // Save completed result
    await convex.mutation(api.aiAnalyses.complete, {
      id: aiAnalysisId,
      summary: result.summary,
      strengths: result.strengths,
      improvementAreas: result.improvementAreas,
      recommendations: result.recommendations,
      developerSummary: result.developerSummary,
      modelId: result.modelId,
    });

    // Create activity
    await convex.mutation(api.activities.create, {
      userId,
      type: "analysis_done",
      message: `AI insights generated for ${owner}/${repo} (${branch})`,
      repositoryId: scan.repositoryId,
      scanId: typedScanId,
    });

    return NextResponse.json({
      success: true,
      aiAnalysisId,
      modelId: result.modelId,
    });
  } catch (err) {
    let userMessage = "AI analysis could not be completed.";
    let code = "UNKNOWN_ERROR";

    if (err instanceof OpenRouterConfigError) {
      userMessage = err.message;
      code = "NOT_CONFIGURED";
    } else if (err instanceof OpenRouterAnalysisError) {
      userMessage = err.message;
      code = err.code;
    }

    // Log a safe diagnostic — no credentials in the message
    console.error(`[ai-analysis] Failed for scan ${scanId}: ${code}`);

    // Mark AI analysis as failed (scan remains completed)
    try {
      await convex.mutation(api.aiAnalyses.fail, {
        id: aiAnalysisId,
        error: userMessage,
      });
    } catch {
      // best effort
    }

    return NextResponse.json(
      { error: userMessage, code },
      { status: 503 }
    );
  }
}
