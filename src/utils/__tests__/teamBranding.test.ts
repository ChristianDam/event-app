// ABOUTME: Unit tests for core team branding functions
// ABOUTME: Tests theme generation and color validation

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Team } from "../teamBranding";
import {
  generateEventTheme,
  isValidHexColor,
} from "../teamBranding";

describe("teamBranding utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isValidHexColor", () => {
    it("should validate hex colors", () => {
      expect(isValidHexColor("#000000")).toBe(true);
      expect(isValidHexColor("#ABCDEF")).toBe(true);
      expect(isValidHexColor("#12345")).toBe(false);
      expect(isValidHexColor("123abc")).toBe(false);
      expect(isValidHexColor("#xyz123")).toBe(false);
    });
  });


  describe("generateEventTheme", () => {
    it("should generate default theme without primary color", () => {
      const team = {
        _id: "team1" as any,
        name: "Test Team",
        slug: "test",
        ownerId: "user1" as any,
        createdAt: Date.now(),
      } as Team;

      const theme = generateEventTheme(team);
      expect(theme.primary).toBe("#3b82f6");
      expect(theme.gradient).toContain("linear-gradient");
      expect(theme.shadow).toMatch(/^rgba\(/);
    });

    it("should generate theme from primary color", () => {
      const team = {
        _id: "team1" as any,
        name: "Test Team",
        slug: "test", 
        ownerId: "user1" as any,
        createdAt: Date.now(),
        primaryColor: "#ff6b35",
      } as Team;

      const theme = generateEventTheme(team);
      expect(theme.primary).toBe("#ff6b35");
      expect(isValidHexColor(theme.secondary)).toBe(true);
      expect(isValidHexColor(theme.accent)).toBe(true);
      expect(isValidHexColor(theme.text)).toBe(true);
    });
  });





});
