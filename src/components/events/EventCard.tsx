import React from 'react';
import { EventWithDetails, TeamEvent, eventTypeOptions } from '../../types/events';
import { EventStatusBadge } from './EventStatusBadge';

interface EventCardProps {
  event: EventWithDetails | TeamEvent;
  onEdit?: () => void;
  onView?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onEdit,
  onView,
  onShare,
  onDuplicate,
  className = '',
}) => {
  const eventTypeConfig = eventTypeOptions.find(option => option.value === event.eventType);
  const startDate = new Date(event.startTime);
  const isUpcoming = startDate.getTime() > Date.now();
  const isPast = startDate.getTime() < Date.now();
  
  // Calculate capacity percentage if maxCapacity is set
  const capacityPercentage = event.maxCapacity 
    ? Math.min((event.registrationCount / event.maxCapacity) * 100, 100)
    : 0;

  const isFull = event.maxCapacity && event.registrationCount >= event.maxCapacity;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${className}`}>
      {/* Header with team branding */}
      <div 
        className="h-2 rounded-t-lg"
        style={{ backgroundColor: ('team' in event ? event.team.primaryColor : undefined) || '#3b82f6' }}
      />
      
      <div className="p-6">
        {/* Top section with status and actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <EventStatusBadge status={event.status} />
            {isFull && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Full
              </span>
            )}
            {isPast && event.status === 'published' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Past Event
              </span>
            )}
          </div>
          
          {/* Actions dropdown */}
          {event.canManage && (
            <div className="relative group">
              <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="py-1">
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      📝 Edit Event
                    </button>
                  )}
                  {onView && (
                    <button
                      onClick={onView}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      👁️ View Event Page
                    </button>
                  )}
                  {onShare && (
                    <button
                      onClick={onShare}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      📤 Share Event
                    </button>
                  )}
                  {onDuplicate && (
                    <button
                      onClick={onDuplicate}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      📋 Duplicate Event
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Event type and title */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{eventTypeConfig?.icon || '📅'}</span>
            <span className="text-sm text-gray-600 font-medium">{eventTypeConfig?.label}</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 cursor-pointer">
            {event.title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {event.description}
        </p>

        {/* Event details */}
        <div className="space-y-2 mb-4">
          {/* Date and time */}
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Venue */}
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{event.venue}</span>
          </div>

          {/* Registration count */}
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>
              {event.registrationCount} registered
              {event.maxCapacity && ` / ${event.maxCapacity}`}
            </span>
          </div>
        </div>

        {/* Capacity bar if maxCapacity is set */}
        {event.maxCapacity && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Registration Progress</span>
              <span>{Math.round(capacityPercentage)}% full</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  capacityPercentage >= 100 
                    ? 'bg-red-500' 
                    : capacityPercentage >= 80 
                      ? 'bg-yellow-500' 
                      : 'bg-green-500'
                }`}
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Team info or time status */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {'team' in event && event.team.logo && (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0">
                {/* Logo would be rendered here */}
              </div>
            )}
            <span className="text-xs text-gray-500">
              {'team' in event ? `by ${event.team.name}` : `by ${event.organizer.name || 'Team Organizer'}`}
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            {isUpcoming ? 'Upcoming' : isPast ? 'Past' : 'Today'}
          </div>
        </div>
      </div>
    </div>
  );
};