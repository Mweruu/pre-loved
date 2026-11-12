import Link from "next/link";
import type { Metadata } from "next";
import { Search, ShieldOff, ShieldCheck, Users as UsersIcon } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminSetUserSuspensionAction } from "@/app/actions/admin-actions";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";
import { param, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Manage users" };

const PAGE_SIZE = 20;

const DONE_MESSAGES: Record<string, { text: string; tone: "good" | "bad" }> = {
  suspended: { text: "User suspended. Their session ends on next page load.", tone: "bad" },
  reactivated: { text: "User reactivated.", tone: "good" },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (param(sp.q) ?? "").trim();
  const page = Math.max(1, Number(param(sp.page) ?? 1) || 1);
  const doneKey = param(sp.done);
  const banner = doneKey ? DONE_MESSAGES[doneKey] : undefined;

  const where: Prisma.ProfileWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        _count: { select: { listings: true } },
        subscriptions: {
          where: { status: "ACTIVE", endsAt: { gt: new Date() } },
          take: 1,
          include: { plan: { select: { name: true } } },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Users</h1>
        <p className="section-subtitle">
          {total} registered account{total === 1 ? "" : "s"}. Suspend accounts
          that break the safety rules — their listings stay online but they
          can&apos;t sign in.
        </p>
      </div>

      {banner && (
        <p
          className={cn(
            "rounded-2xl border px-5 py-4 text-sm font-medium",
            banner.tone === "good"
              ? "border-forest-200 bg-forest-50 text-forest-900"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {banner.text}
        </p>
      )}

      {/* Search */}
      <form method="get" action="/admin/users" className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="input pl-10"
          />
        </div>
        <button type="submit" className="btn-primary btn-md shrink-0">
          Search
        </button>
      </form>

      {users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description={q ? `Nothing matches "${q}".` : "No registered users yet."}
        />
      ) : (
        <div className="space-y-4">
          {users.map((user) => {
            const subscription = user.subscriptions[0];
            return (
              <div key={user.id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink-900">{user.name}</p>
                      {user.role === "ADMIN" && (
                        <span className="badge bg-forest-900 text-white">Admin</span>
                      )}
                      {user.suspended && (
                        <span className="badge bg-red-100 text-red-800">Suspended</span>
                      )}
                      {user.phoneVerifiedAt && (
                        <span className="badge bg-forest-100 text-forest-800">
                          Phone verified
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-ink-500">{user.email}</p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      Joined {formatDate(user.createdAt)} · {user._count.listings}{" "}
                      listing{user._count.listings === 1 ? "" : "s"} ·{" "}
                      {subscription
                        ? `${subscription.plan.name} until ${formatDate(subscription.endsAt)}`
                        : "no active subscription"}
                    </p>
                    {user.suspended && user.suspensionReason && (
                      <p className="mt-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">
                        Reason: {user.suspensionReason}
                      </p>
                    )}
                  </div>

                  {/* Suspend / reactivate */}
                  {user.role !== "ADMIN" && (
                    <div className="shrink-0">
                      {user.suspended ? (
                        <form action={adminSetUserSuspensionAction} className="flex gap-2">
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="suspend" value="false" />
                          <button type="submit" className="btn-primary btn-sm">
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                            Reactivate
                          </button>
                        </form>
                      ) : (
                        <details className="group">
                          <summary className="btn-danger btn-sm flex cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
                            Suspend…
                          </summary>
                          <form
                            action={adminSetUserSuspensionAction}
                            className="mt-2 flex flex-col gap-2 sm:flex-row"
                          >
                            <input type="hidden" name="id" value={user.id} />
                            <input type="hidden" name="suspend" value="true" />
                            <input
                              type="text"
                              name="reason"
                              placeholder="Reason shown to the user"
                              maxLength={300}
                              className="input min-w-[14rem] text-sm"
                              required
                            />
                            <button type="submit" className="btn-danger btn-sm shrink-0">
                              Confirm suspension
                            </button>
                          </form>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              {page > 1 ? (
                <Link
                  href={`/admin/users?q=${encodeURIComponent(q)}&page=${page - 1}`}
                  className="btn-secondary btn-sm"
                >
                  Previous
                </Link>
              ) : (
                <span className="btn-secondary btn-sm cursor-not-allowed opacity-50">
                  Previous
                </span>
              )}
              <span className="text-ink-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/admin/users?q=${encodeURIComponent(q)}&page=${page + 1}`}
                  className="btn-secondary btn-sm"
                >
                  Next
                </Link>
              ) : (
                <span className="btn-secondary btn-sm cursor-not-allowed opacity-50">
                  Next
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
