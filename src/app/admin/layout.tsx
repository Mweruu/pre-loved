import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";

import { SideNav } from "@/components/side-nav";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth-actions";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "shield", exact: true },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/listings", label: "Listings", icon: "layers" },
  { href: "/admin/categories", label: "Categories", icon: "tags" },
  { href: "/admin/plans", label: "Plans", icon: "banknote" },
  { href: "/admin/payments", label: "Payments", icon: "banknote" },
  { href: "/admin/reports", label: "Reports & help", icon: "flag" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();

  return (
    <div className="bg-sand-50">
      <div className="container-page py-8">
        <div className="grid gap-8 lg:grid-cols-[240px,1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-900 text-white">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {profile.name}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-wide text-forest-700">
                    Administrator
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <SideNav items={NAV_ITEMS} />
              </div>
              <div className="mt-3 space-y-1 md:block">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-sand-100 hover:text-ink-800"
                >
                  <span className="h-[18px] w-[18px] text-center" aria-hidden="true">
                    ↩
                  </span>
                  View site
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-ink-500 transition hover:bg-sand-100 hover:text-ink-800"
                  >
                    <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="min-w-0 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
