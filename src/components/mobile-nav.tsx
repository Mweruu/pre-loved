"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";

import { logoutAction } from "@/app/actions/auth-actions";

export function MobileNav({
  isAuthed,
  isAdmin,
}: {
  isAuthed: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  const links: { href: string; label: string }[] = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/plans", label: "Sell With Us" },
    { href: "/about", label: "About" },
    { href: "/safety", label: "Safety" },
    { href: "/contact", label: "Contact & Help" },
  ];

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 text-ink-700 hover:bg-sand-100"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full border-b border-sand-200 bg-sand-50 shadow-lift">
          <nav className="container-page flex flex-col gap-1 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-800 hover:bg-forest-50 hover:text-forest-800"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-sand-200 pt-4">
              {isAuthed ? (
                <>
                  <Link
                    href={isAdmin ? "/admin" : "/dashboard"}
                    onClick={() => setOpen(false)}
                    className="btn-primary btn-md"
                  >
                    {isAdmin ? "Admin Dashboard" : "Seller Dashboard"}
                  </Link>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="btn-secondary btn-md w-full"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-secondary btn-md"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn-primary btn-md"
                  >
                    Start selling
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
