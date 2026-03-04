"use server";

import { cookies } from "next/headers";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const COOKIE_NAME = "rl_bucket";

function getWindowMs(limit: number) {
  return 60_000;
}

export async function checkRateLimit(limit: number) {
  const now = Date.now();
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  let bucket: RateLimitBucket | null = null;
  if (raw) {
    try {
      bucket = JSON.parse(raw) as RateLimitBucket;
    } catch {
      bucket = null;
    }
  }

  if (!bucket || now > bucket.resetAt) {
    const nextBucket: RateLimitBucket = {
      count: 1,
      resetAt: now + getWindowMs(limit),
    };
    cookieStore.set(COOKIE_NAME, JSON.stringify(nextBucket), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  const nextBucket = {
    ...bucket,
    count: bucket.count + 1,
  };
  cookieStore.set(COOKIE_NAME, JSON.stringify(nextBucket), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return { allowed: true, remaining: limit - nextBucket.count };
}
