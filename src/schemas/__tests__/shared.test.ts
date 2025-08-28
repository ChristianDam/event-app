// ABOUTME: Unit tests for core schema validation functions
// ABOUTME: Tests essential validation logic for forms and data integrity

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  emailSchema,
  phoneSchema,
  createStringSchema,
  futureDateSchema,
  sanitizeString,
  generateSlug,
} from "../shared";

describe("shared schemas", () => {
  let mockDate: Date;

  beforeEach(() => {
    mockDate = new Date("2024-01-15T12:00:00.000Z");
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("emailSchema", () => {
    it("should validate emails", () => {
      expect(() => emailSchema.parse("user@example.com")).not.toThrow();
      expect(() => emailSchema.parse("test.email@domain.co.uk")).not.toThrow();
      expect(() => emailSchema.parse("invalid")).toThrow();
      expect(() => emailSchema.parse("@example.com")).toThrow();
    });
  });

  describe("phoneSchema", () => {
    it("should validate phone numbers", () => {
      expect(() => phoneSchema.parse("+1234567890")).not.toThrow();
      expect(() => phoneSchema.parse("1234567890")).not.toThrow();
      expect(() => phoneSchema.parse("abc123")).toThrow();
      expect(phoneSchema.parse(undefined)).toBeUndefined();
    });
  });

  describe("createStringSchema", () => {
    it("should create string validation with length constraints", () => {
      const schema = createStringSchema({ min: 3, max: 10 });
      expect(() => schema.parse("good")).not.toThrow();
      expect(() => schema.parse("hi")).toThrow();
      expect(() => schema.parse("way too long string")).toThrow();
      expect(schema.parse("  hello  ")).toBe("hello");
    });

    it("should support pattern validation", () => {
      const schema = createStringSchema({
        pattern: /^[a-zA-Z]+$/,
        patternMessage: "Only letters allowed",
      });
      expect(() => schema.parse("hello")).not.toThrow();
      expect(() => schema.parse("hello123")).toThrow();
    });
  });




  describe("futureDateSchema", () => {
    it("should validate future dates with buffer", () => {
      const futureDate = new Date(mockDate.getTime() + 10 * 60 * 1000);
      const pastDate = new Date(mockDate.getTime() - 60 * 1000);
      const tooSoon = new Date(mockDate.getTime() + 2 * 60 * 1000);
      
      expect(() => futureDateSchema.parse(futureDate)).not.toThrow();
      expect(() => futureDateSchema.parse(pastDate)).toThrow();
      expect(() => futureDateSchema.parse(tooSoon)).toThrow();
    });
  });



  describe("sanitizeString - security", () => {
    it("should remove XSS attacks", () => {
      expect(sanitizeString("Hello <script>alert('xss')</script> world")).toBe("Hello scriptalert('xss')/script world");
      expect(sanitizeString("javascript:alert('xss')")).toBe("alert('xss')");
      expect(sanitizeString("onclick=alert('xss')")).toBe("alert('xss')");
    });

    it("should preserve safe content", () => {
      const safe = "Normal string with numbers 123";
      expect(sanitizeString(safe)).toBe(safe);
    });
  });

  describe("generateSlug", () => {
    it("should create URL-safe slugs", () => {
      expect(generateSlug("Event Title 2024")).toBe("event-title-2024");
      expect(generateSlug("Art & Music Festival!")).toBe("art-music-festival");
      expect(generateSlug("Event    with    spaces")).toBe("event-with-spaces");
    });

    it("should handle edge cases", () => {
      const longTitle = "This is a very long event title that exceeds the limit";
      expect(generateSlug(longTitle).length).toBeLessThanOrEqual(60);
      expect(generateSlug("")).toBe("");
      expect(generateSlug("!@#$%^&*()")).toBe("");
    });
  });
});
