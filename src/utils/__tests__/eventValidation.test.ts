// ABOUTME: Unit tests for critical event validation functions
// ABOUTME: Tests core validation logic and security-critical paths

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventFormData } from "../../types/events";
import {
  generateEventSlug,
  isValidEventForm,
  sanitizeEventInput,
  validateEventField,
  validateEventForm,
} from "../eventValidation";

describe("eventValidation utilities", () => {
  let mockDate: Date;

  beforeEach(() => {
    mockDate = new Date("2024-01-15T12:00:00.000Z");
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("validateEventField - core validation", () => {
    it("should validate required fields", () => {
      expect(validateEventField("title", "Valid Title")).toBeNull();
      expect(validateEventField("title", "")).toBe("Event title is required");
      expect(validateEventField("description", "Valid description text")).toBeNull();
      expect(validateEventField("venue", "Valid Venue")).toBeNull();
    });

    it("should validate field lengths", () => {
      expect(validateEventField("title", "Hi")).toBe("Title must be at least 3 characters");
      expect(validateEventField("title", "A".repeat(101))).toBe("Title must be less than 100 characters");
    });

    it("should validate dates", () => {
      const futureDate = new Date(mockDate.getTime() + 24 * 60 * 60 * 1000);
      const pastDate = new Date(mockDate.getTime() - 60 * 60 * 1000);
      
      expect(validateEventField("startTime", futureDate)).toBeNull();
      expect(validateEventField("startTime", pastDate)).toBe("Event must be scheduled for the future");
    });

    it("should validate event types", () => {
      expect(validateEventField("eventType", "music")).toBeNull();
      expect(validateEventField("eventType", "invalid-type")).toBe("Invalid event type selected");
    });

    it("should prevent XSS in titles", () => {
      const result = validateEventField("title", "Event <script>alert('xss')</script>");
      expect(result).toBe("Title contains invalid characters");
    });
  });

  describe("validateEventForm", () => {
    it("should validate complete form", () => {
      const validFormData: EventFormData = {
        title: "Music Festival 2024",
        description: "An amazing music festival with great artists.",
        venue: "Central Park",
        startTime: new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
        timezone: "UTC",
        eventType: "music",
        maxCapacity: 1000,
      };
      
      expect(validateEventForm(validFormData)).toEqual({});
      expect(isValidEventForm(validFormData)).toBe(true);
    });

    it("should catch validation errors", () => {
      const invalidFormData: EventFormData = {
        title: "Hi",
        description: "Short",
        venue: "No",
        startTime: new Date(mockDate.getTime() - 60 * 60 * 1000),
        endTime: new Date(mockDate.getTime() - 60 * 60 * 1000),
        timezone: "",
        eventType: "invalid" as EventFormData["eventType"],
        maxCapacity: 0,
      };

      const errors = validateEventForm(invalidFormData);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(isValidEventForm(invalidFormData)).toBe(false);
    });
  });

  describe("sanitizeEventInput - security", () => {
    it("should remove XSS attacks", () => {
      expect(sanitizeEventInput("Hello <script>alert('xss')</script> world")).toBe("Hello scriptalert('xss')/script world");
      expect(sanitizeEventInput("javascript:alert('xss')")).toBe("alert('xss')");
      expect(sanitizeEventInput("onclick=alert('xss')")).toBe("alert('xss')");
    });

    it("should preserve safe content", () => {
      const safe = "Normal event description with numbers 123";
      expect(sanitizeEventInput(safe)).toBe(safe);
    });
  });

  describe("generateEventSlug", () => {
    it("should create URL-safe slugs", () => {
      expect(generateEventSlug("Music Festival 2024")).toBe("music-festival-2024");
      expect(generateEventSlug("Art & Music Festival!")).toBe("art-music-festival");
      expect(generateEventSlug("Event    with    many    spaces")).toBe("event-with-many-spaces");
    });

    it("should handle length limits and edge cases", () => {
      const longTitle = "This is a very long event title that exceeds the sixty character limit";
      const result = generateEventSlug(longTitle);
      expect(result.length).toBeLessThanOrEqual(60);
      expect(generateEventSlug("")).toBe("");
      expect(generateEventSlug("!@#$%^&*()")).toBe("");
    });
  });
});
