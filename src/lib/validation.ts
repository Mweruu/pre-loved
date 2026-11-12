import { z } from "zod";

import { COUNTIES } from "@/lib/constants";

/* --------------------------------- Phones --------------------------------- */

/**
 * Normalises Kenyan mobile numbers to the 2547XXXXXXXX / 2541XXXXXXXX form
 * used by M-Pesa and WhatsApp. Returns null when the number is invalid.
 */
export function normalizeKenyanPhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-()]/g, "");
  const match = cleaned.match(/^(?:\+?254|0)?([17]\d{8})$/);
  if (!match) return null;
  return `254${match[1]}`;
}

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => normalizeKenyanPhone(v) !== null, {
    message: "Enter a valid Kenyan mobile number, e.g. 0712 345 678",
  });

export function phoneErrorMessage(error: unknown): string | null {
  return error instanceof Error ? error.message : String(error);
}

/* ------------------------------- Auth schemas ------------------------------ */

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-zA-Z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(120),
  phone: phoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirm: z.string(),
});

/* ------------------------------ Listing schema ---------------------------- */

const countyEnum = z.enum(COUNTIES);

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Please describe the item in at least 20 characters")
    .max(5000, "Description is too long (max 5000 characters)"),
  price: z.coerce
    .number({ error: "Enter a price in KSh" })
    .int("Price must be a whole number of Kenyan Shillings")
    .min(100, "Minimum price is KSh 100")
    .max(100_000_000, "Price looks too high"),
  negotiable: z.coerce.boolean().default(false),
  condition: z.enum([
    "BRAND_NEW",
    "LIKE_NEW",
    "EXCELLENT",
    "GOOD",
    "FAIR",
    "FOR_PARTS",
  ]),
  reasonForSelling: z
    .string()
    .trim()
    .min(5, "Tell buyers why you are selling (at least 5 characters)")
    .max(500),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  model: z.string().trim().max(80).optional().or(z.literal("")),
  ageDescription: z.string().trim().max(80).optional().or(z.literal("")),
  originalPrice: z.coerce
    .number()
    .int()
    .min(0)
    .max(100_000_000)
    .optional()
    .or(z.literal("")),
  dimensions: z.string().trim().max(120).optional().or(z.literal("")),
  county: countyEnum,
  town: z.string().trim().min(2, "Enter your town / area").max(60),
  deliveryAvailable: z.coerce.boolean().default(false),
  deliveryNote: z.string().trim().max(300).optional().or(z.literal("")),
  buyerCollects: z.coerce.boolean().default(true),
  preferredContact: z.enum(["ANY", "WHATSAPP", "PHONE"]),
  categoryId: z.string().min(1, "Choose a category"),
  subcategoryId: z.string().optional().or(z.literal("")),
});

export type ListingInput = z.infer<typeof listingSchema>;

/* ------------------------------ Report schema ----------------------------- */

export const reportSchema = z.object({
  reason: z.enum([
    "SUSPICIOUS",
    "SCAM",
    "FAKE_ITEM",
    "DUPLICATE_SPAM",
    "PROHIBITED",
    "WRONG_CATEGORY",
    "PRICE_ISSUE",
    "OTHER",
  ]),
  details: z
    .string()
    .trim()
    .min(10, "Please give us a few more details (at least 10 characters)")
    .max(2000),
  reporterName: z.string().trim().max(80).optional().or(z.literal("")),
  reporterEmail: z.string().trim().email().max(120).optional().or(z.literal("")),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address").max(120),
  subject: z.string().trim().min(3, "Enter a subject").max(120),
  message: z.string().trim().min(10, "Please write your message").max(3000),
});

/* -------------------------------- Plans ----------------------------------- */

export const planSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().min(5).max(300),
  priceKes: z.coerce.number().int().min(0).max(1_000_000),
  durationDays: z.coerce.number().int().min(1).max(3650),
  maxActiveListings: z.coerce.number().int().min(1).max(1000),
  features: z.string().trim().max(1000),
  badge: z.string().trim().max(30).optional().or(z.literal("")),
  promoText: z.string().trim().max(60).optional().or(z.literal("")),
  active: z.coerce.boolean().default(true),
  orderIndex: z.coerce.number().int().min(0).max(999),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  icon: z.string().trim().min(2).max(40),
  orderIndex: z.coerce.number().int().min(0).max(999),
  active: z.coerce.boolean().default(true),
});

export const subcategorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  categoryId: z.string().min(1),
});

/** Flattens a ZodError into a single readable message. */
export function firstZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? issue.message : "Please check the highlighted fields.";
}
