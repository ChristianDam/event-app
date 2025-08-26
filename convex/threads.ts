import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUserWithTeamReadOnly, requireTeam } from "./lib/auth";

// Thread Management Functions

/**
 * Create a thread for the current team (team-aware pattern)
 */
export const createTeamThreadForCurrentTeam = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("threads"),
  handler: async (ctx, args) => {
    const user = await requireTeam(ctx);
    const teamId = user.currentTeamId;
    const userId = user._id;

    const threadId = await ctx.db.insert("threads", {
      title: args.title,
      description: args.description,
      threadType: "team",
      teamId,
      createdBy: userId,
      createdAt: Date.now(),
      isArchived: false,
    });

    // Add creator as admin participant
    await ctx.db.insert("threadParticipants", {
      threadId,
      userId,
      role: "admin",
      joinedAt: Date.now(),
    });

    // Add all team members as participants
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();

    for (const member of teamMembers) {
      if (member.userId !== userId) { // Skip creator, already added
        await ctx.db.insert("threadParticipants", {
          threadId,
          userId: member.userId,
          role: "participant",
          joinedAt: Date.now(),
        });
      }
    }

    return threadId;
  },
});

/**
 * Get threads for the current team (team-aware pattern)
 */
export const getMyTeamThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("threads"),
      title: v.string(),
      description: v.optional(v.string()),
      threadType: v.union(v.literal("team"), v.literal("event"), v.literal("ai")),
      createdBy: v.id("users"),
      createdAt: v.number(),
      lastMessageAt: v.optional(v.number()),
      messageCount: v.number(),
      unreadCount: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithTeamReadOnly(ctx);
    if (!user) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    // Verify user is team member (additional safety check)
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", user.currentTeamId).eq("userId", user._id)
      )
      .first();
    
    if (!membership) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const result = await ctx.db
      .query("threads")
      .withIndex("by_team", (q) => q.eq("teamId", user.currentTeamId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedThreads = await Promise.all(
      result.page.map(async (thread) => {
        // Get message count
        const messages = await ctx.db
          .query("threadMessages")
          .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
          .collect();

        // Get user's last read timestamp
        const participation = await ctx.db
          .query("threadParticipants")
          .withIndex("by_thread_and_user", (q) => 
            q.eq("threadId", thread._id).eq("userId", user._id)
          )
          .first();

        const lastReadAt = participation?.lastReadAt || 0;
        const unreadCount = messages.filter((msg) => msg.createdAt > lastReadAt).length;

        return {
          _id: thread._id,
          title: thread.title,
          description: thread.description,
          threadType: thread.threadType,
          createdBy: thread.createdBy,
          createdAt: thread.createdAt,
          lastMessageAt: thread.lastMessageAt,
          messageCount: messages.length,
          unreadCount,
        };
      })
    );

    return {
      page: enrichedThreads,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const createTeamThread = mutation({
  args: {
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("threads"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    // Verify user is a team member
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("userId", userId))
      .unique();
    
    if (!membership) {
      throw new Error("Not a team member");
    }

    const threadId = await ctx.db.insert("threads", {
      title: args.title,
      description: args.description,
      threadType: "team",
      teamId: args.teamId,
      createdBy: userId,
      createdAt: Date.now(),
      isArchived: false,
    });

    // Add creator as admin participant
    await ctx.db.insert("threadParticipants", {
      threadId,
      userId,
      role: "admin",
      joinedAt: Date.now(),
    });

    // Add all team members as participants
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const member of teamMembers) {
      if (member.userId !== userId) { // Skip creator, already added
        await ctx.db.insert("threadParticipants", {
          threadId,
          userId: member.userId,
          role: "participant",
          joinedAt: Date.now(),
        });
      }
    }

    return threadId;
  },
});

export const createEventThread = mutation({
  args: {
    eventId: v.id("events"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("threads"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    // Verify user is event organizer or team member
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const isOrganizer = event.organizerId === userId;
    const isTeamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", event.teamId).eq("userId", userId))
      .unique();

    if (!isOrganizer && !isTeamMember) {
      throw new Error("Not authorized to create event thread");
    }

    const threadId = await ctx.db.insert("threads", {
      title: args.title,
      description: args.description,
      threadType: "event",
      eventId: args.eventId,
      createdBy: userId,
      createdAt: Date.now(),
      isArchived: false,
    });

    // Add creator as admin participant
    await ctx.db.insert("threadParticipants", {
      threadId,
      userId,
      role: "admin",
      joinedAt: Date.now(),
    });

    // Add event organizer as admin (if different from creator)
    if (event.organizerId !== userId) {
      await ctx.db.insert("threadParticipants", {
        threadId,
        userId: event.organizerId,
        role: "admin",
        joinedAt: Date.now(),
      });
    }

    // Note: Event attendee participation will be handled when users
    // register and join the platform with matching email addresses
    
    return threadId;
  },
});

export const createAIThread = mutation({
  args: {
    teamId: v.optional(v.id("teams")),
    eventId: v.optional(v.id("events")),
    title: v.string(),
    aiAgentName: v.string(),
  },
  returns: v.id("threads"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    // Verify user has access to create AI thread
    if (args.teamId) {
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId!).eq("userId", userId))
        .unique();
      
      if (!membership) {
        throw new Error("Not a team member");
      }
    }

    if (args.eventId) {
      const event = await ctx.db.get(args.eventId);
      if (!event) {
        throw new Error("Event not found");
      }

      const isOrganizer = event.organizerId === userId;
      const isTeamMember = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) => q.eq("teamId", event.teamId).eq("userId", userId))
        .unique();

      if (!isOrganizer && !isTeamMember) {
        throw new Error("Not authorized to create AI thread for this event");
      }
    }

    const threadId = await ctx.db.insert("threads", {
      title: args.title,
      description: `AI conversation with ${args.aiAgentName}`,
      threadType: "ai",
      teamId: args.teamId,
      eventId: args.eventId,
      aiAgentName: args.aiAgentName,
      createdBy: userId,
      createdAt: Date.now(),
      isArchived: false,
    });

    // Add creator as admin participant
    await ctx.db.insert("threadParticipants", {
      threadId,
      userId,
      role: "admin",
      joinedAt: Date.now(),
    });

    return threadId;
  },
});

export const getThreadsForTeam = query({
  args: {
    teamId: v.id("teams"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("threads"),
      title: v.string(),
      description: v.optional(v.string()),
      threadType: v.union(v.literal("team"), v.literal("event"), v.literal("ai")),
      createdBy: v.id("users"),
      createdAt: v.number(),
      lastMessageAt: v.optional(v.number()),
      messageCount: v.number(),
      unreadCount: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    // Verify user is team member
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", args.teamId).eq("userId", userId))
      .unique();
    
    if (!membership) {
      throw new Error("Not a team member");
    }

    // Get team threads
    const teamThreadsResult = await ctx.db
      .query("threads")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    // Get team events
    const teamEvents = await ctx.db
      .query("events")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    // Get event threads for team events
    const eventThreadsPromises = teamEvents.map(async (event) => {
      const eventThreads = await ctx.db
        .query("threads")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .filter((q) => q.eq(q.field("isArchived"), false))
        .collect();
      return eventThreads;
    });

    const eventThreadsResults = await Promise.all(eventThreadsPromises);
    const eventThreads = eventThreadsResults.flat();

    // Combine and sort all threads by creation time (desc)
    const allThreads = [...teamThreadsResult, ...eventThreads]
      .sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination manually
    const startIndex = args.paginationOpts.cursor ? 
      parseInt(args.paginationOpts.cursor) : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedThreads = allThreads.slice(startIndex, endIndex);
    const isDone = endIndex >= allThreads.length;
    const continueCursor = isDone ? "" : endIndex.toString();

    const enrichedThreads = await Promise.all(
      paginatedThreads.map(async (thread) => {
        // Get message count
        const messages = await ctx.db
          .query("threadMessages")
          .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
          .collect();

        // Get user's last read timestamp
        const participation = await ctx.db
          .query("threadParticipants")
          .withIndex("by_thread_and_user", (q) => q.eq("threadId", thread._id).eq("userId", userId))
          .unique();

        const lastReadAt = participation?.lastReadAt || 0;
        const unreadCount = messages.filter(msg => msg.createdAt > lastReadAt).length;

        return {
          _id: thread._id,
          title: thread.title,
          description: thread.description,
          threadType: thread.threadType,
          createdBy: thread.createdBy,
          createdAt: thread.createdAt,
          lastMessageAt: thread.lastMessageAt,
          messageCount: messages.length,
          unreadCount,
        };
      })
    );

    return {
      page: enrichedThreads,
      isDone,
      continueCursor,
    };
  },
});

export const getThreadsForEvent = query({
  args: {
    eventId: v.id("events"),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("threads"),
      title: v.string(),
      description: v.optional(v.string()),
      threadType: v.union(v.literal("team"), v.literal("event"), v.literal("ai")),
      createdBy: v.id("users"),
      createdAt: v.number(),
      lastMessageAt: v.optional(v.number()),
      messageCount: v.number(),
      unreadCount: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    // Verify user has access to event (is registered attendee, organizer, or team member)
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const isOrganizer = event.organizerId === userId;
    const isTeamMember = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => q.eq("teamId", event.teamId).eq("userId", userId))
      .unique();

    // Check if user is registered attendee (by matching email if they have one)
    let isRegisteredAttendee = false;
    const user = await ctx.db.get(userId);
    if (user?.email) {
      const registration = await ctx.db
        .query("eventRegistrations")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .filter((q) => q.eq(q.field("attendeeEmail"), user.email!))
        .unique();
      isRegisteredAttendee = !!registration;
    }

    if (!isOrganizer && !isTeamMember && !isRegisteredAttendee) {
      throw new Error("Not authorized to view event threads");
    }

    const result = await ctx.db
      .query("threads")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .order("desc")
      .paginate(args.paginationOpts);

    const enrichedThreads = await Promise.all(
      result.page.map(async (thread) => {
        // Get message count
        const messages = await ctx.db
          .query("threadMessages")
          .withIndex("by_thread", (q) => q.eq("threadId", thread._id))
          .collect();

        // Get user's last read timestamp
        const participation = await ctx.db
          .query("threadParticipants")
          .withIndex("by_thread_and_user", (q) => q.eq("threadId", thread._id).eq("userId", userId))
          .unique();

        const lastReadAt = participation?.lastReadAt || 0;
        const unreadCount = messages.filter(msg => msg.createdAt > lastReadAt).length;

        return {
          _id: thread._id,
          title: thread.title,
          description: thread.description,
          threadType: thread.threadType,
          createdBy: thread.createdBy,
          createdAt: thread.createdAt,
          lastMessageAt: thread.lastMessageAt,
          messageCount: messages.length,
          unreadCount,
        };
      })
    );

    return {
      page: enrichedThreads,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const addUserToThread = mutation({
  args: {
    threadId: v.id("threads"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("participant")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (currentUserId === null) {
      throw new Error("Not signed in");
    }

    // Verify current user is admin of the thread
    const currentParticipation = await ctx.db
      .query("threadParticipants")
      .withIndex("by_thread_and_user", (q) => q.eq("threadId", args.threadId).eq("userId", currentUserId))
      .unique();

    if (!currentParticipation || currentParticipation.role !== "admin") {
      throw new Error("Not authorized to add users to this thread");
    }

    // Check if user is already a participant
    const existingParticipation = await ctx.db
      .query("threadParticipants")
      .withIndex("by_thread_and_user", (q) => q.eq("threadId", args.threadId).eq("userId", args.userId))
      .unique();

    if (existingParticipation) {
      throw new Error("User is already a participant in this thread");
    }

    await ctx.db.insert("threadParticipants", {
      threadId: args.threadId,
      userId: args.userId,
      role: args.role,
      joinedAt: Date.now(),
    });

    return null;
  },
});

export const archiveThread = mutation({
  args: {
    threadId: v.id("threads"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    // Verify user is admin of the thread
    const participation = await ctx.db
      .query("threadParticipants")
      .withIndex("by_thread_and_user", (q) => q.eq("threadId", args.threadId).eq("userId", userId))
      .unique();

    if (!participation || participation.role !== "admin") {
      throw new Error("Not authorized to archive this thread");
    }

    await ctx.db.patch(args.threadId, {
      isArchived: true,
    });

    return null;
  },
});

export const markThreadAsRead = mutation({
  args: {
    threadId: v.id("threads"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not signed in");
    }

    const participation = await ctx.db
      .query("threadParticipants")
      .withIndex("by_thread_and_user", (q) => q.eq("threadId", args.threadId).eq("userId", userId))
      .unique();

    if (!participation) {
      throw new Error("Not a participant in this thread");
    }

    await ctx.db.patch(participation._id, {
      lastReadAt: Date.now(),
    });

    return null;
  },
});