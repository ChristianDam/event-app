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
import { PersonIcon } from "@radix-ui/react-icons";
import { ReactNode, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from 'sonner';

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
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div className={compact ? "" : "flex items-center gap-2 text-sm font-medium"}>
      {!compact && children}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {compact ? (
            <button className="w-8 h-8 rounded-full text-white  font-bold hover:opacity-80 transition-opacity">
              {children}
            </button>
          ) : (
            <Button variant="secondary" size="icon" className="rounded-full">
              <PersonIcon className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{compact ? (currentUser?.name || currentUser?.email) : children}</DropdownMenuLabel>
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
    <DropdownMenuItem onClick={() => {
      toast.success('Signed out successfully', {
        description: 'You have been logged out.',
      });
      void signOut();
    }}>Sign out</DropdownMenuItem>
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
      toast.success('Team created successfully!', {
        description: `${teamName.trim()} is ready for collaboration.`,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create team:", error);
      toast.error('Failed to create team', {
        description: 'Please check your input and try again.',
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
