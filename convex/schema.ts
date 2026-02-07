import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scripts: defineTable({
    userId: v.string(),
    title: v.string(),
    totalDurationSeconds: v.number(),
    pairs: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
