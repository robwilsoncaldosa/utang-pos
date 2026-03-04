import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/admin/permissions";

export async function getUserRoleById(userId: string): Promise<Role | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  const role = data?.role;
  if (role === "super-admin" || role === "admin" || role === "editor") {
    return role;
  }
  return null;
}

export async function getCurrentUserRole() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, role: null };
  }
  const role = await getUserRoleById(user.id);
  return { user, role };
}
