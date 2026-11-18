"use server";

import { assertPermission } from "@/lib/auth/session";
import { getCloudinaryConfig, signCloudinaryParams } from "@/lib/cloudinary";

import { UPLOAD_FOLDERS, UPLOAD_PERMISSIONS, type UploadKind } from "./upload-kinds";

export type UploadSignature =
  | {
      ok: true;
      cloudName: string;
      apiKey: string;
      timestamp: number;
      folder: string;
      signature: string;
    }
  | { ok: false; message: string };

/** Signs a direct browser → Cloudinary upload. The API secret never leaves the server. */
export async function getUploadSignature(kind: UploadKind): Promise<UploadSignature> {
  const permission = UPLOAD_PERMISSIONS[kind];
  if (!permission) return { ok: false, message: "Unknown upload type." };
  try {
    await assertPermission(permission);
  } catch {
    return { ok: false, message: "You do not have permission to upload images." };
  }
  const config = getCloudinaryConfig();
  if (!config) {
    return {
      ok: false,
      message:
        "Image upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
    };
  }
  const folder = UPLOAD_FOLDERS[kind];
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryParams({ folder, timestamp }, config.apiSecret);
  return {
    ok: true,
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    timestamp,
    folder,
    signature,
  };
}
