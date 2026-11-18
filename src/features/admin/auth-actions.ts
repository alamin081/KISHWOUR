"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/lib/auth/config";

// Simple per-instance throttle against password guessing (serverless instances are short-lived,
// so this is a speed bump, not a guarantee).
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60_000;

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.until > now && entry.count >= MAX_ATTEMPTS) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      const current =
        entry && entry.until > now ? entry : { count: 0, until: now + WINDOW_MS };
      attempts.set(ip, { count: current.count + 1, until: current.until });
      return { error: "Incorrect email or password." };
    }
    throw error; // NEXT_REDIRECT on success must propagate
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
