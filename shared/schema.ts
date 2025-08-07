import { z } from 'zod';

// User schema
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['user', 'admin']).default('user'),
  address: z.string().optional(),
  cityStateZip: z.string().optional(),
  phone: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  address?: string;
  cityStateZip?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Product schema
export const insertProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  category: z.string().min(1),
  stock: z.number().int().min(0),
  image: z.string().url().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().min(0).default(0),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  rating?: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
};

// Category schema
export const insertCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  count: z.number().int().min(0).default(0),
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Category = {
  id: number;
  name: string;
  slug: string;
  count: number;
};

export default {
  insertUserSchema,
  insertProductSchema,
  insertCategorySchema,
};