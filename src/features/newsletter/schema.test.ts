import { describe, expect, it } from "vitest";

import { subscribeToNewsletter } from "./actions";
import { newsletterSchema } from "./schema";

describe("newsletterSchema", () => {
  it("normalises and accepts a valid email", () => {
    expect(newsletterSchema.parse({ email: " Buyer@Example.com " }).email).toBe(
      "buyer@example.com",
    );
  });
  it("rejects an invalid email", () => {
    expect(newsletterSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("subscribeToNewsletter", () => {
  it("returns field errors for invalid input", async () => {
    const res = await subscribeToNewsletter({ email: "bad" });
    expect(res.ok).toBe(false);
    expect(res.ok === false && res.fieldErrors?.email).toBeTruthy();
  });
  it("does not claim success while storage is not connected", async () => {
    const res = await subscribeToNewsletter({ email: "buyer@example.com" });
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/not open yet/i);
  });
});

describe("newsletter honeypot", () => {
  it("silently accepts (and drops) a filled honeypot", async () => {
    const res = await subscribeToNewsletter({ email: "bot@example.com", website: "x" });
    expect(res).toEqual({ ok: true, message: "Thank you." });
  });
});
