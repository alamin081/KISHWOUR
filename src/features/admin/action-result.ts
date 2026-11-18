import { type z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { AuthorizationError } from "@/lib/auth/session";

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Converts thrown errors into safe, user-facing results (never leaks internals). */
export function failure(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): ActionResult<never> {
  if (error instanceof AuthorizationError) return { ok: false, message: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.["target"] as string[] | string | undefined) ?? "";
      return {
        ok: false,
        message: `This value must be unique and is already in use (${String(target)}).`,
      };
    }
    if (error.code === "P2003")
      return { ok: false, message: "This record is still referenced by other data." };
    if (error.code === "P2025")
      return { ok: false, message: "The record no longer exists." };
  }
  console.error("[admin action]", error);
  return { ok: false, message: fallback };
}
