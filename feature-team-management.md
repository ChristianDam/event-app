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
- Team branding/customization
- Advanced member management features

## Success Metrics
- % of users with multiple team members
- Invitation acceptance rate
- Time from invitation to first collaborative event
- Number of teams with 3+ active members