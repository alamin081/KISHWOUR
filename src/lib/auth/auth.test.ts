import { describe, expect, it } from "vitest";

import { hashPassword, passwordProblem, verifyPassword } from "./password";
import { can, isStaffRole } from "./permissions";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse 42");
    expect(hash.startsWith("scrypt$131072$8$1$")).toBe(true);
    expect(await verifyPassword("correct horse 42", hash)).toBe(true);
    expect(await verifyPassword("correct horse 43", hash)).toBe(false);
  }, 20_000);

  it("uses a unique salt per hash", async () => {
    expect(await hashPassword("same password 1")).not.toBe(
      await hashPassword("same password 1"),
    );
  }, 20_000);

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "plaintext")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$4$5")).toBe(false);
  });

  it("enforces the password policy", () => {
    expect(passwordProblem("short1")).toMatch(/12/);
    expect(passwordProblem("onlylettersxx")).toMatch(/number/);
    expect(passwordProblem("a-long-passphrase-9")).toBeNull();
  });
});

describe("role-based access", () => {
  it("grants admins everything", () => {
    expect(can("ADMIN", "settings:manage")).toBe(true);
    expect(can("ADMIN", "alibaba:manage")).toBe(true);
  });
  it("limits editors", () => {
    expect(can("EDITOR", "products:manage")).toBe(true);
    expect(can("EDITOR", "settings:manage")).toBe(false);
    expect(can("EDITOR", "alibaba:manage")).toBe(false);
  });
  it("denies customers and unknown roles", () => {
    expect(isStaffRole("CUSTOMER")).toBe(false);
    expect(can("CUSTOMER", "dashboard:view")).toBe(false);
    expect(can(undefined, "dashboard:view")).toBe(false);
    expect(can("admin", "dashboard:view")).toBe(false);
  });
});
