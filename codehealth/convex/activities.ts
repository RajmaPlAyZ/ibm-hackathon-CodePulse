import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── List recent activities for a user ─────────────────────
export const listByUser = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { userId, limit }) => {
    return ctx.db
      .query("activities")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit ?? 20);
  },
});

// ── Create an activity ─────────────────────────────────────
export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
