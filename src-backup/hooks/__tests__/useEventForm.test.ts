// ABOUTME: Integration tests for useEventForm hook
// ABOUTME: Tests real hook behavior with actual dependencies and validation

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useEventForm } from "../useEventForm";
import type { Id } from "../../../convex/_generated/dataModel";

// Mock Convex API calls but not the actual hook logic
vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
}));

// Mock the Convex API
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    events: {
      createEvent: "mock-function-ref",
    },
  },
}));

describe("useEventForm", () => {
  const mockTeamId = "team-1" as Id<"teams">;
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with proper default values", () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      const { formData } = result.current;

      expect(formData.title).toBe("");
      expect(formData.description).toBe("");
      expect(formData.venue).toBe("");
      expect(formData.timezone).toBe("Europe/Copenhagen");
      expect(formData.eventType).toBe("other");
      expect(formData.maxCapacity).toBeUndefined();
      expect(formData.registrationDeadline).toBeUndefined();
      expect(formData.eventImage).toBeUndefined();
      
      // Check that start time is roughly 24 hours from now
      const now = Date.now();
      const expectedStart = now + 24 * 60 * 60 * 1000;
      expect(formData.startTime.getTime()).toBeCloseTo(expectedStart, -4); // Within 10 seconds
      
      // Check that end time is 2 hours after start time
      expect(formData.endTime.getTime()).toBe(
        formData.startTime.getTime() + 2 * 60 * 60 * 1000
      );
    });

    it("should initialize with custom initial data", () => {
      const initialData = {
        title: "Test Event",
        description: "Test Description",
        venue: "Test Venue",
        eventType: "workshop" as const,
        maxCapacity: 100,
      };

      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          initialData,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      const { formData } = result.current;

      expect(formData.title).toBe("Test Event");
      expect(formData.description).toBe("Test Description");
      expect(formData.venue).toBe("Test Venue");
      expect(formData.eventType).toBe("workshop");
      expect(formData.maxCapacity).toBe(100);
      expect(formData.timezone).toBe("Europe/Copenhagen"); // Default preserved
    });

    it("should initialize form state correctly", () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("form interactions", () => {
    it("should handle input changes via handleInputChange", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.handleInputChange("title", "Updated Title");
      });

      await waitFor(() => {
        expect(result.current.formData.title).toBe("Updated Title");
      });

      expect(result.current.isDirty).toBe(true);
    });

    it("should handle input changes via setFieldValue", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.setFieldValue("description", "Updated Description");
      });

      await waitFor(() => {
        expect(result.current.formData.description).toBe("Updated Description");
      });

      expect(result.current.isDirty).toBe(true);
    });

    it("should auto-adjust end time when start time changes", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      const newStartTime = new Date("2024-12-15T10:00:00Z");

      act(() => {
        result.current.setFieldValue("startTime", newStartTime);
      });

      await waitFor(() => {
        expect(result.current.formData.startTime).toEqual(newStartTime);
        expect(result.current.formData.endTime.getTime()).toBe(
          newStartTime.getTime() + 2 * 60 * 60 * 1000
        );
      });
    });

    it("should handle timezone changes", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.setFieldValue("timezone", "America/New_York");
      });

      await waitFor(() => {
        expect(result.current.formData.timezone).toBe("America/New_York");
      });
    });

    it("should handle event type changes", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      act(() => {
        result.current.setFieldValue("eventType", "music");
      });

      await waitFor(() => {
        expect(result.current.formData.eventType).toBe("music");
      });
    });
  });

  describe("validation", () => {
    it("should validate required fields", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      // Set an invalid title (too short)
      act(() => {
        result.current.setFieldValue("title", "Hi"); // Less than 3 chars
      });

      await waitFor(async () => {
        const error = await result.current.validateField("title");
        expect(error).toContain("Must be at least 3 characters");
      });
    });

    it("should validate title length", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      // Set a title that's too long
      const longTitle = "A".repeat(101); // More than 100 chars

      act(() => {
        result.current.setFieldValue("title", longTitle);
      });

      await waitFor(async () => {
        const error = await result.current.validateField("title");
        expect(error).toContain("Must be less than 100 characters");
      });
    });

    it("should validate description length", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      // Set a description that's too short
      act(() => {
        result.current.setFieldValue("description", "Short"); // Less than 10 chars
      });

      await waitFor(async () => {
        const error = await result.current.validateField("description");
        expect(error).toContain("Must be at least 10 characters");
      });
    });

    it("should validate date relationships", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      const startTime = new Date("2024-12-15T12:00:00Z");
      const endTime = new Date("2024-12-15T10:00:00Z"); // Before start time

      act(() => {
        result.current.setFieldValue("startTime", startTime);
        result.current.setFieldValue("endTime", endTime);
      });

      // Give the form time to process the changes
      await waitFor(() => {
        expect(result.current.formData.startTime).toEqual(startTime);
        expect(result.current.formData.endTime).toEqual(endTime);
      });

      // Validate end time - this should fail because it's before start time
      await waitFor(async () => {
        const error = await result.current.validateField("endTime");
        expect(error).toContain("End time must be after start time");
      });
    });

    it("should clear field errors", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      // Create an error first
      act(() => {
        result.current.setFieldValue("title", "Hi"); // Invalid
      });

      await waitFor(async () => {
        const error = await result.current.validateField("title");
        expect(error).toBeTruthy();
      });

      // Clear the error
      act(() => {
        result.current.clearFieldError("title");
      });

      // Error should be cleared
      expect(result.current.errors.title).toBeUndefined();
    });
  });

  describe("form reset", () => {
    it("should reset form to initial values", async () => {
      const initialData = {
        title: "Initial Title",
        description: "Initial Description",
        venue: "Initial Venue",
      };

      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          initialData,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      // Make some changes
      act(() => {
        result.current.setFieldValue("title", "Changed Title");
        result.current.setFieldValue("description", "Changed Description");
      });

      await waitFor(() => {
        expect(result.current.formData.title).toBe("Changed Title");
        expect(result.current.isDirty).toBe(true);
      });

      // Reset the form
      act(() => {
        result.current.resetForm();
      });

      await waitFor(() => {
        expect(result.current.formData.title).toBe("Initial Title");
        expect(result.current.formData.description).toBe("Initial Description");
        expect(result.current.formData.venue).toBe("Initial Venue");
        expect(result.current.isDirty).toBe(false);
      });
    });

    it("should reset form without initial data", async () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      // Make changes
      act(() => {
        result.current.setFieldValue("title", "Changed Title");
        result.current.setFieldValue("eventType", "music");
      });

      await waitFor(() => {
        expect(result.current.formData.title).toBe("Changed Title");
        expect(result.current.formData.eventType).toBe("music");
      });

      // Reset the form
      act(() => {
        result.current.resetForm();
      });

      await waitFor(() => {
        expect(result.current.formData.title).toBe("");
        expect(result.current.formData.eventType).toBe("other");
        expect(result.current.isDirty).toBe(false);
      });
    });
  });

  describe("React Hook Form integration", () => {
    it("should provide register function", () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      expect(typeof result.current.register).toBe("function");
    });

    it("should provide watch function", () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      expect(typeof result.current.watch).toBe("function");
    });

    it("should provide setValue function", () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      expect(typeof result.current.setValue).toBe("function");
    });

    it("should provide formState", () => {
      const { result } = renderHook(() =>
        useEventForm({
          teamId: mockTeamId,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        })
      );

      expect(result.current.formState).toBeDefined();
      expect(typeof result.current.formState.isValid).toBe("boolean");
      expect(typeof result.current.formState.isSubmitting).toBe("boolean");
      expect(typeof result.current.formState.isDirty).toBe("boolean");
    });
  });
});