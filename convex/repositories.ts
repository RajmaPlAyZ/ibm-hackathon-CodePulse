import { query } from "./_generated/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// ── List all repositories for the current user ─────────────
export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("repositories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// ── Get a single repository ────────────────────────────────
export const get = query({
  args: { id: v.id("repositories") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

// ── Get by fullName (deduplicate) ──────────────────────────
export const getByFullName = query({
  args: { userId: v.string(), fullName: v.string() },
  handler: async (ctx, { userId, fullName }) => {
    return ctx.db
      .query("repositories")
      .withIndex("by_user_fullName", (q) =>
        q.eq("userId", userId).eq("fullName", fullName)
      )
      .first();
  },
});

// ── Create / connect a repository ──────────────────────────
export const create = mutation({
  args: {
    userId: v.string(),
    owner: v.string(),
    name: v.string(),
    fullName: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    language: v.optional(v.string()),
    defaultBranch: v.string(),
    selectedBranch: v.string(),
    branches: v.optional(v.array(v.string())),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Prevent duplicate
    const existing = await ctx.db
      .query("repositories")
      .withIndex("by_user_fullName", (q) =>
        q.eq("userId", args.userId).eq("fullName", args.fullName)
      )
      .first();
    if (existing) return existing._id;

    return ctx.db.insert("repositories", {
      ...args,
      connectedAt: Date.now(),
    });
  },
});

// ── Update selected branch ──────────────────────────────────
export const updateSelectedBranch = mutation({
  args: {
    id: v.id("repositories"),
    selectedBranch: v.string(),
  },
  handler: async (ctx, { id, selectedBranch }) => {
    await ctx.db.patch(id, { selectedBranch });
  },
});

// ── Update last scan info ───────────────────────────────────
export const updateLastScan = mutation({
  args: {
    id: v.id("repositories"),
    lastScanAt: v.number(),
    lastHealthScore: v.number(),
    lastIssueCount: v.number(),
  },
  handler: async (ctx, { id, lastScanAt, lastHealthScore, lastIssueCount }) => {
    await ctx.db.patch(id, { lastScanAt, lastHealthScore, lastIssueCount });
  },
});

// ── Delete a repository (and its scans/findings) ───────────
export const remove = mutation({
  args: { id: v.id("repositories"), userId: v.string() },
  handler: async (ctx, { id, userId }) => {
    const repo = await ctx.db.get(id);
    if (!repo || repo.userId !== userId) throw new Error("Unauthorized");
    await ctx.db.delete(id);
  },
});
