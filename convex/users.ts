import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { requireAuth, getCurrentUserWithTeamReadOnly } from "./lib/auth";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    return userId !== null ? ctx.db.get(userId) : null;
  },
});

/**
 * Get the current user's selected team information
 */
export const getCurrentTeam = query({
  args: {},
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
      logoUrl: v.optional(v.string()),
      primaryColor: v.optional(v.string()),
      userRole: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await getCurrentUserWithTeamReadOnly(ctx);
    if (!user) {
      return null;
    }

    // Check if user is still a member of their selected team
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q: any) => 
        q.eq("teamId", user.currentTeamId).eq("userId", user._id)
      )
      .first();

    if (!membership) {
      // User is no longer a member - return null (can't patch in query)
      return null;
    }

    const team = await ctx.db.get(user.currentTeamId);
    if (!team) {
      // Team no longer exists - return null (can't patch in query)
      return null;
    }

    return {
      ...team,
      logoUrl: team.logo ? (await ctx.storage.getUrl(team.logo)) ?? undefined : undefined,
      userRole: membership.role,
    };
  },
});

/**
 * Set the current team for the authenticated user
 */
export const setCurrentTeam = mutation({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Input validation
    if (!args.teamId) {
      throw new Error("Team ID is required");
    }

    // Verify team exists first (more efficient than membership check)
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Verify user is a member of the team they want to select
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) => 
        q.eq("teamId", args.teamId).eq("userId", user._id)
      )
      .first();

    if (!membership) {
      throw new Error("You are not a member of this team");
    }

    // Only update if different from current team (optimization)
    if (user.currentTeamId !== args.teamId) {
      await ctx.db.patch(user._id, { 
        currentTeamId: args.teamId 
      });
    }

    return null;
  },
});

/**
 * Clear the current team selection (set to no team)
 */
export const clearCurrentTeam = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAuth(ctx);

    await ctx.db.patch(user._id, { 
      currentTeamId: undefined 
    });

    return null;
  },
});

/**
 * Update user profile information
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    favoriteColor: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    // Prepare update data - only include fields that are provided
    const updateData: any = {};
    
    if (args.name !== undefined) {
      updateData.name = args.name;
    }
    
    if (args.email !== undefined) {
      // Basic email validation
      if (args.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.email)) {
        throw new Error("Invalid email format");
      }
      updateData.email = args.email;
      // Reset email verification when email changes
      if (args.email !== user.email) {
        updateData.emailVerificationTime = undefined;
      }
    }
    
    if (args.phone !== undefined) {
      updateData.phone = args.phone;
      // Reset phone verification when phone changes
      if (args.phone !== user.phone) {
        updateData.phoneVerificationTime = undefined;
      }
    }
    
    if (args.favoriteColor !== undefined) {
      updateData.favoriteColor = args.favoriteColor;
    }

    // Only update if there are changes to make
    if (Object.keys(updateData).length > 0) {
      await ctx.db.patch(user._id, updateData);
    }

    return null;
  },
});

/**
 * Update user avatar image
 */
export const updateAvatar = mutation({
  args: {
    imageId: v.optional(v.id("_storage")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);

    if (args.imageId) {
      const imageUrl = await ctx.storage.getUrl(args.imageId);
      await ctx.db.patch(user._id, { 
        image: imageUrl || undefined
      });
    } else {
      await ctx.db.patch(user._id, { 
        image: undefined
      });
    }

    return null;
  },
});
