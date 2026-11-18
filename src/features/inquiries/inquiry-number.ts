import { randomInt } from "node:crypto";

// Unambiguous characters (no 0/O, 1/I/L).
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Human-readable, hard-to-guess reference, e.g. KSW-INQ-20261112-7K3QX9. */
export function generateInquiryNumber(date = new Date()): string {
  const ymd = date.toISOString().slice(0, 10).replaceAll("-", "");
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `KSW-INQ-${ymd}-${suffix}`;
}
