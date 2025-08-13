import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // Custom field.
    favoriteColor: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  messages: defineTable({
    userId: v.id("users"),
    body: v.string(),
  }),
  teams: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_slug", ["slug"]),
  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),
  teamInvitations: defineTable({
    teamId: v.id("teams"),
    invitedBy: v.id("users"),
    email: v.string(),
    token: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("expired")),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_token", ["token"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),
});
