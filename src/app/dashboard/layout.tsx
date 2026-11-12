import Link from "next/link";
import { LogOut } from "lucide-react";

import { SideNav } from "@/components/side-nav";
import { requireUser, isEmailVerified } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth-actions";
import { initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "home", exact: true },
  { href: "/dashboard/listings", label: "My listings", icon: "package" },
  { href: "/dashboard/listings/new", label: "New listing", icon: "plus" },
  { href: "/dashboard/subscription", label: "Subscription", icon: "banknote" },
  { href: "/dashboard/account", label: "Account", icon: "user" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser("/dashboard");
  const emailVerified = await isEmailVerified(profile.id);

  return (
    <div className="bg-sand-50">
      <div className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-white">
                  {initials(profile.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {profile.name}
                  </p>
                  <p className="truncate text-xs text-ink-500">{profile.email}</p>
                </div>
              </div>
              <div className="mt-5">
                <SideNav items={NAV_ITEMS} />
              </div>
              <form action={logoutAction} className="mt-3 hidden md:block">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-sand-100 hover:text-ink-800"
                >
                  <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                  Sign out
                </button>
              </form>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0 space-y-6">
            {/* Verification banners */}
            {!emailVerified && (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">Verify your email</span> —
                  subscriptions and publishing require a confirmed address.
                </p>
                <Link href="/verify-email" className="btn-primary btn-sm shrink-0">
                  Verify email
                </Link>
              </div>
            )}
            {!profile.phoneVerifiedAt && (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">Verify your phone</span> —
                  verified sellers get a trust badge on their listings.
                </p>
                <Link href="/verify-phone" className="btn-primary btn-sm shrink-0">
                  Verify phone
                </Link>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
