import { type Permission } from "@/lib/auth/permissions";

/**
 * Editing site pages is editorial work: administrators and editors may do it, no other
 * role can. Used by the route guards, every Server Action and the upload signature.
 */
export const PAGE_PERMISSION: Permission = "content:manage";
