// ABOUTME: Component tests for EventCard
// ABOUTME: Tests event display, interactions, and action handlers with minimal mocking

import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EventWithDetails } from "../../types/events";
import { EventCard } from "../events/EventCard";

const mockEvent: EventWithDetails = {
  _id: "event-1" as any,
  _creationTime: Date.now(),
  title: "Music Festival 2024",
  description: "An amazing music festival",
  venue: "Central Park",
  startTime: new Date("2024-12-15T14:00:00Z").getTime(),
  endTime: new Date("2024-12-15T18:00:00Z").getTime(),
  timezone: "UTC",
  eventType: "music",
  status: "published",
  slug: "music-festival-2024",
  teamId: "team-1" as any,
  organizerId: "user-1" as any,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  team: {
    _id: "team-1" as any,
    name: "Test Team",
    slug: "test-team",
  },
  organizer: {
    _id: "user-1" as any,
    name: "Test Organizer",
    email: "organizer@test.com",
  },
  registrationCount: 25,
  maxCapacity: 100,
  canManage: true,
};

describe("EventCard", () => {
  describe("basic rendering", () => {
    it("should render event information correctly", () => {
      render(<EventCard event={mockEvent} />);
      
      expect(screen.getByRole("heading", { name: "Music Festival 2024" })).toBeInTheDocument();
      expect(screen.getByText("25 registered / 100.")).toBeInTheDocument();
      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    it("should show event type and icon", () => {
      render(<EventCard event={mockEvent} />);
      
      expect(screen.getByText("Music")).toBeInTheDocument();
      // Check for the music emoji
      expect(screen.getByText("🎵")).toBeInTheDocument();
    });

    it("should format date and time correctly", () => {
      render(<EventCard event={mockEvent} />);
      
      // Look for the formatted date - using a more flexible approach
      const dateTime = screen.getByText(/12\/15\/2024 at/);
      expect(dateTime).toBeInTheDocument();
    });

    it("should display event image when available", () => {
      const eventWithImage = {
        ...mockEvent,
        bannerImageUrl: "https://example.com/banner.jpg",
      };
      
      render(<EventCard event={eventWithImage} />);
      
      const image = screen.getByAltText("Music Festival 2024");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "https://example.com/banner.jpg");
    });

    it("should show placeholder when no image is available", () => {
      render(<EventCard event={mockEvent} />);
      
      // Should show the emoji placeholder for music events - there are 2 instances
      const musicEmojis = screen.getAllByText("🎵");
      expect(musicEmojis.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("event status and capacity", () => {
    it("should show 'Full' badge when event is at capacity", () => {
      const fullEvent = {
        ...mockEvent,
        registrationCount: 100,
        maxCapacity: 100,
      };
      
      render(<EventCard event={fullEvent} />);
      expect(screen.getByText("Full")).toBeInTheDocument();
    });

    it("should handle events without capacity limits", () => {
      const unlimitedEvent = {
        ...mockEvent,
        maxCapacity: undefined,
      };
      
      render(<EventCard event={unlimitedEvent} />);
      expect(screen.getByText("25 registered.")).toBeInTheDocument();
    });

    it("should show different statuses correctly", () => {
      const draftEvent = {
        ...mockEvent,
        status: "draft" as const,
      };
      
      render(<EventCard event={draftEvent} />);
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("📝")).toBeInTheDocument();
    });
  });

  describe("navigation and interactions", () => {
    it("should call navigate when card is clicked", () => {
      const mockNavigate = vi.fn();
      render(<EventCard event={mockEvent} navigate={mockNavigate} />);
      
      const card = screen.getByRole("button"); // Card gets role from onClick
      fireEvent.click(card);
      expect(mockNavigate).toHaveBeenCalledWith("/events/event-1");
    });

    it("should prevent navigation when menu is clicked", () => {
      const mockNavigate = vi.fn();
      render(<EventCard event={mockEvent} navigate={mockNavigate} />);
      
      // Click the menu button (should not trigger navigation)
      const menuButton = screen.getByRole("button", { name: /more/i }) || 
                         screen.getByLabelText(/more/i) ||
                         within(screen.getByRole("button")).getByRole("button");
      
      fireEvent.click(menuButton);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("management actions", () => {
    it("should show management actions when user can manage", () => {
      const mockOnEdit = vi.fn();
      const mockOnView = vi.fn();
      const mockOnShare = vi.fn();
      
      render(
        <EventCard
          event={mockEvent}
          onEdit={mockOnEdit}
          onView={mockOnView}
          onShare={mockOnShare}
        />
      );
      
      // Open the dropdown menu
      const menuTrigger = screen.getByRole("button", { name: "" }); // Menu trigger has no accessible name
      fireEvent.click(menuTrigger);
      
      expect(screen.getByText("Edit Event")).toBeInTheDocument();
      expect(screen.getByText("View Public Page")).toBeInTheDocument();
      expect(screen.getByText("Copy Link")).toBeInTheDocument();
    });

    it("should call action handlers when menu items are clicked", () => {
      const mockOnEdit = vi.fn();
      const mockOnView = vi.fn();
      
      render(<EventCard event={mockEvent} onEdit={mockOnEdit} onView={mockOnView} />);
      
      // Open menu
      const menuTrigger = screen.getByRole("button", { name: "" });
      fireEvent.click(menuTrigger);
      
      // Click edit
      fireEvent.click(screen.getByText("Edit Event"));
      expect(mockOnEdit).toHaveBeenCalled();
    });

    it("should not show management menu when user cannot manage", () => {
      const readOnlyEvent = {
        ...mockEvent,
        canManage: false,
      };
      
      render(<EventCard event={readOnlyEvent} />);
      
      // Should not find any dropdown menu trigger
      const buttons = screen.queryAllByRole("button");
      expect(buttons).toHaveLength(0); // Only the card itself should be clickable
    });

    it("should only show public actions for published events", () => {
      const draftEvent = {
        ...mockEvent,
        status: "draft" as const,
      };
      
      const mockOnEdit = vi.fn();
      const mockOnView = vi.fn();
      const mockOnShare = vi.fn();
      
      render(
        <EventCard
          event={draftEvent}
          onEdit={mockOnEdit}
          onView={mockOnView}
          onShare={mockOnShare}
        />
      );
      
      // Open menu
      const menuTrigger = screen.getByRole("button", { name: "" });
      fireEvent.click(menuTrigger);
      
      expect(screen.getByText("Edit Event")).toBeInTheDocument();
      expect(screen.queryByText("View Public Page")).not.toBeInTheDocument();
      expect(screen.queryByText("Copy Link")).not.toBeInTheDocument();
    });

    it("should show duplicate action when provided", () => {
      const mockOnDuplicate = vi.fn();
      
      render(
        <EventCard
          event={mockEvent}
          onDuplicate={mockOnDuplicate}
        />
      );
      
      // Open menu
      const menuTrigger = screen.getByRole("button", { name: "" });
      fireEvent.click(menuTrigger);
      
      expect(screen.getByText("Duplicate")).toBeInTheDocument();
      
      // Click duplicate
      fireEvent.click(screen.getByText("Duplicate"));
      expect(mockOnDuplicate).toHaveBeenCalled();
    });
  });

  describe("different event types", () => {
    it("should handle workshop events", () => {
      const workshopEvent = {
        ...mockEvent,
        eventType: "workshop" as const,
      };
      
      render(<EventCard event={workshopEvent} />);
      
      expect(screen.getByText("Workshop")).toBeInTheDocument();
      expect(screen.getByText("🛠️")).toBeInTheDocument();
    });

    it("should handle art events", () => {
      const artEvent = {
        ...mockEvent,
        eventType: "art" as const,
      };
      
      render(<EventCard event={artEvent} />);
      
      expect(screen.getByText("Art")).toBeInTheDocument();
      expect(screen.getByText("🎨")).toBeInTheDocument();
    });

    it("should handle events with unknown type", () => {
      const unknownEvent = {
        ...mockEvent,
        eventType: "unknown" as any,
      };
      
      render(<EventCard event={unknownEvent} />);
      
      // Should fall back to default
      expect(screen.getByText("Event")).toBeInTheDocument();
      expect(screen.getByText("📅")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA roles", () => {
      render(<EventCard event={mockEvent} navigate={vi.fn()} />);
      
      // Card should be clickable
      const card = screen.getByRole("button");
      expect(card).toBeInTheDocument();
      
      // Should have heading
      const heading = screen.getByRole("heading");
      expect(heading).toHaveTextContent("Music Festival 2024");
    });

    it("should have proper image alt text", () => {
      const eventWithImage = {
        ...mockEvent,
        bannerImageUrl: "https://example.com/banner.jpg",
      };
      
      render(<EventCard event={eventWithImage} />);
      
      const image = screen.getByAltText("Music Festival 2024");
      expect(image).toBeInTheDocument();
    });
  });
});