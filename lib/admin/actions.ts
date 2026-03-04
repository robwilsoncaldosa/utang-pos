"use server";

import { createClient } from "@/lib/supabase/server";
import { can, type Action, type TableName, type Role } from "@/lib/admin/permissions";
import { verifyCsrfToken } from "@/lib/admin/csrf";
import { checkRateLimit } from "@/lib/admin/rate-limit";
import { sanitizeInput, sanitizeOptional } from "@/lib/admin/sanitization";
import { getUserRoleById } from "@/lib/admin/roles";
import { logAudit } from "@/lib/admin/audit";
import type { Tables, TablesInsert, TablesUpdate } from "@/database.types";

export type ActionResult<T> = { data?: T; error?: string };

type Context = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  role: Role;
};

async function getContext(
  table: TableName,
  action: Action,
  csrfToken: string
): Promise<ActionResult<Context>> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: "Authentication required" };
  }

  const role = await getUserRoleById(user.id);
  if (!role) {
    return { error: "Role assignment required" };
  }

  if (!can(role, table, action)) {
    return { error: "Insufficient permissions" };
  }

  const rateLimit = await checkRateLimit(100);
  if (!rateLimit.allowed) {
    return { error: "Rate limit exceeded" };
  }

  const csrfOk = await verifyCsrfToken(csrfToken);
  if (!csrfOk) {
    return { error: "Invalid CSRF token" };
  }

  return { data: { supabase, userId: user.id, role } };
}

export async function createCategoryAction(
  input: TablesInsert<"categories">,
  csrfToken: string
): Promise<ActionResult<Tables<"categories">>> {
  const context = await getContext("categories", "create", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const payload = {
    name: sanitizeInput(String(input.name ?? "")),
  };
  const { data, error } = await supabase
    .from("categories")
    .insert(payload)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "categories", action: "create", recordId: data.id, payload });
  return { data };
}

export async function updateCategoryAction(
  id: string,
  input: TablesUpdate<"categories">,
  csrfToken: string
): Promise<ActionResult<Tables<"categories">>> {
  const context = await getContext("categories", "update", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const payload = {
    name: sanitizeOptional(input.name ?? null),
  };
  const { data, error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "categories", action: "update", recordId: id, payload });
  return { data };
}

export async function deleteCategoryAction(
  id: string,
  csrfToken: string
): Promise<ActionResult<null>> {
  const context = await getContext("categories", "delete", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  await supabase.from("products").update({ category_id: null }).eq("category_id", id);
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "categories", action: "delete", recordId: id });
  return { data: null };
}

export async function createProductAction(
  input: TablesInsert<"products">,
  csrfToken: string
): Promise<ActionResult<Tables<"products">>> {
  const context = await getContext("products", "create", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const payload = {
    name: sanitizeInput(String(input.name ?? "")),
    price: Number(input.price ?? 0),
    stock_quantity: Number(input.stock_quantity ?? 0),
    category_id: input.category_id ?? null,
    image_url: sanitizeOptional(input.image_url ?? null),
  };
  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "products", action: "create", recordId: data.id, payload });
  return { data };
}

export async function updateProductAction(
  id: string,
  input: TablesUpdate<"products">,
  csrfToken: string
): Promise<ActionResult<Tables<"products">>> {
  const context = await getContext("products", "update", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const payload = {
    name: sanitizeOptional(input.name ?? null),
    price: input.price ?? null,
    stock_quantity: input.stock_quantity ?? null,
    category_id: input.category_id ?? null,
    image_url: sanitizeOptional(input.image_url ?? null),
  };
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "products", action: "update", recordId: id, payload });
  return { data };
}

export async function deleteProductAction(
  id: string,
  csrfToken: string
): Promise<ActionResult<null>> {
  const context = await getContext("products", "delete", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  await supabase.from("order_items").delete().eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "products", action: "delete", recordId: id });
  return { data: null };
}

export async function createOrderAction(
  input: TablesInsert<"orders">,
  csrfToken: string
): Promise<ActionResult<Tables<"orders">>> {
  const context = await getContext("orders", "create", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const payload = {
    customer_id: sanitizeOptional(input.customer_id ?? null),
    payment_method: input.payment_method,
    status: input.status ?? null,
    total_amount: Number(input.total_amount ?? 0),
  };
  const { data, error } = await supabase
    .from("orders")
    .insert(payload)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "orders", action: "create", recordId: data.id, payload });
  return { data };
}

export async function updateOrderAction(
  id: string,
  input: TablesUpdate<"orders">,
  csrfToken: string
): Promise<ActionResult<Tables<"orders">>> {
  const context = await getContext("orders", "update", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const payload = {
    customer_id: sanitizeOptional(input.customer_id ?? null),
    payment_method: input.payment_method ?? null,
    status: input.status ?? null,
    total_amount: input.total_amount ?? null,
  };
  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "orders", action: "update", recordId: id, payload });
  return { data };
}

export async function deleteOrderAction(
  id: string,
  csrfToken: string
): Promise<ActionResult<null>> {
  const context = await getContext("orders", "delete", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  await supabase.from("order_items").delete().eq("order_id", id);
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "orders", action: "delete", recordId: id });
  return { data: null };
}

export async function createOrderItemAction(
  input: TablesInsert<"order_items">,
  csrfToken: string
): Promise<ActionResult<Tables<"order_items">>> {
  const context = await getContext("order_items", "create", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const payload = {
    order_id: sanitizeOptional(input.order_id ?? null),
    product_id: sanitizeOptional(input.product_id ?? null),
    quantity: Number(input.quantity ?? 1),
    unit_price: Number(input.unit_price ?? 0),
  };
  const { data, error } = await supabase
    .from("order_items")
    .insert(payload)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({
    userId,
    tableName: "order_items",
    action: "create",
    recordId: data.id,
    payload,
  });
  return { data };
}

export async function updateOrderItemAction(
  id: string,
  input: TablesUpdate<"order_items">,
  csrfToken: string
): Promise<ActionResult<Tables<"order_items">>> {
  const context = await getContext("order_items", "update", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const payload = {
    order_id: sanitizeOptional(input.order_id ?? null),
    product_id: sanitizeOptional(input.product_id ?? null),
    quantity: input.quantity ?? null,
    unit_price: input.unit_price ?? null,
  };
  const { data, error } = await supabase
    .from("order_items")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({
    userId,
    tableName: "order_items",
    action: "update",
    recordId: id,
    payload,
  });
  return { data };
}

export async function deleteOrderItemAction(
  id: string,
  csrfToken: string
): Promise<ActionResult<null>> {
  const context = await getContext("order_items", "delete", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const { error } = await supabase.from("order_items").delete().eq("id", id);
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "order_items", action: "delete", recordId: id });
  return { data: null };
}

export async function createUserRoleAction(
  input: TablesInsert<"user_roles">,
  csrfToken: string
): Promise<ActionResult<Tables<"user_roles">>> {
  const context = await getContext("user_roles", "create", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  const payload = {
    user_id: sanitizeInput(String(input.user_id ?? "")),
    role: sanitizeInput(String(input.role ?? "")),
  };
  const { data, error } = await supabase
    .from("user_roles")
    .insert(payload)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({ userId, tableName: "user_roles", action: "create", recordId: data.user_id, payload });
  return { data };
}

export async function updateUserRoleAction(
  userId: string,
  input: TablesUpdate<"user_roles">,
  csrfToken: string
): Promise<ActionResult<Tables<"user_roles">>> {
  const context = await getContext("user_roles", "update", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId: actorId } = context.data!;
  const payload = {
    role: sanitizeOptional(input.role ?? null),
  };
  const { data, error } = await supabase
    .from("user_roles")
    .update(payload)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) return { error: error.message };
  await logAudit({
    userId: actorId,
    tableName: "user_roles",
    action: "update",
    recordId: userId,
    payload,
  });
  return { data };
}

export async function deleteUserRoleAction(
  userId: string,
  csrfToken: string
): Promise<ActionResult<null>> {
  const context = await getContext("user_roles", "delete", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId: actorId } = context.data!;
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (error) return { error: error.message };
  await logAudit({ userId: actorId, tableName: "user_roles", action: "delete", recordId: userId });
  return { data: null };
}

export async function bulkDeleteAction(
  table: TableName,
  ids: string[],
  csrfToken: string
): Promise<ActionResult<null>> {
  const context = await getContext(table, "delete", csrfToken);
  if (context.error) return { error: context.error };
  const { supabase, userId } = context.data!;
  if (table === "orders") {
    await supabase.from("order_items").delete().in("order_id", ids);
  }
  if (table === "products") {
    await supabase.from("order_items").delete().in("product_id", ids);
  }
  if (table === "categories") {
    await supabase.from("products").update({ category_id: null }).in("category_id", ids);
  }
  const { error } = await supabase.from(table).delete().in("id", ids);
  if (error) return { error: error.message };
  await logAudit({
    userId,
    tableName: table,
    action: "bulk-delete",
    payload: { ids },
  });
  return { data: null };
}
