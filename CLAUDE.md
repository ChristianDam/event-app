# Convex Auth Example - Event Management Platform

## Project Overview

This is a comprehensive event management platform built with **Convex**, **React**, **TypeScript**, and **Convex Auth**. The application demonstrates modern authentication patterns and provides a full-featured event management system with team collaboration, threading discussions, and public event experiences.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for development and building
- **Tailwind CSS** for styling with custom design system
- **Shad/cn** components for accessible UI elements
- **Lucide React** for icons
- **Next Themes** for dark/light theme support

### Backend  
- **Convex** as the backend-as-a-service platform
- **Convex Auth** for authentication (email/OTP, OAuth with Google)
- **Resend** for email delivery
- **React Email** for email templates

### Development
- **TypeScript** with strict configuration
- **ESLint** for code quality
- **Vitest** for testing with coverage
- **Prettier** for code formatting

## Architecture

### Database Schema (convex/schema.ts)
The app uses a relational data model with the following key entities:

- **users**: Authentication and profile data with email/phone verification
- **teams**: Organization units with branding (logo, colors) and ownership
- **teamMembers**: Team membership with roles (owner, admin, member)
- **teamInvitations**: Email-based team invitations with token verification
- **events**: Full event data with team association, scheduling, and registration
- **eventRegistrations**: Public registration system for events
- **threads**: Discussion threads (team-wide, event-specific, AI agent threads)
- **threadParticipants**: Thread membership and permissions
- **threadMessages**: Threaded messaging system with reply support

### Key Features

#### Authentication System (convex/auth.ts)
- Email/OTP authentication with verification codes
- OAuth integration (Google)
- Anonymous user support
- Email verification workflows
- Phone verification capabilities

#### Team Management
- Team creation with custom branding (colors, logos)
- Role-based access control (owner/admin/member)
- Invitation system with email notifications
- Team member management

#### Event Management  
- Comprehensive event creation with rich metadata
- Multiple event types (music, art, workshop, performance, exhibition)
- Event scheduling with timezone support
- Capacity management and registration limits
- Event status workflow (draft → published → cancelled)
- Image upload support for event and social media images
- Public registration system with confirmation emails

#### Communication System
- Threaded discussions within teams and events
- Real-time messaging capabilities
- Future AI agent integration support
- Thread permissions and moderation

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components (buttons, dialogs, etc)
│   ├── events/          # Event-specific components
│   ├── threads/         # Threading/messaging components
│   └── auth/            # Authentication components
├── pages/               # File-based routing pages
│   ├── events/          # Event-related pages
│   ├── team/            # Team management pages
│   └── invite/          # Team invitation handling
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
└── router/              # Custom file-based routing system

convex/
├── auth.ts              # Convex Auth configuration
├── auth.config.ts       # Auth provider configuration  
├── schema.ts            # Database schema definitions
├── users.ts             # User management functions
├── teams.ts             # Team management functions
├── events.ts            # Event CRUD operations
├── messages.ts          # Messaging system functions
├── threads.ts           # Threading system functions
├── emails/              # Email templates
└── otp/                 # OTP verification system
```

## Development Commands

```bash
# Start development (frontend + backend)
npm run dev

# Start just frontend
npm run dev:frontend

# Start just backend  
npm run dev:backend

# Type checking and linting
npm run lint

# Run tests
npm test
npm run test:coverage

# Build for production
npm run build
```

## Key Development Guidelines

### Git & Version Control
- **Update CLAUDE.md when making significant changes** - When Claude Code is used for git actions (commits, PRs), ensure this documentation reflects any architectural changes, new features, or updated patterns
- Include meaningful commit messages that reference the type of change (feat, fix, refactor, etc.)
- Keep documentation in sync with code changes

### Convex Functions
- Always use the new function syntax with explicit `args` and `returns` validators
- Use appropriate function types: `query`, `mutation`, `action`, `internalQuery`, etc.
- Follow file-based routing: functions in `convex/teams.ts` are accessed via `api.teams.functionName`

### Authentication
- Use `ctx.auth.getUserId()` to get current user ID in Convex functions
- Handle anonymous users appropriately with optional user ID checks
- Implement proper authorization checks for team/event access

### Database Operations
- Use indexes for efficient queries (all defined in schema.ts)
- Prefer `withIndex()` over `filter()` for performance
- Use `unique()` for single document queries that should return exactly one result

### Frontend Patterns
- **Prioritize reusable components** - Create modular, composable components that can be used across different parts of the application
- **Keep page files clean and readable** - Page components should be thin orchestration layers that compose reusable components and hooks
- Use custom hooks for complex state management (`useEventForm`, `useTeamEvents`)
- Implement proper loading and error states
- Follow the established component patterns for consistency

### Design System & Theming
- **Use only semantic colors** - Always use semantic color tokens (e.g., `text-foreground`, `bg-background`, `border-border`) instead of hardcoded colors to ensure consistency across light and dark themes
- Leverage CSS variables for theme-aware styling
- Maintain consistent spacing, typography, and component patterns
- Use Radix UI primitives for accessibility and consistent behavior

### Email System
- Email templates are built with React Email components
- Transactional emails sent via Resend integration
- Team invitations and event confirmations are automated

### File Storage
- Images stored in Convex's built-in file storage
- Support for both event images and social media optimized images
- Proper file upload handling with validation

## Recent Major Features

Based on recent commits, the platform has evolved to include:

1. **Comprehensive Team & Event Management** - Full CRUD operations with proper authorization
2. **Public Event Experience** - Public-facing event pages with registration
3. **Event Creation Flow** - Streamlined event creation with team branding
4. **Thread-based Communication** - Real-time messaging system
5. **Theme System** - Consistent dark/light theme support with CSS variables

## Testing

The project uses Vitest for testing with:
- Unit tests for utility functions
- Integration tests for Convex functions  
- Coverage reporting
- Debug capabilities with `npm run test:debug`

## Deployment

The app is configured for deployment with:
- Vite build system optimized for production
- TypeScript compilation with strict settings
- Environment variable support for configuration
- Convex backend automatically deployed

This platform demonstrates modern full-stack development practices with Convex, showcasing authentication, real-time features, file storage, email integration, and a comprehensive event management system.