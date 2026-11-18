/** Accepts only https links to alibaba.com (incl. subdomains such as kishwour.en.alibaba.com). */
export function isValidAlibabaUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === "alibaba.com" || host.endsWith(".alibaba.com"))
    );
  } catch {
    return false;
  }
}

/** wa.me link with a pre-filled message. `number` is international format, digits only. */
export function whatsAppLink(number: string, message: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
