import Link from "next/link";
import type { Metadata } from "next";
import { CircleCheck, PlusCircle } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireUser, isEmailVerified } from "@/lib/auth";
import { ListingForm } from "@/components/forms/listing-form";
import { canSellerPublish } from "@/lib/listing-utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New listing" };

export default async function NewListingPage() {
  const { profile } = await requireUser("/dashboard/listings/new");
  const [emailVerified, publishCheck, categories] = await Promise.all([
    isEmailVerified(profile.id),
    canSellerPublish(profile.id),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { orderIndex: "asc" },
      include: { subcategories: { orderBy: { name: "asc" } } },
    }),
  ]);

  /* ------------------------- Publishing gate / CTAs ------------------------ */

  const gate =
    !emailVerified
      ? {
          title: "Verify your email to publish listings",
          text: `We sent a confirmation link to ${profile.email}. Click it to confirm your address — publishing and subscriptions require a verified email.`,
          cta: { href: "/verify-email", label: "Verify my email" },
        }
      : publishCheck.reason === "no-subscription"
        ? {
            title: "You need an active subscription to publish",
            text: "Sellers pick a monthly, 3-month or annual plan to list items. Pay with M-Pesa — your plan activates as soon as the payment is verified.",
            cta: {
              href: "/dashboard/subscription",
              label: "Choose a plan",
            },
          }
        : publishCheck.reason === "limit-reached"
          ? {
              title: "You've reached your plan's listing limit",
              text: `Your plan allows ${publishCheck.maxListings} active listings and all ${publishCheck.activeCount} slots are in use. Mark some items as sold, or upgrade your plan for more slots.`,
              cta: {
                href: "/dashboard/subscription",
                label: "Upgrade my plan",
              },
            }
          : null;

  if (gate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="section-title">New listing</h1>
          <p className="section-subtitle">
            Almost there — one more step before you can publish.
          </p>
        </div>
        <div className="card mx-auto max-w-xl p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-100 text-gold-700">
            <PlusCircle className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-xl font-semibold text-ink-900">
            {gate.title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-600">
            {gate.text}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={gate.cta.href} className="btn-primary btn-md">
              {gate.cta.label}
            </Link>
            <Link href="/dashboard/listings" className="btn-secondary btn-md">
              Back to my listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------------- The form ------------------------------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">New listing</h1>
        <p className="section-subtitle">
          Tell buyers what you&apos;re selling, honestly and clearly — it
          sells faster.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4">
        <CircleCheck className="h-5 w-5 shrink-0 text-forest-700" aria-hidden="true" />
        <p className="text-sm text-forest-900">
          You have{" "}
          <span className="font-semibold">
            {publishCheck.maxListings - publishCheck.activeCount}
          </span>{" "}
          listing slot
          {publishCheck.maxListings - publishCheck.activeCount === 1 ? "" : "s"}{" "}
          left on your current plan.
        </p>
      </div>

      <ListingForm
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          subcategories: category.subcategories.map((sub) => ({
            id: sub.id,
            name: sub.name,
          })),
        }))}
        defaults={{
          county: profile.county ?? "Nairobi",
          town: profile.town ?? "",
        }}
      />
    </div>
  );
}
