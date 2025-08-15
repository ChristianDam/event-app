import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PersonIcon,
  PlusIcon,
  TrashIcon,
  GearIcon,
  ArrowLeftIcon,
  ImageIcon,
  CalendarIcon,
} from "@radix-ui/react-icons";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { EventList } from "@/components/events/EventList";
import { useTeamEvents } from "@/hooks/useTeamEvents";

interface TeamIdPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function TeamIdPage({ params, navigate }: TeamIdPageProps) {
  const teamId = params.id as Id<"teams">;
  const team = useQuery(api.teams.getTeam, { teamId });
  const teamMembers = useQuery(api.teams.getTeamMembers, { teamId });
  const pendingInvitations = useQuery(api.teams.getPendingInvitations, { teamId });
  
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
  const cancelInvitation = useMutation(api.teams.cancelInvitation);
  const updateTeam = useMutation(api.teams.updateTeam);
  const leaveTeam = useMutation(api.teams.leaveTeam);
  const updateTeamBranding = useMutation(api.teams.updateTeamBranding);
  const generateLogoUploadUrl = useMutation(api.teams.generateLogoUploadUrl);
  
  // Events data
  const { events, upcomingEvents, totalRegistrations } = useTeamEvents(teamId);

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
    } catch (error) {
      console.error("Failed to invite member:", error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: Id<"users">) => {
    try {
      await removeMember({ teamId, memberUserId: userId });
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleCancelInvitation = async (invitationId: Id<"teamInvitations">) => {
    try {
      await cancelInvitation({ invitationId });
    } catch (error) {
      console.error("Failed to cancel invitation:", error);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setIsUpdating(true);
    try {
      await updateTeam({
        teamId,
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });
      setShowEditDialog(false);
    } catch (error) {
      console.error("Failed to update team:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!confirm("Are you sure you want to leave this team?")) return;
    
    try {
      await leaveTeam({ teamId });
      void navigate("/");
    } catch (error) {
      console.error("Failed to leave team:", error);
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
    } catch (error) {
      console.error("Failed to update team branding:", error);
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => { void navigate("/"); }}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          {team.logo && (
            <img 
              src={`${window.location.origin}/api/storage/${team.logo}`}
              alt={`${team.name} logo`}
              className="w-12 h-12 rounded-lg object-cover border"
            />
          )}
          <div>
            <h1 
              className="text-3xl font-bold"
              style={{ color: team.primaryColor || undefined }}
            >
              {team.name}
            </h1>
            {team.description && (
              <p className="text-muted-foreground mt-1">{team.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getRoleBadgeColor(team.userRole)}>
            {team.userRole}
          </Badge>
          {canManageTeam && (
            <>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowBrandingDialog(true)}
                title="Team Branding"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setShowEditDialog(true)}
                title="Team Settings"
              >
                <GearIcon className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Events Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Events ({events.length})
              </CardTitle>
              <Button 
                size="sm"
                onClick={() => setShowCreateEventDialog(true)}
                style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
                className="text-white hover:opacity-90"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{events.length}</div>
                  <div className="text-xs text-muted-foreground">Total Events</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{upcomingEvents.length}</div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{totalRegistrations}</div>
                  <div className="text-xs text-muted-foreground">Registrations</div>
                </div>
              </div>
              
              {/* Recent Events Preview */}
              {events.length > 0 ? (
                <div>
                  <div className="space-y-2">
                    {events.slice(0, 3).map((event) => {
                      const startDate = new Date(event.startTime);
                      const isUpcoming = startDate.getTime() > Date.now();
                      
                      return (
                        <div key={event._id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{event.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {startDate.toLocaleDateString()} • {event.registrationCount} registered
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`text-xs ${
                                event.status === 'published' ? 'bg-green-100 text-green-800' :
                                event.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {event.status}
                            </Badge>
                            {isUpcoming && (
                              <Badge className="text-xs bg-blue-100 text-blue-800">
                                Upcoming
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {events.length > 3 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => setShowAllEvents(true)}
                    >
                      View All Events ({events.length})
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No events yet. Create your first event to get started!
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => setShowCreateEventDialog(true)}
                    style={{ backgroundColor: team.primaryColor || '#3b82f6' }}
                    className="text-white hover:opacity-90"
                  >
                    Create First Event
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Team Members */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PersonIcon className="h-5 w-5" />
                Team Members ({teamMembers?.length || 0})
              </CardTitle>
              {canManageTeam && (
                <Button 
                  size="sm"
                  onClick={() => setShowInviteDialog(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {teamMembers === undefined ? (
              <div className="text-center py-4">Loading members...</div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No members found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {canManageTeam && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member.user.name || "Anonymous"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      {canManageTeam && (
                        <TableCell>
                          {member.role !== "owner" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { void handleRemoveMember(member.userId); }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {canManageTeam && (
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle>Pending Invitations ({pendingInvitations?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingInvitations === undefined ? (
                <div className="text-center py-4">Loading invitations...</div>
              ) : pendingInvitations.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No pending invitations
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations.map((invitation) => (
                      <TableRow key={invitation._id}>
                        <TableCell>{invitation.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(invitation.role)}>
                            {invitation.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { void handleCancelInvitation(invitation._id); }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Team Actions */}
      <div className="mt-8 flex justify-end">
        {!isOwner && (
          <Button 
            variant="destructive" 
            onClick={() => { void handleLeaveTeam(); }}
          >
            Leave Team
          </Button>
        )}
      </div>

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