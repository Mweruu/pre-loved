import type { Metadata } from "next";

import { AuthShell } from "@/components/auth-shell";
import { PhoneOtpForms } from "@/components/forms/auth-forms";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Verify your phone" };

export default async function VerifyPhonePage() {
  const { profile } = await requireUser("/verify-phone");

  return (
    <AuthShell
      title="Verify your phone"
      subtitle="Verified numbers earn a badge on your listings — buyers know they're reaching a real person."
    >
      <PhoneOtpForms phone={profile.phone} verified={Boolean(profile.phoneVerifiedAt)} />
    </AuthShell>
  );
}
