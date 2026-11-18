/** Staff roles that may use the admin. CUSTOMER accounts can never access /admin. */
export const STAFF_ROLES = ["ADMIN", "EDITOR"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const PERMISSIONS = [
  "dashboard:view",
  "products:manage",
  "categories:manage",
  "inquiries:manage",
  "quotations:manage",
  "customers:view",
  "alibaba:manage",
  "content:manage",
  "settings:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<StaffRole, ReadonlySet<Permission>> = {
  ADMIN: new Set(PERMISSIONS),
  // Editors run the catalogue and sales pipeline; business settings and the
  // Alibaba store URL stay with admins.
  EDITOR: new Set<Permission>([
    "dashboard:view",
    "products:manage",
    "categories:manage",
    "inquiries:manage",
    "quotations:manage",
    "customers:view",
    "content:manage",
  ]),
};

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === "string" && (STAFF_ROLES as readonly string[]).includes(role);
}

export function can(role: unknown, permission: Permission): boolean {
  return isStaffRole(role) && ROLE_PERMISSIONS[role].has(permission);
}
