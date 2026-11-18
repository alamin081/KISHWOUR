import { describe, expect, it } from "vitest";

import {
  UPLOAD_FOLDERS,
  UPLOAD_PERMISSIONS,
  SITE_UPLOAD_FOLDER,
} from "@/features/admin/upload-kinds";
import { can, PERMISSIONS, STAFF_ROLES } from "@/lib/auth/permissions";

import { PAGE_PERMISSION } from "./permission";

describe("page editor permission", () => {
  it("is a real permission", () => {
    expect(PERMISSIONS).toContain(PAGE_PERMISSION);
    expect(PAGE_PERMISSION).toBe("content:manage");
  });

  it("is granted to every staff role and to nobody else", () => {
    for (const role of STAFF_ROLES) expect(can(role, PAGE_PERMISSION), role).toBe(true);
    for (const role of ["CUSTOMER", "", "admin", null, undefined, 1, {}])
      expect(can(role, PAGE_PERMISSION), String(role)).toBe(false);
  });
});

describe("site upload kind", () => {
  it("uploads page images into a dedicated Cloudinary folder", () => {
    expect(UPLOAD_FOLDERS.site).toBe("kishwour/site");
    expect(SITE_UPLOAD_FOLDER).toBe(UPLOAD_FOLDERS.site);
    // Separate from catalogue media, which the homepage cleanup must never delete.
    expect(UPLOAD_FOLDERS.site).not.toBe(UPLOAD_FOLDERS.products);
    expect(UPLOAD_FOLDERS.site).not.toBe(UPLOAD_FOLDERS.categories);
  });

  it("requires the same permission as the editor itself", () => {
    expect(UPLOAD_PERMISSIONS.site).toBe(PAGE_PERMISSION);
  });

  it("keeps a permission for every upload kind", () => {
    for (const kind of Object.keys(UPLOAD_FOLDERS)) {
      expect(PERMISSIONS, kind).toContain(
        UPLOAD_PERMISSIONS[kind as keyof typeof UPLOAD_FOLDERS],
      );
    }
  });
});
