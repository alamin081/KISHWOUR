import "server-only";

/** Image hosts the PDF generator may fetch from (mirrors next.config images.remotePatterns). */
const ALLOWED_HOSTS = new Set(["res.cloudinary.com"]);

/**
 * Cloudinary delivery URL → small JPEG suitable for print-size thumbnails
 * (react-pdf supports JPEG/PNG only, not WebP/AVIF).
 */
export function pdfImageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.hostname)) return null;
    if (u.pathname.includes("/image/upload/")) {
      u.pathname = u.pathname.replace(
        "/image/upload/",
        "/image/upload/c_fill,w_520,h_390,q_auto,f_jpg/",
      );
    }
    return u.toString();
  } catch {
    return null;
  }
}

/** Fetches images with a timeout and limited concurrency; failures resolve to null. */
export async function fetchImages(
  urls: (string | null)[],
  concurrency = 6,
): Promise<(Buffer | null)[]> {
  const out: (Buffer | null)[] = new Array(urls.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < urls.length) {
      const i = next++;
      const url = urls[i] ? pdfImageUrl(urls[i] as string) : null;
      if (!url) continue;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
        const type = res.headers.get("content-type") ?? "";
        if (res.ok && /image\/(jpeg|png)/.test(type))
          out[i] = Buffer.from(await res.arrayBuffer());
      } catch {
        // Missing image → placeholder in the PDF.
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return out;
}
