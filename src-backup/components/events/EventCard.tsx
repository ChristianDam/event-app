import { CalendarHeart, MoreHorizontal, Users2 } from "lucide-react";
import type React from "react";
import {
  type EventWithDetails,
  eventTypeOptions,
  type TeamEvent,
} from "../../types/events";
import { H4, Muted, Small } from "../typography/typography";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { EventStatusBadge } from "./EventStatusBadge";

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
  className = "",
}) => {
  const eventTypeConfig = eventTypeOptions.find(
    (option) => option.value === event.eventType
  );
  const startDate = new Date(event.startTime);

  const isFull =
    event.maxCapacity && event.registrationCount >= event.maxCapacity;

  return (
    <Card
      className={`${className} cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]`}
      onClick={() => navigate && navigate(`/events/${event._id}`)}
    >
      {/* Event image or placeholder - Following PRD hierarchy #1 */}
      <CardHeader className="p-0 aspect-video bg-muted rounded-t-lg flex items-center justify-center">
        {"bannerImageUrl" in event && event.bannerImageUrl ? (
          <img
            src={event.bannerImageUrl}
            alt={event.title}
            className="w-full h-full object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center">
            <span className="text-6xl text-muted-foreground">
              {eventTypeConfig?.icon || "📅"}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* PRD hierarchy #2: Event title and type badge */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{eventTypeConfig?.icon || "📅"}</span>
              <Small>{eventTypeConfig?.label || "Event"}</Small>
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
                  {onView && event.status === "published" && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onView();
                      }}
                    >
                      View Public Page
                    </DropdownMenuItem>
                  )}
                  {onShare && event.status === "published" && (
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
          <H4 className="line-clamp-2">{event.title}</H4>
        </div>

        {/* PRD hierarchy #3: Date/time */}
        <div className="mb-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarHeart className="w-4 h-4 mr-1 flex-shrink-0" />
            <Muted className="">
              {`${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            </Muted>
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

          <div className="flex items-center">
            <Users2 className="text-muted-foreground w-4 h-4 mr-1 flex-shrink-0" />
            <Muted className="">
              {`${event.registrationCount} registered${event.maxCapacity ? ` / ${event.maxCapacity}` : ""}`}
            </Muted>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
