import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { EventCard } from '../../components/events/EventCard';
import { Button } from '../../components/ui/button';
import { Plus } from 'lucide-react';

const EventListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  // Use the existing getMyEvents query which is team-aware
  const events = useQuery(api.events.getMyEvents);
  const isLoading = events === undefined;

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
  
  const displayEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

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
          onClick={() => window.location.href = '/events/create'}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'past'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
              }`}
            >
              Past Events ({pastEvents.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Event count and summary */}
      <div className="mb-6 text-sm text-muted-foreground">
        {displayEvents.length} event{displayEvents.length !== 1 ? 's' : ''} found
      </div>

      {/* Events grid */}
      {displayEvents.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <div className="text-6xl text-muted-foreground mb-4">
            {activeTab === 'upcoming' ? '📅' : '📚'}
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            {activeTab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {activeTab === 'upcoming' 
              ? 'Create your first event to get started with event management.'
              : 'Once you create and complete events, they will appear here.'
            }
          </p>
          {activeTab === 'upcoming' && (
            <Button 
              onClick={() => window.location.href = '/events/create'}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Create Your First Event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayEvents.map(event => (
            <EventCard
              key={event._id}
              event={event}
              onEdit={() => window.location.href = `/events/${event._id}`}
              onView={() => window.location.href = `/events/${event.slug}`}
              onShare={() => {
                if (event.status === 'published') {
                  navigator.clipboard.writeText(`${window.location.origin}/events/${event.slug}`);
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
    </div>
  );
};

export default EventListPage;