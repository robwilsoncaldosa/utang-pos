import type { Tables } from "@/database.types";
import type { TableName } from "@/lib/admin/permissions";
import {
  categorySchema,
  orderItemSchema,
  orderSchema,
  productSchema,
  userRoleSchema,
} from "@/lib/admin/schemas";
import { z } from "zod";

export type ColumnConfig<T> = {
  key: keyof T;
  label: string;
  hidden?: boolean;
};

export type FieldConfig = {
  name: string;
  label: string;
  type: "text" | "number" | "select";
  options?: Array<{ label: string; value: string }>;
};

export type FilterConfig = {
  name: string;
  label: string;
  type: "text" | "date" | "select";
  options?: Array<{ label: string; value: string }>;
};

export type TableConfig<T> = {
  table: TableName;
  label: string;
  schema: z.ZodTypeAny;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  filters: FilterConfig[];
};

export function getTableConfigs(
  categories: Array<Tables<"categories">>
): Record<TableName, TableConfig<any>> {
  return {
    categories: {
      table: "categories",
      label: "Categories",
      schema: categorySchema,
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "created_at", label: "Created" },
      ],
      fields: [{ name: "name", label: "Name", type: "text" }],
      filters: [{ name: "search", label: "Search", type: "text" }],
    },
    products: {
      table: "products",
      label: "Products",
      schema: productSchema,
      columns: [
        { key: "id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "price", label: "Price" },
        { key: "stock_quantity", label: "Stock" },
        { key: "category_id", label: "Category" },
        { key: "image_url", label: "Image" },
        { key: "created_at", label: "Created" },
      ],
      fields: [
        { name: "name", label: "Name", type: "text" },
        { name: "price", label: "Price", type: "number" },
        { name: "stock_quantity", label: "Stock quantity", type: "number" },
        {
          name: "category_id",
          label: "Category",
          type: "select",
          options: categories.map((cat) => ({ label: cat.name, value: cat.id })),
        },
        { name: "image_url", label: "Image URL", type: "text" },
      ],
      filters: [
        { name: "search", label: "Search", type: "text" },
        {
          name: "categoryId",
          label: "Category",
          type: "select",
          options: categories.map((cat) => ({ label: cat.name, value: cat.id })),
        },
      ],
    },
    orders: {
      table: "orders",
      label: "Orders",
      schema: orderSchema,
      columns: [
        { key: "id", label: "ID" },
        { key: "customer_id", label: "Customer ID" },
        { key: "payment_method", label: "Payment" },
        { key: "status", label: "Status" },
        { key: "total_amount", label: "Total" },
        { key: "created_at", label: "Created" },
      ],
      fields: [
        { name: "customer_id", label: "Customer ID", type: "text" },
        {
          name: "payment_method",
          label: "Payment method",
          type: "select",
          options: [
            { label: "Credit", value: "credit" },
            { label: "E-wallet", value: "e-wallet" },
            { label: "Cash", value: "cash" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ],
        },
        { name: "total_amount", label: "Total amount", type: "number" },
      ],
      filters: [
        { name: "search", label: "Search", type: "text" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Completed", value: "completed" },
            { label: "Cancelled", value: "cancelled" },
          ],
        },
        {
          name: "payment",
          label: "Payment",
          type: "select",
          options: [
            { label: "Credit", value: "credit" },
            { label: "E-wallet", value: "e-wallet" },
            { label: "Cash", value: "cash" },
          ],
        },
        { name: "dateFrom", label: "From", type: "date" },
        { name: "dateTo", label: "To", type: "date" },
      ],
    },
    order_items: {
      table: "order_items",
      label: "Order Items",
      schema: orderItemSchema,
      columns: [
        { key: "id", label: "ID" },
        { key: "order_id", label: "Order ID" },
        { key: "product_id", label: "Product ID" },
        { key: "quantity", label: "Quantity" },
        { key: "unit_price", label: "Unit price" },
        { key: "created_at", label: "Created" },
      ],
      fields: [
        { name: "order_id", label: "Order ID", type: "text" },
        { name: "product_id", label: "Product ID", type: "text" },
        { name: "quantity", label: "Quantity", type: "number" },
        { name: "unit_price", label: "Unit price", type: "number" },
      ],
      filters: [
        { name: "search", label: "Search", type: "text" },
        { name: "orderId", label: "Order ID", type: "text" },
        { name: "productId", label: "Product ID", type: "text" },
      ],
    },
    user_roles: {
      table: "user_roles",
      label: "Roles",
      schema: userRoleSchema,
      columns: [
        { key: "user_id", label: "User ID" },
        { key: "role", label: "Role" },
      ],
      fields: [
        { name: "user_id", label: "User ID", type: "text" },
        {
          name: "role",
          label: "Role",
          type: "select",
          options: [
            { label: "Super Admin", value: "super-admin" },
            { label: "Admin", value: "admin" },
            { label: "Editor", value: "editor" },
          ],
        },
      ],
      filters: [
        { name: "search", label: "Search", type: "text" },
        {
          name: "role",
          label: "Role",
          type: "select",
          options: [
            { label: "Super Admin", value: "super-admin" },
            { label: "Admin", value: "admin" },
            { label: "Editor", value: "editor" },
          ],
        },
      ],
    },
  };
}
