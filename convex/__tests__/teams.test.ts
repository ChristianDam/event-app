// ABOUTME: Backend tests for team-related Convex functions
// ABOUTME: Tests team CRUD operations, permissions, and slug generation

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

describe("teams backend", () => {
  it("should create team with proper slug generation and membership", async () => {
    const t = convexTest(schema);

    // Create a test user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Team Owner",
        email: "owner@example.com",
      });
    });

    // Test team creation
    const teamId = await t.run(async (ctx) => {
      // Simulate authenticated user
      return await ctx.runMutation(api.teams.create, {
        name: "My Awesome Team!",
        description: "A great team for testing",
      });
    }, { user: { tokenIdentifier: "test-user", subject: userId } });

    expect(teamId).toBeDefined();

    // Verify team was created with proper slug
    const team = await t.run(async (ctx) => {
      return await ctx.db.get(teamId);
    });

    expect(team?.name).toBe("My Awesome Team!");
    expect(team?.slug).toBe("my-awesome-team");
    expect(team?.ownerId).toBe(userId);

    // Verify team membership was created
    const membership = await t.run(async (ctx) => {
      return await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) => q.eq("teamId", teamId).eq("userId", userId))
        .unique();
    });

    expect(membership?.role).toBe("owner");
  });

  it("should handle team queries with permissions", async () => {
    const t = convexTest(schema);

    // Create users
    const ownerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Owner",
        email: "owner@test.com",
      });
    });

    const memberId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Member",
        email: "member@test.com",
      });
    });

    // Create team and membership
    const teamId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("teams", {
        name: "Test Team",
        slug: "test-team", 
        ownerId: ownerId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: id,
        userId: ownerId,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: id,
        userId: memberId,
        role: "member",
        joinedAt: Date.now(),
      });

      return id;
    });

    // Test team query as owner
    const teamAsOwner = await t.run(async (ctx) => {
      return await ctx.runQuery(api.teams.get, { teamId });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    expect(teamAsOwner?.name).toBe("Test Team");

    // Test team query as member
    const teamAsMember = await t.run(async (ctx) => {
      return await ctx.runQuery(api.teams.get, { teamId });
    }, { user: { tokenIdentifier: "member", subject: memberId } });

    expect(teamAsMember?.name).toBe("Test Team");
  });

  it("should handle team updates and permission checks", async () => {
    const t = convexTest(schema);

    // Setup team with owner
    const ownerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Team Owner",
        email: "owner@test.com",
      });
    });

    const teamId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("teams", {
        name: "Original Name",
        slug: "original-name",
        ownerId: ownerId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: id,
        userId: ownerId,
        role: "owner",
        joinedAt: Date.now(),
      });

      return id;
    });

    // Test team update
    await t.run(async (ctx) => {
      await ctx.runMutation(api.teams.update, {
        teamId,
        name: "Updated Team Name",
        description: "Updated description",
        primaryColor: "#ff6b35",
      });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    // Verify update
    const updatedTeam = await t.run(async (ctx) => {
      return await ctx.db.get(teamId);
    });

    expect(updatedTeam?.name).toBe("Updated Team Name");
    expect(updatedTeam?.description).toBe("Updated description");
    expect(updatedTeam?.primaryColor).toBe("#ff6b35");
  });

  it("should handle team member management", async () => {
    const t = convexTest(schema);

    // Create users
    const ownerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Owner",
        email: "owner@test.com",
      });
    });

    const newMemberId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "New Member",
        email: "newmember@test.com",
      });
    });

    // Create team
    const teamId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("teams", {
        name: "Test Team",
        slug: "test-team",
        ownerId: ownerId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: id,
        userId: ownerId,
        role: "owner",
        joinedAt: Date.now(),
      });

      return id;
    });

    // Add new member
    await t.run(async (ctx) => {
      await ctx.db.insert("teamMembers", {
        teamId,
        userId: newMemberId,
        role: "member",
        joinedAt: Date.now(),
      });
    });

    // Test getting team members
    const members = await t.run(async (ctx) => {
      return await ctx.runQuery(api.teams.getMembers, { teamId });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    expect(members).toHaveLength(2);
    expect(members?.some(m => m.role === "owner")).toBe(true);
    expect(members?.some(m => m.role === "member")).toBe(true);
  });

  it("should validate team input and prevent XSS", async () => {
    const t = convexTest(schema);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });
    });

    // Test input validation
    await expect(
      t.run(async (ctx) => {
        return await ctx.runMutation(api.teams.create, {
          name: "", // Empty name should fail
          description: "Valid description",
        });
      }, { user: { tokenIdentifier: "test", subject: userId } })
    ).rejects.toThrow();

    // Test XSS prevention in name
    await expect(
      t.run(async (ctx) => {
        return await ctx.runMutation(api.teams.create, {
          name: "<script>alert('xss')</script>",
          description: "Description",
        });
      }, { user: { tokenIdentifier: "test", subject: userId } })
    ).rejects.toThrow();
  });
});