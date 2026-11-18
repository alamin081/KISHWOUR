import { z } from "zod";

/** Reusable Zod primitives shared by client forms and server actions. */

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must be at least 2 characters")
  .max(120, "Slug must be at most 120 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

/** International phone number: optional "+", digits, spaces, dashes, brackets. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s\-()]{6,20}$/, "Enter a valid phone number");

export const urlSchema = z.string().trim().pipe(z.url("Enter a valid URL"));

/** ISO 4217 currency code, e.g. USD. */
export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Use a 3-letter currency code");
