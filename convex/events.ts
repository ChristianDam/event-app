import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
// import { internal } from "./_generated/api"; // Reserved for future use
import { Id } from "./_generated/dataModel";
import { requireAuth, getCurrentUserWithTeamReadOnly, requireTeam } from "./lib/auth";

/**
 * Validate email address using proper regex
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate timezone string against IANA timezone database
 */
function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (ex) {
    return false;
  }
}

/**
 * Generate a URL-friendly slug from event title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 60); // Limit length for URLs
}

/**
 * Generate a unique slug by appending numbers if needed
 */
async function generateUniqueSlug(ctx: any, title: string, excludeEventId?: Id<"events">): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existingEvent = await ctx.db
      .query("events")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .first();

    // If no existing event or it's the same event we're updating
    if (!existingEvent || (excludeEventId && existingEvent._id === excludeEventId)) {
      return slug;
    }

    // Generate new slug with counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Check if user is a member of the team
 */
async function checkTeamMembership(ctx: any, userId: Id<"users">, teamId: Id<"teams">) {
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q: any) => 
      q.eq("teamId", teamId).eq("userId", userId)
    )
    .first();

  return membership;
}

/**
 * Check if user can manage events for this team (owner, admin, or member)
 */
async function checkEventCreatePermission(ctx: any, userId: Id<"users">, teamId: Id<"teams">) {
  const membership = await checkTeamMembership(ctx, userId, teamId);
  if (!membership) {
    throw new Error("You must be a team member to create events");
  }
  return membership;
}

/**
 * Build standardized event response with team and organizer details
 */
async function buildEventResponse(ctx: any, event: any, userId?: Id<"users">) {
  // Get team details
  const team = await ctx.db.get(event.teamId);
  if (!team) {
    return null;
  }

  // Get organizer details
  const organizer = await ctx.db.get(event.organizerId);
  if (!organizer) {
    return null;
  }

  // Count registrations
  const registrationCount = await ctx.db
    .query("eventRegistrations")
    .withIndex("by_event", (q: any) => q.eq("eventId", event._id))
    .collect()
    .then((registrations: any) => registrations.length);

  // Check if user can manage this event
  let canManage = false;
  if (userId) {
    if (event.organizerId === userId) {
      canManage = true;
    } else {
      const membership = await checkTeamMembership(ctx, userId, event.teamId);
      if (membership && (membership.role === "admin" || membership.role === "owner")) {
        canManage = true;
      }
    }
  }

  return {
    ...event,
    team: {
      _id: team._id,
      name: team.name,
      slug: team.slug,
      logo: team.logo,
      primaryColor: team.primaryColor,
    },
    organizer: {
      _id: organizer._id,
      name: organizer.name,
      email: organizer.email,
    },
    registrationCount,
    canManage,
  };
}

/**
 * Check if user can edit/delete specific event (organizer, team admin, or owner)
 */
async function checkEventManagePermission(ctx: any, userId: Id<"users">, eventId: Id<"events">) {
  const event = await ctx.db.get(eventId);
  if (!event) {
    throw new Error("Event not found");
  }

  // Event organizer can always manage
  if (event.organizerId === userId) {
    return { event, canManage: true };
  }

  // Check if user is team admin or owner
  const membership = await checkTeamMembership(ctx, userId, event.teamId);
  if (!membership || membership.role === "member") {
    throw new Error("Insufficient permissions to manage this event");
  }

  return { event, canManage: true };
}

/**
 * Create a new event (team-aware - uses current team)
 */
export const createEventForCurrentTeam = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    venue: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.optional(v.string()),
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
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    eventImageId: v.optional(v.id("_storage")),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    const user = await requireTeam(ctx);
    const teamId = user.currentTeamId;
    const userId = user._id;

    // Validate input
    if (args.title.trim().length < 3) {
      throw new Error("Event title must be at least 3 characters long");
    }
    if (args.description.trim().length < 10) {
      throw new Error("Event description must be at least 10 characters long");
    }
    if (args.venue.trim().length < 3) {
      throw new Error("Venue must be at least 3 characters long");
    }
    if (args.endTime <= args.startTime) {
      throw new Error("End time must be after start time");
    }
    if (args.startTime <= Date.now()) {
      throw new Error("Event must be scheduled for the future");
    }
    if (args.maxCapacity && args.maxCapacity <= 0) {
      throw new Error("Maximum capacity must be a positive number");
    }
    if (args.timezone && !isValidTimezone(args.timezone)) {
      throw new Error("Invalid timezone. Please use a valid IANA timezone identifier");
    }

    // Check permissions (user is already verified to be a team member by requireTeam)
    await checkEventCreatePermission(ctx, userId, teamId);

    // Generate unique slug
    const slug = await generateUniqueSlug(ctx, args.title);

    const now = Date.now();

    const eventId = await ctx.db.insert("events", {
      title: args.title.trim(),
      slug,
      description: args.description.trim(),
      venue: args.venue.trim(),
      startTime: args.startTime,
      endTime: args.endTime,
      timezone: args.timezone || "Europe/Copenhagen",
      teamId,
      organizerId: userId,
      eventType: args.eventType,
      maxCapacity: args.maxCapacity,
      registrationDeadline: args.registrationDeadline,
      status: args.status || "draft",
      eventImageId: args.eventImageId,
      createdAt: now,
      updatedAt: now,
    });

    // Create a default discussion thread for the event
    const threadId = await ctx.db.insert("threads", {
      title: "Event Discussion",
      description: `Discussion thread for ${args.title.trim()}`,
      threadType: "event",
      eventId,
      createdBy: userId,
      createdAt: now,
      isArchived: false,
    });

    // Add organizer as admin participant
    await ctx.db.insert("threadParticipants", {
      threadId,
      userId,
      role: "admin",
      joinedAt: now,
    });

    // Add all team members as participants
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q: any) => q.eq("teamId", teamId))
      .collect();

    for (const member of teamMembers) {
      if (member.userId !== userId) { // Skip organizer, already added
        await ctx.db.insert("threadParticipants", {
          threadId,
          userId: member.userId,
          role: "participant",
          joinedAt: now,
        });
      }
    }

    // Send welcome message to the thread
    await ctx.db.insert("threadMessages", {
      threadId,
      authorId: undefined,
      content: `Welcome to the discussion thread for ${args.title.trim()}! Use this space to coordinate with attendees and organizers.`,
      messageType: "system",
      createdAt: now,
    });

    return eventId;
  },
});

/**
 * Create a new event (legacy - requires explicit teamId)
 */
export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    venue: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.optional(v.string()),
    teamId: v.id("teams"),
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
    status: v.optional(v.union(v.literal("draft"), v.literal("published"))),
    eventImageId: v.optional(v.id("_storage")),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const userId = user._id;

    // Validate input
    if (args.title.trim().length < 3) {
      throw new Error("Event title must be at least 3 characters long");
    }
    if (args.description.trim().length < 10) {
      throw new Error("Event description must be at least 10 characters long");
    }
    if (args.venue.trim().length < 3) {
      throw new Error("Venue must be at least 3 characters long");
    }
    if (args.endTime <= args.startTime) {
      throw new Error("End time must be after start time");
    }
    if (args.startTime <= Date.now()) {
      throw new Error("Event must be scheduled for the future");
    }
    if (args.maxCapacity && args.maxCapacity <= 0) {
      throw new Error("Maximum capacity must be a positive number");
    }
    if (args.timezone && !isValidTimezone(args.timezone)) {
      throw new Error("Invalid timezone. Please use a valid IANA timezone identifier");
    }

    // Check permissions
    await checkEventCreatePermission(ctx, userId, args.teamId);

    // Generate unique slug
    const slug = await generateUniqueSlug(ctx, args.title);

    const now = Date.now();

    const eventId = await ctx.db.insert("events", {
      title: args.title.trim(),
      slug,
      description: args.description.trim(),
      venue: args.venue.trim(),
      startTime: args.startTime,
      endTime: args.endTime,
      timezone: args.timezone || "Europe/Copenhagen",
      teamId: args.teamId,
      organizerId: userId,
      eventType: args.eventType,
      maxCapacity: args.maxCapacity,
      registrationDeadline: args.registrationDeadline,
      status: args.status || "draft",
      eventImageId: args.eventImageId,
      createdAt: now,
      updatedAt: now,
    });

    // Create a default discussion thread for the event
    const threadId = await ctx.db.insert("threads", {
      title: "Event Discussion",
      description: `Discussion thread for ${args.title.trim()}`,
      threadType: "event",
      eventId,
      createdBy: userId,
      createdAt: now,
      isArchived: false,
    });

    // Add organizer as admin participant
    await ctx.db.insert("threadParticipants", {
      threadId,
      userId,
      role: "admin",
      joinedAt: now,
    });

    // Add all team members as participants
    const teamMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    for (const member of teamMembers) {
      if (member.userId !== userId) { // Skip organizer, already added
        await ctx.db.insert("threadParticipants", {
          threadId,
          userId: member.userId,
          role: "participant",
          joinedAt: now,
        });
      }
    }

    // Send welcome message to the thread
    await ctx.db.insert("threadMessages", {
      threadId,
      authorId: undefined,
      content: `Welcome to the discussion thread for ${args.title.trim()}! Use this space to coordinate with attendees and organizers.`,
      messageType: "system",
      createdAt: now,
    });

    return eventId;
  },
});

/**
 * Update an existing event
 */
export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    venue: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    timezone: v.optional(v.string()),
    eventType: v.optional(v.union(
      v.literal("music"),
      v.literal("art"),
      v.literal("workshop"),
      v.literal("performance"),
      v.literal("exhibition"),
      v.literal("other")
    )),
    maxCapacity: v.optional(v.number()),
    registrationDeadline: v.optional(v.number()),
    status: v.optional(v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled"))),
    eventImageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check permissions and get event
    const { event } = await checkEventManagePermission(ctx, userId, args.eventId);

    // Build update object
    const updates: any = {
      updatedAt: Date.now(),
    };

    // Validate and add title update
    if (args.title !== undefined) {
      if (args.title.trim().length < 3) {
        throw new Error("Event title must be at least 3 characters long");
      }
      updates.title = args.title.trim();
      
      // Generate new slug if title changed
      if (args.title.trim() !== event.title) {
        updates.slug = await generateUniqueSlug(ctx, args.title, args.eventId);
      }
    }

    // Validate and add other updates
    if (args.description !== undefined) {
      if (args.description.trim().length < 10) {
        throw new Error("Event description must be at least 10 characters long");
      }
      updates.description = args.description.trim();
    }

    if (args.venue !== undefined) {
      if (args.venue.trim().length < 3) {
        throw new Error("Venue must be at least 3 characters long");
      }
      updates.venue = args.venue.trim();
    }

    if (args.startTime !== undefined) {
      if (args.startTime <= Date.now()) {
        throw new Error("Event must be scheduled for the future");
      }
      updates.startTime = args.startTime;
    }

    if (args.endTime !== undefined) {
      const startTime = args.startTime || event.startTime;
      if (args.endTime <= startTime) {
        throw new Error("End time must be after start time");
      }
      updates.endTime = args.endTime;
    }

    if (args.timezone !== undefined) {
      if (!isValidTimezone(args.timezone)) {
        throw new Error("Invalid timezone. Please use a valid IANA timezone identifier");
      }
      updates.timezone = args.timezone;
    }

    if (args.eventType !== undefined) {
      updates.eventType = args.eventType;
    }

    if (args.maxCapacity !== undefined) {
      if (args.maxCapacity <= 0) {
        throw new Error("Maximum capacity must be a positive number");
      }
      updates.maxCapacity = args.maxCapacity;
    }

    if (args.registrationDeadline !== undefined) {
      updates.registrationDeadline = args.registrationDeadline;
    }

    if (args.status !== undefined) {
      updates.status = args.status;
    }

    if (args.eventImageId !== undefined) {
      updates.eventImageId = args.eventImageId;
    }

    await ctx.db.patch(args.eventId, updates);
    return null;
  },
});

/**
 * Delete an event
 */
export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check permissions
    await checkEventManagePermission(ctx, userId, args.eventId);

    // Delete all registrations for this event
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const registration of registrations) {
      await ctx.db.delete(registration._id);
    }

    // Delete the event
    await ctx.db.delete(args.eventId);
    return null;
  },
});

/**
 * Get a single event by ID (public access)
 */
export const getEvent = query({
  args: {
    eventId: v.id("events"),
  },
  returns: v.union(
    v.object({
      _id: v.id("events"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      venue: v.string(),
      startTime: v.number(),
      endTime: v.number(),
      timezone: v.string(),
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
      status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")),
      eventImageId: v.optional(v.id("_storage")),
      socialImageId: v.optional(v.id("_storage")),
      createdAt: v.number(),
      updatedAt: v.number(),
      team: v.object({
        _id: v.id("teams"),
        name: v.string(),
        slug: v.string(),
        logo: v.optional(v.id("_storage")),
        primaryColor: v.optional(v.string()),
      }),
      organizer: v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
      }),
      registrationCount: v.number(),
      canManage: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return null;
    }

    // Only return published events for non-team members
    const userId = await auth.getUserId(ctx);
    let canManage = false;

    if (userId) {
      if (event.organizerId === userId) {
        canManage = true;
      } else {
        const membership = await checkTeamMembership(ctx, userId, event.teamId);
        if (membership && (membership.role === "admin" || membership.role === "owner")) {
          canManage = true;
        }
      }
    }

    // If user can't manage and event is not published, don't show it
    if (!canManage && event.status !== "published") {
      return null;
    }

    // Use the helper function to build the response
    return await buildEventResponse(ctx, event, userId || undefined);
  },
});

/**
 * Get an event by slug (public access)
 */
export const getEventBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("events"),
      _creationTime: v.number(),
      title: v.string(),
      slug: v.string(),
      description: v.string(),
      venue: v.string(),
      startTime: v.number(),
      endTime: v.number(),
      timezone: v.string(),
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
      status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")),
      eventImageId: v.optional(v.id("_storage")),
      socialImageId: v.optional(v.id("_storage")),
      createdAt: v.number(),
      updatedAt: v.number(),
      team: v.object({
        _id: v.id("teams"),
        name: v.string(),
        slug: v.string(),
        logo: v.optional(v.id("_storage")),
        primaryColor: v.optional(v.string()),
      }),
      organizer: v.object({
        _id: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
      }),
      registrationCount: v.number(),
      canManage: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();

    if (!event) {
      return null;
    }

    // Only return published events for non-team members
    const userId = await auth.getUserId(ctx);
    let canManage = false;

    if (userId) {
      if (event.organizerId === userId) {
        canManage = true;
      } else {
        const membership = await checkTeamMembership(ctx, userId, event.teamId);
        if (membership && (membership.role === "admin" || membership.role === "owner")) {
          canManage = true;
        }
      }
    }

    // If user can't manage and event is not published, don't show it
    if (!canManage && event.status !== "published") {
      return null;
    }

    // Use the helper function to build the response
    return await buildEventResponse(ctx, event, userId || undefined);
  },
});

/**
 * Get all events for the current team (team-aware pattern)
 */
export const getMyEvents = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("events"),
    _creationTime: v.number(),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    venue: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.string(),
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
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")),
    eventImageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
    organizer: v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    registrationCount: v.number(),
    canManage: v.boolean(),
  })),
  handler: async (ctx) => {
    const user = await getCurrentUserWithTeamReadOnly(ctx);
    if (!user) return [];

    const events = await ctx.db
      .query("events")
      .withIndex("by_team", (q: any) => q.eq("teamId", user.currentTeamId))
      .order("desc") // Most recent first
      .collect();

    // Get team membership for permission checking
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q: any) => 
        q.eq("teamId", user.currentTeamId).eq("userId", user._id)
      )
      .first();

    if (!membership) return [];

    // Batch fetch all unique organizer IDs to avoid N+1 query problem
    const organizerIds = [...new Set(events.map(event => event.organizerId))];
    const organizersMap = new Map();
    
    for (const organizerId of organizerIds) {
      const organizer = await ctx.db.get(organizerId);
      if (organizer) {
        organizersMap.set(organizerId, organizer);
      }
    }

    // Batch fetch registration counts for all events
    const registrationCountsMap = new Map();
    for (const event of events) {
      const registrations = await ctx.db
        .query("eventRegistrations")
        .withIndex("by_event", (q: any) => q.eq("eventId", event._id))
        .collect();
      registrationCountsMap.set(event._id, registrations.length);
    }

    const eventsWithDetails = [];
    for (const event of events) {
      const organizer = organizersMap.get(event.organizerId);
      if (!organizer) continue;

      // Check if user can manage this event
      const canManage = event.organizerId === user._id || 
                       membership.role === "admin" || 
                       membership.role === "owner";

      eventsWithDetails.push({
        _id: event._id,
        _creationTime: event._creationTime,
        title: event.title,
        slug: event.slug,
        description: event.description,
        venue: event.venue,
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: event.timezone,
        eventType: event.eventType,
        maxCapacity: event.maxCapacity,
        registrationDeadline: event.registrationDeadline,
        status: event.status,
        eventImageId: event.eventImageId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        organizer: {
          _id: organizer._id,
          name: organizer.name,
          email: organizer.email,
        },
        registrationCount: registrationCountsMap.get(event._id) || 0,
        canManage,
      });
    }

    return eventsWithDetails;
  },
});

/**
 * Get all events for a team (team members only)
 */
export const getTeamEvents = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.array(v.object({
    _id: v.id("events"),
    _creationTime: v.number(),
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    venue: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.string(),
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
    status: v.union(v.literal("draft"), v.literal("published"), v.literal("cancelled")),
    eventImageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
    updatedAt: v.number(),
    organizer: v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    registrationCount: v.number(),
    canManage: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check team membership
    const membership = await checkTeamMembership(ctx, userId, args.teamId);
    if (!membership) {
      throw new Error("Not a member of this team");
    }

    const events = await ctx.db
      .query("events")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .order("desc") // Most recent first
      .collect();

    // Batch fetch all unique organizer IDs to avoid N+1 query problem
    const organizerIds = [...new Set(events.map(event => event.organizerId))];
    const organizersMap = new Map();
    
    for (const organizerId of organizerIds) {
      const organizer = await ctx.db.get(organizerId);
      if (organizer) {
        organizersMap.set(organizerId, organizer);
      }
    }

    // Batch fetch registration counts for all events
    const registrationCountsMap = new Map();
    for (const event of events) {
      const registrations = await ctx.db
        .query("eventRegistrations")
        .withIndex("by_event", (q) => q.eq("eventId", event._id))
        .collect();
      registrationCountsMap.set(event._id, registrations.length);
    }

    const eventsWithDetails = [];
    for (const event of events) {
      const organizer = organizersMap.get(event.organizerId);
      if (!organizer) continue;

      // Check if user can manage this event
      const canManage = event.organizerId === userId || 
                       membership.role === "admin" || 
                       membership.role === "owner";

      eventsWithDetails.push({
        _id: event._id,
        _creationTime: event._creationTime,
        title: event.title,
        slug: event.slug,
        description: event.description,
        venue: event.venue,
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: event.timezone,
        eventType: event.eventType,
        maxCapacity: event.maxCapacity,
        registrationDeadline: event.registrationDeadline,
        status: event.status,
        eventImageId: event.eventImageId,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        organizer: {
          _id: organizer._id,
          name: organizer.name,
          email: organizer.email,
        },
        registrationCount: registrationCountsMap.get(event._id) || 0,
        canManage,
      });
    }

    return eventsWithDetails;
  },
});

/**
 * Generate upload URL for event image
 */
export const generateEventImageUploadUrl = mutation({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user can create events for this team
    await checkEventCreatePermission(ctx, userId, args.teamId);

    return await ctx.storage.generateUploadUrl();
  },
});

// ============================================================================
// REGISTRATION SYSTEM
// ============================================================================

/**
 * Register for an event (public access - no authentication required)
 */
export const registerForEvent = mutation({
  args: {
    eventId: v.id("events"),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    attendeePhone: v.optional(v.string()),
  },
  returns: v.id("eventRegistrations"),
  handler: async (ctx, args) => {
    // Validate input
    if (args.attendeeName.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }
    if (!isValidEmail(args.attendeeEmail)) {
      throw new Error("Please provide a valid email address");
    }

    // Get event details
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Only allow registration for published events
    if (event.status !== "published") {
      throw new Error("This event is not accepting registrations");
    }

    // Check if event is in the future
    if (event.startTime <= Date.now()) {
      throw new Error("Cannot register for events that have already started");
    }

    // Check registration deadline
    if (event.registrationDeadline && event.registrationDeadline <= Date.now()) {
      throw new Error("Registration deadline has passed");
    }

    // Check for existing registration with same email
    const existingRegistration = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .filter((q) => q.eq(q.field("attendeeEmail"), args.attendeeEmail.toLowerCase().trim()))
      .first();

    if (existingRegistration) {
      throw new Error("This email address is already registered for this event");
    }

    const now = Date.now();

    // Check capacity limit with atomic operation to prevent race condition
    if (event.maxCapacity) {
      const currentRegistrations = await ctx.db
        .query("eventRegistrations")
        .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
        .collect();

      if (currentRegistrations.length >= event.maxCapacity) {
        throw new Error("This event has reached maximum capacity");
      }

      // Double-check capacity after creating registration to handle race conditions
      try {
        const registrationId = await ctx.db.insert("eventRegistrations", {
          eventId: args.eventId,
          attendeeName: args.attendeeName.trim(),
          attendeeEmail: args.attendeeEmail.toLowerCase().trim(),
          attendeePhone: args.attendeePhone?.trim(),
          registeredAt: now,
          confirmationSent: false,
        });

        // Verify capacity wasn't exceeded after insertion
        const finalRegistrations = await ctx.db
          .query("eventRegistrations")
          .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
          .collect();

        if (finalRegistrations.length > event.maxCapacity) {
          // If we exceeded capacity due to race condition, remove this registration
          await ctx.db.delete(registrationId);
          throw new Error("This event has reached maximum capacity");
        }

        return registrationId;
      } catch {
        // If insertion failed, re-throw the original error
        throw new Error("Registration failed");
      }
    } else {
      // No capacity limit - proceed with normal insertion
      const registrationId = await ctx.db.insert("eventRegistrations", {
        eventId: args.eventId,
        attendeeName: args.attendeeName.trim(),
        attendeeEmail: args.attendeeEmail.toLowerCase().trim(),
        attendeePhone: args.attendeePhone?.trim(),
        registeredAt: now,
        confirmationSent: false,
      });

      // TODO: Schedule confirmation email
      // await ctx.scheduler.runAfter(0, internal.eventEmails.sendRegistrationConfirmation, {
      //   registrationId,
      // });

      return registrationId;
    }
  },
});

/**
 * Get event registrations (organizers and team admins only)
 */
export const getEventRegistrations = query({
  args: {
    eventId: v.id("events"),
  },
  returns: v.array(v.object({
    _id: v.id("eventRegistrations"),
    _creationTime: v.number(),
    eventId: v.id("events"),
    attendeeName: v.string(),
    attendeeEmail: v.string(),
    attendeePhone: v.optional(v.string()),
    registeredAt: v.number(),
    confirmationSent: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check permissions - must be event organizer or team admin
    await checkEventManagePermission(ctx, userId, args.eventId);

    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .order("desc") // Most recent first
      .collect();

    return registrations;
  },
});

/**
 * Get registration count for an event (public access)
 */
export const getEventRegistrationCount = query({
  args: {
    eventId: v.id("events"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    return registrations.length;
  },
});

/**
 * Remove a registration (organizers only - for spam/inappropriate registrations)
 */
export const removeRegistration = mutation({
  args: {
    registrationId: v.id("eventRegistrations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const registration = await ctx.db.get(args.registrationId);
    if (!registration) {
      throw new Error("Registration not found");
    }

    // Check permissions
    await checkEventManagePermission(ctx, userId, registration.eventId);

    await ctx.db.delete(args.registrationId);
    return null;
  },
});