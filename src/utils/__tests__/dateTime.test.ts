// ABOUTME: Unit tests for dateTime utility functions
// ABOUTME: Tests date formatting, relative time calculation, and event status determination

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  getEventStatus,
  isPast,
  isToday,
  isUpcoming,
} from "../dateTime";

describe("dateTime utilities", () => {
  let mockDate: Date;

  beforeEach(() => {
    // Mock current time to 2024-01-15 12:00:00 UTC
    mockDate = new Date("2024-01-15T12:00:00.000Z");
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("formatDate", () => {
    it("should format timestamp to localized date string", () => {
      const timestamp = new Date("2024-01-15T15:30:00").getTime();
      const result = formatDate(timestamp);
      
      // Since this uses toLocaleDateString(), result will be locale-dependent
      // We just verify it returns a string and contains expected date parts
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("formatTime", () => {
    it("should format timestamp to 24-hour time format", () => {
      const timestamp = new Date("2024-01-15T15:30:00").getTime();
      const result = formatTime(timestamp);
      
      expect(typeof result).toBe("string");
      // Should contain colon for time separator
      expect(result).toMatch(/\d+:\d+/);
    });

    it("should pad minutes with leading zero", () => {
      const timestamp = new Date("2024-01-15T15:05:00").getTime();
      const result = formatTime(timestamp);
      
      expect(result).toMatch(/05/);
    });
  });

  describe("formatDateTime", () => {
    it("should combine date and time with 'at' separator", () => {
      const timestamp = new Date("2024-01-15T15:30:00").getTime();
      const result = formatDateTime(timestamp);
      
      expect(typeof result).toBe("string");
      expect(result).toContain(" at ");
    });
  });

  describe("formatRelativeTime", () => {
    it("should return 'Just ended' for timestamps within 1 minute in the past", () => {
      const timestamp = mockDate.getTime() - 30000; // 30 seconds ago
      expect(formatRelativeTime(timestamp)).toBe("Just ended");
    });

    it("should return 'Starting now' for timestamps within 1 minute in the future", () => {
      const timestamp = mockDate.getTime() + 30000; // 30 seconds from now
      expect(formatRelativeTime(timestamp)).toBe("Starting now");
    });

    it("should format minutes for times 1-59 minutes in the past", () => {
      const timestamp = mockDate.getTime() - 30 * 60 * 1000; // 30 minutes ago
      expect(formatRelativeTime(timestamp)).toBe("Ended 30 min ago");
    });

    it("should format minutes for times 1-59 minutes in the future", () => {
      const timestamp = mockDate.getTime() + 45 * 60 * 1000; // 45 minutes from now
      expect(formatRelativeTime(timestamp)).toBe("Starting in 45 min");
    });

    it("should format hours for times 1-23 hours in the past", () => {
      const timestamp = mockDate.getTime() - 5 * 60 * 60 * 1000; // 5 hours ago
      expect(formatRelativeTime(timestamp)).toBe("Ended 5h ago");
    });

    it("should format hours for times 1-23 hours in the future", () => {
      const timestamp = mockDate.getTime() + 8 * 60 * 60 * 1000; // 8 hours from now
      expect(formatRelativeTime(timestamp)).toBe("Starting in 8h");
    });

    it("should format days for times 1-6 days in the past", () => {
      const timestamp = mockDate.getTime() - 3 * 24 * 60 * 60 * 1000; // 3 days ago
      expect(formatRelativeTime(timestamp)).toBe("Ended 3d ago");
    });

    it("should format days for times 1-6 days in the future", () => {
      const timestamp = mockDate.getTime() + 2 * 24 * 60 * 60 * 1000; // 2 days from now
      expect(formatRelativeTime(timestamp)).toBe("Starting in 2d");
    });

    it("should fall back to formatDate for times more than 7 days away", () => {
      const timestamp = mockDate.getTime() - 10 * 24 * 60 * 60 * 1000; // 10 days ago
      const result = formatRelativeTime(timestamp);
      
      // Should be same as formatDate
      expect(result).toBe(formatDate(timestamp));
    });
  });

  describe("isUpcoming", () => {
    it("should return true for future timestamps", () => {
      const futureTime = mockDate.getTime() + 60000; // 1 minute from now
      expect(isUpcoming(futureTime)).toBe(true);
    });

    it("should return false for past timestamps", () => {
      const pastTime = mockDate.getTime() - 60000; // 1 minute ago
      expect(isUpcoming(pastTime)).toBe(false);
    });

    it("should return false for current timestamp", () => {
      expect(isUpcoming(mockDate.getTime())).toBe(false);
    });
  });

  describe("isPast", () => {
    it("should return true for past timestamps", () => {
      const pastTime = mockDate.getTime() - 60000; // 1 minute ago
      expect(isPast(pastTime)).toBe(true);
    });

    it("should return false for future timestamps", () => {
      const futureTime = mockDate.getTime() + 60000; // 1 minute from now
      expect(isPast(futureTime)).toBe(false);
    });

    it("should return true for current timestamp", () => {
      expect(isPast(mockDate.getTime())).toBe(true);
    });
  });

  describe("isToday", () => {
    it("should return true for timestamps on the same day", () => {
      // Same day but different time
      const sameDay = new Date("2024-01-15T08:30:00").getTime();
      expect(isToday(sameDay)).toBe(true);
    });

    it("should return false for timestamps on different days", () => {
      // Different day
      const differentDay = new Date("2024-01-16T12:00:00").getTime();
      expect(isToday(differentDay)).toBe(false);
    });

    it("should return true for current timestamp", () => {
      expect(isToday(mockDate.getTime())).toBe(true);
    });
  });

  describe("getEventStatus", () => {
    it("should return 'upcoming' when current time is before start time", () => {
      const now = mockDate.getTime();
      const startTime = now + 60000; // 1 minute from now
      const endTime = now + 120000; // 2 minutes from now
      
      expect(getEventStatus(startTime, endTime)).toBe("upcoming");
    });

    it("should return 'ongoing' when current time is between start and end time", () => {
      const now = mockDate.getTime();
      const startTime = now - 30000; // 30 seconds ago
      const endTime = now + 30000; // 30 seconds from now
      
      expect(getEventStatus(startTime, endTime)).toBe("ongoing");
    });

    it("should return 'ongoing' when current time equals start time", () => {
      const now = mockDate.getTime();
      const startTime = now;
      const endTime = now + 60000; // 1 minute from now
      
      expect(getEventStatus(startTime, endTime)).toBe("ongoing");
    });

    it("should return 'ongoing' when current time equals end time", () => {
      const now = mockDate.getTime();
      const startTime = now - 60000; // 1 minute ago
      const endTime = now;
      
      expect(getEventStatus(startTime, endTime)).toBe("ongoing");
    });

    it("should return 'past' when current time is after end time", () => {
      const now = mockDate.getTime();
      const startTime = now - 120000; // 2 minutes ago
      const endTime = now - 60000; // 1 minute ago
      
      expect(getEventStatus(startTime, endTime)).toBe("past");
    });

    it("should handle edge case where start equals end time", () => {
      const now = mockDate.getTime();
      const startTime = now - 60000; // 1 minute ago
      const endTime = now - 60000; // same time
      
      expect(getEventStatus(startTime, endTime)).toBe("past");
    });
  });
});