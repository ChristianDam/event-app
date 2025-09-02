import { z } from "zod";
import { emailSchema } from "./shared";

// Event registration form data schema
export const eventRegistrationSchema = z.object({
  attendeeName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must be less than 100 characters"),

  attendeeEmail: emailSchema,

  attendeePhone: z
    .string()
    .regex(/^[+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number")
    .transform((val) => val.replace(/\s/g, ""))
    .optional()
    .or(z.literal("")),
});

// Individual field schemas for partial validation
export const registrationFieldSchemas = {
  attendeeName: eventRegistrationSchema.shape.attendeeName,
  attendeeEmail: eventRegistrationSchema.shape.attendeeEmail,
  attendeePhone: eventRegistrationSchema.shape.attendeePhone,
};

// Inferred TypeScript types
export type EventRegistrationData = z.infer<typeof eventRegistrationSchema>;

// Form errors type
export type EventRegistrationErrors = Partial<
  Record<keyof EventRegistrationData, string>
>;
