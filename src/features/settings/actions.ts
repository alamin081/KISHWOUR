"use server";

import { updateTag } from "next/cache";

import {
  type ActionResult,
  failure,
  fieldErrorsFrom,
} from "@/features/admin/action-result";
import { type Prisma } from "@/generated/prisma/client";
import { assertPermission } from "@/lib/auth/session";
import { db } from "@/lib/db";

import { SETTINGS_TAG } from "./queries";
import { type SettingKey, settingSchemas } from "./schema";

/** Business settings need admin rights; editorial content can be edited by editors. */
const PERMISSION: Record<
  SettingKey,
  "settings:manage" | "content:manage" | "alibaba:manage"
> = {
  contact: "settings:manage",
  social: "settings:manage",
  alibaba: "alibaba:manage",
  brand: "content:manage",
  home: "content:manage",
  about: "content:manage",
};

export async function saveSetting(
  key: SettingKey,
  value: unknown,
): Promise<ActionResult> {
  try {
    if (!(key in settingSchemas)) return { ok: false, message: "Unknown setting." };
    const staff = await assertPermission(PERMISSION[key]);
    const parsed = settingSchemas[key].safeParse(value);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Please correct the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error),
      };
    }
    // JSON.parse(JSON.stringify()) drops undefined values so optional fields are stored cleanly.
    const json = JSON.parse(JSON.stringify(parsed.data)) as Prisma.InputJsonValue;
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: json, updatedById: staff.id },
      update: { value: json, updatedById: staff.id },
    });
    updateTag(SETTINGS_TAG);
    return { ok: true, message: "Saved. The website is updated." };
  } catch (error) {
    return failure(error);
  }
}
