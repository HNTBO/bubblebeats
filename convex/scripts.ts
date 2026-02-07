import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const userId = identity.subject;
    const scripts = await ctx.db
      .query("scripts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return scripts.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const get = query({
  args: { id: v.id("scripts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const script = await ctx.db.get(args.id);
    if (!script || script.userId !== identity.subject) return null;
    return script;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    totalDurationSeconds: v.number(),
    pairs: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("scripts", {
      userId: identity.subject,
      title: args.title,
      totalDurationSeconds: args.totalDurationSeconds,
      pairs: args.pairs,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("scripts"),
    title: v.optional(v.string()),
    totalDurationSeconds: v.optional(v.number()),
    pairs: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Not found");
    }
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.totalDurationSeconds !== undefined)
      updates.totalDurationSeconds = args.totalDurationSeconds;
    if (args.pairs !== undefined) updates.pairs = args.pairs;
    await ctx.db.patch(args.id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("scripts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.id);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Not found");
    }
    await ctx.db.delete(args.id);
  },
});
