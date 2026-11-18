import { z } from "zod";

import { aboutContent, homeContent } from "@/content/site-content";
import { siteConfig } from "@/config/site";
import { isValidAlibabaUrl } from "@/features/products/links";

/** Optional trimmed text: "" → undefined. */
const opt = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use at most ${max} characters`)
    .optional()
    .transform((v) => (v ? v : undefined));
const req = (max: number, label = "This field") =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `Use at most ${max} characters`);
const optUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine(
    (v) => v === undefined || /^https:\/\/[^\s]+$/.test(v),
    "Use a full https:// URL",
  );

export const settingSchemas = {
  contact: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine(
        (v) => v === undefined || z.email().safeParse(v).success,
        "Enter a valid email",
      ),
    phone: opt(40).refine(
      (v) => v === undefined || /^\+?[0-9\s\-()]{6,40}$/.test(v),
      "Enter a valid phone number",
    ),
    whatsapp: opt(20).refine(
      (v) => v === undefined || /^[1-9][0-9]{7,14}$/.test(v),
      "International number, digits only, e.g. 8801XXXXXXXXX",
    ),
    address: opt(400),
  }),
  social: z.object({
    facebook: optUrl,
    instagram: optUrl,
    linkedin: optUrl,
    youtube: optUrl,
  }),
  alibaba: z.object({
    storeUrl: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine(
        (v) => v === undefined || isValidAlibabaUrl(v),
        "Use an https:// link on alibaba.com",
      ),
  }),
  brand: z.object({
    tagline: req(80, "Tagline"),
    description: req(400, "Description"),
    announcementMessage: opt(160),
    footerText: opt(400),
  }),
  home: z.object({
    heroTitle: req(120, "Hero title"),
    heroSubtitle: req(300, "Hero subtitle"),
    aboutTitle: req(120, "About title"),
    aboutBody: req(2000, "About text"),
  }),
  about: z.object({
    introDescription: req(300, "Introduction"),
    sections: z
      .array(
        z.object({ id: z.string(), eyebrow: req(60), title: req(120), body: req(3000) }),
      )
      .min(1)
      .max(10),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type Settings = { [K in SettingKey]: z.output<(typeof settingSchemas)[K]> };
export const SETTING_KEYS = Object.keys(settingSchemas) as SettingKey[];

/** Current content from code — used until (and wherever) nothing is saved in the database. */
export const defaultSettings: Settings = {
  contact: { ...siteConfig.contact },
  social: { ...siteConfig.social },
  alibaba: { storeUrl: siteConfig.alibabaStoreUrl },
  brand: {
    tagline: siteConfig.tagline,
    description: siteConfig.description,
    announcementMessage: siteConfig.announcement.message,
    footerText: undefined,
  },
  home: {
    heroTitle: homeContent.hero.title,
    heroSubtitle: homeContent.hero.subtitle,
    aboutTitle: homeContent.about.title,
    aboutBody: homeContent.about.body.join("\n\n"),
  },
  about: {
    introDescription: aboutContent.intro.description,
    sections: aboutContent.sections.map((s) => ({
      id: s.id,
      eyebrow: s.eyebrow,
      title: s.title,
      body: s.body.join("\n\n"),
    })),
  },
};

/** Splits a textarea value into paragraphs. */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
