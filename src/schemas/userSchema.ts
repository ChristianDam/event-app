import { z } from "zod";
import { colorSchema, emailSchema, phoneSchema } from "./shared";

// User profile form data schema
export const userProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  email: emailSchema.optional().or(z.literal("")),

  phone: phoneSchema.or(z.literal("")),

  favoriteColor: colorSchema.or(z.literal("")),
});

// Individual field schemas for partial validation
export const userFieldSchemas = {
  name: userProfileSchema.shape.name,
  email: userProfileSchema.shape.email,
  phone: userProfileSchema.shape.phone,
  favoriteColor: userProfileSchema.shape.favoriteColor,
};

// Inferred TypeScript types
export type UserProfileData = z.infer<typeof userProfileSchema>;

// Form errors type
export type UserProfileErrors = Partial<Record<keyof UserProfileData, string>>;
