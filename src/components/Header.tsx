import { ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import { H4 } from "@/components/typography/typography";

interface HeaderProps {
  menu?: ReactNode;
  navigate?: (to: string) => void;
}

export function Header({ menu, navigate }: HeaderProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const userTeams = useQuery(api.teams.getMyTeams, isAuthenticated ? {} : "skip");

  const handleNavigation = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigate) {
      navigate(to);
    } else {
      window.location.href = to;
    }
  };

  return (
    <header className="sticky top-0 z-10 flex min-h-20 border-b bg-background/80 backdrop-blur">
      <nav className="container w-full justify-between flex flex-row items-center gap-6">
        <div className="flex items-center gap-6 md:gap-10">
          <a href="/" onClick={handleNavigation("/")}>
            <H4 className="">Event planner</H4>
          </a>
          {!isLoading && isAuthenticated && (
            <div className="flex items-center gap-4 text-sm">
              <a
                href="/"
                onClick={handleNavigation("/")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Home
              </a>
              <a
                href="/events"
                onClick={handleNavigation("/events")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Events
              </a>
              <a
                href={userTeams && userTeams.length > 0 ? `/team/${userTeams[0]._id}` : "/team"}
                onClick={handleNavigation(userTeams && userTeams.length > 0 ? `/team/${userTeams[0]._id}` : "/team")}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Settings
              </a>
            </div>
          )}
          {!isLoading && !isAuthenticated && (
            <div className="flex items-center gap-4 text-sm">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleNavigation("/sign-in")}
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
        {menu}
      </nav>
    </header>
  );
}