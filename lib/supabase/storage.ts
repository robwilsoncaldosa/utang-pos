import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = "project-uploads";
export const STORAGE_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const STORAGE_MAX_FILE_SIZE_BYTES = 7 * 1024 * 1024;
export const STORAGE_MAX_FILES_PER_REQUEST = 5;

function getRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseStorageConfig() {
  return {
    url: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function createStorageBrowserClient() {
  const config = getSupabaseStorageConfig();
  return createSupabaseClient(config.url, config.anonKey);
}

export function createStorageServerClient() {
  const config = getSupabaseStorageConfig();
  return createSupabaseClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
