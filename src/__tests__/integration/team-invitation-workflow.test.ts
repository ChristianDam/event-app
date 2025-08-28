// ABOUTME: Integration tests for team invitation workflows
// ABOUTME: Tests end-to-end invitation creation, acceptance, and team membership flows

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../../../convex/_generated/api";
import schema from "../../../convex/schema";

describe("Team Invitation Workflow", () => {
  it("should complete full invitation lifecycle: invite -> accept -> team membership", async () => {
    const t = convexTest(schema);

    // Step 1: Setup team owner
    const { ownerId, teamId } = await t.run(async (ctx) => {
      const ownerId = await ctx.db.insert("users", {
        name: "Team Owner",
        email: "owner@example.com",
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Growing Team",
        slug: "growing-team",
        ownerId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId: ownerId,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.patch(ownerId, { currentTeamId: teamId });

      return { ownerId, teamId };
    });

    // Step 2: Owner creates team invitation
    const invitationId = await t.run(async (ctx) => {
      return await ctx.runMutation(api.teams.createInvitation, {
        email: "newmember@example.com",
        role: "member",
      });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    // Verify invitation was created
    const invitation = await t.run(async (ctx) => {
      return await ctx.db.get(invitationId);
    });

    expect(invitation?.email).toBe("newmember@example.com");
    expect(invitation?.teamId).toBe(teamId);
    expect(invitation?.role).toBe("member");
    expect(invitation?.status).toBe("pending");
    expect(invitation?.invitedBy).toBe(ownerId);
    expect(invitation?.token).toBeDefined();

    // Step 3: Create new user who will accept invitation
    const newUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "New Member",
        email: "newmember@example.com",
      });
    });

    // Step 4: Accept invitation (simulate user accepting via token)
    await t.run(async (ctx) => {
      return await ctx.runMutation(api.teams.acceptInvitation, {
        token: invitation!.token,
      });
    }, { user: { tokenIdentifier: "newmember", subject: newUserId } });

    // Step 5: Verify invitation status changed
    const acceptedInvitation = await t.run(async (ctx) => {
      return await ctx.db.get(invitationId);
    });

    expect(acceptedInvitation?.status).toBe("accepted");
    expect(acceptedInvitation?.acceptedBy).toBe(newUserId);
    expect(acceptedInvitation?.acceptedAt).toBeDefined();

    // Step 6: Verify team membership was created
    const membership = await t.run(async (ctx) => {
      return await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) => 
          q.eq("teamId", teamId).eq("userId", newUserId)
        )
        .unique();
    });

    expect(membership?.teamId).toBe(teamId);
    expect(membership?.userId).toBe(newUserId);
    expect(membership?.role).toBe("member");

    // Step 7: Verify user's currentTeamId was updated
    const updatedUser = await t.run(async (ctx) => {
      return await ctx.db.get(newUserId);
    });

    expect(updatedUser?.currentTeamId).toBe(teamId);

    // Step 8: Verify new member can access team resources
    const memberTeams = await t.run(async (ctx) => {
      return await ctx.runQuery(api.teams.getMyTeams, {});
    }, { user: { tokenIdentifier: "newmember", subject: newUserId } });

    expect(memberTeams).toHaveLength(1);
    expect(memberTeams?.[0]._id).toBe(teamId);
    expect(memberTeams?.[0].name).toBe("Growing Team");
    expect(memberTeams?.[0].role).toBe("member");

    // Step 9: Verify member can see team events
    const memberEvents = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.list, {});
    }, { user: { tokenIdentifier: "newmember", subject: newUserId } });

    expect(memberEvents).toBeDefined(); // Empty but accessible
    expect(Array.isArray(memberEvents)).toBe(true);
  });

  it("should prevent duplicate invitations to same email", async () => {
    const t = convexTest(schema);

    // Setup team
    const { ownerId, teamId } = await t.run(async (ctx) => {
      const ownerId = await ctx.db.insert("users", {
        name: "Team Owner",
        email: "owner@example.com",
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Exclusive Team",
        slug: "exclusive-team",
        ownerId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId: ownerId,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.patch(ownerId, { currentTeamId: teamId });

      return { ownerId, teamId };
    });

    // First invitation
    await t.run(async (ctx) => {
      return await ctx.runMutation(api.teams.createInvitation, {
        email: "duplicate@example.com",
        role: "member",
      });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    // Second invitation to same email should fail
    await expect(
      t.run(async (ctx) => {
        return await ctx.runMutation(api.teams.createInvitation, {
          email: "duplicate@example.com",
          role: "member",
        });
      }, { user: { tokenIdentifier: "owner", subject: ownerId } })
    ).rejects.toThrow();
  });

  it("should handle invitation expiration", async () => {
    const t = convexTest(schema);

    // Setup team
    const { ownerId, teamId } = await t.run(async (ctx) => {
      const ownerId = await ctx.db.insert("users", {
        name: "Team Owner", 
        email: "owner@example.com",
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Time-Limited Team",
        slug: "time-limited-team",
        ownerId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId: ownerId,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.patch(ownerId, { currentTeamId: teamId });

      return { ownerId, teamId };
    });

    // Create expired invitation manually
    const expiredToken = "expired-token-123";
    const expiredInvitationId = await t.run(async (ctx) => {
      return await ctx.db.insert("teamInvitations", {
        email: "expired@example.com",
        teamId,
        role: "member",
        status: "pending",
        invitedBy: ownerId,
        createdAt: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
        expiresAt: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 day ago
        token: expiredToken,
      });
    });

    // Create user trying to accept expired invitation
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Late User",
        email: "expired@example.com",
      });
    });

    // Attempt to accept expired invitation should fail
    await expect(
      t.run(async (ctx) => {
        return await ctx.runMutation(api.teams.acceptInvitation, {
          token: expiredToken,
        });
      }, { user: { tokenIdentifier: "lateuser", subject: userId } })
    ).rejects.toThrow();
  });

  it("should handle role-based invitation permissions", async () => {
    const t = convexTest(schema);

    // Setup team with owner and member
    const { ownerId, memberId, teamId } = await t.run(async (ctx) => {
      const ownerId = await ctx.db.insert("users", {
        name: "Team Owner",
        email: "owner@example.com",
      });

      const memberId = await ctx.db.insert("users", {
        name: "Team Member",
        email: "member@example.com",
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Hierarchical Team",
        slug: "hierarchical-team",
        ownerId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId: ownerId,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId: memberId,
        role: "member", 
        joinedAt: Date.now(),
      });

      await ctx.db.patch(ownerId, { currentTeamId: teamId });
      await ctx.db.patch(memberId, { currentTeamId: teamId });

      return { ownerId, memberId, teamId };
    });

    // Owner can create invitations
    const ownerInvitation = await t.run(async (ctx) => {
      return await ctx.runMutation(api.teams.createInvitation, {
        email: "invitedbyowner@example.com",
        role: "member",
      });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    expect(ownerInvitation).toBeDefined();

    // Regular member should not be able to create invitations
    await expect(
      t.run(async (ctx) => {
        return await ctx.runMutation(api.teams.createInvitation, {
          email: "invitedbymember@example.com", 
          role: "member",
        });
      }, { user: { tokenIdentifier: "member", subject: memberId } })
    ).rejects.toThrow();
  });

  it("should cleanup invitation after acceptance", async () => {
    const t = convexTest(schema);

    // Setup team
    const { ownerId, teamId } = await t.run(async (ctx) => {
      const ownerId = await ctx.db.insert("users", {
        name: "Team Owner",
        email: "owner@example.com",
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Clean Team",
        slug: "clean-team",
        ownerId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId: ownerId,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.patch(ownerId, { currentTeamId: teamId });

      return { ownerId, teamId };
    });

    // Create invitation
    const invitationId = await t.run(async (ctx) => {
      return await ctx.runMutation(api.teams.createInvitation, {
        email: "cleanup@example.com",
        role: "member",
      });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    const invitation = await t.run(async (ctx) => {
      return await ctx.db.get(invitationId);
    });

    // Create and set up new user
    const newUserId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Clean User",
        email: "cleanup@example.com",
      });
    });

    // Accept invitation
    await t.run(async (ctx) => {
      return await ctx.runMutation(api.teams.acceptInvitation, {
        token: invitation!.token,
      });
    }, { user: { tokenIdentifier: "cleanuser", subject: newUserId } });

    // Verify invitation status is updated (not deleted)
    const finalInvitation = await t.run(async (ctx) => {
      return await ctx.db.get(invitationId);
    });

    expect(finalInvitation?.status).toBe("accepted");
    expect(finalInvitation?.acceptedBy).toBe(newUserId);
    
    // Verify team membership exists
    const membership = await t.run(async (ctx) => {
      return await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) => 
          q.eq("teamId", teamId).eq("userId", newUserId)
        )
        .unique();
    });

    expect(membership).toBeDefined();
    expect(membership?.role).toBe("member");
  });
});