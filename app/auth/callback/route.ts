import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/")) {
    return "/";
  }
  return next;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"));
  const orderId = url.searchParams.get("order");
  const oauthError = url.searchParams.get("error_description");

  if (oauthError) {
    redirect(`/auth/error?error=${encodeURIComponent(oauthError)}`);
  }

  if (!code) {
    redirect("/auth/error?error=Missing OAuth code");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: existingRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!roleError && !existingRole) {
      await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "editor",
      });
    }
    if (orderId) {
      await supabase
        .from("orders")
        .update({ customer_id: user.id })
        .eq("id", orderId)
        .is("customer_id", null);
    }
  }

  redirect(next);
}
