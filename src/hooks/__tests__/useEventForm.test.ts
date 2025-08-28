// ABOUTME: Hook tests for useEventForm
// ABOUTME: Tests form validation, submission, and field interactions

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useEventForm } from "../useEventForm";

// Mock react-hook-form
const mockUseForm = vi.fn();
vi.mock("react-hook-form", () => ({
  useForm: () => mockUseForm(),
}));

// Mock convex/react
const mockUseMutation = vi.fn();
vi.mock("convex/react", () => ({
  useMutation: () => mockUseMutation(),
}));

// Mock zodResolver
vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: vi.fn(() => vi.fn()),
}));

// Mock schemas
vi.mock("../schemas/eventSchema", () => ({
  eventFormSchema: {},
}));

vi.mock("../schemas/shared", () => ({
  sanitizeString: (str: string) => str.trim(),
}));

describe("useEventForm", () => {
  const mockTeamId = "team-1" as any;
  const mockCreateEvent = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  let mockFormMethods: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFormMethods = {
      register: vi.fn(),
      handleSubmit: vi.fn(),
      watch: vi.fn(() => ({
        title: "",
        description: "",
        venue: "",
        startTime: new Date(),
        endTime: new Date(),
        timezone: "Europe/Copenhagen",
        eventType: "other",
      })),
      setValue: vi.fn(),
      getFieldState: vi.fn(),
      formState: {
        errors: {},
        isValid: true,
        isSubmitting: false,
        isDirty: false,
      },
      reset: vi.fn(),
      clearErrors: vi.fn(),
      trigger: vi.fn(),
    };

    mockUseForm.mockReturnValue(mockFormMethods);
    mockUseMutation.mockReturnValue(mockCreateEvent);
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    expect(result.current.formData).toBeDefined();
    expect(result.current.formData.timezone).toBe("Europe/Copenhagen");
    expect(result.current.formData.eventType).toBe("other");
    expect(result.current.isValid).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("should handle input changes", () => {
    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    act(() => {
      result.current.handleInputChange("title", "New Event Title");
    });

    expect(mockFormMethods.setValue).toHaveBeenCalledWith(
      "title", 
      "New Event Title",
      { shouldDirty: true, shouldValidate: true }
    );
  });

  it("should validate fields", async () => {
    mockFormMethods.trigger.mockResolvedValue(true);
    
    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    let validationResult: string | null = "";
    
    await act(async () => {
      validationResult = await result.current.validateField("title");
    });

    expect(mockFormMethods.trigger).toHaveBeenCalledWith("title");
    expect(validationResult).toBeNull();
  });

  it("should return validation error when field is invalid", async () => {
    mockFormMethods.trigger.mockResolvedValue(false);
    mockFormMethods.formState.errors = {
      title: { message: "Title is required" }
    };
    
    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    let validationResult: string | null = "";
    
    await act(async () => {
      validationResult = await result.current.validateField("title");
    });

    expect(validationResult).toBe("Title is required");
  });

  it("should handle form submission successfully", async () => {
    const mockEventId = "event-123" as any;
    mockCreateEvent.mockResolvedValue(mockEventId);
    
    const mockHandleSubmit = vi.fn((callback) => {
      return () => callback({
        title: "Test Event",
        description: "Test Description", 
        venue: "Test Venue",
        startTime: new Date("2024-12-01T10:00:00Z"),
        endTime: new Date("2024-12-01T12:00:00Z"),
        timezone: "UTC",
        eventType: "workshop",
        maxCapacity: 50,
        registrationDeadline: new Date("2024-11-30T23:59:59Z"),
      });
    });
    
    mockFormMethods.handleSubmit = mockHandleSubmit;

    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Event",
        description: "Test Description",
        venue: "Test Venue",
        teamId: mockTeamId,
        eventType: "workshop",
        maxCapacity: 50,
        status: "draft",
      })
    );
    
    expect(mockOnSuccess).toHaveBeenCalledWith(mockEventId);
  });

  it("should handle form submission errors", async () => {
    const error = new Error("Network error");
    mockCreateEvent.mockRejectedValue(error);
    
    const mockHandleSubmit = vi.fn((callback) => {
      return () => callback({
        title: "Test Event",
        description: "Test Description",
        venue: "Test Venue", 
        startTime: new Date(),
        endTime: new Date(),
        timezone: "UTC",
        eventType: "workshop",
      });
    });
    
    mockFormMethods.handleSubmit = mockHandleSubmit;

    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockOnError).toHaveBeenCalledWith("Network error");
  });

  it("should clear field errors", () => {
    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    act(() => {
      result.current.clearFieldError("title");
    });

    expect(mockFormMethods.clearErrors).toHaveBeenCalledWith("title");
  });

  it("should reset form to initial values", () => {
    const initialData = {
      title: "Initial Title",
      description: "Initial Description",
    };

    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        initialData,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    act(() => {
      result.current.resetForm();
    });

    expect(mockFormMethods.reset).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Initial Title",
        description: "Initial Description",
        timezone: "Europe/Copenhagen",
        eventType: "other",
      })
    );
  });

  it("should transform RHF errors to legacy format", () => {
    mockFormMethods.formState.errors = {
      title: { message: "Title is required" },
      venue: { message: "Venue is required" },
    };

    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    expect(result.current.errors).toEqual({
      title: "Title is required",
      venue: "Venue is required",
    });
  });

  it("should handle timezone defaults correctly", () => {
    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    expect(result.current.formData.timezone).toBe("Europe/Copenhagen");
  });

  it("should sanitize input values on submission", async () => {
    const mockHandleSubmit = vi.fn((callback) => {
      return () => callback({
        title: "  Test Event  ",
        description: "  Test Description  ",
        venue: "  Test Venue  ",
        startTime: new Date(),
        endTime: new Date(),
        timezone: "UTC",
        eventType: "workshop",
      });
    });
    
    mockFormMethods.handleSubmit = mockHandleSubmit;

    const { result } = renderHook(() =>
      useEventForm({
        teamId: mockTeamId,
        onSuccess: mockOnSuccess,
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockCreateEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test Event", // Should be trimmed
        description: "Test Description", // Should be trimmed
        venue: "Test Venue", // Should be trimmed
      })
    );
  });
});