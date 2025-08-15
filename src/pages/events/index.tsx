import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateEventDialog } from "@/components/events";
import { Plus, Calendar, Users, Eye, EyeOff, Edit, Trash2 } from "lucide-react";

interface EventsPageProps {
  params: Record<string, string>;
  navigate: (to: string) => void;
}

export default function EventsPage({ navigate }: EventsPageProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const user = useQuery(api.users.viewer);
  
  // Mock team data - replace with actual team query when backend is ready
  const mockTeam = {
    _id: "team_123" as any,
    name: "Product Team",
    primaryColor: "#3b82f6",
    secondaryColor: "#1e40af",
    accentColor: "#dbeafe"
  };
  
  // This query would need to be implemented in the backend
  // const events = useQuery(api.events.list);
  
  // Mock data for now - replace with actual query when backend is ready
  const events = [
    {
      _id: "1",
      title: "Team Building Workshop",
      description: "Fun team building activities and workshops",
      date: "2024-01-15",
      time: "14:00",
      location: "Conference Room A",
      isPublished: true,
      isHidden: false,
      attendeeCount: 8,
      maxAttendees: 15
    },
    {
      _id: "2", 
      title: "Monthly All-Hands",
      description: "Company-wide monthly meeting and updates",
      date: "2024-01-22",
      time: "10:00",
      location: "Main Auditorium",
      isPublished: true,
      isHidden: false,
      attendeeCount: 45,
      maxAttendees: 50
    },
    {
      _id: "3",
      title: "Product Planning Session",
      description: "Q1 product roadmap planning",
      date: "2024-01-25",
      time: "09:00",
      location: "Meeting Room B",
      isPublished: false,
      isHidden: true,
      attendeeCount: 5,
      maxAttendees: 10
    }
  ];

  // These mutations would need to be implemented in the backend
  // const deleteEvent = useMutation(api.events.deleteEvent);
  // const toggleEventPublished = useMutation(api.events.togglePublished);
  // const toggleEventHidden = useMutation(api.events.toggleHidden);

  const handleEditEvent = (eventId: string) => {
    // Navigate to edit page or open edit dialog
    console.log("Edit event:", eventId);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      // deleteEvent({ eventId });
      console.log("Delete event:", eventId);
    }
  };

  const handleTogglePublished = (eventId: string) => {
    // toggleEventPublished({ eventId });
    console.log("Toggle published:", eventId);
  };

  const handleToggleHidden = (eventId: string) => {
    // toggleEventHidden({ eventId });
    console.log("Toggle hidden:", eventId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Events</h1>
          <p className="text-muted-foreground">
            Manage your team's events and activities
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      <div className="space-y-6">
        {events.map((event) => (
          <Card key={event._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <div className="flex gap-2">
                      {event.isPublished ? (
                        <Badge variant="default">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      {event.isHidden && (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {event.description}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditEvent(event._id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublished(event._id)}
                  >
                    {event.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleHidden(event._id)}
                  >
                    {event.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteEvent(event._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{event.date} at {event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{event.attendeeCount}/{event.maxAttendees} attendees</span>
                </div>
                <div className="text-muted-foreground">
                  📍 {event.location}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => console.log("View registrations")}
                >
                  View Registrations
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {events.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first event to get started
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {user && (
        <CreateEventDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          team={mockTeam}
          onSuccess={(eventId) => {
            console.log("Event created:", eventId);
            // Could refresh events list or navigate to event
          }}
        />
      )}
    </div>
  );
}