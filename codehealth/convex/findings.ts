import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── List findings by scan ──────────────────────────────────
export const listByScan = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, { scanId }) => {
    return ctx.db
      .query("findings")
      .withIndex("by_scan", (q) => q.eq("scanId", scanId))
      .collect();
  },
});

// ── List findings by repository ────────────────────────────
export const listByRepository = query({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, { repositoryId }) => {
    return ctx.db
      .query("findings")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repositoryId))
      .order("desc")
      .collect();
  },
});

// ── List all findings for a user ───────────────────────────
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("findings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(200);
  },
});

// ── Get single finding ─────────────────────────────────────
export const get = query({
  args: { id: v.id("findings") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

// ── Insert a batch of findings ─────────────────────────────
export const insertBatch = mutation({
  args: {
    findings: v.array(v.object({
      scanId: v.id("scans"),
      repositoryId: v.id("repositories"),
      userId: v.string(),
      severity: v.union(
        v.literal("critical"), v.literal("high"),
        v.literal("medium"),  v.literal("low")
      ),
      category: v.union(
        v.literal("security"),      v.literal("quality"),
        v.literal("complexity"),    v.literal("documentation"),
        v.literal("testing"),       v.literal("maintainability")
      ),
      title: v.string(),
      description: v.string(),
      file: v.string(),
      line: v.optional(v.number()),
      evidence: v.optional(v.string()),
      recommendation: v.string(),
      ruleId: v.string(),
      status: v.literal("open"),
      createdAt: v.number(),
    })),
  },
  handler: async (ctx, { findings }) => {
    for (const f of findings) {
      await ctx.db.insert("findings", f);
    }
  },
});

// ── Update finding status ──────────────────────────────────
export const updateStatus = mutation({
  args: {
    id: v.id("findings"),
    status: v.union(
      v.literal("open"), v.literal("resolved"), v.literal("ignored")
    ),
    userId: v.string(),
  },
  handler: async (ctx, { id, status, userId }) => {
    const finding = await ctx.db.get(id);
    if (!finding || finding.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.patch(id, { status });
  },
});
