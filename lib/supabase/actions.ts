"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type LoginActionState = { error: string | null };
export type SignUpActionState = { error: string | null };
export type ForgotPasswordActionState = { error: string | null; success: boolean };
export type UpdatePasswordActionState = { error: string | null };

async function getOrigin() {
  const headerStore = await headers();
  return headerStore.get("origin") ?? "";
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect("/admin");
}

export async function signUpAction(
  _previousState: SignUpActionState,
  formData: FormData
): Promise<SignUpActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const repeatPassword = String(formData.get("repeatPassword") ?? "").trim();

  if (!email || !password || !repeatPassword) {
    return { error: "All fields are required" };
  }

  if (password !== repeatPassword) {
    return { error: "Passwords do not match" };
  }

  const origin = await getOrigin();
  const emailRedirectTo = origin ? `${origin}/auth/confirm?next=/admin` : undefined;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/sign-up-success");
}

export async function forgotPasswordAction(
  _previousState: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required", success: false };
  }

  const origin = await getOrigin();
  const redirectTo = origin ? `${origin}/auth/update-password` : undefined;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return { error: error.message, success: false };
  }

  return { error: null, success: true };
}

export async function updatePasswordAction(
  _previousState: UpdatePasswordActionState,
  formData: FormData
): Promise<UpdatePasswordActionState> {
  const password = String(formData.get("password") ?? "").trim();

  if (!password) {
    return { error: "Password is required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/admin");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
