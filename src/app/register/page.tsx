import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/forms/auth-forms";
import { param } from "@/lib/utils";

export const metadata: Metadata = { title: "Create a seller account" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = param(sp.next) ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <AuthShell
      title="Become a seller"
      subtitle="Create your free account, verify your email and phone, then pick a subscription to start listing."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login${safeNext !== "/dashboard" ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
            className="font-semibold text-forest-700 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm next={safeNext} />
    </AuthShell>
  );
}
