import type { NextConfig } from "next";

const supabaseStorageHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: supabaseStorageHost
    ? {
        remotePatterns: [
          {
            protocol: "https",
            hostname: supabaseStorageHost,
            pathname: "/storage/v1/**",
          },
        ],
      }
    : undefined,
};

export default nextConfig;
