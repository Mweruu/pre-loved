import type { Metadata } from "next";
import { Settings as SettingsIcon, Save, ShieldAlert } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { adminSaveSettingsAction } from "@/app/actions/admin-actions";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Platform settings" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const done = sp.done === "saved";
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Platform settings</h1>
        <p className="section-subtitle">
          Site-wide configuration. Changes are effective immediately across
          the marketplace, dashboards and emails.
        </p>
      </div>

      {done && (
        <p className="rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4 text-sm font-medium text-forest-900">
          Settings saved.
        </p>
      )}

      <form action={adminSaveSettingsAction} className="space-y-6">
        {/* Brand */}
        <section className="card space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Brand
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="siteName" className="label">
                Site name
              </label>
              <input
                id="siteName"
                name="siteName"
                className="input"
                defaultValue={settings.siteName}
                maxLength={60}
                required
              />
            </div>
            <div>
              <label htmlFor="tagline" className="label">
                Tagline
              </label>
              <input
                id="tagline"
                name="tagline"
                className="input"
                defaultValue={settings.tagline}
                maxLength={120}
                required
              />
            </div>
          </div>
        </section>

        {/* Support contacts */}
        <section className="card space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Support contacts
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="supportEmail" className="label">
                Support email
              </label>
              <input
                id="supportEmail"
                name="supportEmail"
                type="email"
                className="input"
                defaultValue={settings.supportEmail}
                maxLength={120}
                required
              />
            </div>
            <div>
              <label htmlFor="supportPhone" className="label">
                Support phone (display)
              </label>
              <input
                id="supportPhone"
                name="supportPhone"
                className="input"
                defaultValue={settings.supportPhone}
                maxLength={40}
                required
              />
            </div>
            <div>
              <label htmlFor="supportWhatsapp" className="label">
                Support WhatsApp number
              </label>
              <input
                id="supportWhatsapp"
                name="supportWhatsapp"
                className="input"
                defaultValue={settings.supportWhatsapp}
                placeholder="2547XXXXXXXX"
                maxLength={15}
                required
              />
              <p className="field-help">
                E.164 without &ldquo;+&rdquo; — used for wa.me links.
              </p>
            </div>
          </div>
        </section>

        {/* Marketplace behaviour */}
        <section className="card space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Marketplace behaviour
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="listingExpiryDays" className="label">
                Listing expiry (days)
              </label>
              <input
                id="listingExpiryDays"
                name="listingExpiryDays"
                type="number"
                min={7}
                max={365}
                step={1}
                className="input"
                defaultValue={settings.listingExpiryDays}
                required
              />
              <p className="field-help">
                New listings stay live for this many days (7–365) before
                expiring. Sellers can relist expired items.
              </p>
            </div>
            <div>
              <label htmlFor="onSubscriptionExpiry" className="label">
                When a seller&apos;s subscription expires
              </label>
              <select
                id="onSubscriptionExpiry"
                name="onSubscriptionExpiry"
                className="input"
                defaultValue={settings.onSubscriptionExpiry}
              >
                <option value="keep_visible">
                  Keep their listings visible
                </option>
                <option value="hide">Hide their listings</option>
              </select>
              <p className="field-help">
                &ldquo;Hide&rdquo; removes listings of unsubscribed sellers
                from the public marketplace until they renew.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-sand-200 bg-sand-50 px-4 py-3.5">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-800">
              <input
                type="checkbox"
                name="requireListingApproval"
                defaultChecked={settings.requireListingApproval === "true"}
                className="mt-0.5 h-4 w-4 rounded accent-forest-700"
              />
              <span>
                <span className="font-medium">
                  Require approval before listings go live
                </span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  New and edited listings wait in the moderation queue. Turn
                  off to publish instantly — do this only if you trust your
                  seller community.
                </span>
              </span>
            </label>
            {/* Hidden false AFTER the checkbox so unchecked saves "false" */}
            <input type="hidden" name="requireListingApproval" value="false" />
          </div>
        </section>

        {/* Safety notice */}
        <section className="card space-y-5 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <ShieldAlert className="h-5 w-5 text-gold-600" aria-hidden="true" />
            Buyer safety notice
          </h2>
          <div>
            <label htmlFor="safetyNotice" className="label">
              Notice text (shown on homepage, listings and contact flows)
            </label>
            <textarea
              id="safetyNotice"
              name="safetyNotice"
              rows={12}
              className="input font-mono text-[13px] leading-relaxed"
              defaultValue={settings.safetyNotice}
              required
            />
            <p className="field-help">
              This is a legal/safety surface — be careful editing it. Buyers
              must acknowledge it before contacting sellers. Keep the language
              honest: we never guarantee transactions.
            </p>
          </div>
          <button
            type="button"
            className="btn-ghost btn-sm"
            // no-op reset hint: server keeps defaults in code
            title="Defaults live in src/lib/settings.ts"
          >
            Defaults are defined in code (src/lib/settings.ts)
          </button>
        </section>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary btn-lg">
            <Save className="h-4 w-4" aria-hidden="true" />
            Save all settings
          </button>
          <p className="flex items-center gap-1.5 text-xs text-ink-400">
            <SettingsIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {Object.keys(DEFAULT_SETTINGS).length} configurable keys
          </p>
        </div>
      </form>
    </div>
  );
}
