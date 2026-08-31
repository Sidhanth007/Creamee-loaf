import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

export const otpSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-() ]{8,15}$/, "Please enter a valid phone number")
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v)),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Give this address a label").max(30),
  line1: z.string().trim().min(3, "Please enter the address").max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Please enter the city").max(60),
  state: z.string().trim().min(2, "Please enter the state").max(60),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-() ]{8,15}$/, "Please enter a valid phone number"),
  isDefault: z.coerce.boolean().optional().default(false),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  description: z.string().trim().min(10, "Describe the product (10+ chars)").max(1000),
  priceRupees: z.coerce
    .number({ message: "Enter a price" })
    .positive("Price must be positive")
    .max(100000),
  unitLabel: z.string().trim().min(1, "e.g. 1 kg, Box of 6").max(40),
  categoryId: z.string().min(1, "Pick a category"),
  imageUrl: z.string().trim().url("Enter a valid image URL").or(z.literal("")),
  isEggless: z.coerce.boolean().optional().default(false),
  isFeatured: z.coerce.boolean().optional().default(false),
  isAvailable: z.coerce.boolean().optional().default(false),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  imageUrl: z.string().trim().url("Enter a valid image URL").or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.coerce.boolean().optional().default(false),
});

export const slotSchema = z.object({
  label: z.string().trim().min(2, "Label is too short").max(40),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  capacity: z.coerce.number().int().min(1).max(200).default(10),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.coerce.boolean().optional().default(false),
});

export const cakeRequestSchema = z.object({
  occasion: z.string().trim().min(2, "What's the occasion?").max(60),
  sizeLabel: z.string().trim().min(1, "Pick a size").max(20),
  flavour: z.string().trim().min(2, "Tell us the flavour").max(60),
  isEggless: z.coerce.boolean().optional().default(false),
  cakeMessage: z.string().trim().max(60, "Keep the cake message under 60 characters").optional().or(z.literal("")),
  instructions: z.string().trim().max(1000).optional().or(z.literal("")),
  neededByDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Pick a star rating").max(5),
  comment: z.string().trim().max(500, "Keep it under 500 characters").optional().or(z.literal("")),
});

export type FieldErrors = Record<string, string[] | undefined>;
