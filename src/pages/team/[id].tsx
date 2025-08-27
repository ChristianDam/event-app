import {
  CalendarIcon,
  GearIcon,
  PersonIcon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTeamEvents } from "@/hooks/useTeamEvents";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface TeamIdPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function TeamIdPage({ params, navigate }: TeamIdPageProps) {
  const teamId = params.id as Id<"teams">;
  const team = useQuery(api.teams.getTeam, { teamId });
  const teamMembers = useQuery(api.teams.getTeamMembers, { teamId });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("");

  const inviteByEmail = useMutation(api.teams.inviteByEmail);
  const removeMember = useMutation(api.teams.removeMember);
  const updateTeam = useMutation(api.teams.updateTeam);
  const leaveTeam = useMutation(api.teams.leaveTeam);
  const updateTeamBranding = useMutation(api.teams.updateTeamBranding);

  // Events data
  const { events, totalRegistrations } = useTeamEvents(teamId);

  // Set form values when team data loads
  useEffect(() => {
    if (team && !teamName) {
      setTeamName(team.name);
      setTeamDescription(team.description || "");
      setPrimaryColor(team.primaryColor || "#3b82f6");
    }
  }, [team, teamName]);

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = inviteEmail.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");
    setIsInviting(true);
    try {
      await inviteByEmail({
        teamId,
        email: trimmedEmail,
        role: inviteRole,
      });
      setInviteEmail("");
      toast.success("Invitation sent successfully!", {
        description: `Invitation has been sent to ${trimmedEmail}`,
      });
    } catch (error) {
      console.error("Failed to invite member:", error);
      toast.error("Failed to send invitation", {
        description: "Please check the email address and try again.",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleInviteKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isInviting && inviteEmail.trim()) {
        e.preventDefault();
        handleInvite(e as React.FormEvent);
      }
    },
    [inviteEmail, isInviting]
  );

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInviteEmail(e.target.value);
      if (emailError) {
        setEmailError("");
      }
    },
    [emailError]
  );

  const handleInviteSubmit = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleInvite(e as React.FormEvent);
    },
    []
  );

  const handleUpdateTeamSubmit = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleUpdateTeam(e as React.FormEvent);
    },
    [teamName, teamDescription, primaryColor, team?.primaryColor]
  );

  const handleRemoveMember = async (userId: Id<"users">) => {
    if (
      !confirm("Are you sure you want to remove this member from the team?")
    ) {
      return;
    }

    try {
      await removeMember({ teamId, memberUserId: userId });
      toast.success("Member removed successfully", {
        description: "The member has been removed from the team.",
      });
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error("Failed to remove member", {
        description:
          "Please try again. If the problem persists, contact support.",
      });
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsUpdating(true);
    try {
      // Update basic team info
      await updateTeam({
        teamId,
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });

      // Update branding if primary color changed
      if (primaryColor !== team?.primaryColor) {
        await updateTeamBranding({
          teamId,
          primaryColor: primaryColor || undefined,
        });
      }

      // Show success feedback
      toast.success("Team updated successfully!", {
        description: "Your team settings have been saved.",
      });
    } catch (error) {
      console.error("Failed to update team:", error);
      toast.error("Failed to update team", {
        description: "Please check your input and try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Are you sure you want to leave this team?")) return;

    try {
      await leaveTeam({ teamId });
      toast.success("Left team successfully", {
        description: "You have been removed from the team.",
      });
      try {
        navigate("/");
      } catch (navError) {
        console.error("Navigation failed:", navError);
      }
    } catch (error) {
      console.error("Failed to leave team:", error);
      toast.error("Failed to leave team", {
        description:
          "Please try again. If the problem persists, contact support.",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      case "member":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (team === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading team details...</div>
      </div>
    );
  }

  if (team === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
          <p className="text-muted-foreground mb-4">
            You don't have access to this team or it doesn't exist.
          </p>
          <Button
            onClick={() => {
              void navigate("/");
            }}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const canManageTeam = team.userRole === "owner" || team.userRole === "admin";
  const isOwner = team.userRole === "owner";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{team.name}</h1>
        <p className="text-muted-foreground">
          {team.description ||
            "Manage your team settings, members, and permissions"}
        </p>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">
            <PersonIcon className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings">
            <GearIcon className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {/* Invite Member Card */}
          {canManageTeam && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusIcon className="h-5 w-5" />
                  Invite New Member
                </CardTitle>
                <CardDescription>
                  Send an invitation to add a new member to your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={handleEmailChange}
                      onKeyDown={handleInviteKeyDown}
                      className={emailError ? "border-red-500" : ""}
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) =>
                        setInviteRole(e.target.value as "admin" | "member")
                      }
                      className="px-3 py-2 border border-input rounded-md bg-background text-foreground min-w-[100px]"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <Button
                      onClick={handleInviteSubmit}
                      disabled={!inviteEmail || isInviting || !!emailError}
                    >
                      {isInviting ? "Sending..." : "Send Invite"}
                    </Button>
                  </div>
                  {emailError && (
                    <p className="text-sm text-red-500">{emailError}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({teamMembers?.length || 0})</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers?.map((member) => (
                  <div
                    key={member._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {member.user.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.user.name || "Anonymous"}
                          </p>
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined{" "}
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {canManageTeam && member.role !== "owner" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Team Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>
                Customize your team's appearance and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Team Name</label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20"
                  disabled={isUpdating}
                />
              </div>
              <Button
                onClick={handleUpdateTeamSubmit}
                disabled={isUpdating || !teamName.trim()}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Team Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Team Statistics</CardTitle>
              <CardDescription>
                Overview of your team's activity and growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <PersonIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">
                    {teamMembers?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Members
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">{events.length}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Events
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <GearIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">{totalRegistrations}</div>
                  <div className="text-sm text-muted-foreground">
                    Total Registrations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Actions */}
          {!isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for this team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleLeaveTeam}>
                  Leave Team
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
