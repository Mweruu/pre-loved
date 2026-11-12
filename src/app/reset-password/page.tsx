import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/forms/auth-forms";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage() {
  const { authUser } = await getSession();

  if (!authUser) {
    return (
      <AuthShell
        title="Link expired"
        subtitle="This password reset link is no longer valid — password reset links can only be used once and expire after a while."
        footer={
          <Link
            href="/forgot-password"
            className="font-semibold text-forest-700 hover:underline"
          >
            Request a new reset link
          </Link>
        }
      >
        <p className="text-sm text-ink-600">
          If your link has expired, you can request a fresh one in seconds.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a strong password you don't use anywhere else."
      footer={
        <Link href="/dashboard" className="font-semibold text-forest-700 hover:underline">
          Back to dashboard
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
