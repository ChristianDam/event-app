import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, UserPlus, Mail, Shield, Calendar, Trash2 } from "lucide-react";

interface TeamPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function TeamPage({}: TeamPageProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  
  // Mock data - replace with actual queries when backend is ready
  const teamSettings = {
    name: "Product Team",
    description: "Building amazing products together",
    logo: null,
    primaryColor: "#3b82f6",
    memberCount: 12,
  };

  const teamMembers = [
    {
      _id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: "Owner",
      joinedAt: "2023-01-15",
      lastSeen: "2024-01-10",
      isActive: true
    },
    {
      _id: "2", 
      name: "Jane Smith",
      email: "jane@example.com",
      role: "Admin",
      joinedAt: "2023-02-20",
      lastSeen: "2024-01-09",
      isActive: true
    },
    {
      _id: "3",
      name: "Bob Wilson",
      email: "bob@example.com", 
      role: "Member",
      joinedAt: "2023-06-10",
      lastSeen: "2024-01-08",
      isActive: false
    }
  ];

  const handleInviteMember = () => {
    if (inviteEmail) {
      // sendInvitation({ email: inviteEmail });
      console.log("Invite member:", inviteEmail);
      setInviteEmail("");
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      // removeMember({ memberId });
      console.log("Remove member:", memberId);
    }
  };

  const handleUpdateRole = (memberId: string, newRole: string) => {
    // updateMemberRole({ memberId, role: newRole });
    console.log("Update role:", memberId, newRole);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Owner": return "default";
      case "Admin": return "secondary"; 
      case "Member": return "outline";
      default: return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Team Management</h1>
        <p className="text-muted-foreground">
          Manage your team settings, members, and permissions
        </p>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          {/* Invite Member Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
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
                  onKeyDown={(e) => e.key === "Enter" && handleInviteMember()}
                />
                <Button onClick={handleInviteMember} disabled={!inviteEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invite
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({teamMembers.length})</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div 
                    key={member._id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name}</p>
                          <Badge variant={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                          {!member.isActive && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {member.joinedAt} • Last seen {member.lastSeen}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {member.role !== "Owner" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateRole(member._id, 
                              member.role === "Admin" ? "Member" : "Admin"
                            )}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            {member.role === "Admin" ? "Make Member" : "Make Admin"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
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
                <Input defaultValue={teamSettings.name} />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input defaultValue={teamSettings.description} />
              </div>
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <Input type="color" defaultValue={teamSettings.primaryColor} className="w-20" />
              </div>
              <Button>Save Changes</Button>
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
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">{teamSettings.memberCount}</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-sm text-muted-foreground">Events This Month</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Shield className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Admins</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}