import Link from "next/link";
import type { Metadata } from "next";
import {
  BadgeCheck,
  CircleCheck,
  Eye,
  Package,
  PlusCircle,
  Sparkles,
  Timer,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { requireUser, isEmailVerified } from "@/lib/auth";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/badges";
import { canSellerPublish } from "@/lib/listing-utils";
import { formatKes, formatDate, daysUntil } from "@/lib/format";
import { listingImageSrc } from "@/lib/storage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Seller dashboard" };

const BANNERS: Record<string, string> = {
  welcome: "Welcome to Sokoni Nyumbani! Verify your email to continue setup.",
  subscribed: "Subscription active — you can publish listings now!",
  password: "Password updated successfully.",
};

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireUser("/dashboard");
  const sp = await searchParams;
  const bannerKey = Object.keys(sp).find((k) => BANNERS[k]);
  const emailVerified = await isEmailVerified(profile.id);

  const [publishCheck, listingStats, recentListings] = await Promise.all([
    canSellerPublish(profile.id),
    prisma.listing.groupBy({
      by: ["status"],
      where: { sellerId: profile.id },
      _count: { _all: true },
    }),
    prisma.listing.findMany({
      where: { sellerId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { images: { orderBy: { orderIndex: "asc" }, take: 1 } },
    }),
  ]);

  const countFor = (status: string) =>
    listingStats.find((s) => s.status === status)?._count._all ?? 0;

  const views = await prisma.listing.aggregate({
    where: { sellerId: profile.id },
    _sum: { viewsCount: true },
  });

  const subscription = publishCheck.subscription;
  const daysLeft = subscription ? daysUntil(subscription.endsAt) : 0;
  const usedPercent = subscription
    ? Math.min(100, Math.round((publishCheck.activeCount / subscription.maxActiveListings) * 100))
    : 0;

  return (
    <div>
      {bannerKey && (
        <div className="flex items-center gap-3 rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4">
          <CircleCheck className="h-5 w-5 shrink-0 text-forest-700" aria-hidden="true" />
          <p className="text-sm font-medium text-forest-900">{BANNERS[bannerKey]}</p>
        </div>
      )}

      {/* Subscription status */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Seller subscription
            </p>
            {subscription ? (
              <>
                <p className="mt-1 flex flex-wrap items-center gap-2 font-display text-xl font-semibold text-ink-900">
                  {subscription.plan.name}
                  <span className="badge bg-forest-100 text-forest-800">
                    active
                  </span>
                  {subscription.plan.badge && (
                    <span className="badge bg-gold-100 text-gold-800">
                      {subscription.plan.badge}
                    </span>
                  )}
                </p>
                <p className="mt-1.5 text-sm text-ink-500">
                  {daysLeft > 0
                    ? `Renews/expires on ${formatDate(subscription.endsAt)} · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
                    : `Expired on ${formatDate(subscription.endsAt)} — renew to keep listing`}
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 font-display text-xl font-semibold text-ink-900">
                  No active subscription
                </p>
                <p className="mt-1.5 text-sm text-ink-500">
                  Pick a plan to start publishing listings.
                </p>
              </>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link href="/dashboard/subscription" className="btn-secondary btn-md">
              {subscription ? "Manage subscription" : "Choose a plan"}
            </Link>
            <Link href="/dashboard/listings/new" className="btn-primary btn-md">
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              New listing
            </Link>
          </div>
        </div>

        {/* Listing capacity */}
        <div className="mt-5 border-t border-sand-100 pt-5">
          <div className="flex items-baseline justify-between text-sm">
            <p className="font-medium text-ink-700">
              Active listings used
              {!emailVerified && (
                <span className="ml-2 text-xs font-normal text-amber-700">
                  (email verification still required to publish)
                </span>
              )}
            </p>
            <p className="text-ink-500">
              <span className="font-semibold text-ink-900">
                {publishCheck.activeCount}
              </span>{" "}
              / {subscription ? subscription.maxActiveListings : 0}
            </p>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-sand-200">
            <div
              className={`h-full rounded-full ${usedPercent >= 100 ? "bg-red-500" : "bg-forest-600"}`}
              style={{ width: `${Math.max(usedPercent, subscription ? 4 : 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active listings"
          value={countFor("ACTIVE")}
          icon={Package}
          hint={`${countFor("RESERVED")} reserved`}
        />
        <StatCard
          label="Pending review"
          value={countFor("PENDING_APPROVAL")}
          icon={Timer}
          hint="Awaiting moderation"
        />
        <StatCard
          label="Sold"
          value={countFor("SOLD")}
          icon={BadgeCheck}
          hint="Items you've sold"
        />
        <StatCard
          label="Total views"
          value={views._sum.viewsCount ?? 0}
          icon={Eye}
          hint="Across all your listings"
        />
      </div>

      {/* Setup checklist */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <Sparkles className="h-5 w-5 text-gold-500" aria-hidden="true" />
          Your selling checklist
        </h2>
        <ul className="mt-4 space-y-3">
          {[
            {
              done: emailVerified,
              label: "Email address verified",
              href: "/verify-email",
              action: "Verify email",
            },
            {
              done: Boolean(profile.phoneVerifiedAt),
              label: "Phone number verified — trust badge on listings",
              href: "/verify-phone",
              action: "Verify phone",
            },
            {
              done: Boolean(subscription),
              label: "Active seller subscription",
              href: "/dashboard/subscription",
              action: "Choose a plan",
            },
            {
              done: countFor("ACTIVE") > 0,
              label: "First listing live in the marketplace",
              href: "/dashboard/listings/new",
              action: "Create a listing",
            },
          ].map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-xl border border-sand-100 bg-sand-50 px-4 py-3"
            >
              <span className="flex items-center gap-3 text-sm text-ink-700">
                {item.done ? (
                  <CircleCheck className="h-5 w-5 shrink-0 text-forest-600" aria-hidden="true" />
                ) : (
                  <span className="h-5 w-5 shrink-0 rounded-full border-2 border-sand-300" aria-hidden="true" />
                )}
                <span className={item.done ? "line-through decoration-forest-400" : ""}>
                  {item.label}
                </span>
              </span>
              {!item.done && (
                <Link href={item.href} className="btn-secondary btn-sm shrink-0">
                  {item.action}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Recent listings */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Your latest listings
          </h2>
          <Link
            href="/dashboard/listings"
            className="text-sm font-semibold text-forest-700 hover:text-forest-800"
          >
            Manage all →
          </Link>
        </div>
        {recentListings.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-8 text-center text-sm text-ink-500">
            No listings yet.{" "}
            <Link href="/dashboard/listings/new" className="font-semibold text-forest-700 hover:underline">
              Create your first one
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-sand-100">
            {recentListings.map((listing) => (
              <li key={listing.id} className="flex items-center gap-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    listing.images[0]
                      ? listingImageSrc(listing.images[0].storagePath)
                      : "/api/placeholder?e=%F0%9F%8F%A0&t=No%20photo"
                  }
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-xl border border-sand-200 object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${listing.id}`}
                    className="block truncate text-sm font-medium text-ink-900 hover:text-forest-700"
                  >
                    {listing.title}
                  </Link>
                  <p className="text-xs text-ink-500">
                    {formatKes(listing.price)} · {listing.viewsCount} views
                  </p>
                </div>
                <StatusBadge status={listing.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
