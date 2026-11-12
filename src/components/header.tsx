import Link from "next/link";
import { Home, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";

import { MobileNav } from "@/components/mobile-nav";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth-actions";

export async function Header() {
  const { authUser, profile } = await getSession();
  const isAuthed = Boolean(authUser);
  const isAdmin = profile?.role === "ADMIN";

  const navLinks = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/plans", label: "Sell With Us" },
    { href: "/about", label: "About" },
    { href: "/safety", label: "Safety" },
    { href: "/contact", label: "Contact & Help" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/90 backdrop-blur">
      <div className="container-page relative flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-none"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white shadow-soft">
            <Home className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-tight text-ink-900">
              Sokoni <span className="text-forest-700">Nyumbani</span>
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-widest text-ink-400 sm:block">
              Pre-loved home items, Kenya
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-forest-50 hover:text-forest-800"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <>
              <Link
                href={isAdmin ? "/admin" : "/dashboard"}
                className="btn-primary btn-md hidden sm:inline-flex"
              >
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                {isAdmin ? "Admin" : "Dashboard"}
              </Link>
              <form action={logoutAction} className="hidden md:block">
                <button
                  type="submit"
                  className="btn-ghost btn-md"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost btn-md hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary btn-md">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Start selling
              </Link>
            </>
          )}
          <MobileNav isAuthed={isAuthed} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}
