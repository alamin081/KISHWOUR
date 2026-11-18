import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

// OWASP-recommended scrypt parameters (N=2^17, r=8, p=1).
const PARAMS = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const KEYLEN = 64;

/** Hashes a password as `scrypt$N$r$p$saltB64$hashB64`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEYLEN, PARAMS);
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

/** Constant-time verification. Returns false for malformed hashes. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts as [
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(
    password.normalize("NFKC"),
    Buffer.from(saltB64, "base64"),
    expected.length,
    {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: PARAMS.maxmem,
    },
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Minimum password policy for staff accounts. */
export function passwordProblem(password: string): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (password.length > 200) return "Use at most 200 characters.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password))
    return "Use letters and at least one number.";
  return null;
}
