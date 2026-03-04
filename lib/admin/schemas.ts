import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2).max(120),
});

export const productSchema = z.object({
  name: z.string().min(2).max(160),
  price: z.number().min(0),
  stock_quantity: z.number().min(0),
  category_id: z.string().nullable().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
});

export const orderSchema = z.object({
  customer_id: z.string().nullable().optional(),
  payment_method: z.enum(["credit", "e-wallet", "cash"]),
  status: z.enum(["pending", "completed", "cancelled"]).nullable().optional(),
  total_amount: z.number().min(0),
});

export const orderItemSchema = z.object({
  order_id: z.string().nullable().optional(),
  product_id: z.string().nullable().optional(),
  quantity: z.number().min(1),
  unit_price: z.number().min(0),
});

export const userRoleSchema = z.object({
  user_id: z.string().min(1),
  role: z.enum(["super-admin", "admin", "editor"]),
});

export const backupSchema = z.object({
  name: z.string().min(1),
});
