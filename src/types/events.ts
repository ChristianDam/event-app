import { Id } from "../../convex/_generated/dataModel";

export type EventType = 
  | "music" 
  | "art" 
  | "workshop" 
  | "performance" 
  | "exhibition" 
  | "other";

export type EventStatus = "draft" | "published" | "cancelled";

export interface Event {
  _id: Id<"events">;
  _creationTime: number;
  title: string;
  slug: string;
  description: string;
  venue: string;
  startTime: number;
  endTime: number;
  timezone: string;
  teamId: Id<"teams">;
  organizerId: Id<"users">;
  eventType: EventType;
  maxCapacity?: number;
  registrationDeadline?: number;
  status: EventStatus;
  eventImageId?: Id<"_storage">;
  socialImageId?: Id<"_storage">;
  createdAt: number;
  updatedAt: number;
}

export interface EventWithDetails extends Event {
  team: {
    _id: Id<"teams">;
    name: string;
    slug: string;
    logo?: Id<"_storage">;
    primaryColor?: string;
  };
  organizer: {
    _id: Id<"users">;
    name?: string;
    email?: string;
  };
  registrationCount: number;
  canManage: boolean;
}

export interface TeamEvent {
  _id: Id<"events">;
  _creationTime: number;
  title: string;
  slug: string;
  description: string;
  venue: string;
  startTime: number;
  endTime: number;
  timezone: string;
  eventType: EventType;
  maxCapacity?: number;
  registrationDeadline?: number;
  status: EventStatus;
  eventImageId?: Id<"_storage">;
  createdAt: number;
  updatedAt: number;
  organizer: {
    _id: Id<"users">;
    name?: string;
    email?: string;
  };
  registrationCount: number;
  canManage: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  venue: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  eventType: EventType;
  maxCapacity?: number;
  registrationDeadline?: Date;
  eventImage?: File;
}

export interface EventFormErrors {
  title?: string;
  description?: string;
  venue?: string;
  startTime?: string;
  endTime?: string;
  timezone?: string;
  eventType?: string;
  maxCapacity?: string;
  registrationDeadline?: string;
  eventImage?: string;
}

export const eventTypeOptions = [
  { value: "music" as const, label: "Music", icon: "🎵", description: "Concerts, festivals, live performances" },
  { value: "art" as const, label: "Art", icon: "🎨", description: "Galleries, exhibitions, art shows" },
  { value: "workshop" as const, label: "Workshop", icon: "🛠️", description: "Learning sessions, tutorials" },
  { value: "performance" as const, label: "Performance", icon: "🎭", description: "Theater, dance, spoken word" },
  { value: "exhibition" as const, label: "Exhibition", icon: "🏛️", description: "Museums, showcases, displays" },
  { value: "other" as const, label: "Other", icon: "📅", description: "General events and gatherings" },
] as const;

export const eventStatusOptions = [
  { value: "draft" as const, label: "Draft", color: "gray", description: "Not visible to public" },
  { value: "published" as const, label: "Published", color: "green", description: "Live and accepting registrations" },
  { value: "cancelled" as const, label: "Cancelled", color: "red", description: "Event has been cancelled" },
] as const;