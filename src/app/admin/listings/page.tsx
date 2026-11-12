import Link from "next/link";
import type { Metadata } from "next";
import { Layers, Sparkles, Star, Trash2 } from "lucide-react";
import type { ListingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  adminSetListingStatusAction,
  adminToggleFeaturedAction,
  adminDeleteListingAction,
} from "@/app/actions/admin-actions";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge, ConditionBadge } from "@/components/badges";
import { formatKes, formatDate } from "@/lib/format";
import { listingImageSrc } from "@/lib/storage";
import { param, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Moderate listings" };

const PAGE_SIZE = 15;

const FILTERS: { value: string; label: string }[] = [
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "ACTIVE", label: "Active" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REJECTED", label: "Rejected" },
  { value: "REMOVED", label: "Removed" },
];

const DONE_MESSAGES: Record<string, string> = {
  status: "Listing status updated.",
  featured: "Featured status toggled.",
  deleted: "Listing deleted.",
};

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = param(sp.status);
  const page = Math.max(1, Number(param(sp.page) ?? 1) || 1);
  const doneKey = param(sp.done);
  const errorKey = param(sp.error);

  const where = status ? { status: status as ListingStatus } : {};
  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: "asc" }, // oldest pending first — fair moderation
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        images: { orderBy: { orderIndex: "asc" }, take: 1 },
        seller: { select: { name: true, email: true, suspended: true } },
        category: true,
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const query = status ? `status=${status}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Listings</h1>
        <p className="section-subtitle">
          Approve, reject, feature or remove listings. Pending items are shown
          oldest-first for fair moderation.
        </p>
      </div>

      {doneKey && DONE_MESSAGES[doneKey] && (
        <p className="rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4 text-sm font-medium text-forest-900">
          {DONE_MESSAGES[doneKey]}
        </p>
      )}
      {errorKey && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          Something went wrong — the listing may have changed or been removed
          already.
        </p>
      )}

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/listings"
          className={cn(
            "badge border px-3 py-1.5 transition",
            !status
              ? "border-forest-700 bg-forest-700 text-white"
              : "border-sand-300 bg-white text-ink-700 hover:border-forest-400"
          )}
        >
          All
        </Link>
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/listings?status=${filter.value}`}
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
          icon={Layers}
          title="No listings here"
          description={
            status
              ? `No listings with status "${FILTERS.find((f) => f.value === status)?.label ?? status}".`
              : "No listings have been created yet."
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            {total} listing{total === 1 ? "" : "s"} · page {page} of {totalPages}
          </p>
          {listings.map((listing) => (
            <div key={listing.id} className="card p-5">
              <div className="flex flex-col gap-4 lg:flex-row">
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
                    {listing.featured && (
                      <span className="badge bg-gold-100 text-gold-800">
                        <Star className="h-3 w-3" aria-hidden="true" />
                        Featured
                      </span>
                    )}
                    {listing.seller.suspended && (
                      <span className="badge bg-red-100 text-red-800">
                        Seller suspended
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
                    {listing.county}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    by {listing.seller.name} ({listing.seller.email}) · listed{" "}
                    {formatDate(listing.createdAt)} · {listing.viewsCount} views
                  </p>
                  {listing.moderationNote && (
                    <p className="mt-1 text-xs text-ink-500">
                      Note: {listing.moderationNote}
                    </p>
                  )}
                </div>

                {/* Moderation actions */}
                <div className="flex shrink-0 flex-wrap content-start items-start gap-2 lg:w-44">
                  {listing.status === "PENDING_APPROVAL" && (
                    <form action={adminSetListingStatusAction}>
                      <input type="hidden" name="id" value={listing.id} />
                      <input type="hidden" name="status" value="ACTIVE" />
                      <button type="submit" className="btn-primary btn-sm">
                        Approve
                      </button>
                    </form>
                  )}
                  {["ACTIVE", "RESERVED", "EXPIRED", "REJECTED"].includes(
                    listing.status
                  ) && (
                    <details className="w-full">
                      <summary className="btn-secondary btn-sm flex w-full cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        Reject / remove…
                      </summary>
                      <form
                        action={adminSetListingStatusAction}
                        className="mt-2 space-y-2"
                      >
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="status" value="REJECTED" />
                        <input
                          type="text"
                          name="note"
                          placeholder="Reason shown to the seller"
                          maxLength={300}
                          className="input text-sm"
                          required
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="btn-danger btn-sm flex-1">
                            Reject
                          </button>
                        </div>
                      </form>
                      <form
                        action={adminSetListingStatusAction}
                        className="mt-2 space-y-2 border-t border-sand-100 pt-2"
                      >
                        <input type="hidden" name="id" value={listing.id} />
                        <input type="hidden" name="status" value="REMOVED" />
                        <input
                          type="text"
                          name="note"
                          placeholder="Reason for removal"
                          maxLength={300}
                          className="input text-sm"
                          required
                        />
                        <button type="submit" className="btn-danger btn-sm w-full">
                          Remove from site
                        </button>
                      </form>
                    </details>
                  )}
                  <form action={adminToggleFeaturedAction}>
                    <input type="hidden" name="id" value={listing.id} />
                    <button
                      type="submit"
                      className={cn(
                        "btn-sm",
                        listing.featured ? "btn-gold" : "btn-secondary"
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      {listing.featured ? "Unfeature" : "Feature"}
                    </button>
                  </form>
                  <form action={adminDeleteListingAction}>
                    <input type="hidden" name="id" value={listing.id} />
                    <button
                      type="submit"
                      className="btn-danger btn-sm"
                      title="Permanently delete this listing"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              {page > 1 ? (
                <Link
                  href={`/admin/listings?${query ? `${query}&` : ""}page=${page - 1}`}
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
                  href={`/admin/listings?${query ? `${query}&` : ""}page=${page + 1}`}
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
