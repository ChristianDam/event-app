import { QueryCtx, MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id, Doc } from "../_generated/dataModel";

type DatabaseContext = QueryCtx | MutationCtx;

/**
 * Get the current authenticated user, or null if not authenticated
 */
export async function getCurrentUser(ctx: DatabaseContext): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  
  return await ctx.db.get(userId);
}

/**
 * Get the current authenticated user with their selected team context
 * Returns null if not authenticated or no team selected
 */
export async function getCurrentUserWithTeam(ctx: MutationCtx): Promise<(Doc<"users"> & { currentTeamId: Id<"teams"> }) | null> {
  const user = await getCurrentUser(ctx);
  if (!user || !user.currentTeamId) return null;
  
  // Verify user is still a member of their selected team
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q: any) => 
      q.eq("teamId", user.currentTeamId!).eq("userId", user._id)
    )
    .first();
    
  if (!membership) {
    // User is no longer a member of their selected team, clear it
    await ctx.db.patch(user._id, { currentTeamId: undefined });
    return null;
  }
  
  return {
    ...user,
    currentTeamId: user.currentTeamId,
  };
}

/**
 * Get the current authenticated user with their selected team context (read-only)
 * Returns null if not authenticated or no team selected
 */
export async function getCurrentUserWithTeamReadOnly(ctx: DatabaseContext): Promise<(Doc<"users"> & { currentTeamId: Id<"teams"> }) | null> {
  const user = await getCurrentUser(ctx);
  if (!user || !user.currentTeamId) return null;
  
  // Verify user is still a member of their selected team
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q: any) => 
      q.eq("teamId", user.currentTeamId!).eq("userId", user._id)
    )
    .first();
    
  if (!membership) {
    // User is no longer a member - return null but don't modify in query context
    return null;
  }
  
  return {
    ...user,
    currentTeamId: user.currentTeamId,
  };
}

/**
 * Require authentication - throws if not authenticated
 * @returns The authenticated user
 */
export async function requireAuth(ctx: DatabaseContext): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

/**
 * Require team selection - throws if not authenticated or no team selected
 * @returns The authenticated user with team context
 */
export async function requireTeam(ctx: MutationCtx): Promise<Doc<"users"> & { currentTeamId: Id<"teams"> }> {
  const userWithTeam = await getCurrentUserWithTeam(ctx);
  if (!userWithTeam) {
    throw new Error("No team selected. Please select a team first.");
  }
  return userWithTeam;
}

/**
 * Check if user has permission for a specific role in their current team
 * @param ctx Convex context
 * @param requiredRole Minimum role required ("member", "admin", "owner")
 * @returns true if user has sufficient permissions
 */
export async function hasTeamPermission(
  ctx: DatabaseContext, 
  requiredRole: "member" | "admin" | "owner"
): Promise<boolean> {
  const user = await getCurrentUserWithTeamReadOnly(ctx);
  if (!user) return false;
  
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q: any) => 
      q.eq("teamId", user.currentTeamId).eq("userId", user._id)
    )
    .first();
    
  if (!membership) return false;
  
  const roleHierarchy: Record<string, number> = { member: 1, admin: 2, owner: 3 };
  return roleHierarchy[membership.role] >= roleHierarchy[requiredRole];
}

/**
 * Require specific team permission - throws if insufficient permissions
 * @param ctx Convex context
 * @param requiredRole Minimum role required
 * @returns The team membership record
 */
export async function requireTeamPermission(
  ctx: MutationCtx,
  requiredRole: "member" | "admin" | "owner"
): Promise<Doc<"teamMembers">> {
  const user = await requireTeam(ctx);
  
  const membership = await ctx.db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q: any) => 
      q.eq("teamId", user.currentTeamId).eq("userId", user._id)
    )
    .first();
    
  if (!membership) {
    throw new Error("Not a member of the selected team");
  }
  
  const roleHierarchy: Record<string, number> = { member: 1, admin: 2, owner: 3 };
  if (roleHierarchy[membership.role] < roleHierarchy[requiredRole]) {
    throw new Error(`Insufficient permissions. ${requiredRole} role required.`);
  }
  
  return membership;
}