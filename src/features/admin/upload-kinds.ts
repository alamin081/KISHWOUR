import { type Permission } from "@/lib/auth/permissions";

/**
 * Signed-upload targets. Kept in its own module (not in `upload-actions.ts`) because a
 * `"use server"` file may only export async functions.
 */
export const UPLOAD_FOLDERS = {
  products: "kishwour/products",
  categories: "kishwour/categories",
  /** Editorial images for the homepage and other site content. */
  site: "kishwour/site",
} as const;

export type UploadKind = keyof typeof UPLOAD_FOLDERS;

export const UPLOAD_PERMISSIONS: Record<UploadKind, Permission> = {
  products: "products:manage",
  categories: "categories:manage",
  site: "content:manage",
};

/** Cloudinary folder for site content images. */
export const SITE_UPLOAD_FOLDER = UPLOAD_FOLDERS.site;
