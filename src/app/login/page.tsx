import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/forms/auth-forms";
import { param } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  "invalid-link":
    "That sign-in link has expired or is invalid. Please sign in with your password.",
  "profile-missing":
    "Your account profile is incomplete. Please contact support.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = param(sp.next) ?? "/dashboard";
  const errorKey = param(sp.error);
  const banner =
    errorKey && ERRORS[errorKey]
      ? ERRORS[errorKey]
      : param(sp.verified) === "1"
        ? "Email verified — welcome! Sign in to continue."
        : null;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your listings and subscription."
      footer={
        <>
          New to Sokoni Nyumbani?{" "}
          <Link
            href={`/register${safeNext !== "/dashboard" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
            className="font-semibold text-forest-700 hover:underline"
          >
            Create a seller account
          </Link>
        </>
      }
    >
      {banner && (
        <p className="mb-4 rounded-xl border border-gold-300 bg-gold-50 px-4 py-3 text-sm font-medium text-gold-900">
          {banner}
        </p>
      )}
      <LoginForm next={safeNext} />
    </AuthShell>
  );
}
