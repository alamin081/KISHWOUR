import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { db } from "@/lib/db";

import { auth } from "./config";
import { can, isStaffRole, type Permission, type StaffRole } from "./permissions";

export type StaffUser = {
  id: string;
  name: string | null;
  email: string;
  role: StaffRole;
};

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to do this.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * The signed-in staff member, re-validated against the database on every request
 * (deactivated users or changed roles take effect immediately). Never selects passwordHash.
 */
export const getCurrentStaff = cache(async (): Promise<StaffUser | null> => {
  // Session checks are always request-time (Auth.js uses crypto randomness internally).
  await connection();
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive || !isStaffRole(user.role)) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

/** For admin pages: redirects to login when signed out; to /admin when lacking permission. */
export async function requireStaff(
  permission: Permission = "dashboard:view",
): Promise<StaffUser> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/login");
  if (!can(staff.role, permission)) redirect("/admin?denied=1");
  return staff;
}

/** For server actions and route handlers: throws instead of redirecting. */
export async function assertPermission(permission: Permission): Promise<StaffUser> {
  const staff = await getCurrentStaff();
  if (!staff || !can(staff.role, permission)) throw new AuthorizationError();
  return staff;
}
