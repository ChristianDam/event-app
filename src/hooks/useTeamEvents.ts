import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export const useTeamEvents = (teamId: Id<"teams">) => {
  const events = useQuery(api.events.getTeamEvents, { teamId });
  
  return {
    events: events || [],
    isLoading: events === undefined,
    upcomingEvents: events?.filter(event => event.startTime > Date.now()) || [],
    pastEvents: events?.filter(event => event.startTime <= Date.now()) || [],
    draftEvents: events?.filter(event => event.status === 'draft') || [],
    publishedEvents: events?.filter(event => event.status === 'published') || [],
    totalRegistrations: events?.reduce((sum, event) => sum + event.registrationCount, 0) || 0,
  };
};