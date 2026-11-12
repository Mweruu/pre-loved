import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@prisma/client";

import { prisma } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getSession(): Promise<{
  authUser: User | null;
  profile: Profile | null;
}> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const authUser = data.user ?? null;
  if (!authUser) return { authUser: null, profile: null };

  const profile = await prisma.profile.findUnique({
    where: { id: authUser.id },
  });
  return { authUser, profile };
}

/**
 * Requires a signed-in, non-suspended account.
 * Admins are redirected to their own dashboard.
 */
export async function requireUser(nextPath?: string): Promise<{
  authUser: User;
  profile: Profile;
}> {
  const { authUser, profile } = await getSession();
  if (!authUser) {
    redirect(
      `/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
    );
  }
  if (!profile) redirect("/login?error=profile-missing");
  if (profile.suspended) redirect("/account-suspended");

  if (profile.role === "ADMIN") redirect("/admin");
  return { authUser, profile };
}

export async function requireAdmin(): Promise<{
  authUser: User;
  profile: Profile;
}> {
  const { authUser, profile } = await getSession();
  if (!authUser) redirect("/login?next=/admin");
  if (!profile) redirect("/login?error=profile-missing");
  if (profile.suspended) redirect("/account-suspended");
  if (profile.role !== "ADMIN") redirect("/dashboard?error=admin-only");
  return { authUser, profile };
}

/** True when the signed-in user has confirmed their email address. */
export async function isEmailVerified(userId?: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return false;
  if (userId && user.id !== userId) return false;
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}
