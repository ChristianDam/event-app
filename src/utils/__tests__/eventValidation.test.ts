// ABOUTME: Unit tests for event validation utility functions
// ABOUTME: Tests form validation, sanitization, and slug generation for events

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
    // Mock current time to ensure consistent test results
    mockDate = new Date("2024-01-15T12:00:00.000Z");
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("validateEventField", () => {
    describe("title validation", () => {
      it("should return null for valid title", () => {
        const result = validateEventField("title", "Music Festival 2024");
        expect(result).toBeNull();
      });

      it("should return error for undefined title", () => {
        const result = validateEventField("title", undefined);
        expect(result).toBe("Event title is required");
      });

      it("should return error for empty string title", () => {
        const result = validateEventField("title", "");
        expect(result).toBe("Event title is required");
      });

      it("should return error for title that is too short", () => {
        const result = validateEventField("title", "Hi");
        expect(result).toBe("Title must be at least 3 characters");
      });

      it("should return error for title that is too long", () => {
        const longTitle = "A".repeat(101);
        const result = validateEventField("title", longTitle);
        expect(result).toBe("Title must be less than 100 characters");
      });

      it("should return error for title with invalid characters", () => {
        const result = validateEventField("title", "Event <script>alert('xss')</script>");
        expect(result).toBe("Title contains invalid characters");
      });

      it("should allow valid special characters", () => {
        const result = validateEventField("title", "Music & Art Festival - 2024 (Winter)!");
        expect(result).toBeNull();
      });

      it("should trim whitespace from title", () => {
        const result = validateEventField("title", "  Valid Title  ");
        expect(result).toBeNull();
      });

      it("should handle non-string title", () => {
        const result = validateEventField("title", 123);
        expect(result).toBe("Event title is required");
      });
    });

    describe("description validation", () => {
      it("should return null for valid description", () => {
        const result = validateEventField("description", "This is a great event with lots of activities.");
        expect(result).toBeNull();
      });

      it("should return error for undefined description", () => {
        const result = validateEventField("description", undefined);
        expect(result).toBe("Event description is required");
      });

      it("should return error for description that is too short", () => {
        const result = validateEventField("description", "Too short");
        expect(result).toBe("Description must be at least 10 characters");
      });

      it("should return error for description that is too long", () => {
        const longDescription = "A".repeat(2001);
        const result = validateEventField("description", longDescription);
        expect(result).toBe("Description must be less than 2000 characters");
      });

      it("should trim whitespace from description", () => {
        const result = validateEventField("description", "  Valid description with enough characters  ");
        expect(result).toBeNull();
      });
    });

    describe("venue validation", () => {
      it("should return null for valid venue", () => {
        const result = validateEventField("venue", "Community Center Hall");
        expect(result).toBeNull();
      });

      it("should return error for undefined venue", () => {
        const result = validateEventField("venue", undefined);
        expect(result).toBe("Venue is required");
      });

      it("should return error for venue that is too short", () => {
        const result = validateEventField("venue", "Hi");
        expect(result).toBe("Venue must be at least 3 characters");
      });

      it("should return error for venue that is too long", () => {
        const longVenue = "A".repeat(201);
        const result = validateEventField("venue", longVenue);
        expect(result).toBe("Venue must be less than 200 characters");
      });
    });

    describe("startTime validation", () => {
      it("should return null for valid future start time", () => {
        const futureDate = new Date(mockDate.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        const result = validateEventField("startTime", futureDate);
        expect(result).toBeNull();
      });

      it("should return error for undefined start time", () => {
        const result = validateEventField("startTime", undefined);
        expect(result).toBe("Start time is required");
      });

      it("should return error for non-Date start time", () => {
        const result = validateEventField("startTime", "2024-01-16");
        expect(result).toBe("Start time is required");
      });

      it("should return error for past start time", () => {
        const pastDate = new Date(mockDate.getTime() - 60 * 60 * 1000); // 1 hour ago
        const result = validateEventField("startTime", pastDate);
        expect(result).toBe("Event must be scheduled for the future");
      });

      it("should return error for start time too close to now", () => {
        const tooSoon = new Date(mockDate.getTime() + 2 * 60 * 1000); // 2 minutes from now
        const result = validateEventField("startTime", tooSoon);
        expect(result).toBe("Event must be scheduled for the future");
      });

      it("should return error for start time too far in advance", () => {
        const tooFar = new Date(mockDate.getTime() + 400 * 24 * 60 * 60 * 1000); // 400 days from now
        const result = validateEventField("startTime", tooFar);
        expect(result).toBe("Event cannot be scheduled more than 365 days in advance");
      });

      it("should allow start time exactly 365 days in advance", () => {
        const maxAdvance = new Date(mockDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        const result = validateEventField("startTime", maxAdvance);
        expect(result).toBeNull();
      });
    });

    describe("endTime validation", () => {
      it("should return null for valid end time", () => {
        const startTime = new Date(mockDate.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        const formData = { startTime } as EventFormData;
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
        const result = validateEventField("endTime", endTime, formData);
        expect(result).toBeNull();
      });

      it("should return error for undefined end time", () => {
        const startTime = new Date(mockDate.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        const formData = { startTime } as EventFormData;
        const result = validateEventField("endTime", undefined, formData);
        expect(result).toBe("End time is required");
      });

      it("should return error for end time before start time", () => {
        const startTime = new Date(mockDate.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        const formData = { startTime } as EventFormData;
        const endTime = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hour before start
        const result = validateEventField("endTime", endTime, formData);
        expect(result).toBe("End time must be after start time");
      });

      it("should return error for end time equal to start time", () => {
        const startTime = new Date(mockDate.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
        const formData = { startTime } as EventFormData;
        const endTime = new Date(startTime.getTime());
        const result = validateEventField("endTime", endTime, formData);
        expect(result).toBe("End time must be after start time");
      });
    });

    describe("eventType validation", () => {
      it("should return null for valid event type", () => {
        const result = validateEventField("eventType", "music");
        expect(result).toBeNull();
      });

      it("should return error for undefined event type", () => {
        const result = validateEventField("eventType", undefined);
        expect(result).toBe("Event type is required");
      });

      it("should return error for invalid event type", () => {
        const result = validateEventField("eventType", "invalid-type");
        expect(result).toBe("Invalid event type selected");
      });

      it("should validate all valid event types", () => {
        const validTypes = ["music", "art", "workshop", "performance", "exhibition", "other"];
        validTypes.forEach((type) => {
          const result = validateEventField("eventType", type);
          expect(result).toBeNull();
        });
      });
    });

    describe("maxCapacity validation", () => {
      it("should return null for valid capacity", () => {
        const result = validateEventField("maxCapacity", 100);
        expect(result).toBeNull();
      });

      it("should return null for undefined capacity (optional field)", () => {
        const result = validateEventField("maxCapacity", undefined);
        expect(result).toBeNull();
      });

      it("should return null for null capacity", () => {
        const result = validateEventField("maxCapacity", null);
        expect(result).toBeNull();
      });

      it("should return null for empty string capacity", () => {
        const result = validateEventField("maxCapacity", "");
        expect(result).toBeNull();
      });

      it("should return error for non-integer capacity", () => {
        const result = validateEventField("maxCapacity", 50.5);
        expect(result).toBe("Capacity must be a whole number");
      });

      it("should return error for capacity less than minimum", () => {
        const result = validateEventField("maxCapacity", 0);
        expect(result).toBe("Capacity must be at least 1");
      });

      it("should return error for capacity exceeding maximum", () => {
        const result = validateEventField("maxCapacity", 10001);
        expect(result).toBe("Capacity cannot exceed 10000");
      });

      it("should handle string numbers", () => {
        const result = validateEventField("maxCapacity", "50");
        expect(result).toBeNull();
      });
    });

    describe("registrationDeadline validation", () => {
      const startTime = new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      const formData = { startTime } as EventFormData;

      it("should return null for undefined deadline (optional)", () => {
        const result = validateEventField("registrationDeadline", undefined, formData);
        expect(result).toBeNull();
      });

      it("should return null for valid deadline", () => {
        const deadline = new Date(mockDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
        const result = validateEventField("registrationDeadline", deadline, formData);
        expect(result).toBeNull();
      });

      it("should return error for deadline after start time", () => {
        const deadline = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour after start
        const result = validateEventField("registrationDeadline", deadline, formData);
        expect(result).toBe("Registration deadline must be before the event starts");
      });

      it("should return error for deadline in the past", () => {
        const pastDeadline = new Date(mockDate.getTime() - 60 * 60 * 1000); // 1 hour ago
        const result = validateEventField("registrationDeadline", pastDeadline, formData);
        expect(result).toBe("Registration deadline must be in the future");
      });

      it("should return error for deadline equal to start time", () => {
        const deadline = new Date(startTime.getTime());
        const result = validateEventField("registrationDeadline", deadline, formData);
        expect(result).toBe("Registration deadline must be before the event starts");
      });
    });

    describe("eventImage validation", () => {
      it("should return null for undefined image (optional)", () => {
        const result = validateEventField("eventImage", undefined);
        expect(result).toBeNull();
      });

      it("should return null for valid image file", () => {
        const file = new File([""], "image.jpg", { type: "image/jpeg" });
        Object.defineProperty(file, "size", { value: 5 * 1024 * 1024 }); // 5MB
        const result = validateEventField("eventImage", file);
        expect(result).toBeNull();
      });

      it("should return error for file too large", () => {
        const file = new File([""], "large.jpg", { type: "image/jpeg" });
        Object.defineProperty(file, "size", { value: 15 * 1024 * 1024 }); // 15MB
        const result = validateEventField("eventImage", file);
        expect(result).toBe("Image size must be less than 10MB");
      });

      it("should return error for invalid file type", () => {
        const file = new File([""], "document.pdf", { type: "application/pdf" });
        Object.defineProperty(file, "size", { value: 1024 }); // 1KB
        const result = validateEventField("eventImage", file);
        expect(result).toBe("Image must be JPEG, PNG, or WebP format");
      });

      it("should allow all valid image types", () => {
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        validTypes.forEach((type) => {
          const file = new File([""], `image.${type.split("/")[1]}`, { type });
          Object.defineProperty(file, "size", { value: 1024 });
          const result = validateEventField("eventImage", file);
          expect(result).toBeNull();
        });
      });
    });

    describe("unknown field", () => {
      it("should return null for unknown field", () => {
        const result = validateEventField("unknownField" as keyof EventFormData, "value");
        expect(result).toBeNull();
      });
    });
  });

  describe("validateEventForm", () => {
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

    it("should return empty errors object for valid form data", () => {
      const errors = validateEventForm(validFormData);
      expect(errors).toEqual({});
    });

    it("should return errors for invalid form data", () => {
      const invalidFormData: EventFormData = {
        title: "Hi", // Too short
        description: "Short", // Too short
        venue: "No", // Too short
        startTime: new Date(mockDate.getTime() - 60 * 60 * 1000), // Past
        endTime: new Date(mockDate.getTime() - 60 * 60 * 1000), // Past and before start
        timezone: "",
        eventType: "invalid" as EventFormData["eventType"],
        maxCapacity: 0, // Too small
      };

      const errors = validateEventForm(invalidFormData);

      expect(errors.title).toBeTruthy();
      expect(errors.description).toBeTruthy();
      expect(errors.venue).toBeTruthy();
      expect(errors.startTime).toBeTruthy();
      expect(errors.eventType).toBeTruthy();
      expect(errors.maxCapacity).toBeTruthy();
    });

    it("should validate end time against start time", () => {
      const formDataWithBadEndTime: EventFormData = {
        ...validFormData,
        endTime: new Date(validFormData.startTime.getTime() - 60 * 60 * 1000), // Before start
      };

      const errors = validateEventForm(formDataWithBadEndTime);
      expect(errors.endTime).toBe("End time must be after start time");
    });
  });

  describe("isValidEventForm", () => {
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

    it("should return true for valid form data", () => {
      const isValid = isValidEventForm(validFormData);
      expect(isValid).toBe(true);
    });

    it("should return false for invalid form data", () => {
      const invalidFormData: EventFormData = {
        ...validFormData,
        title: "Hi", // Too short
      };

      const isValid = isValidEventForm(invalidFormData);
      expect(isValid).toBe(false);
    });
  });

  describe("sanitizeEventInput", () => {
    it("should remove HTML tags", () => {
      const input = "Hello <script>alert('xss')</script> world";
      const result = sanitizeEventInput(input);
      expect(result).toBe("Hello alert('xss') world");
    });

    it("should remove javascript: protocols", () => {
      const input = "javascript:alert('xss')";
      const result = sanitizeEventInput(input);
      expect(result).toBe("alert('xss')");
    });

    it("should remove event handlers", () => {
      const input = "onclick=alert('xss') onload=malicious()";
      const result = sanitizeEventInput(input);
      expect(result).toBe("malicious()");
    });

    it("should trim whitespace", () => {
      const input = "  clean input  ";
      const result = sanitizeEventInput(input);
      expect(result).toBe("clean input");
    });

    it("should handle empty input", () => {
      const result = sanitizeEventInput("");
      expect(result).toBe("");
    });

    it("should preserve safe content", () => {
      const input = "This is a normal event description with numbers 123 and symbols @#$%";
      const result = sanitizeEventInput(input);
      expect(result).toBe(input.trim());
    });

    it("should handle case insensitive javascript", () => {
      const input = "JAVASCRIPT:alert() Javascript:test()";
      const result = sanitizeEventInput(input);
      expect(result).toBe("alert() test()");
    });
  });

  describe("generateEventSlug", () => {
    it("should convert title to lowercase slug", () => {
      const result = generateEventSlug("Music Festival 2024");
      expect(result).toBe("music-festival-2024");
    });

    it("should replace spaces with hyphens", () => {
      const result = generateEventSlug("My Great Event");
      expect(result).toBe("my-great-event");
    });

    it("should remove special characters", () => {
      const result = generateEventSlug("Art & Music Festival!");
      expect(result).toBe("art-music-festival");
    });

    it("should handle multiple spaces and hyphens", () => {
      const result = generateEventSlug("Event    with    many    spaces");
      expect(result).toBe("event-with-many-spaces");
    });

    it("should remove leading and trailing hyphens", () => {
      const result = generateEventSlug("!!!Event Title!!!");
      expect(result).toBe("event-title");
    });

    it("should limit length to 60 characters", () => {
      const longTitle = "This is a very long event title that exceeds the sixty character limit for URL slugs";
      const result = generateEventSlug(longTitle);
      expect(result).toBe("this-is-a-very-long-event-title-that-exceeds-the-sixty");
      expect(result.length).toBeLessThanOrEqual(60);
    });

    it("should handle empty string", () => {
      const result = generateEventSlug("");
      expect(result).toBe("");
    });

    it("should handle only special characters", () => {
      const result = generateEventSlug("!@#$%^&*()");
      expect(result).toBe("");
    });

    it("should preserve numbers and letters", () => {
      const result = generateEventSlug("Event123 Test456");
      expect(result).toBe("event123-test456");
    });

    it("should handle mixed case with numbers", () => {
      const result = generateEventSlug("TechConf2024 Day1");
      expect(result).toBe("techconf2024-day1");
    });
  });
});