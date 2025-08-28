// ABOUTME: Component tests for UserMenu
// ABOUTME: Tests user menu interactions, team switching, and authentication

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { UserMenu } from "../UserMenu";

// Mock all the hooks and external dependencies
vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({
    signOut: vi.fn(),
  }),
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock components
vi.mock("../typography/typography", () => ({
  Small: ({ children }: { children: React.ReactNode }) => <small>{children}</small>,
}));

vi.mock("../ThemeToggle", () => ({
  ThemeToggle: () => <button>Theme Toggle</button>,
}));

import { useQuery, useMutation } from "convex/react";

const mockUseQuery = useQuery as any;
const mockUseMutation = useMutation as any;

describe("UserMenu", () => {
  const mockNavigate = vi.fn();
  const mockSetCurrentTeam = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseQuery.mockImplementation((api: any) => {
      if (api.toString().includes("viewer")) {
        return {
          _id: "user-1",
          name: "John Doe",
          email: "john@example.com",
        };
      }
      if (api.toString().includes("getCurrentTeam")) {
        return {
          _id: "team-1",
          name: "Current Team",
        };
      }
      if (api.toString().includes("getMyTeams")) {
        return [
          {
            _id: "team-1",
            name: "Current Team",
            role: "owner",
            isCurrentTeam: true,
            primaryColor: "#3b82f6",
          },
          {
            _id: "team-2", 
            name: "Other Team",
            role: "member",
            isCurrentTeam: false,
            primaryColor: "#ef4444",
          },
        ];
      }
      return null;
    });

    mockUseMutation.mockReturnValue(mockSetCurrentTeam);
  });

  it("should render user avatar and initials", () => {
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        John Doe
      </UserMenu>
    );
    
    expect(screen.getByText("JD")).toBeInTheDocument(); // Initials
  });

  it("should show user menu when clicked", () => {
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        John Doe
      </UserMenu>
    );
    
    // Click the avatar button
    fireEvent.click(screen.getByRole("button", { name: /toggle user menu/i }));
    
    expect(screen.getByText("Team settings")).toBeInTheDocument();
    expect(screen.getByText("Switch team")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Log out")).toBeInTheDocument();
  });

  it("should display favorite color", () => {
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        John Doe
      </UserMenu>
    );
    
    fireEvent.click(screen.getByRole("button", { name: /toggle user menu/i }));
    
    expect(screen.getByText("Favorite color:")).toBeInTheDocument();
    const colorBox = screen.getByText("Favorite color:").nextSibling;
    expect(colorBox).toHaveStyle({ backgroundColor: "#ff0000" });
  });

  it("should show team switching options", () => {
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        John Doe
      </UserMenu>
    );
    
    // Open main menu
    fireEvent.click(screen.getByRole("button", { name: /toggle user menu/i }));
    
    // Hover over switch team to open submenu
    fireEvent.mouseOver(screen.getByText("Switch team"));
    
    expect(screen.getByText("Current Team")).toBeInTheDocument();
    expect(screen.getByText("Other Team")).toBeInTheDocument();
    expect(screen.getByText("owner")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("should handle team switching", async () => {
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        John Doe
      </UserMenu>
    );
    
    // Open menu and switch team submenu
    fireEvent.click(screen.getByRole("button", { name: /toggle user menu/i }));
    fireEvent.mouseOver(screen.getByText("Switch team"));
    
    // Click on "Other Team"
    fireEvent.click(screen.getByText("Other Team"));
    
    await waitFor(() => {
      expect(mockSetCurrentTeam).toHaveBeenCalledWith({ teamId: "team-2" });
    });
  });

  it("should navigate to team settings", () => {
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        John Doe
      </UserMenu>
    );
    
    fireEvent.click(screen.getByRole("button", { name: /toggle user menu/i }));
    fireEvent.click(screen.getByText("Team settings"));
    
    expect(mockNavigate).toHaveBeenCalledWith("/team/team-1");
  });

  it("should navigate to create team", () => {
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        John Doe
      </UserMenu>
    );
    
    fireEvent.click(screen.getByRole("button", { name: /toggle user menu/i }));
    fireEvent.mouseOver(screen.getByText("Switch team"));
    fireEvent.click(screen.getByText("Create team"));
    
    expect(mockNavigate).toHaveBeenCalledWith("/team/create");
  });

  it("should navigate to settings", () => {
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        John Doe
      </UserMenu>
    );
    
    fireEvent.click(screen.getByRole("button", { name: /toggle user menu/i }));
    fireEvent.click(screen.getByText("Settings"));
    
    expect(mockNavigate).toHaveBeenCalledWith("/settings");
  });

  it("should render in compact mode", () => {
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate} compact>
        John Doe
      </UserMenu>
    );
    
    // In compact mode, children are not displayed outside the dropdown
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    
    // But should appear in dropdown when opened
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should handle user with no name gracefully", () => {
    mockUseQuery.mockImplementation((api: any) => {
      if (api.toString().includes("viewer")) {
        return {
          _id: "user-1",
          email: "john@example.com", // No name
        };
      }
      return null;
    });
    
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        Test User
      </UserMenu>
    );
    
    // Should show first letter of email as initial
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("should only show team switching when multiple teams exist", () => {
    mockUseQuery.mockImplementation((api: any) => {
      if (api.toString().includes("getMyTeams")) {
        return [
          {
            _id: "team-1",
            name: "Only Team",
            role: "owner",
            isCurrentTeam: true,
          },
        ];
      }
      return null;
    });
    
    render(
      <UserMenu favoriteColor="#ff0000" navigate={mockNavigate}>
        John Doe
      </UserMenu>
    );
    
    fireEvent.click(screen.getByRole("button", { name: /toggle user menu/i }));
    
    // Should not show switch team option with only one team
    expect(screen.queryByText("Switch team")).not.toBeInTheDocument();
  });
});