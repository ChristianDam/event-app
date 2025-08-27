import { z } from 'zod';

// Email validation - Zod's .email() already handles format validation
export const emailSchema = z
  .string()
  .email('Please enter a valid email address');

// Phone number validation (international format)
export const phoneSchema = z
  .string()
  .regex(/^[+]?[1-9][\d]{0,20}$/, 'Please enter a valid phone number')
  .transform(val => val.replace(/[\s\-()]/g, ''))
  .optional();

// Non-empty strings with min/max length
export const createStringSchema = (options: {
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternMessage?: string;
}) => {
  let schema = z.string().trim();
  
  if (options.min) {
    schema = schema.min(options.min, `Must be at least ${options.min} characters`);
  }
  
  if (options.max) {
    schema = schema.max(options.max, `Must be less than ${options.max} characters`);
  }
  
  if (options.pattern && options.patternMessage) {
    schema = schema.regex(options.pattern, options.patternMessage);
  }
  
  return schema;
};

// URL validation
export const urlSchema = z
  .string()
  .url('Please enter a valid URL')
  .optional();

// Color hex code validation
export const colorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color code')
  .optional();

// File upload validation (size, type restrictions)
export const createFileSchema = (options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}) => {
  return z
    .instanceof(File)
    .refine(
      (file) => !options.maxSize || file.size <= options.maxSize,
      `File size must be less than ${options.maxSize ? (options.maxSize / (1024 * 1024)).toFixed(0) : '10'}MB`
    )
    .refine(
      (file) => !options.allowedTypes || options.allowedTypes.includes(file.type),
      `File must be one of: ${options.allowedTypes?.join(', ') || 'JPEG, PNG, WebP'}`
    )
    .optional();
};

// Date validation helpers
export const futureDateSchema = z
  .date()
  .refine(
    (date) => date.getTime() > Date.now() + (5 * 60 * 1000), // 5 minutes buffer
    'Date must be in the future'
  );

export const createMaxAdvanceDateSchema = (maxDays: number) => {
  return z
    .date()
    .refine((date) => {
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + maxDays);
      return date.getTime() <= maxDate.getTime();
    }, `Date cannot be more than ${maxDays} days in advance`);
};

// Capacity validation
export const capacitySchema = z
  .number()
  .int('Capacity must be a whole number')
  .min(1, 'Capacity must be at least 1')
  .max(10000, 'Capacity cannot exceed 10,000')
  .optional();

// Common transformations
export const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Event slug generation
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60); // Limit length for URLs
};