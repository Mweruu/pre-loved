import Link from "next/link";
import type { Metadata } from "next";
import { Package, Pencil, PlusCircle } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { StatusBadge, ConditionBadge } from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { setListingStatusAction } from "@/app/actions/listing-actions";
import { formatKes, formatDate, daysUntil } from "@/lib/format";
import { listingImageSrc } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My listings" };

const BANNERS: Record<string, { text: string; tone: "good" | "bad" }> = {
  created: { text: "Listing submitted! It will go live once approved by our moderators.", tone: "good" },
  updated: { text: "Listing updated.", tone: "good" },
  deleted: { text: "Listing deleted.", tone: "good" },
  "not-found": { text: "That listing could not be found.", tone: "bad" },
  "limit-reached": {
    text: "Your plan's listing limit is reached — mark items as sold or upgrade your plan to add more.",
    tone: "bad",
  },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REJECTED", label: "Rejected" },
];

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireUser("/dashboard/listings");
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "all";
  const bannerKey = Object.keys(sp).find((k) => BANNERS[k]);

  const listings = await prisma.listing.findMany({
    where: { sellerId: profile.id, ...(status === "all" ? {} : { status: status as never }) },
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { orderIndex: "asc" }, take: 1 }, category: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">My listings</h1>
          <p className="section-subtitle">
            Manage, update and hand over your items.
          </p>
        </div>
        <Link href="/dashboard/listings/new" className="btn-primary btn-md shrink-0">
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          New listing
        </Link>
      </div>

      {bannerKey && (
        <p
          className={cn(
            "rounded-2xl border px-5 py-4 text-sm font-medium",
            BANNERS[bannerKey].tone === "good"
              ? "border-forest-200 bg-forest-50 text-forest-900"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {BANNERS[bannerKey].text}
        </p>
      )}

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/dashboard/listings${filter.value === "all" ? "" : `?status=${filter.value}`}`}
            className={cn(
              "badge border px-3 py-1.5 transition",
              status === filter.value
                ? "border-forest-700 bg-forest-700 text-white"
                : "border-sand-300 bg-white text-ink-700 hover:border-forest-400"
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nothing here yet"
          description="When you create listings they'll appear here with tools to reserve, mark sold, edit or delete them."
          actionLabel="Create your first listing"
          actionHref="/dashboard/listings/new"
        />
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const daysLeft = listing.expiresAt ? daysUntil(listing.expiresAt) : null;
            const editable = listing.status !== "SOLD";
            return (
              <div key={listing.id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      listing.images[0]
                        ? listingImageSrc(listing.images[0].storagePath)
                        : "/api/placeholder?e=%F0%9F%8F%A0&t=No%20photo"
                    }
                    alt=""
                    className="h-24 w-32 shrink-0 rounded-xl border border-sand-200 object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={listing.status} />
                      <ConditionBadge condition={listing.condition} />
                      {listing.moderationNote && listing.status === "REJECTED" && (
                        <span className="badge bg-red-50 text-red-700">
                          Reason: {listing.moderationNote}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/product/${listing.id}`}
                      className="mt-1.5 block truncate font-medium text-ink-900 hover:text-forest-700"
                    >
                      {listing.title}
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {formatKes(listing.price)} · {listing.category.name} ·{" "}
                      {listing.viewsCount} views
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      Listed {formatDate(listing.createdAt)}
                      {daysLeft !== null && listing.status === "ACTIVE" && daysLeft > 0
                        ? ` · expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-start gap-2">
                    {editable && (
                      <Link
                        href={`/dashboard/listings/${listing.id}/edit`}
                        className="btn-secondary btn-sm"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Edit
                      </Link>
                    )}
                    {listing.status === "ACTIVE" && (
                      <form action={setListingStatusAction}>
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="target" value="reserve" />
                        <button type="submit" className="btn-secondary btn-sm">
                          Mark reserved
                        </button>
                      </form>
                    )}
                    {(listing.status === "ACTIVE" || listing.status === "RESERVED") && (
                      <form action={setListingStatusAction}>
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="target" value="sell" />
                        <button type="submit" className="btn-primary btn-sm">
                          Mark as sold
                        </button>
                      </form>
                    )}
                    {listing.status === "RESERVED" && (
                      <form action={setListingStatusAction}>
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="target" value="relist" />
                        <button type="submit" className="btn-secondary btn-sm">
                          Back to available
                        </button>
                      </form>
                    )}
                    {listing.status === "EXPIRED" && (
                      <form action={setListingStatusAction}>
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="target" value="relist" />
                        <button type="submit" className="btn-primary btn-sm">
                          Relist
                        </button>
                      </form>
                    )}
                    <form action={setListingStatusAction}>
                      <input type="hidden" name="id" value={listing.id} />
                      <input type="hidden" name="target" value="delete" />
                      <button type="submit" className="btn-danger btn-sm">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
