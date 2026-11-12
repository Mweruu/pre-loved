import { prisma } from "@/lib/db";
import { BUYER_SAFETY_NOTICE } from "@/lib/constants";

/**
 * Platform-wide configuration, editable from the admin dashboard.
 * Defaults live in code; rows in the SiteSetting table override them.
 */
export const DEFAULT_SETTINGS = {
  siteName: "Sokoni Nyumbani",
  tagline: "Give Your Home Items a Second Life.",
  supportEmail: "support@sokoninyumbani.co.ke",
  supportPhone: "+254 700 000 000",
  supportWhatsapp: "254700000000",
  listingExpiryDays: "60",
  requireListingApproval: "true",
  onSubscriptionExpiry: "keep_visible",
  safetyNotice: BUYER_SAFETY_NOTICE,
} as const;

export type SiteSettingsKey = keyof typeof DEFAULT_SETTINGS;
export type SiteSettings = Record<SiteSettingsKey, string>;

const VALIDATORS: Partial<Record<SiteSettingsKey, (v: string) => boolean>> = {
  listingExpiryDays: (v) => /^\d+$/.test(v) && Number(v) >= 7 && Number(v) <= 365,
  requireListingApproval: (v) => v === "true" || v === "false",
  onSubscriptionExpiry: (v) => v === "keep_visible" || v === "hide",
};

export async function getSettings(): Promise<SiteSettings> {
  const merged: SiteSettings = { ...DEFAULT_SETTINGS };
  try {
    const rows = await prisma.siteSetting.findMany();
    for (const row of rows) {
      if (row.key in merged) merged[row.key as SiteSettingsKey] = row.value;
    }
  } catch {
    // Fall back to defaults if the database is unreachable (e.g. during build)
  }
  return merged;
}

export async function setSettings(entries: Partial<SiteSettings>) {
  for (const [key, value] of Object.entries(entries)) {
    const validator = VALIDATORS[key as SiteSettingsKey];
    if (validator && !validator(value)) continue;
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}

export function settingsBool(
  settings: SiteSettings,
  key: SiteSettingsKey
): boolean {
  return settings[key] === "true";
}

export function settingsNumber(
  settings: SiteSettings,
  key: SiteSettingsKey,
  fallback: number
): number {
  const n = Number(settings[key]);
  return Number.isFinite(n) ? n : fallback;
}
