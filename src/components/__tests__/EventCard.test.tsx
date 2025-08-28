// ABOUTME: Component tests for EventCard
// ABOUTME: Tests event display, interactions, and action handlers

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EventWithDetails } from "../../types/events";
import { EventCard } from "../events/EventCard";

// Mock the typography components
vi.mock("../typography/typography", () => ({
  H4: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h4 className={className}>{children}</h4>
  ),
  Muted: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={className}>{children}</span>
  ),
  Small: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <small className={className}>{children}</small>
  ),
}));

// Mock EventStatusBadge
vi.mock("../events/EventStatusBadge", () => ({
  EventStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="status-badge">{status}</span>
  ),
}));

const mockEvent: EventWithDetails = {
  _id: "event-1" as any,
  _creationTime: Date.now(),
  title: "Music Festival 2024",
  description: "An amazing music festival",
  venue: "Central Park",
  startTime: Date.now() + 24 * 60 * 60 * 1000,
  endTime: Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
  timezone: "UTC",
  eventType: "music",
  status: "published",
  slug: "music-festival-2024",
  teamId: "team-1" as any,
  createdBy: "user-1" as any,
  createdAt: Date.now(),
  registrationCount: 25,
  maxCapacity: 100,
  canManage: true,
};

describe("EventCard", () => {
  it("should render event information correctly", () => {
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText("Music Festival 2024")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge")).toHaveTextContent("published");
    expect(screen.getByText("25 registered / 100")).toBeInTheDocument();
  });

  it("should show event type and icon", () => {
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText("Music")).toBeInTheDocument();
    expect(screen.getByText("🎵")).toBeInTheDocument();
  });

  it("should call navigate when card is clicked", () => {
    const mockNavigate = vi.fn();
    render(<EventCard event={mockEvent} navigate={mockNavigate} />);
    
    fireEvent.click(screen.getByRole("article")); // Card has implicit role
    expect(mockNavigate).toHaveBeenCalledWith("/events/event-1");
  });

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
    
    // Click the menu trigger
    const menuButton = screen.getByRole("button");
    fireEvent.click(menuButton);
    
    expect(screen.getByText("Edit Event")).toBeInTheDocument();
    expect(screen.getByText("View Public Page")).toBeInTheDocument();
    expect(screen.getByText("Copy Link")).toBeInTheDocument();
  });

  it("should call action handlers when menu items are clicked", () => {
    const mockOnEdit = vi.fn();
    const mockOnView = vi.fn();
    
    render(<EventCard event={mockEvent} onEdit={mockOnEdit} onView={mockOnView} />);
    
    // Open menu
    fireEvent.click(screen.getByRole("button"));
    
    // Click edit
    fireEvent.click(screen.getByText("Edit Event"));
    expect(mockOnEdit).toHaveBeenCalled();
  });

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
    expect(screen.getByText("25 registered")).toBeInTheDocument();
  });

  it("should not show management menu when user cannot manage", () => {
    const readOnlyEvent = {
      ...mockEvent,
      canManage: false,
    };
    
    render(<EventCard event={readOnlyEvent} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
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
    
    // Should show the emoji placeholder for music events
    expect(screen.getByText("🎵")).toBeInTheDocument();
  });

  it("should format date and time correctly", () => {
    render(<EventCard event={mockEvent} />);
    
    const dateTime = screen.getByText(/at/);
    expect(dateTime).toBeInTheDocument();
  });
});