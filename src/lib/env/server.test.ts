import { afterEach, describe, expect, it, vi } from "vitest";

const VALID_DB = "postgresql://user:pass@localhost:5432/db";

async function loadFresh() {
  vi.resetModules();
  return import("./server");
}

describe("getServerEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects a missing DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { getServerEnv } = await loadFresh();
    expect(() => getServerEnv()).toThrow(/DATABASE_URL/);
  });

  it("rejects a non-PostgreSQL DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "mysql://localhost/db");
    const { getServerEnv } = await loadFresh();
    expect(() => getServerEnv()).toThrow(/PostgreSQL/);
  });

  it("treats empty optional integration keys as not configured", async () => {
    vi.stubEnv("DATABASE_URL", VALID_DB);
    vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("ADMIN_EMAIL", "");
    vi.stubEnv("AUTH_SECRET", "");
    const { getServerEnv, getIntegrationStatus } = await loadFresh();
    expect(getServerEnv().CLOUDINARY_CLOUD_NAME).toBeUndefined();
    expect(getIntegrationStatus()).toEqual({
      auth: false,
      cloudinary: false,
      email: false,
    });
  });

  it("rejects an invalid ADMIN_EMAIL", async () => {
    vi.stubEnv("DATABASE_URL", VALID_DB);
    vi.stubEnv("ADMIN_EMAIL", "not-an-email");
    const { getServerEnv } = await loadFresh();
    expect(() => getServerEnv()).toThrow(/ADMIN_EMAIL/);
  });
});

describe("DIRECT_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is optional", async () => {
    vi.stubEnv("DATABASE_URL", VALID_DB);
    vi.stubEnv("DIRECT_URL", "");
    const { getServerEnv } = await loadFresh();
    expect(getServerEnv().DIRECT_URL).toBeUndefined();
  });

  it("must be a PostgreSQL URL when set", async () => {
    vi.stubEnv("DATABASE_URL", VALID_DB);
    vi.stubEnv("DIRECT_URL", "https://example.com");
    const { getServerEnv } = await loadFresh();
    expect(() => getServerEnv()).toThrow(/DIRECT_URL/);
  });
});
