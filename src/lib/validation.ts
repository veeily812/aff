import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(2000),
  price: z.string().trim().max(50).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  affiliateUrl: z.string().trim().url("Must be a valid URL"),
});

export type ProductInput = z.infer<typeof productSchema>;

export const productImportRowSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(2000),
  price: z.string().trim().max(50).optional().or(z.literal("")),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  affiliateUrl: z.string().trim().url("Affiliate URL must be a valid URL"),
  imageUrl: z.string().trim().url("Image URL must be a valid URL"),
});

export type ProductImportRow = z.infer<typeof productImportRowSchema>;

export const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and hyphen-separated"),
  body: z.string().trim().min(1, "Body is required"),
  published: z.boolean(),
});

export type PostInput = z.infer<typeof postSchema>;

const roleEnum = z.enum(["OWNER", "SECONDARY_ADMIN", "MANAGER", "STAFF"]);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const setupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const userCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: roleEnum,
});

export const userUpdateSchema = z.object({
  email: z.string().trim().toLowerCase().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
  role: roleEnum,
});
