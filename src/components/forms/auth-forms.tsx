"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleCheck, MailCheck, Smartphone } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
  resendEmailVerificationAction,
  sendPhoneOtpAction,
  confirmPhoneOtpAction,
} from "@/app/actions/auth-actions";

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
    <p className="rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm font-medium text-forest-800">
      {message}
    </p>
  );
}

/* ---------------------------------- Login ---------------------------------- */

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <div>
        <label htmlFor="login-email" className="label">
          Email address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          className="input"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="login-password" className="label">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="mb-1.5 text-xs font-medium text-forest-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput id="login-password" name="password" placeholder="Your password" />
      </div>
      <FormError message={state.error} />
      <SubmitButton className="btn-primary btn-md w-full" pendingLabel="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}

/* -------------------------------- Register --------------------------------- */

export function RegisterForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(registerAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <div>
        <label htmlFor="reg-name" className="label">
          Full name
        </label>
        <input
          id="reg-name"
          name="name"
          className="input"
          autoComplete="name"
          placeholder="e.g. Amina Wanjiru"
          required
          minLength={2}
          maxLength={80}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="label">
          Email address
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          placeholder="you@example.com"
          required
          maxLength={120}
        />
      </div>
      <div>
        <label htmlFor="reg-phone" className="label">
          Mobile number (M-Pesa)
        </label>
        <input
          id="reg-phone"
          name="phone"
          type="tel"
          className="input"
          autoComplete="tel"
          placeholder="0712 345 678"
          required
        />
        <p className="field-help">
          Kenyan Safaricom/Airtel/Telkom number — used for M-Pesa payments and
          buyer contact.
        </p>
      </div>
      <div>
        <label htmlFor="reg-password" className="label">
          Password
        </label>
        <PasswordInput
          id="reg-password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters, with a letter and a number"
        />
      </div>
      <FormError message={state.error} />
      <SubmitButton className="btn-primary btn-md w-full" pendingLabel="Creating account…">
        Create my seller account
      </SubmitButton>
      <p className="text-center text-xs leading-relaxed text-ink-500">
        By creating an account you agree to transact safely and follow our{" "}
        <Link href="/safety" className="font-medium text-forest-700 underline underline-offset-2">
          safety guidelines
        </Link>
        .
      </p>
    </form>
  );
}

/* ----------------------------- Password recovery ---------------------------- */

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="forgot-email" className="label">
          Email address
        </label>
        <input
          id="forgot-email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          placeholder="you@example.com"
          required
          autoFocus
        />
      </div>
      <FormError message={state.error} />
      <FormSuccess message={state.success} />
      <SubmitButton className="btn-primary btn-md w-full" pendingLabel="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="new-password" className="label">
          New password
        </label>
        <PasswordInput
          id="new-password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters, with a letter and a number"
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className="label">
          Confirm new password
        </label>
        <PasswordInput
          id="confirm-password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Repeat the new password"
        />
      </div>
      <FormError message={state.error} />
      <SubmitButton className="btn-primary btn-md w-full" pendingLabel="Saving…">
        Set new password
      </SubmitButton>
    </form>
  );
}

/* ---------------------------- Email verification ---------------------------- */

export function ResendEmailVerificationForm() {
  const [state, formAction] = useActionState(resendEmailVerificationAction, {});

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state.error} />
      <FormSuccess message={state.success} />
      <SubmitButton className="btn-secondary btn-md w-full" pendingLabel="Sending…">
        <MailCheck className="h-4 w-4" aria-hidden="true" />
        Resend verification email
      </SubmitButton>
    </form>
  );
}

/* ---------------------------- Phone verification ---------------------------- */

export function PhoneOtpForms({
  phone,
  verified,
}: {
  phone: string | null;
  verified: boolean;
}) {
  const [sendState, sendFormAction] = useActionState(sendPhoneOtpAction, {});
  const [confirmState, confirmFormAction] = useActionState(confirmPhoneOtpAction, {});

  if (verified) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm font-medium text-forest-800">
        <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
        Your number {phone ? `(${phone})` : ""} is verified. Buyers trust you
        a little more for it.
      </div>
    );
  }

  if (!phone) {
    return (
      <p className="text-sm text-ink-600">
        Add a phone number in{" "}
        <Link href="/dashboard/account" className="font-medium text-forest-700 underline underline-offset-2">
          Account settings
        </Link>{" "}
        first, then come back to verify it.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <form action={sendFormAction} className="space-y-3">
        <p className="text-sm text-ink-600">
          We&apos;ll generate a 6-digit code for{" "}
          <span className="font-semibold text-ink-900">{phone}</span>.
        </p>
        <FormError message={sendState.error} />
        <FormSuccess message={sendState.success} />
        {sendState.demoCode && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">
              Demo mode — no SMS gateway configured
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-purple-900">
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              Your code is{" "}
              <span className="font-mono text-lg font-bold tracking-[0.3em]">
                {sendState.demoCode}
              </span>
            </p>
            <p className="mt-1 text-xs text-purple-700">
              In production this code is delivered by SMS instead of being
              shown here.
            </p>
          </div>
        )}
        <SubmitButton className="btn-secondary btn-md" pendingLabel="Generating…">
          {sendState.demoCode ? "Send a new code" : "Send code"}
        </SubmitButton>
      </form>

      {sendState.demoCode && (
        <form action={confirmFormAction} className="space-y-3 border-t border-sand-100 pt-5">
          <label htmlFor="otp-code" className="label">
            Enter the 6-digit code
          </label>
          <input
            id="otp-code"
            name="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            className="input max-w-[12rem] text-center font-mono text-lg tracking-[0.3em]"
            placeholder="••••••"
            required
            autoFocus
          />
          <FormError message={confirmState.error} />
          <FormSuccess message={confirmState.success} />
          <SubmitButton className="btn-primary btn-md" pendingLabel="Verifying…">
            Verify my number
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
