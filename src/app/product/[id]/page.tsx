import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Calendar,
  History,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBasket,
  Tag,
  Truck,
  User,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { ImageGallery } from "@/components/image-gallery";
import { ContactSeller } from "@/components/contact-seller";
import { ReportDialog } from "@/components/report-dialog";
import { ShareButton } from "@/components/share-button";
import { SafetyNotice } from "@/components/safety-notice";
import { ProductCard } from "@/components/product-card";
import { ConditionBadge, NegotiableBadge, StatusBadge, VerifiedBadge } from "@/components/badges";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { listingImageSrc } from "@/lib/storage";
import { formatKes, formatDate, timeAgo } from "@/lib/format";
import { conditionLabel, preferredContactLabel } from "@/lib/constants";

export const dynamic = "force-dynamic";

const PUBLIC_STATUSES = ["ACTIVE", "RESERVED", "SOLD"] as const;

async function getListing(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { orderIndex: "asc" } },
      category: true,
      subcategory: true,
      seller: true,
    },
  });
  if (!listing) return null;
  if (!PUBLIC_STATUSES.includes(listing.status as (typeof PUBLIC_STATUSES)[number])) {
    return null;
  }
  return listing;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found" };
  const price = formatKes(listing.price);
  return {
    title: `${listing.title} — ${price}`,
    description: `${listing.title} for sale in ${listing.town}, ${listing.county}. ${conditionLabel(listing.condition)} condition. ${price} on Sokoni Nyumbani.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const [settings, session] = await Promise.all([getSettings(), getSession()]);

  // Count the view (best-effort, never blocks rendering).
  if (listing.status === "ACTIVE") {
    await prisma.listing
      .update({
        where: { id: listing.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => null);
  }

  const images = listing.images.map((img) => ({
    src: listingImageSrc(img.storagePath),
    alt: `${listing.title} — photo ${img.orderIndex + 1}`,
  }));

  const similar = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      categoryId: listing.categoryId,
      id: { not: listing.id },
    },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { images: true, category: true, subcategory: true, seller: true },
  });

  const seller = listing.seller;
  const contactPhone = seller.whatsappPhone ?? seller.phone ?? "";
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/product/${listing.id}`;

  const detailRows: { label: string; value: string | null }[] = [
    { label: "Condition", value: conditionLabel(listing.condition) },
    { label: "Brand", value: listing.brand },
    { label: "Model", value: listing.model },
    { label: "Age / usage", value: listing.ageDescription },
    {
      label: "Original price",
      value: listing.originalPrice ? formatKes(listing.originalPrice) : null,
    },
    { label: "Dimensions", value: listing.dimensions },
    { label: "Category", value: listing.category.name },
    {
      label: "Subcategory",
      value: listing.subcategory?.name ?? null,
    },
    { label: "Listed", value: `${timeAgo(listing.createdAt)} (${formatDate(listing.createdAt)})` },
    { label: "Views", value: `${listing.viewsCount.toLocaleString("en-KE")}` },
  ];

  return (
    <div className="container-page py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
        <Link href="/" className="hover:text-forest-700">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/marketplace" className="hover:text-forest-700">
          Marketplace
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/marketplace?category=${listing.category.slug}`}
          className="hover:text-forest-700"
        >
          {listing.category.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-ink-700">{listing.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.2fr,1fr]">
        {/* ------------------------------- Left column ------------------------ */}
        <div>
          <ImageGallery images={images} title={listing.title} />

          {/* Description */}
          <section className="card mt-6 p-6">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              About this item
            </h2>
            <p className="prose-block mt-3">{listing.description}</p>
          </section>

          {/* Reason for selling */}
          <section className="card mt-5 p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <History className="h-4 w-4 text-gold-700" aria-hidden="true" />
              Why the seller is letting it go
            </h3>
            <p className="prose-block mt-2">{listing.reasonForSelling}</p>
          </section>

          {/* Item details */}
          <section className="card mt-5 p-6">
            <h3 className="text-sm font-semibold text-ink-900">Item details</h3>
            <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {detailRows.map(
                (row) =>
                  row.value && (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-3 border-b border-sand-100 pb-2"
                    >
                      <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">
                        {row.label}
                      </dt>
                      <dd className="text-right text-sm font-medium text-ink-800">
                        {row.value}
                      </dd>
                    </div>
                  )
              )}
            </dl>
          </section>

          {/* Location & delivery */}
          <section className="card mt-5 p-6">
            <h3 className="text-sm font-semibold text-ink-900">
              Location &amp; handover
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-700">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                <span>
                  <span className="font-medium text-ink-900">
                    {listing.town}, {listing.county}
                  </span>
                  <span className="block text-xs text-ink-500">
                    Arrange viewing with the seller before paying.
                  </span>
                </span>
              </li>
              {listing.deliveryAvailable && (
                <li className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                  <span>
                    <span className="font-medium text-ink-900">
                      Delivery may be available
                    </span>
                    {listing.deliveryNote && (
                      <span className="block text-xs text-ink-500">
                        {listing.deliveryNote}
                      </span>
                    )}
                  </span>
                </li>
              )}
              {listing.buyerCollects && (
                <li className="flex items-start gap-3">
                  <ShoppingBasket className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                  <span className="font-medium text-ink-900">
                    Buyer collects in person
                  </span>
                </li>
              )}
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                <span>
                  Seller prefers:{" "}
                  <span className="font-medium text-ink-900">
                    {preferredContactLabel(listing.preferredContact)}
                  </span>
                </span>
              </li>
            </ul>
          </section>
        </div>

        {/* ------------------------------ Right column ------------------------ */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={listing.status} />
              <ConditionBadge condition={listing.condition} />
              {listing.negotiable && <NegotiableBadge />}
              {listing.featured && (
                <span className="badge bg-gold-100 text-gold-800">
                  <Tag className="h-3 w-3" aria-hidden="true" />
                  Featured
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink-900">
              {listing.title}
            </h1>
            <p className="mt-2 font-display text-3xl font-semibold text-forest-700">
              {formatKes(listing.price)}
              {listing.negotiable && (
                <span className="ml-2 align-middle text-sm font-medium text-gold-700">
                  negotiable
                </span>
              )}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-500">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {listing.town}, {listing.county}
            </p>

            <div className="mt-5 border-t border-sand-100 pt-5">
              <ContactSeller
                sellerName={seller.name}
                sellerPhone={contactPhone}
                listingTitle={listing.title}
                price={formatKes(listing.price)}
                preferredContact={listing.preferredContact}
                status={listing.status}
              />
              <div className="mt-3 flex gap-3">
                <ShareButton title={listing.title} url={shareUrl} />
                <div className="flex-1">
                  <ReportDialog
                    listingId={listing.id}
                    reportedUserId={seller.id}
                    isLoggedIn={Boolean(session.authUser)}
                    triggerLabel="Report listing"
                    variant="button"
                  />
                </div>
              </div>
            </div>

            {/* Seller card */}
            <div className="mt-5 rounded-2xl border border-sand-200 bg-sand-50 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-100 font-semibold text-forest-700">
                  <User className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">
                    {seller.name}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink-500">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    Member since {formatDate(seller.createdAt)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {seller.phoneVerifiedAt && (
                  <VerifiedBadge label="Phone verified seller" />
                )}
                <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-forest-600" aria-hidden="true" />
                  Active seller subscription
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-500">
                Sokoni Nyumbani does not verify ownership or quality of items.
                Agree on payment and collection directly with the seller — and
                report anything suspicious.
              </p>
            </div>
          </div>

          <SafetyNotice text={settings.safetyNotice} className="mt-5" compact />
        </div>
      </div>

      {/* ------------------------------ Similar items ------------------------- */}
      {similar.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="section-title">More in {listing.category.name}</h2>
              <p className="section-subtitle">
                Other pre-loved finds from sellers across Kenya.
              </p>
            </div>
            <Link
              href={`/marketplace?category=${listing.category.slug}`}
              className="hidden shrink-0 text-sm font-semibold text-forest-700 hover:text-forest-800 sm:inline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((item) => (
              <ProductCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
