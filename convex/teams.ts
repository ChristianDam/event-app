import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { requireAuth } from "./lib/auth";

/**
 * Create a new team with the authenticated user as owner
 */
export const createTeam = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("teams"),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const userId = user._id;

    const now = Date.now();
    
    // Generate slug from name (basic implementation)
    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists
    const existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (existingTeam) {
      throw new Error("Team name already exists. Please choose a different name.");
    }

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      slug,
      description: args.description,
      ownerId: userId,
      createdAt: now,
    });

    // Add creator as team owner
    await ctx.db.insert("teamMembers", {
      teamId,
      userId,
      role: "owner",
      joinedAt: now,
    });

    // Create a default general discussion thread for the team
    const threadId = await ctx.db.insert("threads", {
      title: "General Discussion",
      description: "Team-wide discussions and announcements",
      threadType: "team",
      teamId,
      createdBy: userId,
      createdAt: now,
      isArchived: false,
    });

    // Add creator as admin participant in the thread
    await ctx.db.insert("threadParticipants", {
      threadId,
      userId,
      role: "admin",
      joinedAt: now,
    });

    // Send welcome message to the thread
    await ctx.db.insert("threadMessages", {
      threadId,
      authorId: undefined,
      content: `Welcome to ${args.name}! This is your team's general discussion thread.`,
      messageType: "system",
      createdAt: now,
    });

    // Set this as the user's current team
    await ctx.db.patch(userId, {
      currentTeamId: teamId,
    });

    return teamId;
  },
});

/**
 * Create default "My Team" for new users (internal)
 */
export const createDefaultTeam = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.id("teams"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Generate unique slug for "My Team"
    let slug = "my-team";
    let counter = 1;
    let existingTeam = await ctx.db
      .query("teams")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    
    while (existingTeam) {
      slug = `my-team-${counter}`;
      counter++;
      existingTeam = await ctx.db
        .query("teams")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
    }

    const teamId = await ctx.db.insert("teams", {
      name: "My Team",
      slug,
      ownerId: args.userId,
      createdAt: now,
    });

    // Add user as team owner
    await ctx.db.insert("teamMembers", {
      teamId,
      userId: args.userId,
      role: "owner",
      joinedAt: now,
    });

    // Create a default general discussion thread for the team
    const threadId = await ctx.db.insert("threads", {
      title: "General Discussion",
      description: "Team-wide discussions and announcements",
      threadType: "team",
      teamId,
      createdBy: args.userId,
      createdAt: now,
      isArchived: false,
    });

    // Add creator as admin participant in the thread
    await ctx.db.insert("threadParticipants", {
      threadId,
      userId: args.userId,
      role: "admin",
      joinedAt: now,
    });

    // Send welcome message to the thread
    await ctx.db.insert("threadMessages", {
      threadId,
      authorId: undefined,
      content: "Welcome to My Team! This is your team's general discussion thread.",
      messageType: "system",
      createdAt: now,
    });

    // Set this as the user's current team
    await ctx.db.patch(args.userId, {
      currentTeamId: teamId,
    });

    return teamId;
  },
});

/**
 * Get all teams the authenticated user belongs to
 */
export const getMyTeams = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("teams"),
    _creationTime: v.number(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    createdAt: v.number(),
    logo: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    memberCount: v.number(),
    isCurrentTeam: v.boolean(),
  })),
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q: any) => q.eq("userId", user._id))
      .collect();

    const teams = [];
    for (const membership of teamMemberships) {
      const team = await ctx.db.get(membership.teamId);
      if (!team) continue;

      // Count team members
      const memberCount = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q: any) => q.eq("teamId", team._id))
        .collect()
        .then(members => members.length);

      teams.push({
        ...team,
        role: membership.role,
        memberCount,
        isCurrentTeam: user.currentTeamId === team._id,
      });
    }

    return teams;
  },
});

/**
 * Get team details by ID (for members only)
 */
export const getTeam = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.union(
    v.object({
      _id: v.id("teams"),
      _creationTime: v.number(),
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      ownerId: v.id("users"),
      createdAt: v.number(),
      logo: v.optional(v.id("_storage")),
      primaryColor: v.optional(v.string()),
      userRole: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Check if user is a member of this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q: any) => 
        q.eq("teamId", args.teamId).eq("userId", user._id)
      )
      .first();

    if (!membership) {
      return null;
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return null;
    }

    return {
      ...team,
      userRole: membership.role,
    };
  },
});

/**
 * Update team details (owner and admin only)
 */
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has permission to update team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Insufficient permissions to update team");
    }

    const updates: Partial<{
      name: string;
      slug: string;
      description: string;
    }> = {};

    if (args.name !== undefined) {
      // Generate new slug if name is being updated
      const slug = args.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Check if new slug conflicts with existing teams
      const existingTeam = await ctx.db
        .query("teams")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (existingTeam && existingTeam._id !== args.teamId) {
        throw new Error("Team name already exists. Please choose a different name.");
      }

      updates.name = args.name;
      updates.slug = slug;
    }

    if (args.description !== undefined) {
      updates.description = args.description;
    }

    await ctx.db.patch(args.teamId, updates);
    return null;
  },
});

/**
 * Update team branding (logo and primary color) - owner and admin only
 */
export const updateTeamBranding = mutation({
  args: {
    teamId: v.id("teams"),
    logo: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has permission to update team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Insufficient permissions to update team branding");
    }

    const updates: Partial<{
      logo: Id<"_storage">;
      primaryColor: string;
    }> = {};

    if (args.logo !== undefined) {
      updates.logo = args.logo;
    }

    if (args.primaryColor !== undefined) {
      // Validate hex color format
      if (args.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(args.primaryColor)) {
        throw new Error("Primary color must be a valid hex color (e.g., #3b82f6)");
      }
      updates.primaryColor = args.primaryColor;
    }

    await ctx.db.patch(args.teamId, updates);
    return null;
  },
});

/**
 * Generate upload URL for team logo
 */
export const generateLogoUploadUrl = mutation({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has permission to update team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Insufficient permissions to upload team logo");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get team members
 */
export const getTeamMembers = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.array(v.object({
    _id: v.id("teamMembers"),
    _creationTime: v.number(),
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
    user: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
    }),
  })),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is a member of this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const membersWithUsers = [];
    for (const member of members) {
      const user = await ctx.db.get(member.userId);
      if (user) {
        membersWithUsers.push({
          ...member,
          user: {
            _id: user._id,
            _creationTime: user._creationTime,
            name: user.name,
            email: user.email,
            image: user.image,
          },
        });
      }
    }

    return membersWithUsers;
  },
});

/**
 * Remove a member from team (owner and admin only)
 */
export const removeMember = mutation({
  args: {
    teamId: v.id("teams"),
    memberUserId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has permission to remove members
    const userMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!userMembership || (userMembership.role !== "owner" && userMembership.role !== "admin")) {
      throw new Error("Insufficient permissions to remove team members");
    }

    // Find the member to remove
    const memberToRemove = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", args.memberUserId)
      )
      .first();

    if (!memberToRemove) {
      throw new Error("User is not a member of this team");
    }

    // Can't remove team owner
    if (memberToRemove.role === "owner") {
      throw new Error("Cannot remove team owner");
    }

    // Admin can't remove another admin (only owner can)
    if (userMembership.role === "admin" && memberToRemove.role === "admin") {
      throw new Error("Admins cannot remove other admins");
    }

    await ctx.db.delete(memberToRemove._id);
    return null;
  },
});

/**
 * Leave a team (can't leave if you're the owner)
 */
export const leaveTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    if (membership.role === "owner") {
      throw new Error("Team owners cannot leave their team. Transfer ownership first or delete the team.");
    }

    await ctx.db.delete(membership._id);
    return null;
  },
});

// ============================================================================
// INVITATION SYSTEM
// ============================================================================

/**
 * Generate a unique invitation token
 */
function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Invite someone to the team via email
 */
export const inviteByEmail = mutation({
  args: {
    teamId: v.id("teams"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  returns: v.id("teamInvitations"),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user has permission to invite
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Insufficient permissions to invite team members");
    }

    // Check if user is already a member
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      const existingMembership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) => 
          q.eq("teamId", args.teamId).eq("userId", existingUser._id)
        )
        .first();

      if (existingMembership) {
        throw new Error("User is already a member of this team");
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => 
        q.and(
          q.eq(q.field("teamId"), args.teamId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingInvitation) {
      throw new Error("Invitation already sent to this email");
    }

    // Create invitation
    const token = generateInvitationToken();
    const now = Date.now();
    const expiresAt = now + (7 * 24 * 60 * 60 * 1000); // 7 days

    const invitationId = await ctx.db.insert("teamInvitations", {
      teamId: args.teamId,
      invitedBy: userId,
      email: args.email,
      token,
      role: args.role,
      status: "pending",
      expiresAt,
      createdAt: now,
    });

    // Schedule email sending
    await ctx.scheduler.runAfter(0, internal.teamEmails.sendInvitationEmail, {
      invitationId,
    });
    
    console.log("📧 Team invitation created and email scheduled:", {
      invitationId,
      email: args.email,
      role: args.role,
    });

    return invitationId;
  },
});

/**
 * Get invitation details for email sending (internal query)
 */
export const getInvitationDetails = internalQuery({
  args: {
    invitationId: v.id("teamInvitations"),
  },
  returns: v.union(
    v.object({
      email: v.string(),
      teamName: v.string(),
      inviterName: v.optional(v.string()),
      role: v.union(v.literal("admin"), v.literal("member")),
      token: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.status !== "pending") {
      return null;
    }

    const team = await ctx.db.get(invitation.teamId);
    if (!team) {
      return null;
    }

    const inviter = await ctx.db.get(invitation.invitedBy);

    return {
      email: invitation.email,
      teamName: team.name,
      inviterName: inviter?.name,
      role: invitation.role,
      token: invitation.token,
    };
  },
});

/**
 * Accept an invitation via token
 */
export const acceptInvitation = mutation({
  args: {
    token: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    teamId: v.optional(v.id("teams")),
    teamName: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser?.email) {
      return {
        success: false,
        error: "User email not found",
      };
    }

    // Find invitation
    const invitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      return {
        success: false,
        error: "Invitation not found",
      };
    }

    // Check if invitation is valid
    if (invitation.status !== "pending") {
      return {
        success: false,
        error: "Invitation has already been used or expired",
      };
    }

    if (invitation.expiresAt < Date.now()) {
      // Mark as expired
      await ctx.db.patch(invitation._id, { status: "expired" });
      return {
        success: false,
        error: "Invitation has expired",
      };
    }

    // Check if email matches
    if (invitation.email !== currentUser.email) {
      return {
        success: false,
        error: "This invitation was sent to a different email address",
      };
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", invitation.teamId).eq("userId", userId)
      )
      .first();

    if (existingMembership) {
      // Mark invitation as accepted anyway
      await ctx.db.patch(invitation._id, { status: "accepted" });
      
      const team = await ctx.db.get(invitation.teamId);
      return {
        success: true,
        teamId: invitation.teamId,
        teamName: team?.name,
      };
    }

    // Add user to team
    const now = Date.now();
    await ctx.db.insert("teamMembers", {
      teamId: invitation.teamId,
      userId,
      role: invitation.role,
      joinedAt: now,
    });

    // Add user to all existing team threads as participant
    const teamThreads = await ctx.db
      .query("threads")
      .withIndex("by_team", (q) => q.eq("teamId", invitation.teamId))
      .filter((q) => q.eq(q.field("isArchived"), false))
      .collect();

    for (const thread of teamThreads) {
      await ctx.db.insert("threadParticipants", {
        threadId: thread._id,
        userId,
        role: "participant",
        joinedAt: now,
      });
    }

    // Mark invitation as accepted
    await ctx.db.patch(invitation._id, { status: "accepted" });

    // Set this team as current if user doesn't have a current team
    const userRecord = await ctx.db.get(userId);
    if (userRecord && !userRecord.currentTeamId) {
      await ctx.db.patch(userId, {
        currentTeamId: invitation.teamId,
      });
    }

    const team = await ctx.db.get(invitation.teamId);
    return {
      success: true,
      teamId: invitation.teamId,
      teamName: team?.name,
    };
  },
});

/**
 * Get pending invitations for a team
 */
export const getPendingInvitations = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.array(v.object({
    _id: v.id("teamInvitations"),
    _creationTime: v.number(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    invitedBy: v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
    createdAt: v.number(),
    expiresAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is a member of this team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", userId)
      )
      .first();

    if (!membership) {
      throw new Error("Not a member of this team");
    }

    const invitations = await ctx.db
      .query("teamInvitations")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const invitationsWithInviter = [];
    for (const invitation of invitations) {
      const inviter = await ctx.db.get(invitation.invitedBy);
      if (inviter) {
        invitationsWithInviter.push({
          _id: invitation._id,
          _creationTime: invitation._creationTime,
          email: invitation.email,
          role: invitation.role,
          invitedBy: {
            _id: inviter._id,
            _creationTime: inviter._creationTime,
            name: inviter.name,
            email: inviter.email,
          },
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
        });
      }
    }

    return invitationsWithInviter;
  },
});

/**
 * Cancel a pending invitation
 */
export const cancelInvitation = mutation({
  args: {
    invitationId: v.id("teamInvitations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Check if user has permission to cancel invitation
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", invitation.teamId).eq("userId", userId)
      )
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Insufficient permissions to cancel invitations");
    }

    if (invitation.status !== "pending") {
      throw new Error("Can only cancel pending invitations");
    }

    await ctx.db.delete(invitation._id);
    return null;
  },
});

/**
 * Get invitation by token (for invitation acceptance page)
 */
export const getInvitationByToken = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("teamInvitations"),
      _creationTime: v.number(),
      teamName: v.string(),
      teamDescription: v.optional(v.string()),
      inviterName: v.optional(v.string()),
      role: v.union(v.literal("admin"), v.literal("member")),
      email: v.string(),
      expiresAt: v.number(),
      isExpired: v.boolean(),
      isValid: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("teamInvitations")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation || invitation.status !== "pending") {
      return null;
    }

    const team = await ctx.db.get(invitation.teamId);
    if (!team) {
      return null;
    }

    const inviter = await ctx.db.get(invitation.invitedBy);
    const now = Date.now();
    const isExpired = invitation.expiresAt < now;

    // Note: Cannot auto-expire in a query - this should be handled in a mutation

    return {
      _id: invitation._id,
      _creationTime: invitation._creationTime,
      teamName: team.name,
      teamDescription: team.description,
      inviterName: inviter?.name,
      role: invitation.role,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
      isExpired,
      isValid: !isExpired,
    };
  },
});