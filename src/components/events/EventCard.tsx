import React from 'react';
import { EventWithDetails, TeamEvent, eventTypeOptions } from '../../types/events';
import { EventStatusBadge } from './EventStatusBadge';
import { MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';

interface EventCardProps {
  event: EventWithDetails | TeamEvent;
  navigate?: (to: string) => void;
  onEdit?: () => void;
  onView?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  className?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  navigate,
  onEdit,
  onView,
  onShare,
  onDuplicate,
  className = '',
}) => {
  const eventTypeConfig = eventTypeOptions.find(option => option.value === event.eventType);
  const startDate = new Date(event.startTime);
  
  const isFull = event.maxCapacity && event.registrationCount >= event.maxCapacity;

  return (
    <Card 
      className={`${className} cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]`}
      onClick={()=> navigate && navigate(`/events/${event._id}`)}
    >
      {/* Event image or placeholder - Following PRD hierarchy #1 */}
      <CardHeader className="p-0 aspect-video bg-muted rounded-t-lg flex items-center justify-center">
        {'bannerImageUrl' in event && event.bannerImageUrl ? (
          <img 
            src={event.bannerImageUrl} 
            alt={event.title}
            className="w-full h-full object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center">
            <span className="text-6xl text-muted-foreground">{eventTypeConfig?.icon || '📅'}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* PRD hierarchy #2: Event title and type badge */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{eventTypeConfig?.icon || '📅'}</span>
              <span className="text-sm text-muted-foreground font-medium">{eventTypeConfig?.label}</span>
            </div>
            
            {/* PRD hierarchy #5: Actions menu (⋯) */}
            {event.canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger 
                  className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      Edit Event
                    </DropdownMenuItem>
                  )}
                  {onView && event.status === 'published' && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onView();
                      }}
                    >
                      View Public Page
                    </DropdownMenuItem>
                  )}
                  {onShare && event.status === 'published' && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare();
                      }}
                    >
                      Copy Link
                    </DropdownMenuItem>
                  )}
                  {onDuplicate && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate();
                      }}
                    >
                      Duplicate
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 hover:text-primary cursor-pointer">
            {event.title}
          </h3>
        </div>

        {/* PRD hierarchy #3: Date/time */}
        <div className="mb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>
              {startDate.toLocaleDateString()} at {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* PRD hierarchy #4: Status badge and registration count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <EventStatusBadge status={event.status} />
            {isFull && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Full
              </span>
            )}
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>
              {event.registrationCount} registered
              {event.maxCapacity && ` / ${event.maxCapacity}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};