import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, MailCheck, Smartphone } from "lucide-react";

import { requireUser, isEmailVerified } from "@/lib/auth";
import {
  ProfileForm,
  ChangePasswordForm,
} from "@/components/forms/account-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account settings" };

export default async function AccountPage() {
  const { profile } = await requireUser("/dashboard/account");
  const emailVerified = await isEmailVerified(profile.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Account settings</h1>
        <p className="section-subtitle">
          Keep your contact details current — buyers and M-Pesa depend on them.
        </p>
      </div>

      {/* Verification status */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Verification
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <MailCheck
                className={`h-5 w-5 shrink-0 ${emailVerified ? "text-forest-600" : "text-ink-400"}`}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-ink-900">
                  Email address
                </p>
                <p className="truncate text-xs text-ink-500">
                  {profile.email}
                </p>
              </div>
            </div>
            {emailVerified ? (
              <span className="badge bg-forest-100 text-forest-800">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                Verified
              </span>
            ) : (
              <Link href="/verify-email" className="btn-primary btn-sm shrink-0">
                Verify
              </Link>
            )}
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-sand-200 bg-sand-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Smartphone
                className={`h-5 w-5 shrink-0 ${profile.phoneVerifiedAt ? "text-forest-600" : "text-ink-400"}`}
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-ink-900">
                  Phone number
                </p>
                <p className="truncate text-xs text-ink-500">
                  {profile.phone ?? "Not set"}
                </p>
              </div>
            </div>
            {profile.phoneVerifiedAt ? (
              <span className="badge bg-forest-100 text-forest-800">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                Verified
              </span>
            ) : (
              <Link href="/verify-phone" className="btn-primary btn-sm shrink-0">
                Verify
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Profile &amp; contact
        </h2>
        <div className="mt-5">
          <ProfileForm
            defaults={{
              name: profile.name,
              phone: profile.phone ?? "",
              whatsappPhone: profile.whatsappPhone ?? "",
              county: profile.county ?? "",
              town: profile.town ?? "",
            }}
          />
        </div>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Change password
        </h2>
        <div className="mt-5">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
