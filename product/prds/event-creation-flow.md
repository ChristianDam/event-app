# PR #2: Event Creation Flow - Detailed Scope

## Overview

This PR implements the **Event Creation Flow** - the frontend components and team dashboard integration that allows team members to create beautiful, branded events using the backend infrastructure completed in PR #1.

## GitHub Issues Covered

- **Issue #8**: Event Creation Form - Beautiful, branded form for creating events
- **Issue #11**: Team Dashboard Integration - Adding events management to existing team dashboard

## Implementation Scope

### 1. Event Creation Form Component (`src/components/events/CreateEventDialog.tsx`)

#### 1.1 Core Form Features
- **Multi-step form wizard** with smooth transitions
- **Team branding integration** - automatic inheritance of team colors and logo
- **Real-time validation** with clear error messages and success states
- **Image upload system** with preview and drag-and-drop support
- **Responsive design** - mobile-first approach with touch-friendly interactions

#### 1.2 Form Fields & Validation
```typescript
// Event creation form schema
interface EventFormData {
  title: string;           // Required, 3-100 chars, unique slug generation
  description: string;     // Required, 10-2000 chars, rich text support
  venue: string;          // Required, 3+ chars, future autocomplete integration
  startTime: Date;        // Required, must be in future
  endTime: Date;          // Required, must be after start time  
  timezone: string;       // Optional, defaults to "Europe/Copenhagen"
  eventType: EventType;   // Required, visual selection with icons
  maxCapacity?: number;   // Optional, positive integer
  registrationDeadline?: Date; // Optional, before start time
  eventImage?: File;      // Optional, stored in Convex files with compression
}
```

#### 1.3 User Experience Features
- **Smart defaults** - pre-fill timezone, set end time 2 hours after start
- **Progressive disclosure** - show advanced options only when needed
- **Live preview** - show how the event page will look as user types
- **Team branding preview** - demonstrate how team colors will appear
- **Accessibility** - full keyboard navigation and screen reader support

### 2. Team Dashboard Integration (`src/components/TeamPage.tsx` modifications)

#### 2.1 Events Section Addition
```typescript
// New sections to add to existing TeamPage
interface TeamEventsSection {
  eventsOverviewCard: {
    totalEvents: number;
    upcomingEvents: number;
    totalRegistrations: number;
    recentActivity: EventActivity[];
  };
  quickActions: {
    createEventButton: () => void;
    viewAllEventsLink: string;
    eventTemplatesDropdown?: EventTemplate[];
  };
  recentEventsList: {
    events: Event[];
    limit: 5;
    showStatus: boolean;
    managementActions: EventAction[];
  };
}
```

#### 2.2 Dashboard Enhancements
- **Events overview card** - key metrics and quick stats
- **"Create Event" CTA button** - prominent, styled with team colors
- **Recent events list** - last 5 events with management shortcuts
- **Event status indicators** - draft, published, cancelled states
- **Quick actions menu** - edit, duplicate, view registrations, share

### 3. Event Management Components

#### 3.1 Event List Component (`src/components/events/EventList.tsx`)
```typescript
interface EventListProps {
  teamId: string;
  view: 'grid' | 'list' | 'calendar';
  filter: {
    status?: EventStatus[];
    eventType?: EventType[];
    dateRange?: [Date, Date];
  };
  sortBy: 'startTime' | 'createdAt' | 'registrationCount';
  sortOrder: 'asc' | 'desc';
}
```

#### 3.2 Event Card Component (`src/components/events/EventCard.tsx`)
- **Visual hierarchy** - clear title, date, venue, registration count
- **Team branding** - consistent with team colors and logo
- **Status indicators** - published, draft, cancelled, full capacity
- **Quick actions** - edit, view, share, duplicate buttons
- **Registration progress** - visual capacity bar when applicable

### 4. Supporting Utilities & Hooks

#### 4.1 Form Management Hook (`src/hooks/useEventForm.ts`)
```typescript
interface UseEventFormReturn {
  formData: EventFormData;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  handleInputChange: (field: keyof EventFormData, value: any) => void;
  handleSubmit: () => Promise<Event>;
  resetForm: () => void;
  validateField: (field: keyof EventFormData) => string | null;
}
```

#### 4.2 Convex Image Upload Hook (`src/hooks/useImageUpload.ts`)
```typescript
interface UseImageUploadReturn {
  uploadedImageId: Id<"_storage"> | null;
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;
  uploadImage: (file: File) => Promise<void>;
  clearImage: () => void;
  generateUploadUrl: () => Promise<string>;
  getImageUrl: (fileId: Id<"_storage">) => Promise<string | null>;
}

// Implementation uses Convex file storage system
const useImageUpload = (teamId: Id<"teams">) => {
  const generateUploadUrl = useMutation(api.events.generateEventImageUploadUrl);
  
  const uploadImage = async (file: File) => {
    // 1. Generate signed upload URL from Convex
    const uploadUrl = await generateUploadUrl({ teamId });
    
    // 2. Client-side image compression and format validation
    const compressedFile = await compressImage(file);
    
    // 3. Upload directly to Convex file storage
    const result = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: compressedFile,
    });
    
    // 4. Extract file ID from response
    const { storageId } = await result.json();
    setUploadedImageId(storageId);
  };
};
```

#### 4.3 Event Validation Utilities (`src/utils/eventValidation.ts`)
```typescript
export const eventValidationRules = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-.,!?()]+$/,
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 2000,
    sanitize: true,
  },
  venue: {
    required: true,
    minLength: 3,
    maxLength: 200,
  },
  dateTime: {
    futureOnly: true,
    endAfterStart: true,
    maxAdvanceBooking: 365, // days
  },
  capacity: {
    min: 1,
    max: 10000,
    integer: true,
  }
};
```

### 5. Team Branding Integration (`src/utils/teamBranding.ts`)

#### 5.1 Brand Theme Generation
```typescript
interface TeamEventTheme {
  primary: string;        // Team's primary color
  secondary: string;      // Generated complementary color  
  accent: string;         // Lighter shade for highlights
  text: string;          // High contrast text color
  background: string;     // Light background variant
  shadow: string;        // Subtle shadow with brand color
}

export const generateEventTheme = (team: Team): TeamEventTheme => {
  // Color theory algorithms for complementary colors
  // Accessibility compliance (WCAG AA)
  // Return cohesive theme object
};
```

#### 5.2 Dynamic CSS Variables
```typescript
// Inject team colors as CSS custom properties
export const applyTeamTheme = (theme: TeamEventTheme) => {
  document.documentElement.style.setProperty('--event-primary', theme.primary);
  document.documentElement.style.setProperty('--event-secondary', theme.secondary);
  document.documentElement.style.setProperty('--event-accent', theme.accent);
  // ... additional properties
};
```

## File Structure

```
src/
├── components/
│   ├── events/
│   │   ├── CreateEventDialog.tsx        # Main event creation form
│   │   ├── EventList.tsx                # List view for team events
│   │   ├── EventCard.tsx                # Individual event display card
│   │   ├── EventFormSteps/              # Multi-step form components
│   │   │   ├── BasicInfoStep.tsx
│   │   │   ├── DateTimeStep.tsx
│   │   │   ├── DetailsStep.tsx
│   │   │   └── ReviewStep.tsx
│   │   └── EventStatusBadge.tsx         # Status indicator component
│   └── TeamPage.tsx                     # Modified existing component
├── hooks/
│   ├── useEventForm.ts                  # Event form state management
│   ├── useImageUpload.ts                # Image upload functionality
│   └── useTeamEvents.ts                 # Team events data fetching
├── utils/
│   ├── eventValidation.ts               # Form validation logic
│   ├── teamBranding.ts                  # Brand theme generation
│   └── dateTime.ts                      # Date/time formatting utilities
└── types/
    └── events.ts                        # Frontend event type definitions
```

## Technical Implementation Details

### 6.1 State Management Strategy
- **React Hook Form** for complex form state with validation
- **React Query (via Convex)** for server state management  
- **Local component state** for UI interactions and temporary data
- **Context API** for team branding theme throughout event components

### 6.2 Performance Optimizations
- **Lazy loading** - Event creation dialog only loads when opened
- **Convex file storage** - Direct upload to Convex with signed URLs
- **Image compression** - Client-side compression before Convex upload
- **Debounced validation** - Real-time validation with performance consideration
- **Optimistic updates** - Immediate UI feedback during form submission
- **Image caching** - Convex-generated URLs are cached for performance

### 6.3 Accessibility Features
- **Keyboard navigation** - Full keyboard support for all interactions
- **Screen reader support** - Proper ARIA labels and descriptions
- **Focus management** - Logical tab order and focus trapping in dialogs
- **Color contrast** - Ensure team colors meet WCAG AA standards
- **Motion preferences** - Respect user's reduced motion settings

### 6.4 Mobile-First Responsive Design
```css
/* Mobile-first breakpoints */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }  
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

## Integration Points

### 7.1 Backend Integration
- Uses all CRUD functions from `convex/events.ts` (completed in PR #1)
- Leverages existing team permission system
- **Convex file storage integration**:
  - Uses `generateEventImageUploadUrl` mutation from backend
  - Stores event images as `Id<"_storage">` references in events table
  - Retrieves image URLs using `ctx.storage.getUrl()` in queries
  - Follows Convex file storage best practices with signed URLs
- Follows existing authentication patterns

### 7.2 Existing Component Integration  
- **TeamPage.tsx** - Add new events section without breaking existing layout
- **Navigation** - Add events links to team navigation menu
- **Theme system** - Extend existing team branding to event components
- **Permission system** - Respect existing role-based access controls

## Testing Strategy

### 8.1 Unit Tests
- Form validation logic
- Team branding theme generation
- Date/time utility functions
- Image upload functionality

### 8.2 Integration Tests
- Complete event creation flow
- Team dashboard events section
- **Convex file storage integration**:
  - Image upload to Convex storage
  - Image preview from Convex URLs
  - File permission validation
  - Image compression and format handling
- Form submission and error handling

### 8.3 Visual/E2E Tests
- Multi-step form progression
- Team branding application
- Responsive behavior across devices  
- Accessibility compliance

## Success Criteria

### 9.1 Functional Requirements
✅ Team members can create events through intuitive form  
✅ Events automatically inherit team branding (colors, logo)  
✅ Form validation prevents invalid event data  
✅ Image upload works with preview and compression  
✅ Team dashboard shows events overview and management tools  
✅ All components are fully responsive and accessible  

### 9.2 Performance Requirements
✅ Event creation form loads in under 1 second  
✅ Image upload completes in under 10 seconds  
✅ Form validation provides immediate feedback (<100ms)  
✅ Mobile experience is smooth on 3G networks  

### 9.3 User Experience Requirements
✅ First-time users can create an event in under 5 minutes  
✅ Form clearly communicates validation errors and requirements  
✅ Team branding is visually consistent across all components  
✅ Mobile form is touch-friendly with proper sizing  

## Dependencies & Blockers

### 10.1 Dependencies
- **PR #1 must be merged** - Requires backend event functions including `generateEventImageUploadUrl`
- **Existing team system** - Builds on current team management
- **Convex file storage** - Uses existing Convex storage system (already configured):
  - Backend `generateEventImageUploadUrl` mutation (completed in PR #1)
  - Convex storage permissions for team members
  - Image URL generation with `ctx.storage.getUrl()`

### 10.2 No Blockers
- Can develop independently once PR #1 is merged
- No external API dependencies  
- No breaking changes to existing code

## Deployment Strategy

### 11.1 Feature Flags (Optional)
- `enableEventCreation` - Toggle event creation form visibility
- `showEventsDashboard` - Control events section in team dashboard

### 11.2 Rollout Plan
1. **Deploy to staging** - Full functionality testing
2. **Team beta testing** - Internal teams create test events  
3. **Gradual rollout** - Enable for select teams first
4. **Full deployment** - Enable for all teams

## Future Enhancements (Out of Scope)
- Rich text editor for event descriptions
- Event templates and recurring events
- Advanced venue search with Google Places API
- Calendar integration (Google Calendar, Outlook)
- Bulk event operations
- Advanced analytics dashboard

---

This PR will deliver a complete, beautiful event creation experience that seamlessly integrates with the existing team management system while laying the foundation for the public event pages in PR #3.