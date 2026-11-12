import Link from "next/link";
import type { Metadata } from "next";
import { CircleCheck, MailWarning } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { ResendEmailVerificationForm } from "@/components/forms/auth-forms";
import { getSession, isEmailVerified } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const justVerified = sp.verified === "1";
  const { authUser } = await getSession();
  const verified = authUser
    ? (await isEmailVerified(authUser.id)) || justVerified
    : false;

  if (verified && authUser) {
    return (
      <AuthShell
        title="Email verified 🎉"
        subtitle="Your email address is confirmed. Next: verify your phone, then pick a subscription to start listing."
      >
        <div className="flex flex-col items-center gap-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-100 text-forest-700">
            <CircleCheck className="h-8 w-8" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/verify-phone" className="btn-primary btn-md">
              Verify my phone
            </Link>
            <Link href="/dashboard/subscription" className="btn-secondary btn-md">
              Choose a plan
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Check your inbox"
      subtitle={
        authUser?.email
          ? `We sent a verification link to ${authUser.email}. Click it to confirm your address — then sign in again.`
          : "We sent a verification link to your email address. Click it to confirm your address."
      }
      footer={
        <Link href="/login" className="font-semibold text-forest-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-sand-200 bg-sand-50 p-4 text-sm text-ink-600">
          <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" aria-hidden="true" />
          <p className="leading-relaxed">
            Can&apos;t find it? Check your spam folder. The link expires after a
            while — you can resend it below.
          </p>
        </div>
        {authUser ? (
          <ResendEmailVerificationForm />
        ) : (
          <p className="text-sm text-ink-600">
            Already clicked the link?{" "}
            <Link href="/login" className="font-semibold text-forest-700 hover:underline">
              Sign in
            </Link>{" "}
            to continue.
          </p>
        )}
      </div>
    </AuthShell>
  );
}
