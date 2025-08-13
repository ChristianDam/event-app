import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

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
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

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

    return teamId;
  },
});

/**
 * Create default "My Team" for new users
 */
export const createDefaultTeam = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.id("teams"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Generate unique slug for "My Team"
    let slug = "my-team";
    let counter = 1;
    
    while (true) {
      const existingTeam = await ctx.db
        .query("teams")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();
      
      if (!existingTeam) break;
      
      slug = `my-team-${counter}`;
      counter++;
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
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    createdAt: v.number(),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    memberCount: v.number(),
  })),
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const teams = [];
    for (const membership of teamMemberships) {
      const team = await ctx.db.get(membership.teamId);
      if (!team) continue;

      // Count team members
      const memberCount = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .collect()
        .then(members => members.length);

      teams.push({
        ...team,
        role: membership.role,
        memberCount,
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
      name: v.string(),
      slug: v.string(),
      description: v.optional(v.string()),
      ownerId: v.id("users"),
      createdAt: v.number(),
      userRole: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    }),
    v.null()
  ),
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
 * Get team members
 */
export const getTeamMembers = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.array(v.object({
    _id: v.id("teamMembers"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
    user: v.object({
      _id: v.id("users"),
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