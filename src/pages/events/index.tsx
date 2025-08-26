import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { EventCard } from '../../components/events/EventCard';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Plus, CalendarIcon, HistoryIcon } from 'lucide-react';

interface EventListPageProps {
  navigate: (to: string) => void;
}

const EventListPage: React.FC<EventListPageProps> = ({ navigate }) => {
  
  // Use the existing getMyEvents query which is team-aware
  const events = useQuery(api.events.getMyEvents);
  const isLoading = events === undefined;

  // Mutation to create a new draft event
  const createDraftEvent = useMutation(api.events.createDraftEvent);

  const handleCreateEvent = async () => {
    try {
      const eventId = await createDraftEvent();
      navigate(`/events/${eventId}`);
    } catch (error) {
      console.error('Failed to create draft event:', error);
    }
  };

  // Handle case where user is not authenticated
  if (events === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Access Required</h1>
          <p className="text-muted-foreground">Please sign in to view your team's events.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        {/* Tab skeleton */}
        <div className="mb-6">
          <div className="flex space-x-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="flex gap-4">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const now = Date.now();
  const upcomingEvents = events?.filter(event => event.startTime > now).sort((a, b) => a.startTime - b.startTime) || [];
  const pastEvents = events?.filter(event => event.startTime <= now).sort((a, b) => b.startTime - a.startTime) || [];

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all your team's events in one place
          </p>
        </div>
        
        <Button 
          onClick={handleCreateEvent}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Upcoming ({upcomingEvents.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <HistoryIcon className="h-4 w-4" />
            Past Events ({pastEvents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          <div className="text-sm text-muted-foreground">
            {upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? 's' : ''} found
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="text-6xl text-muted-foreground mb-4">📅</div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No upcoming events
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first event to get started with event management.
              </p>
              <Button 
                onClick={handleCreateEvent}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create Your First Event
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEvents.map(event => (
                <EventCard
                  key={event._id}
                  event={event}
                  navigate={navigate}
                  onEdit={() => navigate(`/events/${event._id}`)}
                  onView={() => navigate(`/events/discover/${event.slug}`)}
                  onShare={() => {
                    if (event.status === 'published') {
                      navigator.clipboard.writeText(`${window.location.origin}/events/discover/${event.slug}`);
                      // Could add toast notification here
                    }
                  }}
                  onDuplicate={() => {
                    // Could implement duplication logic
                    console.log('Duplicate event', event._id);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          <div className="text-sm text-muted-foreground">
            {pastEvents.length} past event{pastEvents.length !== 1 ? 's' : ''} found
          </div>

          {pastEvents.length === 0 ? (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <div className="text-6xl text-muted-foreground mb-4">📚</div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No past events
              </h3>
              <p className="text-muted-foreground mb-4">
                Once you create and complete events, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pastEvents.map(event => (
                <EventCard
                  key={event._id}
                  event={event}
                  navigate={navigate}
                  onEdit={() => navigate(`/events/${event._id}`)}
                  onView={() => navigate(`/events/discover/${event.slug}`)}
                  onShare={() => {
                    if (event.status === 'published') {
                      navigator.clipboard.writeText(`${window.location.origin}/events/discover/${event.slug}`);
                      // Could add toast notification here
                    }
                  }}
                  onDuplicate={() => {
                    // Could implement duplication logic
                    console.log('Duplicate event', event._id);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventListPage;