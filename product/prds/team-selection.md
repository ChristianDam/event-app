Team-Aware Convex Query Pattern
Overview
Implement a pattern where user's currently selected team is stored in their database record, and all team-scoped queries automatically filter by the user's active team without requiring explicit team ID parameters.
Core Architecture
Database Schema

users table includes currentTeamId field storing the user's selected team
teamMembers junction table links users to teams they belong to
All team-scoped resources (projects, tasks, etc.) have teamId foreign key
Essential indexes: by_email on users, by_team on all team-scoped tables

Authentication & User Context Helpers
Create reusable helper functions in convex/lib/auth.js:
javascript// Core helpers that eliminate repetitive auth/user lookup code
export async function getCurrentUser(ctx) // Returns user or null
export async function getCurrentUserWithTeam(ctx) // Returns user with team or null  
export async function requireAuth(ctx) // Throws if not authenticated
export async function requireTeam(ctx) // Throws if no team selected
Query Pattern
Every team-scoped query follows this pattern:

Call helper to get current user with team
Return empty result if no user/team
Query resources filtered by user.currentTeamId
No team ID parameters needed in query args

Team Switching

Mutation validates user membership before switching teams
Updates currentTeamId in user record
All queries automatically re-run with new team context via Convex reactivity

Implementation Benefits
Developer Experience:

Clean query signatures without team ID pollution
Automatic team filtering - impossible to accidentally show wrong team's data
Team switches update entire app automatically
Single source of truth for current team selection

Performance:

User lookup adds ~1ms with proper indexing
Automatic query caching eliminates redundant user lookups
Results cache at team level for efficiency

Security:

Team membership validation in switching logic
Queries naturally isolated to user's accessible teams
No risk of team ID injection or cross-team data leakage

Example Implementation
javascript// Simple query becomes:
export const getMyProjects = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserWithTeam(ctx);
    if (!user) return [];
    
    return ctx.db.query("projects")
      .withIndex("by_team", q => q.eq("teamId", user.currentTeamId))
      .collect();
  },
});

// Team switching:
export const setCurrentTeam = mutation({
  args: { teamId: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    // Validate membership then update currentTeamId
  },
});
Key Files to Create/Modify

convex/schema.js - Add team-related tables and indexes
convex/lib/auth.js - Authentication helper functions
convex/users.js - User queries and team switching mutation
Team-scoped query files - Use helpers for automatic team filtering
React components - Use team switching mutation and team-aware queries

This pattern transforms team-scoped applications from manually passing team IDs everywhere to having team context automatically available in every query.