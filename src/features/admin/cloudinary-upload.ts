import { type UploadSignature } from "./upload-actions";

/**
 * Browser → Cloudinary upload. The request is signed by the server (`getUploadSignature`),
 * so the API secret never reaches the browser.
 */

export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/avif";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type SignedUpload = Extract<UploadSignature, { ok: true }>;

export type UploadedImage = {
  url: string;
  publicId: string;
  width: number | null;
  height: number | null;
};

/** Returns an error message for files Cloudinary would reject, or null when the file is fine. */
export function validateImageFile(file: File): string | null {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type))
    return `${file.name}: use JPEG, PNG, WebP or AVIF up to 10 MB.`;
  if (file.size > MAX_UPLOAD_BYTES)
    return `${file.name}: use JPEG, PNG, WebP or AVIF up to 10 MB.`;
  return null;
}

/** Uploads one file with an already-obtained signature. Throws with Cloudinary's message. */
export async function uploadToCloudinary(
  file: File,
  signature: SignedUpload,
): Promise<UploadedImage> {
  const body = new FormData();
  body.set("file", file);
  body.set("api_key", signature.apiKey);
  body.set("timestamp", String(signature.timestamp));
  body.set("folder", signature.folder);
  body.set("signature", signature.signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    { method: "POST", body },
  );
  const json = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    error?: { message: string };
  };
  if (!res.ok || !json.secure_url)
    throw new Error(json.error?.message ?? `Upload failed (${res.status})`);

  return {
    url: json.secure_url,
    publicId: json.public_id ?? "",
    width: json.width ?? null,
    height: json.height ?? null,
  };
}
