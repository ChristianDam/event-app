# Zod Implementation - Task Checklist

This document provides a checklist of tasks for implementing Zod form validation in the project. Check off each item as you complete it and commit your changes.

## Phase 1: Foundation Setup

### 1.1 Install Dependencies
- [ ] **Task:** Install the following npm packages for Zod form validation: zod, react-hook-form, and @hookform/resolvers. Update package.json with these dependencies.
- [ ] **Commit:** `feat: add zod and react-hook-form dependencies for form validation`

### 1.2 Create Schema Directory Structure  
- [ ] **Task:** Create a new directory structure `src/schemas/` with the following files:
  - `src/schemas/index.ts` (barrel export file)
  - `src/schemas/eventSchema.ts` (empty for now)
  - `src/schemas/userSchema.ts` (empty for now) 
  - `src/schemas/registrationSchema.ts` (empty for now)
  - `src/schemas/shared.ts` (for common validation patterns)
- [ ] **Commit:** `feat: create schema directory structure for zod validation`

## Phase 2: Schema Creation

### 2.1 Create Shared Validation Utilities
- [ ] **Task:** Create `src/schemas/shared.ts` with common Zod validation schemas for:
  - Email validation (with proper regex)
  - Phone number validation (international format)
  - Non-empty strings with min/max length
  - URL validation
  - Color hex code validation
  - File upload validation (size, type restrictions)
- [ ] **Commit:** `feat: add shared zod validation utilities and common patterns`

### 2.2 Create Event Schema
- [ ] **Task:** Convert the validation logic from `src/utils/eventValidation.ts` to Zod schemas in `src/schemas/eventSchema.ts`. Create schemas for:
  - EventFormData (title, description, venue, dates, capacity, etc.)
  - EventFormErrors (error types)
  - Include all validation rules from the original file (min/max lengths, patterns, date validations)
  - Export TypeScript types inferred from the schemas
- [ ] **Commit:** `feat: add event form zod schema with validation rules`

### 2.3 Create User Profile Schema
- [ ] **Task:** Create `src/schemas/userSchema.ts` with Zod schemas based on validation logic in `src/pages/settings.tsx`:
  - UserProfileData (name, email, phone, favoriteColor)
  - UserProfileErrors  
  - Include email and phone validation patterns from the existing code
  - Export inferred TypeScript types
- [ ] **Commit:** `feat: add user profile zod schema for settings validation`

### 2.4 Create Registration Schema
- [ ] **Task:** Create `src/schemas/registrationSchema.ts` with Zod schemas based on validation in `src/components/events/EventRegistrationForm.tsx`:
  - EventRegistrationData (attendeeName, attendeeEmail, attendeePhone)
  - EventRegistrationErrors
  - Include all validation rules from the existing form (name length, email format, optional phone)
  - Export inferred TypeScript types
- [ ] **Commit:** `feat: add event registration zod schema for form validation`

### 2.5 Create Schema Index
- [ ] **Task:** Create `src/schemas/index.ts` as a barrel export file that exports all schemas and types from the schema files, making them easily importable throughout the app.
- [ ] **Commit:** `feat: add schema barrel export for centralized imports`

## Phase 3: Form Hook Modernization

### 3.1 Create Reusable Form Components
- [ ] **Task:** Create reusable form UI components in `src/components/ui/form/`:
  - `FormField.tsx` - Wrapper for form inputs with error handling
  - `FormError.tsx` - Standardized error display component  
  - `FormSection.tsx` - Form section wrapper with consistent styling
  - These should integrate with React Hook Form and display Zod validation errors consistently
- [ ] **Commit:** `feat: add reusable form components with react-hook-form integration`

### 3.2 Refactor useEventForm Hook
- [ ] **Task:** Refactor `src/hooks/useEventForm.ts` to use React Hook Form with Zod validation:
  - Replace manual useState with useForm from react-hook-form
  - Use zodResolver with the event schema for validation
  - Maintain the same API interface for backward compatibility
  - Keep features like auto-adjusting end time and real-time validation
  - Integrate the image upload functionality
- [ ] **Commit:** `refactor: migrate useEventForm to react-hook-form with zod validation`

### 3.3 Create Registration Form Hook
- [ ] **Task:** Create `src/hooks/useRegistrationForm.ts` to replace the inline form logic in EventRegistrationForm:
  - Use React Hook Form with Zod validation
  - Include form submission logic
  - Handle success/error states
  - Make it reusable for different registration scenarios
- [ ] **Commit:** `feat: add useRegistrationForm hook with zod validation`

### 3.4 Create User Settings Form Hook
- [ ] **Task:** Create `src/hooks/useProfileForm.ts` to replace validation logic in `src/pages/settings.tsx`:
  - Use React Hook Form with user profile schema
  - Handle avatar upload functionality
  - Include form dirty state detection
  - Maintain existing features like unsaved changes warning
- [ ] **Commit:** `feat: add useProfileForm hook for settings page validation`

## Phase 4: Component Migration

### 4.1 Update CreateEventDialog Component
- [ ] **Task:** Refactor `src/components/events/CreateEventDialog.tsx` to use the new useEventForm hook with Zod validation:
  - Replace direct hook usage with the new Zod-powered version
  - Update form field components to use the new reusable Form components
  - Ensure error display works with Zod validation messages
  - Maintain all existing functionality and UI behavior
- [ ] **Commit:** `refactor: migrate CreateEventDialog to use zod validation`

### 4.2 Update EventRegistrationForm Component  
- [ ] **Task:** Refactor `src/components/events/EventRegistrationForm.tsx` to use the new useRegistrationForm hook:
  - Replace manual form state with the new hook
  - Update form validation to use Zod schemas
  - Use the new reusable Form components for consistent styling
  - Maintain all existing functionality including success states
- [ ] **Commit:** `refactor: migrate EventRegistrationForm to use zod validation`

### 4.3 Update Settings Page
- [ ] **Task:** Refactor `src/pages/settings.tsx` to use the new useProfileForm hook:
  - Replace manual validation logic with Zod-powered hook
  - Update form fields to use new Form components
  - Maintain existing features like avatar upload and verification badges
  - Ensure all validation works correctly with new schema
- [ ] **Commit:** `refactor: migrate settings page to use zod validation`

### 4.4 Update Other Form Components
- [ ] **Task:** Search for other components that might use form validation and update them to use Zod schemas if needed:
  - Check `src/components/UserMenu.tsx` for any form logic
  - Update any other components with form validation to use consistent patterns
  - Ensure all forms follow the new validation approach
- [ ] **Commit:** `refactor: update remaining form components to use zod validation`

## Phase 5: Testing and Cleanup

### 5.1 Add Schema Tests
- [ ] **Task:** Create test files for the Zod schemas:
  - `src/schemas/__tests__/eventSchema.test.ts`
  - `src/schemas/__tests__/userSchema.test.ts`  
  - `src/schemas/__tests__/registrationSchema.test.ts`
  - Test valid and invalid inputs, edge cases, and error messages
- [ ] **Commit:** `test: add comprehensive tests for zod validation schemas`

### 5.2 Add Form Hook Tests
- [ ] **Task:** Create test files for the form hooks:
  - `src/hooks/__tests__/useEventForm.test.ts`
  - `src/hooks/__tests__/useRegistrationForm.test.ts`
  - `src/hooks/__tests__/useProfileForm.test.ts`
  - Test form validation, submission, error handling, and edge cases
- [ ] **Commit:** `test: add tests for form hooks with zod validation`

### 5.3 Remove Deprecated Files
- [ ] **Task:** After confirming all functionality works with the new Zod implementation:
  - Delete `src/utils/eventValidation.ts`
  - Remove any other deprecated validation utilities
  - Clean up unused type definitions
  - Update imports throughout the codebase
- [ ] **Commit:** `refactor: remove deprecated validation utilities and clean up imports`

### 5.4 Update Type Definitions
- [ ] **Task:** Update `src/types/events.ts` and other type files:
  - Replace manual type definitions with Zod-inferred types
  - Remove duplicate interfaces that are now handled by schemas
  - Ensure TypeScript compilation works correctly
  - Update any Convex function types if needed
- [ ] **Commit:** `refactor: update type definitions to use zod-inferred types`

### 5.5 Documentation Update
- [ ] **Task:** Update project documentation:
  - Update CLAUDE.md to reflect the new validation patterns
  - Add comments explaining the Zod schema approach
  - Update any inline documentation about form validation
  - Create examples of how to add new forms using the new patterns
- [ ] **Commit:** `docs: update documentation for zod validation implementation`

## Phase 6: Performance and Bundle Optimization

### 6.1 Bundle Size Analysis
- [ ] **Task:** Analyze the bundle size impact of adding Zod and React Hook Form:
  - Run build and check bundle size before/after
  - Ensure the size increase is reasonable given the benefits
  - Look for opportunities to optimize imports or tree-shake unused code
- [ ] **Commit:** `perf: optimize bundle size for zod and react-hook-form`

### 6.2 Performance Testing
- [ ] **Task:** Test form performance with the new implementation:
  - Verify forms render and validate quickly
  - Check that real-time validation doesn't cause performance issues
  - Ensure large forms (like event creation) remain responsive
  - Compare performance metrics with the old implementation
- [ ] **Commit:** `perf: verify and optimize form performance with new validation`

## Final Verification Checklist

After completing all changes, verify:

- [ ] All existing forms work correctly with new validation
- [ ] Error messages are clear and user-friendly  
- [ ] TypeScript compilation succeeds with no errors
- [ ] All tests pass
- [ ] Bundle size increase is acceptable
- [ ] Form performance is maintained or improved
- [ ] Developer experience is improved with better IntelliSense
- [ ] Documentation is updated and accurate

## Final Integration Test

- [ ] **Task:** Perform end-to-end testing of all forms in the application:
  1. Test event creation with various valid/invalid inputs
  2. Test event registration with edge cases
  3. Test user settings updates with validation errors
  4. Verify error messages are displayed correctly
  5. Check form submission success flows
  6. Test form reset and cancellation functionality
  7. Ensure all accessibility features still work
  8. Verify mobile responsive behavior
  9. Run the linter and type checker to ensure code quality standards are met
- [ ] **Commit:** `feat: complete zod form validation implementation with full testing`

## Summary Statistics

**Total Tasks:** 24  
**Completed:** ___/24  
**Progress:** ____%

**Estimated Time:** 2-3 days  
**Dependencies Added:** 3 (zod, react-hook-form, @hookform/resolvers)  
**Files Created:** ~15  
**Files Modified:** ~8  
**Files Deleted:** ~2