"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CircleCheck, Smartphone } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import {
  updateProfileAction,
  changePasswordAction,
} from "@/app/actions/account-actions";
import { COUNTIES, townsForCounty } from "@/lib/constants";

function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}

function FormSuccess({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="flex items-start gap-2 rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm font-medium text-forest-800">
      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

/* ------------------------------- Profile form ------------------------------- */

export function ProfileForm({
  defaults,
}: {
  defaults: {
    name: string;
    phone: string;
    whatsappPhone: string;
    county: string;
    town: string;
  };
}) {
  const [state, formAction] = useActionState(updateProfileAction, {});
  const [county, setCounty] = useState(defaults.county || "Nairobi");
  const towns = townsForCounty(county);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="profile-name" className="label">
            Full name
          </label>
          <input
            id="profile-name"
            name="name"
            className="input"
            defaultValue={defaults.name}
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
          />
        </div>
        <div>
          <label htmlFor="profile-phone" className="label">
            Mobile number (M-Pesa)
          </label>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            className="input"
            defaultValue={defaults.phone}
            autoComplete="tel"
            placeholder="0712 345 678"
            required
          />
          <p className="field-help">
            Used for M-Pesa payments. Changing it requires re-verification.
          </p>
        </div>
        <div>
          <label htmlFor="profile-whatsapp" className="label">
            WhatsApp number <span className="text-ink-400">(optional)</span>
          </label>
          <input
            id="profile-whatsapp"
            name="whatsappPhone"
            type="tel"
            className="input"
            defaultValue={defaults.whatsappPhone}
            placeholder="Same as mobile if empty"
          />
          <p className="field-help">
            The number buyers see after acknowledging the safety notice.
          </p>
        </div>
        <div>
          <label htmlFor="profile-county" className="label">
            County
          </label>
          <select
            id="profile-county"
            name="county"
            className="input"
            value={county}
            onChange={(e) => setCounty(e.target.value)}
          >
            <option value="">Choose…</option>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="profile-town" className="label">
            Town / area
          </label>
          <input
            id="profile-town"
            name="town"
            className="input"
            defaultValue={defaults.town}
            list="profile-town-options"
            placeholder="e.g. Kilimani"
            maxLength={60}
          />
          <datalist id="profile-town-options">
            {towns.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <p className="field-help">
            Pre-filled on new listings so buyers near you find your items.
          </p>
        </div>
      </div>
      <FormError message={state.error} />
      <FormSuccess message={state.success} />
      <SubmitButton className="btn-primary btn-md">Save profile</SubmitButton>
    </form>
  );
}

/* ------------------------------ Password form ------------------------------- */

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, {});

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="current-password" className="label">
          Current password
        </label>
        <PasswordInput
          id="current-password"
          name="currentPassword"
          placeholder="Your current password"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="account-new-password" className="label">
            New password
          </label>
          <PasswordInput
            id="account-new-password"
            name="newPassword"
            autoComplete="new-password"
            placeholder="At least 8 characters, with a letter and a number"
          />
        </div>
        <div>
          <label htmlFor="account-confirm-password" className="label">
            Confirm new password
          </label>
          <PasswordInput
            id="account-confirm-password"
            name="confirm"
            autoComplete="new-password"
            placeholder="Repeat the new password"
          />
        </div>
      </div>
      <FormError message={state.error} />
      <FormSuccess message={state.success} />
      <SubmitButton className="btn-primary btn-md">Change password</SubmitButton>
    </form>
  );
}
