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
import { UserMenu } from "./UserMenu";
import { CalendarIcon, MessageCircleIcon, HomeIcon, CirclePlusIcon } from "lucide-react";
import { Header } from "./Header";
import { toast } from "sonner";
import { useCallback } from "react";

interface AppSidebarProps {
  navigate?: (to: string) => void;
  currentPath?: string;
}

export function AppSidebar({ navigate, currentPath }: AppSidebarProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const currentUser = useQuery(api.users.viewer, isAuthenticated ? {} : "skip");

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
              <div 
                className="w-12 h-12 rounded bg-muted"
              >
              </div>
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
        <UserMenu
          favoriteColor={currentUser?.favoriteColor}
          navigate={navigate!}
          compact={true}
        >
          {(currentUser?.name || currentUser?.email)?.charAt(0).toUpperCase() || "U"}
        </UserMenu>
      </SidebarFooter>
    </Sidebar>
  );
}