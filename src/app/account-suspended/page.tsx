import type { Metadata } from "next";
import { ShieldOff } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { logoutAction } from "@/app/actions/auth-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account suspended" };

export default async function AccountSuspendedPage() {
  const { profile } = await getSession();
  const settings = await getSettings();

  return (
    <AuthShell
      title="Account suspended"
      subtitle={
        profile?.suspended
          ? "Your account has been suspended by our moderation team."
          : "This account is not currently active."
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="text-sm leading-relaxed text-red-800">
            <p className="font-semibold">
              {profile?.suspensionReason ?? "No reason was provided."}
            </p>
            <p className="mt-1 text-red-700">
              If you believe this is a mistake, contact support at{" "}
              <a
                href={`mailto:${settings.supportEmail}`}
                className="font-semibold underline underline-offset-2"
              >
                {settings.supportEmail}
              </a>{" "}
              and we&apos;ll review your case.
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-secondary btn-md w-full">
            Sign out
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
