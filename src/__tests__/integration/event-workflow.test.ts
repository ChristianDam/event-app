// ABOUTME: Integration tests for complete event workflows
// ABOUTME: Tests end-to-end event creation, publication, and registration flows

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../../../convex/_generated/api";
import schema from "../../../convex/schema";

describe("Event Management Workflow", () => {
  it("should complete full event lifecycle: create -> publish -> register -> manage", async () => {
    const t = convexTest(schema);

    // Step 1: Setup team and authenticated user
    const { userId, teamId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        name: "Event Manager",
        email: "manager@example.com",
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Event Organization",
        slug: "event-org",
        ownerId: userId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.patch(userId, { currentTeamId: teamId });

      return { userId, teamId };
    });

    // Step 2: Create event (draft status)
    const eventId = await t.run(async (ctx) => {
      return await ctx.runMutation(api.events.create, {
        title: "Tech Conference 2024",
        description: "A comprehensive tech conference covering AI, web development, and cloud technologies.",
        venue: "Convention Center",
        startTime: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        endTime: Date.now() + 30 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000, // 8 hours later
        timezone: "America/New_York",
        eventType: "workshop",
        maxCapacity: 200,
      });
    }, { user: { tokenIdentifier: "manager", subject: userId } });

    // Verify event was created in draft status
    const draftEvent = await t.run(async (ctx) => {
      return await ctx.db.get(eventId);
    });

    expect(draftEvent?.title).toBe("Tech Conference 2024");
    expect(draftEvent?.status).toBe("draft");
    expect(draftEvent?.slug).toBe("tech-conference-2024");
    expect(draftEvent?.teamId).toBe(teamId);

    // Step 3: Update event details
    await t.run(async (ctx) => {
      await ctx.runMutation(api.events.update, {
        eventId,
        description: "Updated: A comprehensive tech conference with networking opportunities.",
        maxCapacity: 250, // Increased capacity
      });
    }, { user: { tokenIdentifier: "manager", subject: userId } });

    // Verify updates
    const updatedEvent = await t.run(async (ctx) => {
      return await ctx.db.get(eventId);
    });

    expect(updatedEvent?.description).toContain("Updated:");
    expect(updatedEvent?.maxCapacity).toBe(250);

    // Step 4: Publish event (make it public)
    await t.run(async (ctx) => {
      await ctx.runMutation(api.events.updateStatus, {
        eventId,
        status: "published",
      });
    }, { user: { tokenIdentifier: "manager", subject: userId } });

    // Verify publication
    const publishedEvent = await t.run(async (ctx) => {
      return await ctx.db.get(eventId);
    });

    expect(publishedEvent?.status).toBe("published");

    // Step 5: Test public event access (no authentication required)
    const publicEvent = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.getPublicEvent, {
        eventId,
      });
    }); // No user context - public access

    expect(publicEvent?.title).toBe("Tech Conference 2024");
    expect(publicEvent?.status).toBe("published");

    // Step 6: Register attendees for the event
    const registration1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("eventRegistrations", {
        eventId,
        name: "John Doe",
        email: "john@example.com",
        registeredAt: Date.now(),
        status: "confirmed",
      });
    });

    const registration2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("eventRegistrations", {
        eventId,
        name: "Jane Smith", 
        email: "jane@example.com",
        registeredAt: Date.now(),
        status: "confirmed",
      });
    });

    // Step 7: Query registrations (should be accessible by event manager)
    const registrations = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.getRegistrations, {
        eventId,
      });
    }, { user: { tokenIdentifier: "manager", subject: userId } });

    expect(registrations).toHaveLength(2);
    expect(registrations?.some(r => r.name === "John Doe")).toBe(true);
    expect(registrations?.some(r => r.name === "Jane Smith")).toBe(true);

    // Step 8: Test event listing (team-scoped)
    const teamEvents = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.list, {});
    }, { user: { tokenIdentifier: "manager", subject: userId } });

    expect(teamEvents).toHaveLength(1);
    expect(teamEvents?.[0]._id).toBe(eventId);
    expect(teamEvents?.[0].registrationCount).toBe(2);

    // Step 9: Create event thread for discussion
    const threadId = await t.run(async (ctx) => {
      return await ctx.runMutation(api.threads.create, {
        title: "Tech Conference Discussion",
        type: "event",
        eventId,
      });
    }, { user: { tokenIdentifier: "manager", subject: userId } });

    // Verify thread creation
    const thread = await t.run(async (ctx) => {
      return await ctx.db.get(threadId);
    });

    expect(thread?.title).toBe("Tech Conference Discussion");
    expect(thread?.eventId).toBe(eventId);
    expect(thread?.teamId).toBe(teamId);

    // Step 10: Add message to event thread
    const messageId = await t.run(async (ctx) => {
      return await ctx.runMutation(api.threads.sendMessage, {
        threadId,
        content: "Welcome to the Tech Conference discussion! Feel free to ask questions about the agenda.",
      });
    }, { user: { tokenIdentifier: "manager", subject: userId } });

    // Verify message
    const message = await t.run(async (ctx) => {
      return await ctx.db.get(messageId);
    });

    expect(message?.content).toContain("Welcome to the Tech Conference");
    expect(message?.authorId).toBe(userId);
    expect(message?.threadId).toBe(threadId);

    // Step 11: Test event cancellation
    await t.run(async (ctx) => {
      await ctx.runMutation(api.events.updateStatus, {
        eventId,
        status: "cancelled",
      });
    }, { user: { tokenIdentifier: "manager", subject: userId } });

    // Verify cancellation
    const cancelledEvent = await t.run(async (ctx) => {
      return await ctx.db.get(eventId);
    });

    expect(cancelledEvent?.status).toBe("cancelled");

    // Step 12: Verify cancelled events are still visible to organizers but not publicly
    const managerView = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.get, { eventId });
    }, { user: { tokenIdentifier: "manager", subject: userId } });

    expect(managerView?.status).toBe("cancelled");

    // Public access should still work but show cancelled status
    const publicCancelledEvent = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.getPublicEvent, { eventId });
    });

    expect(publicCancelledEvent?.status).toBe("cancelled");
  });

  it("should handle team member permissions in event management", async () => {
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
        name: "Collaborative Team",
        slug: "collab-team",
        ownerId,
        createdAt: Date.now(),
      });

      // Add both users to team
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

      // Set current teams
      await ctx.db.patch(ownerId, { currentTeamId: teamId });
      await ctx.db.patch(memberId, { currentTeamId: teamId });

      return { ownerId, memberId, teamId };
    });

    // Owner creates event
    const eventId = await t.run(async (ctx) => {
      return await ctx.runMutation(api.events.create, {
        title: "Team Workshop",
        description: "Internal team workshop",
        venue: "Office Conference Room",
        startTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
        timezone: "UTC",
        eventType: "workshop",
        maxCapacity: 20,
      });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    // Both owner and member should be able to view the event
    const eventAsOwner = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.get, { eventId });
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    const eventAsMember = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.get, { eventId });
    }, { user: { tokenIdentifier: "member", subject: memberId } });

    expect(eventAsOwner?.title).toBe("Team Workshop");
    expect(eventAsMember?.title).toBe("Team Workshop");

    // Both should see the event in team event lists
    const ownerEvents = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.list, {});
    }, { user: { tokenIdentifier: "owner", subject: ownerId } });

    const memberEvents = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.list, {});
    }, { user: { tokenIdentifier: "member", subject: memberId } });

    expect(ownerEvents).toHaveLength(1);
    expect(memberEvents).toHaveLength(1);
    expect(ownerEvents?.[0]._id).toBe(eventId);
    expect(memberEvents?.[0]._id).toBe(eventId);

    // Member should be able to update event (assuming member permissions allow)
    await t.run(async (ctx) => {
      await ctx.runMutation(api.events.update, {
        eventId,
        description: "Updated by member: Internal team workshop with new agenda",
      });
    }, { user: { tokenIdentifier: "member", subject: memberId } });

    // Verify update
    const updatedEvent = await t.run(async (ctx) => {
      return await ctx.db.get(eventId);
    });

    expect(updatedEvent?.description).toContain("Updated by member:");
  });

  it("should prevent unauthorized access to events from other teams", async () => {
    const t = convexTest(schema);

    // Setup two separate teams
    const { team1Id, user1Id, team2Id, user2Id } = await t.run(async (ctx) => {
      // Team 1
      const user1Id = await ctx.db.insert("users", {
        name: "User 1",
        email: "user1@example.com",
      });

      const team1Id = await ctx.db.insert("teams", {
        name: "Private Team 1",
        slug: "private-team-1",
        ownerId: user1Id,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: team1Id,
        userId: user1Id,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.patch(user1Id, { currentTeamId: team1Id });

      // Team 2
      const user2Id = await ctx.db.insert("users", {
        name: "User 2",
        email: "user2@example.com",
      });

      const team2Id = await ctx.db.insert("teams", {
        name: "Private Team 2",
        slug: "private-team-2",
        ownerId: user2Id,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: team2Id,
        userId: user2Id,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.patch(user2Id, { currentTeamId: team2Id });

      return { team1Id, user1Id, team2Id, user2Id };
    });

    // User 1 creates private event
    const privateEventId = await t.run(async (ctx) => {
      return await ctx.runMutation(api.events.create, {
        title: "Team 1 Private Meeting",
        description: "Confidential team meeting",
        venue: "Private Office",
        startTime: Date.now() + 7 * 24 * 60 * 60 * 1000,
        endTime: Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
        timezone: "UTC",
        eventType: "other",
      });
    }, { user: { tokenIdentifier: "user1", subject: user1Id } });

    // User 2 should not be able to access Team 1's event
    await expect(
      t.run(async (ctx) => {
        return await ctx.runQuery(api.events.get, { eventId: privateEventId });
      }, { user: { tokenIdentifier: "user2", subject: user2Id } })
    ).rejects.toThrow();

    // User 2's event list should be empty
    const user2Events = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.list, {});
    }, { user: { tokenIdentifier: "user2", subject: user2Id } });

    expect(user2Events).toHaveLength(0);

    // User 1 should see their own event
    const user1Events = await t.run(async (ctx) => {
      return await ctx.runQuery(api.events.list, {});
    }, { user: { tokenIdentifier: "user1", subject: user1Id } });

    expect(user1Events).toHaveLength(1);
    expect(user1Events?.[0]._id).toBe(privateEventId);
  });
});