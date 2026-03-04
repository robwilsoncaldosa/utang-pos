"use server";

import type { Tables } from "@/database.types";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type QueryResult<T> = { data: T; error: string | null };

export type UserClaims = { email?: string | null; [key: string]: unknown };

export async function fetchCategories(): Promise<QueryResult<Tables<"categories">[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name");
  return {
    data: data ?? [],
    error: error?.message ?? null,
  };
}

export async function fetchProducts(): Promise<QueryResult<Tables<"products">[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").order("name");
  return {
    data: data ?? [],
    error: error?.message ?? null,
  };
}

export async function fetchUser(): Promise<QueryResult<User | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return {
    data: data.user ?? null,
    error: error?.message ?? null,
  };
}

export async function fetchUserClaims(): Promise<QueryResult<UserClaims | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  return {
    data: data?.claims ?? null,
    error: error?.message ?? null,
  };
}
