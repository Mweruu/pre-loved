import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export type ListingFull = Prisma.ListingGetPayload<{
  include: {
    images: true;
    category: true;
    subcategory: true;
    seller: true;
  };
}>;

export type CategoryWithSubcategories = Prisma.CategoryGetPayload<{
  include: { subcategories: true };
}>;

export type PlanWithCounts = Prisma.SubscriptionPlanGetPayload<{
  include: { _count: { select: { subscriptions: true } } };
}>;

/** Statuses considered "live" on the public marketplace. */
export const MARKETPLACE_STATUSES = ["ACTIVE", "RESERVED", "SOLD"] as const;

/** Statuses that count against a subscription's active-listing limit. */
export const LIMIT_STATUSES = ["ACTIVE", "RESERVED", "PENDING_APPROVAL"] as const;

/**
 * Lazily expires subscriptions and listings whose dates have passed.
 * Runs on key page loads; cheap thanks to indexed updateMany queries.
 */
export async function sweepExpiries(): Promise<void> {
  const now = new Date();
  await prisma.subscription.updateMany({
    where: { status: "ACTIVE", endsAt: { lt: now } },
    data: { status: "EXPIRED" },
  });
  await prisma.listing.updateMany({
    where: { status: "ACTIVE", expiresAt: { lt: now } },
    data: { status: "EXPIRED" },
  });
}

export interface PublishCheck {
  allowed: boolean;
  reason: "no-subscription" | "limit-reached" | "email-unverified" | null;
  activeCount: number;
  maxListings: number;
  subscription: Prisma.SubscriptionGetPayload<{ include: { plan: true } }> | null;
}

/**
 * Gatekeeper for publishing listings: requires an email-verified account
 * (checked separately by callers), an active subscription, and remaining
 * capacity within the plan's listing limit.
 */
export async function canSellerPublish(userId: string): Promise<PublishCheck> {
  await sweepExpiries();

  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE", endsAt: { gt: new Date() } },
    orderBy: { endsAt: "desc" },
    include: { plan: true },
  });

  if (!subscription) {
    return {
      allowed: false,
      reason: "no-subscription",
      activeCount: 0,
      maxListings: 0,
      subscription: null,
    };
  }

  const activeCount = await prisma.listing.count({
    where: { sellerId: userId, status: { in: [...LIMIT_STATUSES] } },
  });

  return {
    allowed: activeCount < subscription.maxActiveListings,
    reason: activeCount < subscription.maxActiveListings ? null : "limit-reached",
    activeCount,
    maxListings: subscription.maxActiveListings,
    subscription,
  };
}

/**
 * Extra where-clauses for public marketplace queries, honouring the admin
 * setting for what happens to listings when a seller's subscription expires.
 */
export async function marketplaceSellerFilter(): Promise<Prisma.ListingWhereInput> {
  const settings = await getSettings();
  if (settings.onSubscriptionExpiry === "hide") {
    return {
      seller: {
        subscriptions: { some: { status: "ACTIVE", endsAt: { gt: new Date() } } },
      },
    };
  }
  return {};
}

/** Simple duplicate-listing detection (same seller, same title, still listed). */
export async function findDuplicateListing(
  userId: string,
  title: string
): Promise<boolean> {
  const normalized = title.trim().toLowerCase();
  const listings = await prisma.listing.findMany({
    where: { sellerId: userId, status: { in: [...LIMIT_STATUSES] } },
    select: { title: true },
  });
  return listings.some((l) => l.title.trim().toLowerCase() === normalized);
}
