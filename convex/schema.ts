import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── Repositories ──────────────────────────────────────────
  repositories: defineTable({
    userId: v.string(),           // Clerk user ID
    owner: v.string(),
    name: v.string(),
    fullName: v.string(),         // "owner/name"
    url: v.string(),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    defaultBranch: v.string(),
    selectedBranch: v.string(),
    branches: v.optional(v.array(v.string())),
    isPrivate: v.boolean(),
    connectedAt: v.number(),      // timestamp ms
    lastScanAt: v.optional(v.number()),
    lastHealthScore: v.optional(v.number()),
    lastIssueCount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_fullName", ["userId", "fullName"]),

  // ── Scans ─────────────────────────────────────────────────
  scans: defineTable({
    repositoryId: v.id("repositories"),
    userId: v.string(),
    branch: v.string(),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    durationMs: v.optional(v.number()),
    filesAnalyzed: v.optional(v.number()),
    linesOfCode: v.optional(v.number()),
    healthScore: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    // Health metrics
    codeQualityScore: v.optional(v.number()),
    testingScore: v.optional(v.number()),
    documentationScore: v.optional(v.number()),
    complexityScore: v.optional(v.number()),
    maintainabilityScore: v.optional(v.number()),
    securityScore: v.optional(v.number()),
    // Counts
    findingsCount: v.optional(v.number()),
    criticalCount: v.optional(v.number()),
    highCount: v.optional(v.number()),
    mediumCount: v.optional(v.number()),
    lowCount: v.optional(v.number()),
    // Stage tracking
    currentStage: v.optional(v.string()),
    progress: v.optional(v.number()),
  })
    .index("by_repository", ["repositoryId"])
    .index("by_user", ["userId"])
    .index("by_repository_status", ["repositoryId", "status"]),

  // ── Findings ──────────────────────────────────────────────
  findings: defineTable({
    scanId: v.id("scans"),
    repositoryId: v.id("repositories"),
    userId: v.string(),
    severity: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    category: v.union(
      v.literal("security"),
      v.literal("quality"),
      v.literal("complexity"),
      v.literal("documentation"),
      v.literal("testing"),
      v.literal("maintainability")
    ),
    title: v.string(),
    description: v.string(),
    file: v.string(),
    line: v.optional(v.number()),
    evidence: v.optional(v.string()),    // redacted snippet
    recommendation: v.string(),
    ruleId: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("resolved"),
      v.literal("ignored")
    ),
    createdAt: v.number(),
  })
    .index("by_scan", ["scanId"])
    .index("by_repository", ["repositoryId"])
    .index("by_user", ["userId"])
    .index("by_user_severity", ["userId", "severity"]),

  // ── Activities ────────────────────────────────────────────
  activities: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("scan_completed"),
      v.literal("scan_failed"),
      v.literal("repository_connected"),
      v.literal("finding_detected"),
      v.literal("health_improved"),
      v.literal("health_declined"),
      v.literal("analysis_done")
    ),
    message: v.string(),
    repositoryId: v.optional(v.id("repositories")),
    scanId: v.optional(v.id("scans")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  // ── AI Analyses ────────────────────────────────────────────
  // One record per scan. The AI layer is separate from the scan layer.
  // A scan can complete even if the AI analysis fails.
  aiAnalyses: defineTable({
    scanId: v.id("scans"),
    repositoryId: v.id("repositories"),
    userId: v.string(),

    // Lifecycle
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),

    // AI-generated content (present when status === "completed")
    summary: v.optional(v.string()),
    strengths: v.optional(v.array(v.string())),
    improvementAreas: v.optional(v.array(v.string())),
    recommendations: v.optional(
      v.array(
        v.object({
          priority: v.number(),
          severity: v.union(
            v.literal("critical"),
            v.literal("high"),
            v.literal("medium"),
            v.literal("low")
          ),
          title: v.string(),
          whyItMatters: v.string(),
          action: v.string(),
          affectedFiles: v.array(v.string()),
        })
      )
    ),
    developerSummary: v.optional(v.string()),

    // Provenance
    modelId: v.optional(v.string()),
    generatedAt: v.optional(v.number()),

    // Error (present when status === "failed")
    error: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_scan", ["scanId"])
    .index("by_repository", ["repositoryId"])
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),
});
