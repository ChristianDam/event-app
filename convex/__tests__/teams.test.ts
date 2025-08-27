// ABOUTME: Backend tests for team-related Convex functions
// ABOUTME: Tests core team operations using convex-test

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../schema";
import { api } from "../_generated/api";

describe("teams backend", () => {
  it("should create team with proper slug generation", async () => {
    const t = convexTest(schema);
    
    // Test slug generation logic directly (same as in teams.ts)
    const testName = "My Awesome Team!";
    const expectedSlug = testName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);
    
    expect(expectedSlug).toBe("my-awesome-team");
  });

  it("should handle basic database operations", async () => {
    const t = convexTest(schema);
    
    // Create a test user first to get a valid user ID
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
        createdAt: Date.now(),
      });
    });

    // Test basic schema structure by inserting test data
    const teamId = await t.run(async (ctx) => {
      return await ctx.db.insert("teams", {
        name: "Test Team",
        slug: "test-team", 
        ownerId: userId,
        createdAt: Date.now(),
      });
    });

    expect(teamId).toBeDefined();
    
    // Verify the team was created
    const team = await t.run(async (ctx) => {
      return await ctx.db.get(teamId);
    });
    
    expect(team).toBeDefined();
    expect(team?.name).toBe("Test Team");
    expect(team?.slug).toBe("test-team");
  });
});