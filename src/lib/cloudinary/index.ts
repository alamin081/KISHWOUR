import "server-only";

import { createHash } from "node:crypto";

import { getServerEnv } from "@/lib/env/server";

export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

/** Returns credentials, or null when Cloudinary is not configured (uploads disabled). */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  const env = getServerEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)
    return null;
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  };
}

/** Cloudinary signature: SHA-1 of the alphabetically sorted params + API secret. */
export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

/**
 * Best-effort deletion of an uploaded asset. Errors are logged, never thrown: a failed
 * clean-up must not fail the surrounding action. Returns whether Cloudinary accepted it.
 */
export async function destroyCloudinaryAsset(publicId: string): Promise<boolean> {
  const config = getCloudinaryConfig();
  if (!config || !publicId) return false;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signCloudinaryParams(
    { public_id: publicId, timestamp },
    config.apiSecret,
  );
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: config.apiKey,
    signature,
  });
  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
      {
        method: "POST",
        body,
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) {
      console.error("[cloudinary] destroy failed", res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[cloudinary] destroy failed", error);
    return false;
  }
}

/** Accept only Cloudinary delivery URLs for stored images (matches next.config remotePatterns). */
export function isCloudinaryUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}
