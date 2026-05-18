import { z } from "zod";

export const UserRole = z.enum(["USER", "ADMIN"]);

export const AuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const PostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be alphanumeric and lowercase"),
  content: z.string().min(50, "Content is too short"),
  excerpt: z.string().max(200).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  categoryId: z.string().cuid(),
  published: z.boolean().default(false),
});

export const CommentSchema = z.object({
  content: z.string().min(1).max(500),
  postId: z.string().cuid(),
});

export const CategorySchema = z.object({
  name: z.string().min(2).max(30),
  slug: z.string().min(2),
});
