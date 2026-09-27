import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Shared recommendation validator ────────────────────────────
const recommendationValidator = v.object({
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
});

// ── Get AI analysis for a scan ──────────────────────────────────
export const getByScan = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, { scanId }) => {
    return ctx.db
      .query("aiAnalyses")
      .withIndex("by_scan", (q) => q.eq("scanId", scanId))
      .first();
  },
});

// ── Get AI analysis by ID ────────────────────────────────────────
export const get = query({
  args: { id: v.id("aiAnalyses") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

// ── List AI analyses for a repository ───────────────────────────
export const listByRepository = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    return ctx.db
      .query("aiAnalyses")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
      .order("desc")
      .collect();
  },
});

// ── List AI analyses for a user (recent) ────────────────────────
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("aiAnalyses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});

// ── Create a pending AI analysis record ────────────────────────
// Called right after a scan completes to claim the slot.
export const createPending = mutation({
  args: {
    scanId: v.id("scans"),
    repositoryId: v.id("repositories"),
    userId: v.string(),
  },
  handler: async (ctx, { scanId, repositoryId, userId }) => {
    // Prevent duplicates: if one already exists for this scan, return it
    const existing = await ctx.db
      .query("aiAnalyses")
      .withIndex("by_scan", (q) => q.eq("scanId", scanId))
      .first();
    if (existing) return existing._id;

    const now = Date.now();
    return ctx.db.insert("aiAnalyses", {
      scanId,
      repositoryId,
      userId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ── Mark AI analysis as running ─────────────────────────────────
export const markRunning = mutation({
  args: { id: v.id("aiAnalyses") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, {
      status: "running",
      updatedAt: Date.now(),
    });
  },
});

// ── Complete AI analysis with results ───────────────────────────
export const complete = mutation({
  args: {
    id: v.id("aiAnalyses"),
    summary: v.string(),
    strengths: v.array(v.string()),
    improvementAreas: v.array(v.string()),
    recommendations: v.array(recommendationValidator),
    developerSummary: v.string(),
    modelId: v.string(),
  },
  handler: async (ctx, { id, ...results }) => {
    const now = Date.now();
    await ctx.db.patch(id, {
      status: "completed",
      generatedAt: now,
      updatedAt: now,
      ...results,
    });
  },
});

// ── Fail AI analysis ─────────────────────────────────────────────
export const fail = mutation({
  args: {
    id: v.id("aiAnalyses"),
    error: v.string(),
  },
  handler: async (ctx, { id, error }) => {
    await ctx.db.patch(id, {
      status: "failed",
      error,
      updatedAt: Date.now(),
    });
  },
});

// ── Reset for retry ──────────────────────────────────────────────
// Resets an existing failed/completed analysis back to pending
// so the AI stage can be retried without re-running the full scan.
export const resetForRetry = mutation({
  args: {
    id: v.id("aiAnalyses"),
    userId: v.string(),
  },
  handler: async (ctx, { id, userId }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("AI analysis not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");

    const now = Date.now();
    await ctx.db.patch(id, {
      status: "pending",
      summary: undefined,
      strengths: undefined,
      improvementAreas: undefined,
      recommendations: undefined,
      developerSummary: undefined,
      modelId: undefined,
      generatedAt: undefined,
      error: undefined,
      updatedAt: now,
    });

    return id;
  },
});

// ── Delete AI analysis (admin / cleanup) ─────────────────────────
export const remove = mutation({
  args: {
    id: v.id("aiAnalyses"),
    userId: v.string(),
  },
  handler: async (ctx, { id, userId }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("AI analysis not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(id);
  },
});
