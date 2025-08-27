import { useAuthActions } from "@convex-dev/auth/react";
import { CheckIcon, PlusIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "convex/react";
import { type ReactNode, useCallback, useState } from "react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Small } from "./typography/typography";

export function UserMenu({
  favoriteColor,
  children,
  navigate,
  compact = false,
}: {
  favoriteColor: string | undefined;
  children: ReactNode;
  navigate: (to: string) => void;
  compact?: boolean;
}) {
  const currentUser = useQuery(api.users.viewer);
  const currentTeam = useQuery(api.users.getCurrentTeam);
  const allTeams = useQuery(api.teams.getMyTeams);
  const setCurrentTeam = useMutation(api.users.setCurrentTeam);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleTeamSwitch = useCallback(
    async (teamId: Id<"teams">) => {
      try {
        await setCurrentTeam({ teamId });
        toast.success("Team switched successfully", {
          description: `You are now working with ${allTeams?.find((t) => t._id === teamId)?.name}.`,
        });
      } catch (error) {
        console.error("Failed to switch teams:", error);
        toast.error("Failed to switch teams", {
          description: "Please try again or check your connection.",
        });
      }
    },
    [setCurrentTeam, allTeams]
  );

  const handleCreateTeam = useCallback(() => {
    navigate("/team/create");
  }, [navigate]);

  return (
    <div
      className={compact ? "" : "flex items-center gap-2 text-sm font-medium"}
    >
      {!compact && children}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {compact ? (
            <button className="w-8 h-8 rounded-full hover:opacity-80 transition-opacity">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser?.image || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                  {getInitials(currentUser?.name, currentUser?.email)}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full p-0 h-10 w-10"
            >
              <Avatar className="w-full h-full">
                <AvatarImage src={currentUser?.image || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold">
                  {getInitials(currentUser?.name, currentUser?.email)}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            {compact ? currentUser?.name || currentUser?.email : children}
          </DropdownMenuLabel>
          {favoriteColor !== undefined && (
            <DropdownMenuLabel className="flex items-center">
              Favorite color:
              <div
                style={{ backgroundColor: favoriteColor }}
                className="inline-block ml-1 w-5 h-5 border border-gray-800 rounded-sm"
              >
                &nbsp;
              </div>
            </DropdownMenuLabel>
          )}

          {/* Team switching section */}
          {currentTeam && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(`/team/${currentTeam._id}`)}
                className="flex items-center gap-3"
              >
                <Small>Team settings</Small>
              </DropdownMenuItem>
            </>
          )}

          {/* Switch team section */}
          {allTeams && allTeams.length > 1 && (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-3">
                  <Small>Switch team</Small>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-64">
                  {allTeams.map((team) => (
                    <DropdownMenuItem
                      key={team._id}
                      onClick={() => handleTeamSwitch(team._id)}
                      className="flex items-center gap-3"
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
                          style={{
                            backgroundColor: team.primaryColor || "#3b82f6",
                          }}
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
                  <DropdownMenuItem
                    onClick={handleCreateTeam}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <PlusIcon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <Small>Create team</Small>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </>
          )}

          {/* Create team option */}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigate("/settings")}
            className="flex items-center gap-3"
          >
            <Small>Settings</Small>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2 py-0 font-normal">
            Theme
            <ThemeToggle />
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <SignOutButton />
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Error message display */}
      {errorMessage && (
        <div className="fixed top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg z-50 max-w-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-2 text-destructive-foreground hover:opacity-70"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showCreateTeam && (
        <CreateTeamDialog onClose={() => setShowCreateTeam(false)} />
      )}
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuthActions();
  return (
    <DropdownMenuItem
      onClick={() => {
        toast.success("Signed out successfully", {
          description: "You have been logged out.",
        });
        void signOut();
      }}
    >
      Log out
    </DropdownMenuItem>
  );
}

function CreateTeamDialog({ onClose }: { onClose: () => void }) {
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createTeam = useMutation(api.teams.createTeam);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsCreating(true);
    try {
      await createTeam({
        name: teamName.trim(),
        description: description.trim() || undefined,
      });
      toast.success("Team created successfully!", {
        description: `${teamName.trim()} is ready for collaboration.`,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create team:", error);
      toast.error("Failed to create team", {
        description: "Please check your input and try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team to collaborate on events with others.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            void handleSubmit(e);
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="teamName" className="text-sm font-medium">
              Team Name
            </label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              disabled={isCreating}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your team"
              disabled={isCreating}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !teamName.trim()}>
              {isCreating ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
