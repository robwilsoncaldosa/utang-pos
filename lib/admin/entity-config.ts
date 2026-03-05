import type { Database } from "@/database.types";

export type AdminTableName = keyof Database["public"]["Tables"];

export type AdminFieldType = "text" | "number" | "select" | "json";

export type AdminFieldConfig = {
  name: string;
  label: string;
  type: AdminFieldType;
  nullable?: boolean;
  options?: Array<{ label: string; value: string }>;
  relation?: {
    table: AdminTableName;
    labelField: string;
    valueField: string;
  };
};

export type AdminTableConfig = {
  table: AdminTableName;
  label: string;
  description: string;
  keyField: string;
  columns: Array<{ key: string; label: string }>;
  fields: AdminFieldConfig[];
};

export const ADMIN_TABLE_ORDER: AdminTableName[] = [
  "categories",
  "products",
  "orders",
  "order_items",
  "user_roles",
  "audit_logs",
];

export const ADMIN_TABLE_CONFIGS: Record<AdminTableName, AdminTableConfig> = {
  categories: {
    table: "categories",
    label: "Categories",
    description: "Manage product categories used in POS cataloging.",
    keyField: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "created_at", label: "Created" },
    ],
    fields: [{ name: "name", label: "Name", type: "text" }],
  },
  products: {
    table: "products",
    label: "Products",
    description: "Manage stock, pricing, and category assignments.",
    keyField: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "price", label: "Price" },
      { key: "stock_quantity", label: "Stock" },
      { key: "category_id", label: "Category ID" },
      { key: "image_url", label: "Image URL" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "price", label: "Price", type: "number" },
      { name: "stock_quantity", label: "Stock quantity", type: "number" },
      {
        name: "category_id",
        label: "Category ID",
        type: "select",
        nullable: true,
        relation: {
          table: "categories",
          labelField: "name",
          valueField: "id",
        },
      },
      { name: "image_url", label: "Image URL", type: "text", nullable: true },
    ],
  },
  orders: {
    table: "orders",
    label: "Orders",
    description: "Track payment methods, statuses, and order totals.",
    keyField: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "customer_id", label: "Customer ID" },
      { key: "payment_method", label: "Payment" },
      { key: "status", label: "Status" },
      { key: "total_amount", label: "Total" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "customer_id", label: "Customer ID", type: "text", nullable: true },
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
        nullable: true,
        options: [
          { label: "Pending", value: "pending" },
          { label: "Completed", value: "completed" },
          { label: "Cancelled", value: "cancelled" },
        ],
      },
      { name: "total_amount", label: "Total amount", type: "number" },
    ],
  },
  order_items: {
    table: "order_items",
    label: "Order Items",
    description: "Manage order line items and unit pricing.",
    keyField: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "order_id", label: "Order ID" },
      { key: "product_id", label: "Product ID" },
      { key: "quantity", label: "Quantity" },
      { key: "unit_price", label: "Unit price" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      {
        name: "order_id",
        label: "Order ID",
        type: "select",
        nullable: true,
        relation: {
          table: "orders",
          labelField: "id",
          valueField: "id",
        },
      },
      {
        name: "product_id",
        label: "Product ID",
        type: "select",
        nullable: true,
        relation: {
          table: "products",
          labelField: "name",
          valueField: "id",
        },
      },
      { name: "quantity", label: "Quantity", type: "number" },
      { name: "unit_price", label: "Unit price", type: "number" },
    ],
  },
  user_roles: {
    table: "user_roles",
    label: "User Roles",
    description: "Manage admin access levels for authenticated users.",
    keyField: "user_id",
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
  },
  audit_logs: {
    table: "audit_logs",
    label: "Audit Logs",
    description: "Inspect and manage activity trails for admin changes.",
    keyField: "id",
    columns: [
      { key: "id", label: "ID" },
      { key: "action", label: "Action" },
      { key: "table_name", label: "Table" },
      { key: "record_id", label: "Record ID" },
      { key: "user_id", label: "User ID" },
      { key: "payload", label: "Payload" },
      { key: "created_at", label: "Created" },
    ],
    fields: [
      { name: "action", label: "Action", type: "text" },
      { name: "table_name", label: "Table name", type: "text" },
      { name: "record_id", label: "Record ID", type: "text", nullable: true },
      { name: "user_id", label: "User ID", type: "text", nullable: true },
      { name: "payload", label: "Payload JSON", type: "json", nullable: true },
    ],
  },
};
