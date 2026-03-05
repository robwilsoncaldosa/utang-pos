"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUserRole } from "@/lib/admin/roles";
import { can } from "@/lib/admin/permissions";
import { verifyCsrfToken } from "@/lib/admin/csrf";
import { checkRateLimit } from "@/lib/admin/rate-limit";
import { logAudit } from "@/lib/admin/audit";
import type { TablesInsert } from "@/database.types";

type BackupPayload = {
  categories: TablesInsert<"categories">[];
  products: TablesInsert<"products">[];
  orders: TablesInsert<"orders">[];
  order_items: TablesInsert<"order_items">[];
  user_roles: TablesInsert<"user_roles">[];
  created_at: string;
};

export async function createBackupAction(csrfToken: string) {
  const auth = await getCurrentUserRole();
  if (!auth.user || !auth.role) return { error: "Authentication required" };
  if (!can(auth.role, "orders", "export")) return { error: "Insufficient permissions" };
  const rateLimit = await checkRateLimit(100);
  if (!rateLimit.allowed) return { error: "Rate limit exceeded" };
  const csrfOk = await verifyCsrfToken(csrfToken);
  if (!csrfOk) return { error: "Invalid CSRF token" };

  const supabase = await createClient();
  const [categories, products, orders, orderItems, userRoles] = await Promise.all([
    supabase.from("categories").select("*"),
    supabase.from("products").select("*"),
    supabase.from("orders").select("*"),
    supabase.from("order_items").select("*"),
    supabase.from("user_roles").select("*"),
  ]);

  if (categories.error || products.error || orders.error || orderItems.error || userRoles.error) {
    console.error(categories.error, products.error, orders.error, orderItems.error, userRoles.error);
    return { error: "Backup failed" };
  }

  const payload: BackupPayload = {
    categories: categories.data ?? [],
    products: products.data ?? [],
    orders: orders.data ?? [],
    order_items: orderItems.data ?? [],
    user_roles: userRoles.data ?? [],
    created_at: new Date().toISOString(),
  };

  const filename = `backup-${Date.now()}.json`;
  const { error } = await supabase.storage
    .from("backups")
    .upload(filename, JSON.stringify(payload), {
      contentType: "application/json",
      upsert: false,
    });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  await logAudit({
    userId: auth.user.id,
    tableName: "orders",
    action: "backup",
    payload: { filename },
  });

  return { data: filename };
}

export async function listBackupsAction() {
  const auth = await getCurrentUserRole();
  if (!auth.user || !auth.role) return { error: "Authentication required" };
  if (!can(auth.role, "orders", "export")) return { error: "Insufficient permissions" };
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("backups").list("", {
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) {
    console.error(error);
    return { error: error.message };
  }
  return { data: data ?? [] };
}

export async function restoreBackupAction(backupName: string, csrfToken: string) {
  const auth = await getCurrentUserRole();
  if (!auth.user || !auth.role) return { error: "Authentication required" };
  if (!can(auth.role, "orders", "delete")) return { error: "Insufficient permissions" };
  const rateLimit = await checkRateLimit(100);
  if (!rateLimit.allowed) return { error: "Rate limit exceeded" };
  const csrfOk = await verifyCsrfToken(csrfToken);
  if (!csrfOk) return { error: "Invalid CSRF token" };

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("backups").download(backupName);
  if (error || !data) {
    console.error(error);
    return { error: "Backup not found" };
  }

  const text = await data.text();
  const payload = JSON.parse(text) as BackupPayload;

  await supabase.from("order_items").delete().neq("id", "");
  await supabase.from("orders").delete().neq("id", "");
  await supabase.from("products").delete().neq("id", "");
  await supabase.from("categories").delete().neq("id", "");
  await supabase.from("user_roles").delete().neq("user_id", "");

  if (payload.categories.length) await supabase.from("categories").insert(payload.categories);
  if (payload.products.length) await supabase.from("products").insert(payload.products);
  if (payload.orders.length) await supabase.from("orders").insert(payload.orders);
  if (payload.order_items.length) await supabase.from("order_items").insert(payload.order_items);
  if (payload.user_roles.length) await supabase.from("user_roles").insert(payload.user_roles);

  await logAudit({
    userId: auth.user.id,
    tableName: "orders",
    action: "restore",
    payload: { backupName },
  });

  return { data: true };
}
