// ABOUTME: Backend tests for authentication and user management
// ABOUTME: Tests user creation, team switching, and permission validation

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

describe("authentication backend", () => {
  it("should create user and handle team selection", async () => {
    const t = convexTest(schema);

    // Create user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });
    });

    // Create team
    const teamId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("teams", {
        name: "User's Team",
        slug: "users-team",
        ownerId: userId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: id,
        userId,
        role: "owner",
        joinedAt: Date.now(),
      });

      return id;
    });

    // Test user query
    const user = await t.run(async (ctx) => {
      return await ctx.runQuery(api.users.current, {});
    }, { user: { tokenIdentifier: "test-user", subject: userId } });

    expect(user?.name).toBe("Test User");
    expect(user?.email).toBe("test@example.com");

    // Test team switching
    await t.run(async (ctx) => {
      await ctx.runMutation(api.users.switchTeam, { teamId });
    }, { user: { tokenIdentifier: "test-user", subject: userId } });

    // Verify team was switched
    const updatedUser = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(updatedUser?.currentTeamId).toBe(teamId);
  });

  it("should handle team permissions correctly", async () => {
    const t = convexTest(schema);

    // Create owner and member users
    const ownerId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Team Owner",
        email: "owner@test.com",
      });
    });

    const memberId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Team Member",
        email: "member@test.com",
      });
    });

    const guestId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Non Member",
        email: "guest@test.com",
      });
    });

    // Create team with owner and member
    const teamId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("teams", {
        name: "Permission Test Team",
        slug: "permission-test-team",
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

    // Set current teams
    await t.run(async (ctx) => {
      await ctx.db.patch(ownerId, { currentTeamId: teamId });
      await ctx.db.patch(memberId, { currentTeamId: teamId });
    });

    // Owner should be able to access team
    const teamAsOwner = await t.run(async (ctx) => {
      return await ctx.runQuery(api.teams.get, { teamId });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    expect(teamAsOwner?.name).toBe("Permission Test Team");

    // Member should be able to access team
    const teamAsMember = await t.run(async (ctx) => {
      return await ctx.runQuery(api.teams.get, { teamId });
    }, { user: { tokenIdentifier: "member", subject: memberId } });

    expect(teamAsMember?.name).toBe("Permission Test Team");

    // Non-member should not be able to access team
    await expect(
      t.run(async (ctx) => {
        return await ctx.runQuery(api.teams.get, { teamId });
      }, { user: { tokenIdentifier: "guest", subject: guestId } })
    ).rejects.toThrow();
  });

  it("should handle user profile updates", async () => {
    const t = convexTest(schema);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Original Name",
        email: "original@test.com",
      });
    });

    // Update user profile
    await t.run(async (ctx) => {
      await ctx.runMutation(api.users.update, {
        name: "Updated Name",
        phone: "+1234567890",
      });
    }, { user: { tokenIdentifier: "test-user", subject: userId } });

    // Verify update
    const updatedUser = await t.run(async (ctx) => {
      return await ctx.db.get(userId);
    });

    expect(updatedUser?.name).toBe("Updated Name");
    expect(updatedUser?.phone).toBe("+1234567890");
    expect(updatedUser?.email).toBe("original@test.com"); // Should not change
  });

  it("should validate email and phone formats", async () => {
    const t = convexTest(schema);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });
    });

    // Test invalid email update
    await expect(
      t.run(async (ctx) => {
        await ctx.runMutation(api.users.update, {
          name: "Test User",
          email: "invalid-email", // Invalid format
        });
      }, { user: { tokenIdentifier: "test-user", subject: userId } })
    ).rejects.toThrow();

    // Test invalid phone update
    await expect(
      t.run(async (ctx) => {
        await ctx.runMutation(api.users.update, {
          name: "Test User",
          phone: "invalid-phone", // Invalid format
        });
      }, { user: { tokenIdentifier: "test-user", subject: userId } })
    ).rejects.toThrow();
  });

  it("should handle team membership queries", async () => {
    const t = convexTest(schema);

    // Create user and multiple teams
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Multi Team User",
        email: "multiuser@test.com",
      });
    });

    const team1Id = await t.run(async (ctx) => {
      const id = await ctx.db.insert("teams", {
        name: "Team 1",
        slug: "team-1",
        ownerId: userId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: id,
        userId,
        role: "owner",
        joinedAt: Date.now(),
      });

      return id;
    });

    const team2Id = await t.run(async (ctx) => {
      const otherId = await ctx.db.insert("users", {
        name: "Other Owner",
        email: "other@test.com",
      });

      const id = await ctx.db.insert("teams", {
        name: "Team 2",
        slug: "team-2", 
        ownerId: otherId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: id,
        userId: otherId,
        role: "owner",
        joinedAt: Date.now(),
      });

      // Add user as member
      await ctx.db.insert("teamMembers", {
        teamId: id,
        userId,
        role: "member",
        joinedAt: Date.now(),
      });

      return id;
    });

    // Get user's teams
    const userTeams = await t.run(async (ctx) => {
      return await ctx.runQuery(api.users.getTeams, {});
    }, { user: { tokenIdentifier: "multi-user", subject: userId } });

    expect(userTeams).toHaveLength(2);
    
    const teamIds = userTeams?.map(t => t.teamId);
    expect(teamIds).toContain(team1Id);
    expect(teamIds).toContain(team2Id);

    // Check roles
    const ownerTeam = userTeams?.find(t => t.teamId === team1Id);
    const memberTeam = userTeams?.find(t => t.teamId === team2Id);
    
    expect(ownerTeam?.role).toBe("owner");
    expect(memberTeam?.role).toBe("member");
  });

  it("should prevent unauthorized access to user data", async () => {
    const t = convexTest(schema);

    // Create two users
    const user1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "User 1",
        email: "user1@test.com",
      });
    });

    const user2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "User 2",
        email: "user2@test.com",
      });
    });

    // User 1 should not be able to update User 2's profile
    await expect(
      t.run(async (ctx) => {
        // This would try to update the authenticated user's profile
        // but since we're authenticated as user1, it shouldn't affect user2
        await ctx.runMutation(api.users.update, {
          name: "Hacked Name",
        });
      }, { user: { tokenIdentifier: "user1", subject: user1Id } })
    ).not.toThrow(); // This should succeed but only update user1

    // Verify user2 was not affected
    const user2 = await t.run(async (ctx) => {
      return await ctx.db.get(user2Id);
    });

    expect(user2?.name).toBe("User 2"); // Should remain unchanged
  });

  it("should handle anonymous user access correctly", async () => {
    const t = convexTest(schema);

    // Test that anonymous users cannot access protected resources
    await expect(
      t.run(async (ctx) => {
        return await ctx.runQuery(api.users.current, {});
      }) // No user authentication
    ).resolves.toBeNull(); // Should return null for anonymous users

    // Test that anonymous users cannot create teams
    await expect(
      t.run(async (ctx) => {
        return await ctx.runMutation(api.teams.create, {
          name: "Anonymous Team",
          description: "Should not work",
        });
      })
    ).rejects.toThrow();
  });
});