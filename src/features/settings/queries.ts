import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db";

import {
  defaultSettings,
  SETTING_KEYS,
  settingSchemas,
  type SettingKey,
  type Settings,
} from "./schema";

export const SETTINGS_TAG = "site:settings";

/**
 * Site settings: database values (validated) over code defaults. If the settings table is
 * unavailable (e.g. before its migration), the defaults are used so the public site keeps working.
 */
export async function getSiteSettings(): Promise<Settings> {
  "use cache";
  cacheLife("hours");
  cacheTag(SETTINGS_TAG);

  const merged: Settings = structuredClone(defaultSettings);
  try {
    const rows = await db.siteSetting.findMany({ select: { key: true, value: true } });
    for (const row of rows) {
      if (!(SETTING_KEYS as string[]).includes(row.key)) continue;
      const key = row.key as SettingKey;
      const parsed = settingSchemas[key].safeParse(row.value);
      if (parsed.success) (merged as Record<SettingKey, unknown>)[key] = parsed.data;
    }
  } catch (error) {
    console.error(
      "[settings] falling back to defaults",
      error instanceof Error ? error.message : error,
    );
  }
  return merged;
}

/** Last-updated info per key, for the admin. */
export async function getSettingsMeta() {
  return db.siteSetting.findMany({
    select: {
      key: true,
      updatedAt: true,
      updatedBy: { select: { name: true, email: true } },
    },
  });
}
