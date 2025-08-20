import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PersonIcon, PlusIcon, GearIcon, CheckIcon } from "@radix-ui/react-icons";
import { ReactNode, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UserMenu({
  favoriteColor,
  children,
  navigate,
}: {
  favoriteColor: string | undefined;
  children: ReactNode;
  navigate: (to: string) => void;
}) {
  const teams = useQuery(api.teams.getMyTeams);
  const currentTeam = useQuery(api.users.getCurrentTeam);
  const setCurrentTeam = useMutation(api.users.setCurrentTeam);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [isTeamSwitching, setIsTeamSwitching] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      {children}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <PersonIcon className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{children}</DropdownMenuLabel>
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
          
          {/* Current Team Indicator */}
          <DropdownMenuSeparator />
          {currentTeam ? (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
                Current Team
              </DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center gap-3 bg-primary/10">
                {currentTeam.logo ? (
                  <img 
                    src={`${window.location.origin}/api/storage/${currentTeam.logo}`}
                    alt={`${currentTeam.name} logo`}
                    className="w-6 h-6 rounded object-cover border"
                  />
                ) : (
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: currentTeam.primaryColor || "#3b82f6" }}
                  >
                    {currentTeam.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col">
                  <span 
                    className="font-medium text-sm"
                    style={{ color: currentTeam.primaryColor || undefined }}
                  >
                    {currentTeam.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentTeam.userRole}
                  </span>
                </div>
                <CheckIcon className="ml-auto h-4 w-4 text-primary" />
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
                No Team Selected
              </DropdownMenuLabel>
              <DropdownMenuItem disabled className="text-muted-foreground text-sm">
                Select a team below to get started
              </DropdownMenuItem>
            </>
          )}
          
          {/* Teams Section */}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase">
            {currentTeam ? 'Switch Team' : 'Select Team'}
          </DropdownMenuLabel>
          
          {teams === undefined ? (
            <DropdownMenuItem disabled>Loading teams...</DropdownMenuItem>
          ) : teams.length === 0 ? (
            <DropdownMenuItem disabled>No teams found</DropdownMenuItem>
          ) : (
            teams
              .filter((team) => !team.isCurrentTeam) // Don't show current team in switch list
              .map((team) => (
                <DropdownMenuItem 
                  key={team._id} 
                  className={`flex items-center justify-between cursor-pointer ${
                    isTeamSwitching === team._id ? 'opacity-50' : ''
                  }`}
                  disabled={isTeamSwitching === team._id}
                  onClick={async () => {
                    if (isTeamSwitching) return; // Prevent multiple simultaneous switches
                    
                    setIsTeamSwitching(team._id);
                    try {
                      await setCurrentTeam({ teamId: team._id });
                      // Navigate to team page after selecting/switching
                      navigate(`/team/${team._id}`);
                    } catch (error) {
                      console.error("Failed to switch team:", error);
                      // Show user-friendly error (would be better with toast notification)
                      alert(`Failed to switch to ${team.name}. Please try again.`);
                    } finally {
                      setIsTeamSwitching(null);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    {team.logo ? (
                      <img 
                        src={`${window.location.origin}/api/storage/${team.logo}`}
                        alt={`${team.name} logo`}
                        className="w-8 h-8 rounded object-cover border"
                      />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: team.primaryColor || "#3b82f6" }}
                      >
                        {team.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span 
                        className="font-medium"
                        style={{ color: team.primaryColor || undefined }}
                      >
                        {team.name}
                        {isTeamSwitching === team._id && (
                          <span className="ml-2 text-xs text-muted-foreground">Switching...</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {team.role} • {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/team/${team._id}`);
                    }}
                  >
                    <GearIcon className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))
          )}
          
          <DropdownMenuItem 
            onClick={() => setShowCreateTeam(true)}
            className="text-primary"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create team
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
      
      {showCreateTeam && (
        <CreateTeamDialog onClose={() => setShowCreateTeam(false)} />
      )}
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuthActions();
  return (
    <DropdownMenuItem onClick={() => void signOut()}>Sign out</DropdownMenuItem>
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
      onClose();
    } catch (error) {
      console.error("Failed to create team:", error);
      // TODO: Show error toast
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
        <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
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
