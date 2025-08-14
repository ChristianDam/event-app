import { EventFormData, EventFormErrors, eventTypeOptions } from '../types/events';

export const eventValidationRules = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-.,!?()&']+$/,
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
  },
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }
};

export const validateEventField = (field: keyof EventFormData, value: any, formData?: EventFormData): string | null => {
  switch (field) {
    case 'title': {
      if (!value || typeof value !== 'string') {
        return 'Event title is required';
      }
      const trimmedTitle = value.trim();
      if (trimmedTitle.length < eventValidationRules.title.minLength) {
        return `Title must be at least ${eventValidationRules.title.minLength} characters`;
      }
      if (trimmedTitle.length > eventValidationRules.title.maxLength) {
        return `Title must be less than ${eventValidationRules.title.maxLength} characters`;
      }
      if (!eventValidationRules.title.pattern.test(trimmedTitle)) {
        return 'Title contains invalid characters';
      }
      return null;
    }
    case 'description': {
      if (!value || typeof value !== 'string') {
        return 'Event description is required';
      }
      const trimmedDescription = value.trim();
      if (trimmedDescription.length < eventValidationRules.description.minLength) {
        return `Description must be at least ${eventValidationRules.description.minLength} characters`;
      }
      if (trimmedDescription.length > eventValidationRules.description.maxLength) {
        return `Description must be less than ${eventValidationRules.description.maxLength} characters`;
      }
      return null;
    }
    case 'venue': {
      if (!value || typeof value !== 'string') {
        return 'Venue is required';
      }
      const trimmedVenue = value.trim();
      if (trimmedVenue.length < eventValidationRules.venue.minLength) {
        return `Venue must be at least ${eventValidationRules.venue.minLength} characters`;
      }
      if (trimmedVenue.length > eventValidationRules.venue.maxLength) {
        return `Venue must be less than ${eventValidationRules.venue.maxLength} characters`;
      }
      return null;
    }

    case 'startTime': {
      if (!value || !(value instanceof Date)) {
        return 'Start time is required';
      }
      if (value.getTime() <= Date.now() + (5 * 60 * 1000)) { // Must be at least 5 minutes in future
        return 'Event must be scheduled for the future';
      }
      const maxBookingDate = new Date();
      maxBookingDate.setDate(maxBookingDate.getDate() + eventValidationRules.dateTime.maxAdvanceBooking);
      if (value.getTime() > maxBookingDate.getTime()) {
        return `Event cannot be scheduled more than ${eventValidationRules.dateTime.maxAdvanceBooking} days in advance`;
      }
      return null;
    }

    case 'endTime':
      if (!value || !(value instanceof Date)) {
        return 'End time is required';
      }
      if (formData?.startTime && value.getTime() <= formData.startTime.getTime()) {
        return 'End time must be after start time';
      }
      return null;

    case 'eventType':
      if (!value) {
        return 'Event type is required';
      }
      if (!eventTypeOptions.some(option => option.value === value)) {
        return 'Invalid event type selected';
      }
      return null;

    case 'maxCapacity': {
      if (value !== undefined && value !== null && value !== '') {
        const capacity = Number(value);
        if (!Number.isInteger(capacity)) {
          return 'Capacity must be a whole number';
        }
        if (capacity < eventValidationRules.capacity.min) {
          return `Capacity must be at least ${eventValidationRules.capacity.min}`;
        }
        if (capacity > eventValidationRules.capacity.max) {
          return `Capacity cannot exceed ${eventValidationRules.capacity.max}`;
        }
      }
      return null;
    }

    case 'registrationDeadline':
      if (value && value instanceof Date) {
        if (formData?.startTime && value.getTime() >= formData.startTime.getTime()) {
          return 'Registration deadline must be before the event starts';
        }
        if (value.getTime() <= Date.now()) {
          return 'Registration deadline must be in the future';
        }
      }
      return null;

    case 'eventImage':
      if (value && value instanceof File) {
        if (value.size > eventValidationRules.image.maxSize) {
          return `Image size must be less than ${eventValidationRules.image.maxSize / (1024 * 1024)}MB`;
        }
        if (!eventValidationRules.image.allowedTypes.includes(value.type)) {
          return 'Image must be JPEG, PNG, or WebP format';
        }
      }
      return null;

    default:
      return null;
  }
};

export const validateEventForm = (formData: EventFormData): EventFormErrors => {
  const errors: EventFormErrors = {};

  // Validate each field
  (Object.keys(formData) as Array<keyof EventFormData>).forEach(field => {
    const error = validateEventField(field, formData[field], formData);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

export const isValidEventForm = (formData: EventFormData): boolean => {
  const errors = validateEventForm(formData);
  return Object.keys(errors).length === 0;
};

// Sanitize user input to prevent XSS
export const sanitizeEventInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Generate a URL-friendly slug from event title
export const generateEventSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60); // Limit length for URLs
};