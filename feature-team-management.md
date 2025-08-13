# Feature: Team Management System

## Overview
Enable collaborative event management through team-based organization. All event organizers must belong to a team, with seamless invitation mechanisms to build creative communities.

## User Stories

### Core Team Functionality
- **As a new user**, I want to automatically have a default team called "My Team" so I can start creating events immediately
- **As a team owner**, I want to invite collaborators via email so they can help manage our events
- **As a team owner**, I want to generate invitation links so I can easily share team access
- **As an invited user**, I want to receive clear email invitations with team context so I understand what I'm joining
- **As an invited user**, I want to join teams through invitation links so I can quickly become a collaborator

### Team Management
- **As a team member**, I want to see all team members and their roles so I understand our organization
- **As a team owner**, I want to manage member permissions so I can control who can create/edit events
- **As a team member**, I want to leave teams I no longer want to be part of
- **As a team owner**, I want to remove members when necessary to maintain team quality

## Technical Requirements

### Database Schema
```typescript
teams: {
  name: string;
  slug: string; // URL-friendly identifier
  description?: string;
  ownerId: Id<"users">;
  createdAt: number;
}

teamMembers: {
  teamId: Id<"teams">;
  userId: Id<"users">;
  role: "owner" | "admin" | "member";
  joinedAt: number;
}

teamInvitations: {
  teamId: Id<"teams">;
  invitedBy: Id<"users">;
  email: string;
  token: string; // unique invitation token
  role: "admin" | "member";
  status: "pending" | "accepted" | "expired";
  expiresAt: number;
  createdAt: number;
}
```

### API Endpoints

#### Team Management
- `createTeam(name, description?)` - Create new team
- `getMyTeams()` - Get all teams user belongs to
- `getTeamMembers(teamId)` - Get team member list
- `updateTeam(teamId, updates)` - Update team details
- `leaveTeam(teamId)` - Leave a team
- `removeMember(teamId, userId)` - Remove team member

#### Invitations
- `inviteByEmail(teamId, email, role)` - Send email invitation
- `generateInviteLink(teamId, role, expiresIn?)` - Create shareable link
- `acceptInvitation(token)` - Accept invitation via token
- `getPendingInvitations(teamId)` - Get pending invitations
- `cancelInvitation(invitationId)` - Cancel pending invitation

### User Experience Flow

#### Default Team Creation
1. User signs up → Automatically create "My Team" with user as owner
2. User can rename default team to match their organization
3. All events initially belong to user's default team

#### Email Invitation Flow
1. Team owner enters email address and selects role
2. System generates unique invitation token
3. Email sent with invitation link containing token
4. Recipient clicks link → lands on invitation acceptance page
5. If recipient has account → immediate team join
6. If recipient is new → sign up flow → automatic team join

### Security Considerations
- Invitation tokens expire after 7 days by default
- Email invitations tied to specific email addresses
- Invitation links can have custom expiration (1 hour to 30 days)
- Team owners can revoke pending invitations
- Rate limiting on invitation sends (max 10 per hour per team)

### UI Components Needed
- Team creation modal
- Team settings page with member management
- Invitation modal (email + link generation)
- Pending invitations list
- Team switcher in navigation
- Invitation acceptance page

## Implementation Priority

### Phase 1: Core Team Structure
- Database schema implementation
- Default team creation on user signup
- Basic team CRUD operations
- Team member management

### Phase 2: Email Invitations
- Email invitation system
- Invitation acceptance flow
- Email templates for invitations

### Phase 3: Invitation Links
- Link generation and sharing
- Public invitation acceptance pages
- Link expiration and management

### Phase 4: Enhanced Team Management
- Role-based permissions
- Team branding/customization with logo an primary color
- Advanced member management features

## Implementation Status

### ✅ Phase 1: Core Team Structure - COMPLETED
- ✅ Database schema implemented in `convex/schema.ts`
  - Three tables: `teams`, `teamMembers`, `teamInvitations`
  - Proper indexing for efficient queries
- ✅ Default team creation on user signup via auth callbacks in `convex/auth.ts`
- ✅ Complete team CRUD operations in `convex/teams.ts`
  - `createTeam`, `getMyTeams`, `getTeam`, `updateTeam`
  - `getTeamMembers`, `removeMember`, `leaveTeam`
- ✅ Team member management with role-based permissions (owner/admin/member)

### ✅ Phase 2: Email Invitations - COMPLETED
- ✅ Email invitation system implemented
  - `inviteByEmail` mutation with role selection
  - Token-based invitation system (32-character secure tokens)
  - 7-day expiration on invitations
- ✅ Invitation acceptance flow with `acceptInvitation` mutation
  - Email validation against invitation
  - Automatic team membership creation
  - Status tracking (pending/accepted/expired)
- ✅ Invitation management functions
  - `getPendingInvitations` for viewing sent invitations
  - `cancelInvitation` for revoking pending invitations
- ✅ Email templates prepared (currently logging, ready for email service integration)

### ✅ Frontend Implementation - COMPLETED
- ✅ Team management UI in `src/components/TeamPage.tsx`
  - Team details view with member tables
  - Invite member dialog with email and role selection
  - Pending invitations management
  - Edit team details functionality
- ✅ User menu integration in `src/components/UserMenu.tsx`
  - Team listing with member counts and user roles
  - Create new team dialog
  - Team navigation to dedicated pages
- ✅ File-based routing system in `src/router/` and `src/pages/`
  - Next.js/Remix-style file-based routing with `[param]` syntax
  - Route-level authentication settings
  - Clean separation of concerns from App.tsx
  - Support for nested routes and 404 handling

### ✅ Phase 3: Invitation Links - PARTIALLY COMPLETED
- ✅ Public invitation acceptance pages implemented
  - Unauthenticated users can view invitation details
  - Seamless sign-in flow for invitation acceptance
  - Token-based URL access (`/invite/[token]`)
- ✅ Link generation via development logging (production ready)
- ❌ Shareable link generation UI (admin can copy from logs)
- ❌ Custom expiration settings UI

### ❌ Phase 4: Enhanced Team Management - NOT IMPLEMENTED
- ❌ Team branding/customization
- ❌ Advanced member management features

## Current System Capabilities

The implemented team management system provides:

1. **Automatic Team Creation**: New users get a "My Team" created automatically
2. **Role-Based Access Control**: Three-tier permission system (owner > admin > member)
3. **Email Invitations**: Secure token-based invitations with email validation
4. **Public Invitation Access**: Anyone can view invitation details before signing in
5. **Team Management UI**: Full-featured interface for managing teams and members
6. **Permission Validation**: Server-side permission checks for all team operations
7. **File-Based Routing**: Scalable Next.js/Remix-style routing architecture
8. **Development Mode**: Email fallback with console logging for testing

## Missing Features Analysis

### 🔍 **What's Missing from Original Specification:**

1. **Shareable Link Generation UI** (Phase 3)
   - Currently links are generated and logged to console
   - Missing: Admin UI to copy/share invitation links
   - **Effort**: Small - just UI for displaying/copying the token URL

2. **Custom Link Expiration Settings** (Phase 3)
   - Currently fixed at 7 days
   - Missing: UI to set custom expiration (1 hour to 30 days)
   - **Effort**: Medium - requires UI and backend updates

3. **Rate Limiting** (Security)
   - Specified: "max 10 per hour per team"
   - Missing: Server-side rate limiting implementation
   - **Effort**: Medium - requires tracking invitation counts

4. **Team Branding/Customization** (Phase 4)
   - Missing: Team logos, primary colors, custom branding
   - **Effort**: Large - requires file upload, storage, and UI overhaul

5. **Advanced Role Permissions** (Phase 4)
   - Currently basic owner/admin/member roles
   - Missing: Fine-grained permissions (who can invite, edit events, etc.)
   - **Effort**: Large - requires permission matrix system

6. **Team Analytics** (Phase 4)
   - Missing: Member activity tracking, team statistics
   - **Effort**: Large - requires analytics infrastructure

### ✅ **What We Actually Exceeded:**

1. **Public Invitation Pages** - Better UX than originally specified
2. **File-Based Routing** - More scalable architecture than planned  
3. **Development Mode** - Better testing workflow than specified
4. **Type Safety** - Comprehensive TypeScript implementation

## Next Steps for Enhancement

### **Quick Wins** (1-2 hours each):
1. **Add Link Copy UI**: Display invitation URLs in team management interface
2. **Improve Email Templates**: Add more professional styling and branding

### **Medium Tasks** (1-2 days each):
3. **Custom Expiration Settings**: Add UI for setting invitation expiration times
4. **Rate Limiting**: Implement invitation rate limiting per team/user
5. **Invitation Analytics**: Track invitation success rates and usage

### **Large Features** (1+ weeks each):
6. **Team Branding**: Logo uploads, color themes, custom styling
7. **Advanced Permissions**: Granular role-based permission system
8. **Team Analytics**: Comprehensive activity tracking and reporting