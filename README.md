# Event Management Platform

A comprehensive event management platform built with **Convex**, **React**, and **TypeScript**. This application demonstrates modern authentication patterns with [Convex Auth](https://labs.convex.dev/auth) and provides a full-featured event management system with team collaboration, threaded discussions, and public event experiences.

## Features

### 🎯 Event Management
- **Comprehensive Event Creation** - Rich metadata, multiple event types (music, art, workshop, performance, exhibition)
- **Scheduling & Capacity Management** - Timezone support, registration limits, waitlist functionality
- **Public Registration System** - Open registration with automated confirmation emails
- **Event Status Workflow** - Draft → Published → Cancelled states with proper transitions
- **Media Support** - Event images and social media optimized image uploads

### 👥 Team Collaboration
- **Team Management** - Create teams with custom branding (logos, colors)
- **Role-Based Access Control** - Owner, admin, and member permissions
- **Invitation System** - Email-based invitations with secure token verification
- **Team Member Management** - Add, remove, and manage team member roles

### 💬 Communication
- **Threaded Discussions** - Team-wide and event-specific conversation threads
- **Real-time Messaging** - Live chat functionality with reply support
- **Thread Permissions** - Moderated discussions with participant management
- **AI Agent Integration** - Future-ready architecture for AI-powered discussions

### 🔐 Authentication & Security
- **Multiple Auth Methods** - Email/OTP verification and OAuth (Google)
- **Email & Phone Verification** - Comprehensive user verification workflows
- **Anonymous User Support** - Guest access for public features
- **Secure Token Management** - JWT-based authentication with Convex Auth

## Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom design system and dark/light theme support
- **Shadcn/ui** components for accessible, consistent UI elements
- **Lucide React** for comprehensive icon library

### Backend & Infrastructure
- **Convex** - Backend-as-a-service with real-time capabilities
- **Convex Auth** - Secure authentication with multiple providers
- **File Storage** - Built-in Convex file storage for images
- **Real-time Updates** - Live data synchronization across clients

### Email & Communications
- **Resend** - Reliable email delivery service
- **React Email** - Component-based email template system
- **Automated Notifications** - Event confirmations, team invitations, and updates

### Development & Quality
- **TypeScript** with strict configuration for type safety
- **ESLint** for code quality and consistency
- **Vitest** for comprehensive testing with coverage reporting
- **Prettier** for automated code formatting

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd convex-auth-example
   npm install
   ```

2. **Set up Convex backend**
   ```bash
   npx convex dev
   ```
   Follow the prompts to create your Convex project and configure authentication.

3. **Configure environment variables**
   Set up your `.env.local` file with required API keys:
   ```env
   # Convex Auth configuration
   CONVEX_URL=<your-convex-url>
   
   # Email service (Resend)
   RESEND_API_KEY=<your-resend-api-key>
   
   # OAuth providers (optional)
   GOOGLE_CLIENT_ID=<your-google-client-id>
   GOOGLE_CLIENT_SECRET=<your-google-client-secret>
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start both frontend and backend development servers
- `npm run dev:frontend` - Start only the frontend development server
- `npm run dev:backend` - Start only the Convex backend
- `npm run build` - Build the application for production
- `npm run lint` - Run ESLint for code quality checks
- `npm test` - Run the test suite
- `npm run test:coverage` - Run tests with coverage reporting

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Shadcn/ui base components
│   │   ├── events/         # Event-specific components
│   │   ├── threads/        # Discussion/messaging components
│   │   └── auth/           # Authentication components
│   ├── pages/              # File-based routing pages
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions and helpers
│   └── types/              # TypeScript type definitions
├── convex/
│   ├── auth.ts            # Authentication configuration
│   ├── schema.ts          # Database schema definitions
│   ├── events.ts          # Event management functions
│   ├── teams.ts           # Team management functions
│   ├── threads.ts         # Discussion system functions
│   └── emails/            # Email template components
└── public/                # Static assets
```

## Key Features in Detail

### Event Management System
Create and manage events with comprehensive details including descriptions, scheduling, capacity limits, and media. Events can be published publicly for registration or kept as team-only planning sessions.

### Team Collaboration
Teams provide organizational structure with custom branding. Team members have different permission levels and can collaborate on events, participate in discussions, and manage team settings.

### Threaded Communication
Built-in messaging system supports both team-wide discussions and event-specific conversations. Future-ready for AI agent integration to enhance team productivity.

### Public Event Experience
Events can be published with public registration pages, allowing external users to discover and register for events with automated confirmation workflows.

## Contributing

This project demonstrates modern full-stack development patterns with Convex. It showcases:
- Type-safe database operations with Convex schema validation
- Real-time data synchronization
- Comprehensive authentication flows
- File upload and storage patterns
- Email integration and template management
- Component-based architecture with React and TypeScript

## License

[Add your license information here]

## Support

For questions about Convex Auth, visit the [Convex Auth documentation](https://labs.convex.dev/auth).
For general Convex questions, check out the [Convex documentation](https://docs.convex.dev).
