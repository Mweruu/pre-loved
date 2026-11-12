import Link from "next/link";
import type { Metadata } from "next";
import {
  Banknote,
  CircleCheck,
  Flag,
  Layers,
  Package,
  ShieldAlert,
  Timer,
  TrendingUp,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { StatCard } from "@/components/stat-card";
import {
  PaymentMethodBadge,
  PaymentStatusBadge,
  StatusBadge,
} from "@/components/badges";
import { formatKes, formatDate, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();

  const now = new Date();

  const [
    totalUsers,
    totalSellers,
    listingStatusGroups,
    openReports,
    pendingPayments,
    confirmedPayments,
    recentListings,
    recentReports,
    recentPayments,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({
      where: { subscriptions: { some: { status: "ACTIVE", endsAt: { gt: now } } } },
    }),
    prisma.listing.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.report.count({ where: { status: { in: ["OPEN", "REVIEWING"] } } }),
    prisma.payment.count({ where: { status: { in: ["PENDING", "VERIFYING"] } } }),
    prisma.payment.findMany({
      where: { status: "CONFIRMED" },
      select: { amount: true, simulated: true },
    }),
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { seller: { select: { name: true } }, category: true },
    }),
    prisma.report.findMany({
      where: { status: { in: ["OPEN", "REVIEWING"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { listing: { select: { title: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        user: { select: { name: true } },
        plan: { select: { name: true } },
      },
    }),
    prisma.subscription.count({ where: { status: "ACTIVE", endsAt: { gt: now } } }),
  ]);

  const statusCount = (status: string) =>
    listingStatusGroups.find((g) => g.status === status)?._count._all ?? 0;
  const totalListings = listingStatusGroups.reduce((sum, g) => sum + g._count._all, 0);
  const pendingApprovals = statusCount("PENDING_APPROVAL");
  const revenue = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);
  const simulatedRevenue = confirmedPayments
    .filter((p) => p.simulated)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">Admin overview</h1>
          <p className="section-subtitle">
            Platform health at a glance — moderation queue first.
          </p>
        </div>
        <Link href="/admin/listings?status=PENDING_APPROVAL" className="btn-primary btn-md">
          <Timer className="h-4 w-4" aria-hidden="true" />
          Review pending listings ({pendingApprovals})
        </Link>
      </div>

      {/* Attention needed */}
      {(pendingApprovals > 0 || openReports > 0 || pendingPayments > 0) && (
        <div className="rounded-2xl border border-gold-300 bg-gold-50 p-5">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gold-900">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            Needs attention
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {pendingApprovals > 0 && (
              <Link
                href="/admin/listings?status=PENDING_APPROVAL"
                className="rounded-xl border border-gold-200 bg-white px-4 py-3 text-sm transition hover:border-gold-400"
              >
                <span className="font-semibold text-ink-900">
                  {pendingApprovals} listing{pendingApprovals === 1 ? "" : "s"}
                </span>{" "}
                awaiting approval
              </Link>
            )}
            {openReports > 0 && (
              <Link
                href="/admin/reports"
                className="rounded-xl border border-gold-200 bg-white px-4 py-3 text-sm transition hover:border-gold-400"
              >
                <span className="font-semibold text-ink-900">
                  {openReports} open report{openReports === 1 ? "" : "s"}
                </span>{" "}
                to review
              </Link>
            )}
            {pendingPayments > 0 && (
              <Link
                href="/admin/payments"
                className="rounded-xl border border-gold-200 bg-white px-4 py-3 text-sm transition hover:border-gold-400"
              >
                <span className="font-semibold text-ink-900">
                  {pendingPayments} payment{pendingPayments === 1 ? "" : "s"}
                </span>{" "}
                being verified
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={totalUsers}
          icon={Users}
          hint={`${activeSubscriptions} with active subscriptions`}
        />
        <StatCard
          label="Listings"
          value={totalListings}
          icon={Layers}
          hint={`${statusCount("ACTIVE")} active · ${statusCount("SOLD")} sold`}
        />
        <StatCard
          label="Active sellers"
          value={totalSellers}
          icon={TrendingUp}
          hint="Subscribed right now"
        />
        <StatCard
          label="Revenue (confirmed)"
          value={formatKes(revenue)}
          icon={Banknote}
          hint={
            simulatedRevenue > 0
              ? `${formatKes(simulatedRevenue)} of it simulated`
              : "All verified payments"
          }
        />
      </div>

      {/* Listing status breakdown */}
      <div className="card p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Listings by status
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {(
            [
              ["PENDING_APPROVAL", "/admin/listings?status=PENDING_APPROVAL"],
              ["ACTIVE", "/admin/listings?status=ACTIVE"],
              ["RESERVED", "/admin/listings?status=RESERVED"],
              ["SOLD", "/admin/listings?status=SOLD"],
              ["EXPIRED", "/admin/listings?status=EXPIRED"],
              ["REJECTED", "/admin/listings?status=REJECTED"],
              ["REMOVED", "/admin/listings?status=REMOVED"],
            ] as const
          ).map(([status, href]) => (
            <Link
              key={status}
              href={href}
              className="rounded-xl border border-sand-200 bg-sand-50 px-4 py-3 text-center transition hover:border-forest-300"
            >
              <p className="font-display text-2xl font-semibold text-ink-900">
                {statusCount(status)}
              </p>
              <StatusBadge status={status} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <Package className="h-5 w-5 text-forest-600" aria-hidden="true" />
            Latest listings
          </h2>
          <ul className="mt-4 divide-y divide-sand-100">
            {recentListings.length === 0 && (
              <li className="py-4 text-sm text-ink-500">No listings yet.</li>
            )}
            {recentListings.map((listing) => (
              <li key={listing.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/product/${listing.id}`}
                    className="block truncate text-sm font-medium text-ink-900 hover:text-forest-700"
                  >
                    {listing.title}
                  </Link>
                  <p className="truncate text-xs text-ink-500">
                    {listing.seller.name} · {timeAgo(listing.createdAt)}
                  </p>
                </div>
                <StatusBadge status={listing.status} />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Flag className="h-5 w-5 text-forest-600" aria-hidden="true" />
              Open reports
            </h2>
            <ul className="mt-4 divide-y divide-sand-100">
              {recentReports.length === 0 && (
                <li className="py-4 text-sm text-ink-500">
                  No open reports — the community is behaving.
                </li>
              )}
              {recentReports.map((report) => (
                <li key={report.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {report.listing?.title ?? "Seller report"}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {report.reason} · {timeAgo(report.createdAt)}
                    </p>
                  </div>
                  <Link href="/admin/reports" className="btn-secondary btn-sm shrink-0">
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
              <Banknote className="h-5 w-5 text-forest-600" aria-hidden="true" />
              Recent payments
            </h2>
            <ul className="mt-4 divide-y divide-sand-100">
              {recentPayments.length === 0 && (
                <li className="py-4 text-sm text-ink-500">No payments yet.</li>
              )}
              {recentPayments.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {payment.user.name} — {payment.plan.name}
                    </p>
                    <p className="text-xs text-ink-500">
                      {formatKes(payment.amount)} · {formatDate(payment.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <PaymentMethodBadge method={payment.method} />
                    <PaymentStatusBadge status={payment.status} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="flex items-center gap-2 text-xs text-ink-400">
        <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Subscriptions only activate from verified payments (M-Pesa callback,
        status query or manual confirmation) — never from unverified ones.
      </p>
    </div>
  );
}
