"use server";

import crypto from "crypto";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "csrf_token";
const HEADER_NAME = "x-csrf-token";

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function getCsrfToken() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(COOKIE_NAME)?.value;
  if (existing) {
    return existing;
  }
  const token = generateToken();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return token;
}

export async function verifyCsrfToken(token: string | null) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!token || !cookieToken) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(cookieToken));
}

export async function getCsrfHeaderValue() {
  const headerStore = await headers();
  return headerStore.get(HEADER_NAME);
}
