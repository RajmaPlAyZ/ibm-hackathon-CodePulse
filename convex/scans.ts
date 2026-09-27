import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── List scans for a repository ────────────────────────────
export const listByRepository = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    return ctx.db
      .query("scans")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
      .order("desc")
      .collect();
  },
});

// ── List all scans for a user ──────────────────────────────
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("scans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

// ── Get single scan ────────────────────────────────────────
export const get = query({
  args: { id: v.id("scans") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

// ── Get latest completed scan for a repository ─────────────
export const getLatestCompleted = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
      .order("desc")
      .collect();
    return scans.find((s) => s.status === "completed") ?? null;
  },
});

// ── Create a new scan (queued) ─────────────────────────────
export const create = mutation({
  args: {
    repositoryId: v.id("repositories"),
    userId: v.string(),
    branch: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("scans", {
      ...args,
      status: "queued",
      startedAt: Date.now(),
      progress: 0,
      currentStage: "Queued",
    });
  },
});

// ── Update scan status / progress ─────────────────────────
export const updateProgress = mutation({
  args: {
    id: v.id("scans"),
    status: v.optional(v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    )),
    currentStage: v.optional(v.string()),
    progress: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const patch: Record<string, unknown> = {};
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.currentStage !== undefined) patch.currentStage = updates.currentStage;
    if (updates.progress !== undefined) patch.progress = updates.progress;
    if (updates.errorMessage !== undefined) patch.errorMessage = updates.errorMessage;
    await ctx.db.patch(id, patch);
  },
});

// ── Complete a scan with results ───────────────────────────
export const complete = mutation({
  args: {
    id: v.id("scans"),
    healthScore: v.number(),
    codeQualityScore: v.number(),
    testingScore: v.number(),
    documentationScore: v.number(),
    complexityScore: v.number(),
    maintainabilityScore: v.number(),
    securityScore: v.number(),
    filesAnalyzed: v.number(),
    linesOfCode: v.number(),
    findingsCount: v.number(),
    criticalCount: v.number(),
    highCount: v.number(),
    mediumCount: v.number(),
    lowCount: v.number(),
  },
  handler: async (ctx, { id, ...results }) => {
    const scan = await ctx.db.get(id);
    if (!scan) throw new Error("Scan not found");
    const completedAt = Date.now();
    await ctx.db.patch(id, {
      status: "completed",
      completedAt,
      durationMs: completedAt - scan.startedAt,
      progress: 100,
      currentStage: "Completed",
      ...results,
    });
  },
});

// ── Fail a scan ────────────────────────────────────────────
export const fail = mutation({
  args: { id: v.id("scans"), errorMessage: v.string() },
  handler: async (ctx, { id, errorMessage }) => {
    await ctx.db.patch(id, {
      status: "failed",
      completedAt: Date.now(),
      errorMessage,
      progress: 0,
    });
  },
});
