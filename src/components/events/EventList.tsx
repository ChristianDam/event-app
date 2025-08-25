import React, { useState, useMemo } from 'react';
import { Id } from '../../../convex/_generated/dataModel';
import { EventStatus, EventType, eventTypeOptions, eventStatusOptions, TeamEvent } from '../../types/events';
import { useTeamEvents } from '../../hooks/useTeamEvents';
import { EventCard } from './EventCard';

interface EventListProps {
  teamId: Id<"teams">;
  navigate?: (to: string) => void;
  view?: 'grid' | 'list';
  limit?: number;
  showFilters?: boolean;
  onEventEdit?: (eventId: Id<"events">) => void;
  onEventView?: (eventId: Id<"events">) => void;
  onEventShare?: (eventId: Id<"events">) => void;
  onEventDuplicate?: (eventId: Id<"events">) => void;
  className?: string;
}

interface FilterState {
  status: EventStatus[];
  eventType: EventType[];
  timeRange: 'all' | 'upcoming' | 'past';
  search: string;
}

export const EventList: React.FC<EventListProps> = ({
  teamId,
  navigate,
  view = 'grid',
  limit,
  showFilters = true,
  onEventEdit,
  onEventView,
  onEventShare,
  onEventDuplicate,
  className = '',
}) => {
  const { events, isLoading } = useTeamEvents(teamId);
  
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    eventType: [],
    timeRange: 'all',
    search: '',
  });

  const [sortBy, setSortBy] = useState<'startTime' | 'createdAt' | 'registrationCount'>('startTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let filtered: TeamEvent[] = events.filter((event: TeamEvent) => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(event.status)) {
        return false;
      }

      // Event type filter
      if (filters.eventType.length > 0 && !filters.eventType.includes(event.eventType)) {
        return false;
      }

      // Time range filter
      const now = Date.now();
      if (filters.timeRange === 'upcoming' && event.startTime <= now) {
        return false;
      }
      if (filters.timeRange === 'past' && event.startTime > now) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.venue.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });

    // Sort events
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'startTime':
          aValue = a.startTime;
          bValue = b.startTime;
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'registrationCount':
          aValue = a.registrationCount;
          bValue = b.registrationCount;
          break;
        default:
          aValue = a.startTime;
          bValue = b.startTime;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    // Apply limit if specified
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [events, filters, sortBy, sortOrder, limit]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleStatusFilter = (status: EventStatus) => {
    updateFilter('status', 
      filters.status.includes(status) 
        ? filters.status.filter(s => s !== status)
        : [...filters.status, status]
    );
  };

  const toggleEventTypeFilter = (eventType: EventType) => {
    updateFilter('eventType',
      filters.eventType.includes(eventType)
        ? filters.eventType.filter(t => t !== eventType)
        : [...filters.eventType, eventType]
    );
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      eventType: [],
      timeRange: 'all',
      search: '',
    });
  };

  const hasActiveFilters = filters.status.length > 0 || filters.eventType.length > 0 || 
    filters.timeRange !== 'all' || filters.search.trim() !== '';

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Loading skeleton */}
        {Array.from({ length: limit || 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="flex gap-4">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-3 bg-gray-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search events..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* Time Range Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Time:</label>
              <select
                value={filters.timeRange}
                onChange={(e) => updateFilter('timeRange', e.target.value as FilterState['timeRange'])}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past Events</option>
              </select>
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <div className="flex gap-1">
                {eventStatusOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleStatusFilter(option.value)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      filters.status.includes(option.value)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Type Filters */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <div className="flex gap-1 flex-wrap">
                {eventTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => toggleEventTypeFilter(option.value)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors flex items-center gap-1 ${
                      filters.eventType.includes(option.value)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="startTime">Date</option>
                <option value="createdAt">Created</option>
                <option value="registrationCount">Registrations</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          {hasActiveFilters && ` (filtered from ${events.length} total)`}
        </p>
        
        {!showFilters && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title={`Sort ${sortOrder === 'desc' ? 'ascending' : 'descending'}`}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        )}
      </div>

      {/* Events Grid/List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-6xl text-gray-300 mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your filters to see more events.'
              : 'Get started by creating your first event.'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className={
          view === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredEvents.map(event => (
            <EventCard
              key={event._id}
              event={event}
              navigate={navigate}
              onEdit={onEventEdit ? () => onEventEdit(event._id) : undefined}
              onView={onEventView ? () => onEventView(event._id) : undefined}
              onShare={onEventShare ? () => onEventShare(event._id) : undefined}
              onDuplicate={onEventDuplicate ? () => onEventDuplicate(event._id) : undefined}
              className={view === 'list' ? 'max-w-none' : ''}
            />
          ))}
        </div>
      )}
    </div>
  );
};