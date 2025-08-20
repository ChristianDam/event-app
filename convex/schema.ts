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
    // Team-aware pattern: user's currently selected team
    currentTeamId: v.optional(v.id("teams")),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  threads: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    threadType: v.union(
      v.literal("team"), // Team-wide discussion
      v.literal("event"), // Event-specific discussion
      v.literal("ai") // AI agent thread
    ),
    // One of these will be set based on threadType
    teamId: v.optional(v.id("teams")),
    eventId: v.optional(v.id("events")),
    aiAgentName: v.optional(v.string()), // For future AI integration
    createdBy: v.id("users"),
    createdAt: v.number(),
    isArchived: v.optional(v.boolean()),
    lastMessageAt: v.optional(v.number()),
  })
    .index("by_team", ["teamId"])
    .index("by_event", ["eventId"])
    .index("by_creator", ["createdBy"])
    .index("by_type", ["threadType"])
    .index("by_last_message", ["lastMessageAt"]),
  threadParticipants: defineTable({
    threadId: v.id("threads"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"), // Can manage thread settings
      v.literal("participant") // Can send messages
    ),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
  })
    .index("by_thread", ["threadId"])
    .index("by_user", ["userId"])
    .index("by_thread_and_user", ["threadId", "userId"]),
  threadMessages: defineTable({
    threadId: v.id("threads"),
    authorId: v.optional(v.id("users")), // null for AI messages
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("system"), // System notifications
      v.literal("ai") // AI agent messages
    ),
    replyToId: v.optional(v.id("threadMessages")), // For threaded replies
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_author", ["authorId"])
    .index("by_thread_and_created", ["threadId", "createdAt"])
    .index("by_reply_to", ["replyToId"]),
  teams: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    createdAt: v.number(),
    logo: v.optional(v.id("_storage")), // File ID for team logo/avatar
    primaryColor: v.optional(v.string()), // Hex color code like "#3b82f6"
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
  events: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    venue: v.string(),
    startTime: v.number(), // Unix timestamp
    endTime: v.number(), // Unix timestamp
    timezone: v.string(), // IANA timezone identifier (default: "Europe/Copenhagen")
    teamId: v.id("teams"),
    organizerId: v.id("users"),
    eventType: v.union(
      v.literal("music"),
      v.literal("art"),
      v.literal("workshop"),
      v.literal("performance"),
      v.literal("exhibition"),
      v.literal("other")
    ),
    maxCapacity: v.optional(v.number()),
    registrationDeadline: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("cancelled")
    ),
    eventImageId: v.optional(v.id("_storage")),
    socialImageId: v.optional(v.id("_storage")), // Optimized for social sharing
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_organizer", ["organizerId"])
    .index("by_slug", ["slug"])
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"])
    .index("by_event_type", ["eventType"]),
  eventRegistrations: defineTable({
    eventId: v.id("events"),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    attendeePhone: v.optional(v.string()),
    registeredAt: v.number(),
    confirmationSent: v.boolean(),
  })
    .index("by_event", ["eventId"])
    .index("by_email", ["attendeeEmail"])
    .index("by_registration_time", ["registeredAt"]),
});
