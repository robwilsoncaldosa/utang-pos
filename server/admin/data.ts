import type { Json, TablesInsert, TablesUpdate } from "@/database.types";
import {
  ADMIN_TABLE_CONFIGS,
  ADMIN_TABLE_ORDER,
  type AdminFieldConfig,
  type AdminTableName,
} from "@/lib/admin/entity-config";
import { validateCategoryName } from "@/lib/admin/category-naming";
import { createClient } from "@/lib/supabase/server";

export type DashboardMetrics = {
  tableCounts: Record<AdminTableName, number>;
  completedOrders: number;
  pendingOrders: number;
  lowStockProducts: number;
  totalRevenue: number;
};

export type TableOption = {
  label: string;
  value: string;
  imageUrl?: string;
};

function parseJsonValue(raw: string): Json | null {
  if (!raw.trim()) {
    return null;
  }
  const parsed = JSON.parse(raw) as Json;
  return parsed;
}

function parseFieldValue(field: AdminFieldConfig, rawValue: string) {
  if (rawValue === "") {
    if (field.nullable) {
      return null;
    }
    if (field.type === "number") {
      return 0;
    }
    return "";
  }

  if (field.type === "number") {
    return Number(rawValue);
  }
  if (field.type === "json") {
    return parseJsonValue(rawValue);
  }
  return rawValue;
}

function getPayloadFromFormData(table: AdminTableName, formData: FormData) {
  const config = ADMIN_TABLE_CONFIGS[table];
  const payload: Record<string, unknown> = {};

  for (const field of config.fields) {
    const rawValue = String(formData.get(field.name) ?? "");
    payload[field.name] = parseFieldValue(field, rawValue);
  }

  if (table === "categories") {
    const nameResult = validateCategoryName(String(payload.name ?? ""));
    if (nameResult.error) {
      throw new Error(nameResult.error);
    }
    payload.name = nameResult.value;
  }

  return payload;
}

async function assertAuthenticated() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return { supabase, user };
}

export async function getTableRows(table: AdminTableName, limit = 50) {
  const { supabase } = await assertAuthenticated();
  const keyField = ADMIN_TABLE_CONFIGS[table].keyField;
  let data: Record<string, unknown>[] | null = null;
  let error: Error | null = null;

  if (table === "categories") {
    const result = await supabase.from("categories").select("*").limit(limit).order(keyField, { ascending: false });
    data = result.data as unknown as Record<string, unknown>[] | null;
    error = result.error;
  } else if (table === "products") {
    const result = await supabase.from("products").select("*").limit(limit).order(keyField, { ascending: false });
    data = result.data as unknown as Record<string, unknown>[] | null;
    error = result.error;
  } else if (table === "orders") {
    const result = await supabase.from("orders").select("*").limit(limit).order(keyField, { ascending: false });
    data = result.data as unknown as Record<string, unknown>[] | null;
    error = result.error;
  } else if (table === "order_items") {
    const result = await supabase.from("order_items").select("*").limit(limit).order(keyField, { ascending: false });
    data = result.data as unknown as Record<string, unknown>[] | null;
    error = result.error;
  } else if (table === "user_roles") {
    const result = await supabase.from("user_roles").select("*").limit(limit).order(keyField, { ascending: false });
    data = result.data as unknown as Record<string, unknown>[] | null;
    error = result.error;
  }

  if (error) {
    throw new Error(String(error.message));
  }
  return (data ?? []) as Record<string, unknown>[];
}

export async function getTableOptions(table: AdminTableName, labelField: string, valueField: string) {
  const { supabase } = await assertAuthenticated();
  const selectColumns = table === "products"
    ? `${labelField}, ${valueField}, image_url`
    : `${labelField}, ${valueField}`;
  const result = await supabase
    .from(table)
    .select(selectColumns)
    .order(labelField, { ascending: true, nullsFirst: false });
  if (result.error) {
    console.error(result.error);
    return [];
  }
  return ((result.data ?? []) as unknown as Record<string, unknown>[]).map((row): TableOption => ({
    label: String(row[labelField] ?? "Unknown"),
    value: String(row[valueField] ?? ""),
    imageUrl: typeof row.image_url === "string" ? row.image_url : undefined,
  }));
}

export async function createTableRow(table: AdminTableName, formData: FormData) {
  const { supabase } = await assertAuthenticated();
  const payload = getPayloadFromFormData(table, formData);
  let error: Error | null = null;

  if (table === "categories") {
    const result = await supabase.from("categories").insert(payload as TablesInsert<"categories">);
    error = result.error;
  } else if (table === "products") {
    const result = await supabase.from("products").insert(payload as TablesInsert<"products">);
    error = result.error;
  } else if (table === "orders") {
    const result = await supabase.from("orders").insert(payload as TablesInsert<"orders">);
    error = result.error;
  } else if (table === "order_items") {
    const result = await supabase.from("order_items").insert(payload as TablesInsert<"order_items">);
    error = result.error;
  } else if (table === "user_roles") {
    const result = await supabase.from("user_roles").insert(payload as TablesInsert<"user_roles">);
    error = result.error;
  }

  if (error) {
    throw new Error(String(error.message));
  }
}

export async function updateTableRow(
  table: AdminTableName,
  rowId: string,
  formData: FormData
) {
  const { supabase } = await assertAuthenticated();
  const payload = getPayloadFromFormData(table, formData);
  const keyField = ADMIN_TABLE_CONFIGS[table].keyField;
  let error: Error | null = null;

  if (table === "categories") {
    const result = await supabase
      .from("categories")
      .update(payload as TablesUpdate<"categories">)
      .eq(keyField, rowId);
    error = result.error;
  } else if (table === "products") {
    const result = await supabase
      .from("products")
      .update(payload as TablesUpdate<"products">)
      .eq(keyField, rowId);
    error = result.error;
  } else if (table === "orders") {
    const result = await supabase
      .from("orders")
      .update(payload as TablesUpdate<"orders">)
      .eq(keyField, rowId);
    error = result.error;
  } else if (table === "order_items") {
    const result = await supabase
      .from("order_items")
      .update(payload as TablesUpdate<"order_items">)
      .eq(keyField, rowId);
    error = result.error;
  } else if (table === "user_roles") {
    const result = await supabase
      .from("user_roles")
      .update(payload as TablesUpdate<"user_roles">)
      .eq(keyField, rowId);
    error = result.error;
  }

  if (error) {
    throw new Error(String(error.message));
  }
}

export async function deleteTableRow(table: AdminTableName, rowId: string) {
  const { supabase } = await assertAuthenticated();
  const keyField = ADMIN_TABLE_CONFIGS[table].keyField;
  let error: Error | null = null;

  if (table === "categories") {
    const result = await supabase.from("categories").delete().eq(keyField, rowId);
    error = result.error;
  } else if (table === "products") {
    const result = await supabase.from("products").delete().eq(keyField, rowId);
    error = result.error;
  } else if (table === "orders") {
    const result = await supabase.from("orders").delete().eq(keyField, rowId);
    error = result.error;
  } else if (table === "order_items") {
    const result = await supabase.from("order_items").delete().eq(keyField, rowId);
    error = result.error;
  } else if (table === "user_roles") {
    const result = await supabase.from("user_roles").delete().eq(keyField, rowId);
    error = result.error;
  }

  if (error) {
    throw new Error(String(error.message));
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { supabase } = await assertAuthenticated();
  const tableCounts = {} as Record<AdminTableName, number>;

  for (const table of ADMIN_TABLE_ORDER) {
    const { count, error } = await supabase.from(table).select("*", {
      head: true,
      count: "exact",
    });
    if (error) {
      throw new Error(error.message);
    }
    tableCounts[table] = count ?? 0;
  }

  const { data: completedRows, error: completedError } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("status", "completed");
  if (completedError) {
    throw new Error(completedError.message);
  }

  const { count: pendingOrders, error: pendingError } = await supabase
    .from("orders")
    .select("*", { head: true, count: "exact" })
    .eq("status", "pending");
  if (pendingError) {
    throw new Error(pendingError.message);
  }

  const { count: lowStockProducts, error: lowStockError } = await supabase
    .from("products")
    .select("*", { head: true, count: "exact" })
    .lte("stock_quantity", 10);
  if (lowStockError) {
    throw new Error(lowStockError.message);
  }

  const totalRevenue = (completedRows ?? []).reduce(
    (sum, row) => sum + Number(row.total_amount ?? 0),
    0
  );

  return {
    tableCounts,
    completedOrders: completedRows?.length ?? 0,
    pendingOrders: pendingOrders ?? 0,
    lowStockProducts: lowStockProducts ?? 0,
    totalRevenue,
  };
}
