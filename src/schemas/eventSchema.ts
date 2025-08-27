import { z } from 'zod';
import { 
  createStringSchema, 
  futureDateSchema, 
  createMaxAdvanceDateSchema, 
  capacitySchema, 
  createFileSchema 
} from './shared';

// Event type enumeration
export const eventTypeSchema = z.enum([
  'music',
  'art', 
  'workshop',
  'performance',
  'exhibition',
  'other'
], {
  message: 'Please select a valid event type'
});

// Event status enumeration
export const eventStatusSchema = z.enum([
  'draft',
  'published', 
  'cancelled'
]);

// Timezone validation
export const timezoneSchema = z
  .string()
  .min(1, 'Timezone is required');

// Event form data schema
export const eventFormSchema = z.object({
  title: createStringSchema({
    min: 3,
    max: 100,
    pattern: /^[a-zA-Z0-9\s\-.,!?()&']+$/,
    patternMessage: 'Title contains invalid characters'
  }),
  
  description: createStringSchema({
    min: 10,
    max: 2000
  }),
  
  venue: createStringSchema({
    min: 3,
    max: 200
  }),
  
  startTime: futureDateSchema.and(createMaxAdvanceDateSchema(365)),
  
  endTime: z.date(),
  
  timezone: timezoneSchema,
  
  eventType: eventTypeSchema,
  
  maxCapacity: capacitySchema,
  
  registrationDeadline: z.date().optional(),
  
  eventImage: createFileSchema({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  })
}).refine((data) => {
  // End time must be after start time
  return data.endTime.getTime() > data.startTime.getTime();
}, {
  message: 'End time must be after start time',
  path: ['endTime']
}).refine((data) => {
  // Registration deadline must be before start time
  if (data.registrationDeadline) {
    return data.registrationDeadline.getTime() < data.startTime.getTime();
  }
  return true;
}, {
  message: 'Registration deadline must be before the event starts',
  path: ['registrationDeadline']
}).refine((data) => {
  // Registration deadline must be in the future
  if (data.registrationDeadline) {
    return data.registrationDeadline.getTime() > Date.now();
  }
  return true;
}, {
  message: 'Registration deadline must be in the future',
  path: ['registrationDeadline']
});

// Individual field validation schemas for partial validation
export const eventFieldSchemas = {
  title: eventFormSchema.shape.title,
  description: eventFormSchema.shape.description,
  venue: eventFormSchema.shape.venue,
  startTime: eventFormSchema.shape.startTime,
  endTime: eventFormSchema.shape.endTime,
  timezone: eventFormSchema.shape.timezone,
  eventType: eventFormSchema.shape.eventType,
  maxCapacity: eventFormSchema.shape.maxCapacity,
  registrationDeadline: eventFormSchema.shape.registrationDeadline,
  eventImage: eventFormSchema.shape.eventImage
};

// Inferred TypeScript types
export type EventFormData = z.infer<typeof eventFormSchema>;
export type EventType = z.infer<typeof eventTypeSchema>;
export type EventStatus = z.infer<typeof eventStatusSchema>;

// Form errors type (all fields optional strings for error messages)
export type EventFormErrors = Partial<Record<keyof EventFormData, string>>;