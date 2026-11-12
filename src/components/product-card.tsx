import Link from "next/link";
import { MapPin } from "lucide-react";

import { ConditionBadge, StatusBadge } from "@/components/badges";
import type { ListingFull } from "@/lib/listing-utils";
import { listingImageSrc } from "@/lib/storage";
import { formatKes, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ProductCard({
  listing,
  className,
}: {
  listing: ListingFull;
  className?: string;
}) {
  const image = listing.images[0]; // queries sort by orderIndex
  const src = image
    ? listingImageSrc(image.storagePath)
    : "/api/placeholder?e=%F0%9F%8F%A0&t=No%20photo";
  const sold = listing.status === "SOLD";
  const reserved = listing.status === "RESERVED";

  return (
    <div className={cn("card card-hover group overflow-hidden", className)}>
      <Link
        href={`/product/${listing.id}`}
        className="block focus-visible:outline-none"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {(sold || reserved) && (
            <span
              className={cn(
                "absolute left-3 top-3 badge",
                sold
                  ? "bg-ink-900/85 text-white"
                  : "bg-blue-600/90 text-white"
              )}
            >
              {sold ? "Sold" : "Reserved"}
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium text-ink-900 group-hover:text-forest-700">
              {listing.title}
            </p>
          </div>
          <p className="mt-1 text-lg font-semibold text-forest-700">
            {formatKes(listing.price)}
            {listing.negotiable && (
              <span className="ml-2 text-xs font-medium text-gold-700">
                negotiable
              </span>
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ConditionBadge condition={listing.condition} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {listing.town}, {listing.county}
              </span>
            </span>
            <span className="shrink-0">{timeAgo(listing.createdAt)}</span>
          </div>
          {listing.status !== "ACTIVE" && (
            <div className="mt-2">
              <StatusBadge status={listing.status} />
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
