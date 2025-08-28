// ABOUTME: Unit tests for core dateTime utility functions
// ABOUTME: Tests essential date operations and event status logic

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatRelativeTime,
  getEventStatus,
  isPast,
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




  describe("formatRelativeTime", () => {
    it("should format relative time ranges", () => {
      expect(formatRelativeTime(mockDate.getTime() - 30000)).toBe("Just ended");
      expect(formatRelativeTime(mockDate.getTime() + 30000)).toBe("Starting now");
      expect(formatRelativeTime(mockDate.getTime() - 30 * 60 * 1000)).toBe("Ended 30 min ago");
      expect(formatRelativeTime(mockDate.getTime() + 45 * 60 * 1000)).toBe("Starting in 45 min");
      expect(formatRelativeTime(mockDate.getTime() - 5 * 60 * 60 * 1000)).toBe("Ended 5h ago");
    });
  });

  describe("isUpcoming", () => {
    it("should check if timestamp is in future", () => {
      expect(isUpcoming(mockDate.getTime() + 60000)).toBe(true);
      expect(isUpcoming(mockDate.getTime() - 60000)).toBe(false);
      expect(isUpcoming(mockDate.getTime())).toBe(false);
    });
  });

  describe("isPast", () => {
    it("should check if timestamp is in past", () => {
      expect(isPast(mockDate.getTime() - 60000)).toBe(true);
      expect(isPast(mockDate.getTime() + 60000)).toBe(false);
      expect(isPast(mockDate.getTime())).toBe(true);
    });
  });


  describe("getEventStatus", () => {
    it("should determine event status based on time", () => {
      const now = mockDate.getTime();
      
      // Upcoming
      expect(getEventStatus(now + 60000, now + 120000)).toBe("upcoming");
      
      // Ongoing
      expect(getEventStatus(now - 30000, now + 30000)).toBe("ongoing");
      expect(getEventStatus(now, now + 60000)).toBe("ongoing");
      
      // Past
      expect(getEventStatus(now - 120000, now - 60000)).toBe("past");
    });
  });
});
