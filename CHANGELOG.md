# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
- Refactored components to use new typography elements for improved UI consistency
- Enhanced EventListPage with Tabs for better event navigation
- Improved event display logic and styling
- Refactored layout with mobile detection capabilities
- Updated event management to use ID-based routing with change detection
- Enhanced user menu with avatar display and better navigation

### Fixed
- Resolved TypeScript lint errors and React Hook warnings
- Fixed event routing issues
- Replaced window.location.href with proper navigate function

### Security
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