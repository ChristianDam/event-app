import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserMenu } from "./UserMenu";
import { CalendarIcon, MessageCircleIcon, HomeIcon, PlusIcon, CheckIcon, CirclePlusIcon } from "lucide-react";
import { Header } from "./Header";
import { toast } from "sonner";
import { useCallback } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface AppSidebarProps {
  navigate?: (to: string) => void;
  currentPath?: string;
}

export function AppSidebar({ navigate, currentPath }: AppSidebarProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const currentUser = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");
  const currentTeam = useQuery(api.users.getCurrentTeam, isAuthenticated ? {} : "skip");
  const allTeams = useQuery(api.teams.getMyTeams, isAuthenticated ? {} : "skip");
  const setCurrentTeam = useMutation(api.users.setCurrentTeam);

  const handleNavigation = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    // Close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }
    if (navigate) {
      navigate(to);
    } else {
      window.location.href = to;
    }
  };

  const handleTeamSwitch = useCallback(async (teamId: Id<"teams">) => {
    try {
      await setCurrentTeam({ teamId });
      toast.success('Team switched successfully', {
        description: `You are now working with ${allTeams?.find(t => t._id === teamId)?.name}.`,
      });
    } catch (error) {
      console.error("Failed to switch teams:", error);
      toast.error('Failed to switch teams', {
        description: 'Please try again or check your connection.',
      });
    }
  }, [setCurrentTeam, allTeams]);

  const handleCreateTeam = useCallback(() => {
    // Close mobile sidebar when navigating
    if (isMobile) {
      setOpenMobile(false);
    }
    if (navigate) {
      navigate("/team/create");
    } else {
      window.location.href = "/team/create";
    }
  }, [navigate, isMobile, setOpenMobile]);

  const createDraftEvent = useMutation(api.events.createDraftEvent);

  const handleCreateEvent = useCallback(async () => {
    try {
      const eventId = await createDraftEvent();
      toast.success('Draft event created', {
        description: 'Your event draft is ready for editing.',
      });
      // Close mobile sidebar when navigating
      if (isMobile) {
        setOpenMobile(false);
      }
      if (navigate) {
        navigate(`/events/${eventId}`);
      }
    } catch (error) {
      console.error('Failed to create draft event:', error);
      toast.error('Failed to create event', {
        description: 'Please ensure you have a team selected and try again.',
      });
    }
  }, [createDraftEvent, navigate, isMobile, setOpenMobile]);

  const isActive = useCallback((path: string) => {
    if (!currentPath) return false;
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  }, [currentPath]);

  if (isLoading) {
    return (
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  if (!isAuthenticated) {
    return <Header navigate={navigate} />;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-[11px] mb-2">
        {/* Compact Team Switcher - Avatar Only */}
        {currentTeam && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex items-center justify-center w-12 h-12 rounded-md hover:bg-sidebar-accent transition-colors"
                aria-label={`Switch from ${currentTeam.name} team`}
              >
                {currentTeam.logoUrl ? (
                  <img 
                    src={currentTeam.logoUrl}
                    alt={`${currentTeam.name} logo`}
                    className="w-10 aspect-square rounded object-cover"
                  />
                ) : (
                  <div 
                    className="w-10 h-10 rounded flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: currentTeam.primaryColor || "#3b82f6" }}
                  >
                    {currentTeam.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="start">
              <DropdownMenuItem onClick={handleNavigation(`/team/${currentTeam._id}`)} className="flex items-center gap-3 p-2" role="menuitem">
                <span>Team settings</span>
              </DropdownMenuItem>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                Switch team
              </div>
              {allTeams?.map((team) => (
                <DropdownMenuItem
                  key={team._id}
                  onClick={() => handleTeamSwitch(team._id)}
                  className="flex items-center gap-3 p-2"
                  role="menuitem"
                >
                  {team.logoUrl ? (
                    <img 
                      src={team.logoUrl}
                      alt={`${team.name} logo`}
                      className="w-6 h-6 rounded object-cover border"
                    />
                  ) : (
                    <div 
                      className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: team.primaryColor || "#3b82f6" }}
                    >
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {team.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {team.role}
                    </div>
                  </div>
                  {team.isCurrentTeam && (
                    <CheckIcon className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCreateTeam} className="flex items-center gap-3 p-2" role="menuitem">
                <div className="w-6 h-6 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <PlusIcon className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="font-medium text-sm">Create team</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarHeader>
        <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-6 px-[11px] items-center" role="navigation" aria-label="Main navigation">
                <SidebarMenuButton 
                  className="w-12 h-12 justify-center"
                  tooltip="Home" 
                  onClick={handleNavigation("/")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleNavigation("/")(e as any);
                    }
                  }}
                  isActive={isActive("/")}
                  aria-label="Go to home page"
                  tabIndex={0}
                >
                  <HomeIcon aria-hidden="true" />
                </SidebarMenuButton>

                <SidebarMenuButton 
                  className="w-12 h-12 justify-center"
                  tooltip="Events" 
                  onClick={handleNavigation("/events")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleNavigation("/events")(e as any);
                    }
                  }}
                  isActive={isActive("/events")}
                  aria-label="Go to events page"
                  tabIndex={0}
                >
                  <CalendarIcon aria-hidden="true" />
                </SidebarMenuButton>

                <SidebarMenuButton 
                  className="w-12 h-12 justify-center"
                  tooltip="Messages" 
                  onClick={handleNavigation("/messages")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleNavigation("/messages")(e as any);
                    }
                  }}
                  isActive={isActive("/messages")}
                  aria-label="Go to messages page"
                  tabIndex={0}
                >
                  <MessageCircleIcon aria-hidden="true" />
                </SidebarMenuButton>

                <SidebarMenuButton 
                  className="w-12 h-12 justify-center" 
                  tooltip="Create event" 
                  onClick={handleCreateEvent}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      void handleCreateEvent();
                    }
                  }}
                  aria-label="Create new event"
                  tabIndex={0}
                >
                  <CirclePlusIcon aria-hidden="true" />
                </SidebarMenuButton>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-[11px] py-4 flex justify-center items-center">
        {/* Compact User Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <UserMenu
            favoriteColor={currentUser?.favoriteColor}
            compact={true}
          >

            {(currentUser?.name || currentUser?.email)?.charAt(0).toUpperCase() || "U"}
          </UserMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}