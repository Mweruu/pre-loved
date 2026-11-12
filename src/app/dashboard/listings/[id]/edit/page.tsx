import Link from "next/link";
import type { Metadata } from "next";
import { Ban } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ListingForm } from "@/components/forms/listing-form";
import { listingImageSrc } from "@/lib/storage";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireUser(`/dashboard/listings/${id}/edit`);

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { orderIndex: "asc" } },
      category: { include: { subcategories: { orderBy: { name: "asc" } } } },
      subcategory: true,
    },
  });

  if (!listing || listing.sellerId !== profile.id) notFound();

  if (listing.status === "SOLD") {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
          <Ban className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-xl font-semibold text-ink-900">
          Sold listings can&apos;t be edited
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-600">
          &ldquo;{listing.title}&rdquo; has been marked as sold, so its details
          are locked — buyers still see the final record. If something needs
          fixing, contact support and we&apos;ll help.
        </p>
        <Link href="/dashboard/listings" className="btn-primary btn-md mt-6">
          Back to my listings
        </Link>
      </div>
    );
  }

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { orderIndex: "asc" },
    include: { subcategories: { orderBy: { name: "asc" } } },
  });

  const categoryOptions = categories.map((category) => ({
    id: category.id,
    name: category.name,
    subcategories: category.subcategories.map((sub) => ({
      id: sub.id,
      name: sub.name,
    })),
  }));

  // The listing's category may have been deactivated; keep it selectable.
  const categoryIncluded = categoryOptions.some((c) => c.id === listing.categoryId);
  if (!categoryIncluded) {
    categoryOptions.push({
      id: listing.category.id,
      name: `${listing.category.name} (inactive)`,
      subcategories: listing.category.subcategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
      })),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Edit listing</h1>
          <p className="section-subtitle">
            Updates are re-checked by our moderators if the listing is live.
          </p>
        </div>
        <StatusBadge status={listing.status} />
      </div>

      <ListingForm
        categories={categoryOptions}
        listingId={listing.id}
        defaults={{
          title: listing.title,
          description: listing.description,
          price: listing.price,
          negotiable: listing.negotiable,
          condition: listing.condition,
          reasonForSelling: listing.reasonForSelling,
          brand: listing.brand ?? "",
          model: listing.model ?? "",
          ageDescription: listing.ageDescription ?? "",
          originalPrice: listing.originalPrice,
          dimensions: listing.dimensions ?? "",
          county: listing.county,
          town: listing.town,
          deliveryAvailable: listing.deliveryAvailable,
          deliveryNote: listing.deliveryNote ?? "",
          buyerCollects: listing.buyerCollects,
          preferredContact: listing.preferredContact,
          categoryId: listing.categoryId,
          subcategoryId: listing.subcategoryId,
        }}
        existingImages={listing.images.map((img) => ({
          id: img.id,
          src: listingImageSrc(img.storagePath),
        }))}
      />
    </div>
  );
}
