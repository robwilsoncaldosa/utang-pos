import type { Tables } from "@/database.types";
import type { TableName } from "@/lib/admin/permissions";
import { createClient } from "@/lib/supabase/server";
import { sanitizeInput } from "@/lib/admin/sanitization";

export type SortSpec = { column: string; direction: "asc" | "desc" };

export type FilterSpec = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  payment?: string;
  role?: string;
  categoryId?: string;
  orderId?: string;
  productId?: string;
};

export type TableQueryParams = {
  table: TableName;
  page: number;
  pageSize: number;
  sorts: SortSpec[];
  filters: FilterSpec;
};

export type TableQueryResult<T> = {
  data: T[];
  count: number;
};

export async function fetchTableData<T extends Tables<TableName>>(
  params: TableQueryParams
): Promise<TableQueryResult<T>> {
  const supabase = await createClient();
  const { table, page, pageSize, sorts, filters } = params;
  let query = supabase.from(table).select("*", { count: "exact" });

  if (filters.search) {
    const search = sanitizeInput(filters.search.trim());
    if (table === "categories" || table === "products") {
      query = query.ilike("name", `%${search}%`);
    } else if (table === "orders") {
      query = query.or(`id.ilike.%${search}%,customer_id.ilike.%${search}%`);
    } else if (table === "order_items") {
      query = query.or(`id.ilike.%${search}%,order_id.ilike.%${search}%`);
    } else if (table === "user_roles") {
      query = query.or(`user_id.ilike.%${search}%,role.ilike.%${search}%`);
    }
  }

  if (filters.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  if (table === "orders") {
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.payment) query = query.eq("payment_method", filters.payment);
  }

  if (table === "products" && filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (table === "order_items") {
    if (filters.orderId) query = query.eq("order_id", filters.orderId);
    if (filters.productId) query = query.eq("product_id", filters.productId);
  }

  if (table === "user_roles" && filters.role) {
    query = query.eq("role", filters.role);
  }

  sorts.forEach((sort) => {
    query = query.order(sort.column, { ascending: sort.direction === "asc" });
  });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.range(from, to);
  if (error) {
    console.error(error);
    return { data: [], count: 0 };
  }
  return { data: (data ?? []) as T[], count: count ?? 0 };
}
