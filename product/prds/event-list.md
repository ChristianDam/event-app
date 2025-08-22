# Event List - Team Event Management

## Background
Team members need a centralized dashboard to view and manage all their team's events. The default view shows upcoming events with the ability to switch to past events via tabs. Team members can perform event management actions directly from this view based on their role permissions.

## Problem
Teams currently lack an efficient way to get an overview of their event pipeline and quickly perform common event management tasks without navigating to individual event pages.

## Objectives / Goals
Create a scannable grid/gallery view where each event displays:
- Event image
- Title and date
- Publish status (draft/published/cancelled)
- Registration count vs capacity
- Actions menu (⋯ button) for quick operations

Enable team members to create new events and manage existing ones from a single interface.

## User Stories & Acceptance Criteria

### Story 1: Event Overview
**As a** team member  
**I want to** see all my team's events at a glance  
**So that I can** quickly understand our event pipeline

**Acceptance Criteria:**
- Events display in chronological order by default
- Upcoming/Past events accessible via tabs
- Each event shows key info: title, date, status, attendee count
- Published events include link to public page
- Page loads in <2 seconds for teams with <50 events

### Story 2: Event Management by Role
**As an** event organizer  
**I want to** manage my events directly from the list  
**So that I can** quickly update status and details

**Acceptance Criteria:**
- Actions menu shows role-appropriate options
- Status changes update immediately without page refresh
- Confirmation dialogs for destructive actions
- Cannot delete events with existing registrations

## User Permissions by Role

### All Team Members:
- View all team events
- Access published event URLs
- Basic filtering (upcoming/past)

### Event Organizers:
- Edit their own events
- Change status: draft → published, published → cancelled
- View registration analytics for their events

### Team Admins/Owners:
- All organizer actions for any team event
- Delete events (if no registrations exist)

## UX Requirements

### Layout:
- **Desktop:** 3-column grid with sidebar filters
- **Tablet:** 2-column grid
- **Mobile:** Single column with collapsible filters

### Event Card Information Hierarchy:
1. Event image (primary visual) or a gray box as placeholder
2. Event title and type badge
3. Date/time
4. Status badge and registration count
5. Actions menu (⋯)

### Empty States:
- No upcoming events: Show "Create your first event" CTA
- No search results: "Clear filters" suggestion

## Technical Requirements

### API Integration:
- Use existing `getMyEvents` query for team-aware fetching
- Status updates via `updateEvent` mutation
- Leverage current EventList component with enhancements

### Performance:
- Pagination for teams with 100+ events
- Debounced search (300ms delay)
- Image lazy loading

### Real-time Updates:
- Live registration count updates via Convex subscriptions
- Optimistic UI for status changes

## Success Metrics

### Primary KPIs:
- Event creation completion rate >85%
- Time to publish event <2 minutes
- Task completion time for "find and edit event" <30 seconds

### Secondary Metrics:
- Filter usage patterns
- Mobile vs desktop usage
- Average events per team per month

## Out of Scope

### Phase 2 Features:
- Bulk event operations (duplicate, archive)
- Calendar view integration
- Advanced analytics dashboard

### Not Included:
- Event template system
- Custom event fields
- External calendar integration 