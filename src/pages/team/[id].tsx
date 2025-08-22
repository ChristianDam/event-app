import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PersonIcon,
  PlusIcon,
  TrashIcon,
  GearIcon,
  ImageIcon,
  CalendarIcon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { EventList } from "@/components/events/EventList";
import { ThreadView } from "@/components/threads/ThreadView";
import { useTeamEvents } from "@/hooks/useTeamEvents";
import { toast } from 'sonner';

interface TeamIdPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function TeamIdPage({ params, navigate }: TeamIdPageProps) {
  const teamId = params.id as Id<"teams">;
  const team = useQuery(api.teams.getTeam, { teamId });
  const teamMembers = useQuery(api.teams.getTeamMembers, { teamId });
  
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showBrandingDialog, setShowBrandingDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isInviting, setIsInviting] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingBranding, setIsUploadingBranding] = useState(false);
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const inviteByEmail = useMutation(api.teams.inviteByEmail);
  const removeMember = useMutation(api.teams.removeMember);
  const updateTeam = useMutation(api.teams.updateTeam);
  const leaveTeam = useMutation(api.teams.leaveTeam);
  const updateTeamBranding = useMutation(api.teams.updateTeamBranding);
  const generateLogoUploadUrl = useMutation(api.teams.generateLogoUploadUrl);
  
  // Events data
  const { events, totalRegistrations } = useTeamEvents(teamId);

  // Set form values when team data loads
  if (team && !teamName && !showEditDialog && !showBrandingDialog) {
    setTeamName(team.name);
    setTeamDescription(team.description || "");
    setPrimaryColor(team.primaryColor || "#3b82f6");
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await inviteByEmail({
        teamId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail("");
      setShowInviteDialog(false);
      toast.success('Invitation sent successfully!', {
        description: `Invitation has been sent to ${inviteEmail.trim()}`,
      });
    } catch (error) {
      console.error("Failed to invite member:", error);
      toast.error('Failed to send invitation', {
        description: 'Please check the email address and try again.',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: Id<"users">) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }
    
    try {
      await removeMember({ teamId, memberUserId: userId });
      toast.success('Member removed successfully', {
        description: 'The member has been removed from the team.',
      });
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast.error('Failed to remove member', {
        description: 'Please try again. If the problem persists, contact support.',
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
      toast.success('Team updated successfully!', {
        description: 'Your team settings have been saved.',
      });
    } catch (error) {
      console.error("Failed to update team:", error);
      toast.error('Failed to update team', {
        description: 'Please check your input and try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Are you sure you want to leave this team?")) return;
    
    try {
      await leaveTeam({ teamId });
      toast.success('Left team successfully', {
        description: 'You have been removed from the team.',
      });
      void navigate("/");
    } catch (error) {
      console.error("Failed to leave team:", error);
      toast.error('Failed to leave team', {
        description: 'Please try again. If the problem persists, contact support.',
      });
    }
  };

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingBranding(true);

    try {
      let logoId: Id<"_storage"> | undefined = undefined;

      // Upload logo if a file is selected
      if (logoFile) {
        const uploadUrl = await generateLogoUploadUrl({ teamId });
        
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": logoFile.type },
          body: logoFile,
        });
        
        if (!uploadResult.ok) {
          throw new Error("Failed to upload logo");
        }
        
        const { storageId } = await uploadResult.json();
        logoId = storageId;
      }

      // Update branding
      await updateTeamBranding({
        teamId,
        logo: logoId,
        primaryColor: primaryColor || undefined,
      });

      setShowBrandingDialog(false);
      setLogoFile(null);
      toast.success('Team branding updated!', {
        description: 'Your team logo and colors have been saved.',
      });
    } catch (error) {
      console.error("Failed to update team branding:", error);
      toast.error('Failed to update branding', {
        description: 'Please check your image file and try again.',
      });
    } finally {
      setIsUploadingBranding(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-purple-100 text-purple-800";
      case "admin": return "bg-blue-100 text-blue-800";
      case "member": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
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
          <Button onClick={() => { void navigate("/"); }}>Go Back</Button>
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
          {team.description || "Manage your team settings, members, and permissions"}
        </p>
      </div>

      <Tabs defaultValue="discussion" className="space-y-6">
        <TabsList>
          <TabsTrigger value="discussion">
            <ChatBubbleIcon className="mr-2 h-4 w-4" />
            Discussion
          </TabsTrigger>
          <TabsTrigger value="members">
            <PersonIcon className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings">
            <GearIcon className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discussion" className="space-y-6">
          <ThreadView teamId={teamId} />
        </TabsContent>

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
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite(e as any)}
                  />
                  <Button onClick={(e) => handleInvite(e as any)} disabled={!inviteEmail}>
                    Send Invite
                  </Button>
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
                        {member.user.name?.split(" ").map(n => n[0]).join("") || "?"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.user.name || "Anonymous"}</p>
                          <Badge className={getRoleBadgeColor(member.role)}>
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
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
                onClick={(e) => handleUpdateTeam(e as any)} 
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
                  <div className="text-2xl font-bold">{teamMembers?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">{events.length}</div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <GearIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">{totalRegistrations}</div>
                  <div className="text-sm text-muted-foreground">Total Registrations</div>
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
                <Button 
                  variant="destructive" 
                  onClick={() => { void handleLeaveTeam(); }}
                >
                  Leave Team
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Invite Member Dialog */}
      {showInviteDialog && (
        <Dialog open onOpenChange={() => setShowInviteDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join {team.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { void handleInvite(e); }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    disabled={isInviting}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
                    disabled={isInviting}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowInviteDialog(false)}
                  disabled={isInviting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                  {isInviting ? "Inviting..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Team Dialog */}
      {showEditDialog && (
        <Dialog open onOpenChange={() => setShowEditDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>
                Update team details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { void handleUpdateTeam(e); }}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Team Name</label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Team name"
                    disabled={isUpdating}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    placeholder="Brief team description"
                    disabled={isUpdating}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowEditDialog(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating || !teamName.trim()}>
                  {isUpdating ? "Updating..." : "Update Team"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Team Branding Dialog */}
      {showBrandingDialog && (
        <Dialog open onOpenChange={() => setShowBrandingDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Team Branding</DialogTitle>
              <DialogDescription>
                Customize your team's logo and primary color
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { void handleUpdateBranding(e); }}>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Team Logo</label>
                  <div className="mt-2 flex items-center gap-4">
                    {team.logo ? (
                      <img 
                        src={`${window.location.origin}/api/storage/${team.logo}`}
                        alt="Current team logo"
                        className="w-16 h-16 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center border">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        disabled={isUploadingBranding}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload a square image (PNG, JPG) up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Primary Color</label>
                  <div className="mt-2">
                    <ColorPicker
                      value={primaryColor}
                      onChange={setPrimaryColor}
                      disabled={isUploadingBranding}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This color will be used in team invitations and branding
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowBrandingDialog(false)}
                  disabled={isUploadingBranding}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploadingBranding}>
                  {isUploadingBranding ? "Updating..." : "Update Branding"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Create Event Dialog */}
      {showCreateEventDialog && (
        <CreateEventDialog
          isOpen={showCreateEventDialog}
          onClose={() => setShowCreateEventDialog(false)}
          team={team}
          onSuccess={(eventId) => {
            console.log('Event created:', eventId);
            // Could navigate to event page or show success message
          }}
        />
      )}
      
      {/* All Events Dialog */}
      {showAllEvents && (
        <Dialog open onOpenChange={() => setShowAllEvents(false)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>All Events - {team.name}</DialogTitle>
              <DialogDescription>
                Manage all events for your team
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[70vh]">
              <EventList
                teamId={teamId}
                view="list"
                showFilters={true}
                onEventEdit={(eventId) => {
                  console.log('Edit event:', eventId);
                  // Could navigate to edit page
                }}
                onEventView={(eventId) => {
                  console.log('View event:', eventId);
                  // Could navigate to event page
                }}
                onEventShare={(eventId) => {
                  console.log('Share event:', eventId);
                  // Could show share dialog
                }}
                onEventDuplicate={(eventId) => {
                  console.log('Duplicate event:', eventId);
                  // Could duplicate event
                }}
              />
            </div>
            <DialogFooter>
              <Button 
                onClick={() => setShowCreateEventDialog(true)}
                style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
                className="text-white hover:opacity-90"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Event
              </Button>
              <Button variant="outline" onClick={() => setShowAllEvents(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}