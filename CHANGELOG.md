# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive Zod validation system for all form inputs
- Shared validation schemas with reusable validation utilities
- User profile validation (name, email, phone, favorite color)
- Event creation validation with advanced date, capacity, and file constraints
- Event registration validation for public attendee forms
- Client-side form validation with real-time error feedback
- Server-side validation integration with Convex functions
- Custom validation patterns for phone numbers, URLs, and hex colors
- File upload validation with size and type restrictions
- Settings page with profile and avatar update functionality
- File upload integration for user avatars
- Avatar display in user menu
- Thread creation dialog with auto-selection of latest thread
- Discussion threads for event management
- Sidebar navigation with mobile detection
- Messages page for team communication
- UI components: separator, sheet, sidebar, tooltip
- DatePicker and Calendar components for event date selection
- Event image upload functionality with dropdown menu
- Toast notifications system
- Draft event creation functionality

### Changed
- Optimized email validation to use Zod's built-in validation instead of custom regex
- Enhanced form validation architecture with TypeScript integration
- Improved error handling and user feedback for form submissions
- Refactored components to use new typography elements for improved UI consistency
- Enhanced EventListPage with Tabs for better event navigation
- Improved event display logic and styling
- Refactored layout with mobile detection capabilities
- Updated event management to use ID-based routing with change detection
- Enhanced user menu with avatar display and better navigation

### Fixed
- Removed redundant email validation regex to eliminate duplicate validation logic
- Enhanced input validation to prevent XSS attacks and malicious content
- Resolved TypeScript lint errors and React Hook warnings
- Fixed event routing issues
- Replaced window.location.href with proper navigate function

### Security
- Implemented comprehensive input sanitization to prevent XSS attacks
- Added robust validation for file uploads with type and size restrictions
- Enhanced form validation to block malicious content and event handlers
- Improved data validation at both client and server levels
- Enhanced user authentication and avatar upload security

## [1.0.0] - Initial Release

### Added
- Event management platform with team collaboration
- Convex Auth integration (email/OTP, OAuth with Google)
- Team management with role-based access control
- Event creation, editing, and management
- Public event registration system
- Real-time messaging and threading system
- Email notifications via Resend
- Dark/light theme support
- File storage for event and user images
- Mobile-responsive design with Tailwind CSS
- TypeScript support with strict configuration