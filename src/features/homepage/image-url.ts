/**
 * Cloudinary delivery-URL rules for editorial images.
 *
 * Pure and isomorphic on purpose: the exact same check runs in the browser (React Hook
 * Form / Zod resolver) and again on the server inside the Server Actions. The server
 * additionally pins the URL to our own cloud name, which is a server-side secret-ish
 * value and therefore not part of the shared schema.
 */

export const CLOUDINARY_HOST = "res.cloudinary.com";

export type CloudinaryUrlParts = {
  /** The Cloudinary cloud the asset is served from. */
  cloudName: string;
  /** Public ID without version or file extension, e.g. "kishwour/site/hero_ab12cd". */
  publicId: string;
};

const VERSION_SEGMENT = /^v\d+$/;

/**
 * Parses an `https://res.cloudinary.com/<cloud>/image/upload/.../<public id>.<ext>` URL.
 * Returns null for anything else — other hosts, http, query strings, path traversal.
 */
export function parseCloudinaryUrl(value: string): CloudinaryUrlParts | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== CLOUDINARY_HOST) return null;
  if (url.search !== "" || url.hash !== "" || url.username !== "" || url.password !== "")
    return null;

  const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (segments.some((s) => s === "." || s === "..")) return null;

  const [cloudName, resourceType, deliveryType, ...rest] = segments;
  if (!cloudName || resourceType !== "image" || deliveryType !== "upload") return null;

  // Everything after the last version segment is the public ID; without a version
  // segment Cloudinary transformations and IDs cannot be told apart reliably, so the
  // whole remainder is used (the upload response's public_id is stored anyway).
  const versionAt = rest.findLastIndex((s) => VERSION_SEGMENT.test(s));
  const idSegments = versionAt >= 0 ? rest.slice(versionAt + 1) : rest;
  const publicId = idSegments.join("/").replace(/\.[a-z0-9]{2,5}$/i, "");
  if (!publicId) return null;

  return { cloudName, publicId };
}

/** True for any Cloudinary image delivery URL (host-level check, safe in the browser). */
export function isCloudinaryDeliveryUrl(value: string): boolean {
  return parseCloudinaryUrl(value) !== null;
}

/** True only for URLs served from `cloudName`. Used server-side where the cloud is known. */
export function isCloudinaryDeliveryUrlFor(value: string, cloudName: string): boolean {
  const parts = parseCloudinaryUrl(value);
  return parts !== null && parts.cloudName === cloudName;
}

/** The asset's public ID, or null when the URL is not a Cloudinary delivery URL. */
export function cloudinaryPublicIdFromUrl(value: string): string | null {
  return parseCloudinaryUrl(value)?.publicId ?? null;
}
