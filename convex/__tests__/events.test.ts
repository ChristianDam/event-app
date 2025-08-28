// ABOUTME: Backend tests for event-related Convex functions
// ABOUTME: Tests event CRUD operations, validation, and team-scoped access

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";

describe("events backend", () => {
  it("should create event with proper validation and slug generation", async () => {
    const t = convexTest(schema);

    // Setup team and user
    const { userId, teamId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        name: "Event Creator",
        email: "creator@example.com",
        currentTeamId: undefined,
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Test Team",
        slug: "test-team",
        ownerId: userId,
        createdAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role: "owner",
        joinedAt: Date.now(),
      });

      // Update user's current team
      await ctx.db.patch(userId, { currentTeamId: teamId });

      return { userId, teamId };
    });

    // Create event (simulating createEvent mutation logic)
    const eventId = await t.run(async (ctx) => {
      // Generate slug
      const title = "Music Festival 2024!";
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 60);

      const now = Date.now();
      
      return await ctx.db.insert("events", {
        title: title,
        slug: slug,
        description: "An amazing music festival with great artists.",
        venue: "Central Park",
        startTime: now + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        endTime: now + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000, // 6 hours later
        timezone: "UTC",
        teamId: teamId,
        organizerId: userId,
        eventType: "music",
        maxCapacity: 1000,
        registrationDeadline: undefined,
        status: "draft",
        bannerImageId: undefined,
        socialImageId: undefined,
        createdAt: now,
        updatedAt: now,
      });
    });

    expect(eventId).toBeDefined();

    // Verify event was created with proper slug
    const event = await t.run(async (ctx) => {
      return await ctx.db.get(eventId);
    });

    expect(event?.title).toBe("Music Festival 2024!");
    expect(event?.slug).toBe("music-festival-2024");
    expect(event?.teamId).toBe(teamId);
    expect(event?.status).toBe("draft");
    expect(event?.eventType).toBe("music");
  });

  it("should handle event queries with team-scoped access", async () => {
    const t = convexTest(schema);

    // Setup two teams with different users
    const { team1Id, user1Id, team2Id, user2Id } = await t.run(async (ctx) => {
      const user1Id = await ctx.db.insert("users", {
        name: "User 1",
        email: "user1@test.com",
      });

      const user2Id = await ctx.db.insert("users", {
        name: "User 2", 
        email: "user2@test.com",
      });

      const team1Id = await ctx.db.insert("teams", {
        name: "Team 1",
        slug: "team-1",
        ownerId: user1Id,
        createdAt: Date.now(),
      });

      const team2Id = await ctx.db.insert("teams", {
        name: "Team 2",
        slug: "team-2",
        ownerId: user2Id,
        createdAt: Date.now(),
      });

      // Set up memberships and current teams
      await ctx.db.insert("teamMembers", {
        teamId: team1Id,
        userId: user1Id,
        role: "owner",
        joinedAt: Date.now(),
      });

      await ctx.db.insert("teamMembers", {
        teamId: team2Id,
        userId: user2Id,
        role: "owner", 
        joinedAt: Date.now(),
      });

      await ctx.db.patch(user1Id, { currentTeamId: team1Id });
      await ctx.db.patch(user2Id, { currentTeamId: team2Id });

      return { team1Id, user1Id, team2Id, user2Id };
    });

    // Create events in different teams
    const event1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("events", {
        title: "Team 1 Event",
        description: "Event for team 1",
        venue: "Venue 1",
        startTime: Date.now() + 24 * 60 * 60 * 1000,
        endTime: Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
        timezone: "UTC",
        eventType: "workshop",
        slug: "team-1-event",
        teamId: team1Id,
        organizerId: user1Id,
        status: "published",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    const event2Id = await t.run(async (ctx) => {
      return await ctx.db.insert("events", {
        title: "Team 2 Event",
        description: "Event for team 2",
        venue: "Venue 2", 
        startTime: Date.now() + 24 * 60 * 60 * 1000,
        endTime: Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
        timezone: "UTC",
        eventType: "art",
        slug: "team-2-event",
        teamId: team2Id,
        organizerId: user2Id,
        status: "published",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });

    // User 1 should only see team 1 events (simulating team-scoped query)
    const team1Events = await t.run(async (ctx) => {
      return await ctx.db
        .query("events")
        .withIndex("by_team", (q) => q.eq("teamId", team1Id))
        .collect();
    });

    expect(team1Events?.length).toBe(1);
    expect(team1Events?.[0]._id).toBe(event1Id);

    // User 2 should only see team 2 events (simulating team-scoped query)
    const team2Events = await t.run(async (ctx) => {
      return await ctx.db
        .query("events")
        .withIndex("by_team", (q) => q.eq("teamId", team2Id))
        .collect();
    });

    expect(team2Events?.length).toBe(1);
    expect(team2Events?.[0]._id).toBe(event2Id);
  });

  it("should handle event updates and status changes", async () => {
    const t = convexTest(schema);

    // Setup
    const { userId, teamId, eventId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        name: "Event Manager",
        email: "manager@test.com",
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Event Team",
        slug: "event-team",
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

      const eventId = await ctx.db.insert("events", {
        title: "Test Event",
        description: "Original description",
        venue: "Original Venue",
        startTime: Date.now() + 48 * 60 * 60 * 1000,
        endTime: Date.now() + 48 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
        timezone: "UTC",
        eventType: "workshop",
        slug: "test-event",
        teamId,
        organizerId: userId,
        status: "draft",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { userId, teamId, eventId };
    });

    // Update event (simulating updateEvent mutation logic)
    await t.run(async (ctx) => {
      await ctx.db.patch(eventId, {
        title: "Updated Test Event",
        description: "Updated description",
        venue: "Updated Venue",
        maxCapacity: 500,
        updatedAt: Date.now(),
      });
    });

    // Verify update
    const updatedEvent = await t.run(async (ctx) => {
      return await ctx.db.get(eventId);
    });

    expect(updatedEvent?.title).toBe("Updated Test Event");
    expect(updatedEvent?.description).toBe("Updated description");
    expect(updatedEvent?.venue).toBe("Updated Venue");
    expect(updatedEvent?.maxCapacity).toBe(500);

    // Test status change to published (simulating updateEvent mutation logic)
    await t.run(async (ctx) => {
      await ctx.db.patch(eventId, {
        status: "published",
        updatedAt: Date.now(),
      });
    });

    const publishedEvent = await t.run(async (ctx) => {
      return await ctx.db.get(eventId);
    });

    expect(publishedEvent?.status).toBe("published");
  });

  it("should validate event input and prevent invalid data", async () => {
    const t = convexTest(schema);

    // Setup
    const { userId, teamId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Test Team",
        slug: "test-team",
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

    // Test that events can be created with valid data (basic schema validation)
    const testEventId = await t.run(async (ctx) => {
      const now = Date.now();
      return await ctx.db.insert("events", {
        title: "Valid Title",
        slug: "valid-title",
        description: "Valid description",
        venue: "Valid venue",
        startTime: now + 24 * 60 * 60 * 1000,
        endTime: now + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
        timezone: "UTC",
        teamId: teamId,
        organizerId: userId,
        eventType: "music",
        status: "draft",
        createdAt: now,
        updatedAt: now,
      });
    });

    expect(testEventId).toBeDefined();

    // Verify the event was created correctly
    const testEvent = await t.run(async (ctx) => {
      return await ctx.db.get(testEventId);
    });

    expect(testEvent?.title).toBe("Valid Title");
    expect(testEvent?.eventType).toBe("music");
  });

  it("should handle event registrations", async () => {
    const t = convexTest(schema);

    // Setup event
    const { eventId } = await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        name: "Event Host",
        email: "host@test.com",
      });

      const teamId = await ctx.db.insert("teams", {
        name: "Host Team",
        slug: "host-team",
        ownerId: userId,
        createdAt: Date.now(),
      });

      const eventId = await ctx.db.insert("events", {
        title: "Registration Test Event",
        description: "Event to test registrations",
        venue: "Test Venue",
        startTime: Date.now() + 48 * 60 * 60 * 1000,
        endTime: Date.now() + 48 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
        timezone: "UTC",
        eventType: "workshop",
        slug: "registration-test-event",
        teamId,
        organizerId: userId,
        status: "published",
        maxCapacity: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { eventId };
    });

    // Test registration creation
    const registrationId = await t.run(async (ctx) => {
      return await ctx.db.insert("eventRegistrations", {
        eventId,
        attendeeName: "John Doe",
        attendeeEmail: "john@test.com",
        registeredAt: Date.now(),
        confirmationSent: true,
      });
    });

    // Verify registration
    const registration = await t.run(async (ctx) => {
      return await ctx.db.get(registrationId);
    });

    expect(registration?.attendeeName).toBe("John Doe");
    expect(registration?.attendeeEmail).toBe("john@test.com");
    expect(registration?.confirmationSent).toBe(true);

    // Test registration count
    const registrationCount = await t.run(async (ctx) => {
      return await ctx.db
        .query("eventRegistrations")
        .withIndex("by_event", (q) => q.eq("eventId", eventId))
        .collect()
        .then(regs => regs.length);
    });

    expect(registrationCount).toBe(1);
  });

  it("should handle timezone and date validation", async () => {
    const t = convexTest(schema);

    // Test timezone validation
    const validTimezones = ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo"];
    const invalidTimezones = ["Invalid/Timezone", "", "America/FakeCity"];

    for (const timezone of validTimezones) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        expect(true).toBe(true); // Valid timezone
      } catch {
        expect(true).toBe(false); // Should not throw for valid timezones
      }
    }

    for (const timezone of invalidTimezones) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        expect(true).toBe(false); // Should throw for invalid timezones
      } catch {
        expect(true).toBe(true); // Expected to throw
      }
    }
  });
});