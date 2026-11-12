import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CreditCard,
  Leaf,
  MapPin,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { CategoryIcon } from "@/components/category-icon";
import { SafetyNotice } from "@/components/safety-notice";
import { NearYouSelect } from "@/components/near-you-select";
import { EmptyState } from "@/components/empty-state";
import { sweepExpiries } from "@/lib/listing-utils";
import { getSettings } from "@/lib/settings";
import { COUNTIES } from "@/lib/constants";
import { param } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await sweepExpiries();
  const settings = await getSettings();

  const nearParam = param((await searchParams).near);
  const nearCounty =
    nearParam && (COUNTIES as readonly string[]).includes(nearParam)
      ? nearParam
      : "Nairobi";

  const [categories, featured, recent, nearListings, activeCount, sellerCount, countyCount] =
    await Promise.all([
      prisma.category.findMany({
        where: { active: true },
        orderBy: { orderIndex: "asc" },
        include: {
          _count: { select: { listings: { where: { status: "ACTIVE" } } } },
        },
      }),
      prisma.listing.findMany({
        where: { status: "ACTIVE", featured: true },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { images: true, category: true, subcategory: true, seller: true },
      }),
      prisma.listing.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { images: true, category: true, subcategory: true, seller: true },
      }),
      prisma.listing.findMany({
        where: { status: "ACTIVE", county: nearCounty },
        orderBy: { createdAt: "desc" },
        take: 4,
        include: { images: true, category: true, subcategory: true, seller: true },
      }),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.profile.count({
        where: {
          subscriptions: { some: { status: "ACTIVE", endsAt: { gt: new Date() } } },
        },
      }),
      prisma.listing
        .findMany({
          where: { status: "ACTIVE" },
          select: { county: true },
          distinct: ["county"],
        })
        .then((rows) => rows.length),
    ]);

  const howItWorks = [
    {
      icon: Camera,
      title: "Snap & list",
      text: "Photograph the item, add a description and set your price in KSh.",
    },
    {
      icon: CreditCard,
      title: "Pay your subscription",
      text: "Choose a monthly, 3-month or annual seller plan and pay with M-Pesa.",
    },
    {
      icon: Package,
      title: "Get discovered",
      text: "Buyers across Kenya browse by category, county and price.",
    },
    {
      icon: MessageCircle,
      title: "Sell & hand over",
      text: "Buyers reach you on WhatsApp or by phone. Meet safely and get paid.",
    },
  ];

  const whySell = [
    {
      icon: MapPin,
      title: "Buyers near you",
      text: "Your items are shown to people in your county and town first.",
    },
    {
      icon: TrendingUp,
      title: "Fair, simple pricing",
      text: "One subscription unlocks several active listings — no per-item fees.",
    },
    {
      icon: ShieldCheck,
      title: "Safety-first community",
      text: "Verified sellers, moderation and easy reporting keep scammers away.",
    },
    {
      icon: Leaf,
      title: "Good for the planet",
      text: "Every re-used sofa or fridge keeps useful things out of landfill.",
    },
  ];

  return (
    <div>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-800 via-forest-800 to-forest-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-forest-400/10 blur-3xl"
        />
        <div className="container-page relative py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-forest-500/60 bg-forest-700/40 px-3.5 py-1.5 text-xs font-medium text-forest-100">
              <Sparkles className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
              Kenya&apos;s marketplace for pre-loved household items
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
              {settings.tagline}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-forest-100/90 sm:text-lg">
              Moving, upgrading or decluttering? Turn your unwanted household
              items into cash. Find affordable pre-loved treasures from sellers
              near you.
            </p>

            {/* Search bar */}
            <form
              action="/marketplace"
              method="get"
              className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  name="q"
                  placeholder="Search sofas, fridges, beds, TVs…"
                  aria-label="Search household items"
                  className="w-full rounded-xl border-0 bg-white py-3.5 pl-12 pr-4 text-sm text-ink-900 shadow-lift placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <button
                type="submit"
                className="btn-gold btn-lg whitespace-nowrap"
              >
                Search items
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-forest-100/80">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-1.5 font-medium text-white underline-offset-4 hover:underline"
              >
                Browse everything <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/plans"
                className="inline-flex items-center gap-1.5 font-medium text-gold-300 underline-offset-4 hover:underline"
              >
                Or start selling <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------ Stats band ---------------------------- */}
      <section className="border-b border-sand-200 bg-white">
        <div className="container-page grid grid-cols-2 divide-x divide-sand-100 py-6 sm:grid-cols-4">
          {[
            { label: "Items for sale", value: activeCount },
            { label: "Active sellers", value: sellerCount },
            { label: "Counties covered", value: countyCount },
            { label: "Categories", value: categories.length },
          ].map((stat) => (
            <div key={stat.label} className="px-4 text-center">
              <p className="font-display text-2xl font-semibold text-forest-700 sm:text-3xl">
                {stat.value.toLocaleString("en-KE")}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------- Categories --------------------------- */}
      <section id="categories" className="container-page py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Browse by category</h2>
            <p className="section-subtitle">
              Everything for the home — from sofas to fridges to baby cots.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-800 sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/marketplace?category=${category.slug}`}
              className="card card-hover group flex flex-col items-center gap-3 p-6 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-50 text-forest-600 transition-colors group-hover:bg-forest-100">
                <CategoryIcon icon={category.icon} className="h-7 w-7" />
              </span>
              <div>
                <p className="font-medium text-ink-900 group-hover:text-forest-700">
                  {category.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {category._count.listings} item
                  {category._count.listings === 1 ? "" : "s"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------- Featured ----------------------------- */}
      {featured.length > 0 && (
        <section className="bg-forest-50/60 py-14">
          <div className="container-page">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="section-title flex items-center gap-2">
                  <Sparkles
                    className="h-6 w-6 text-gold-500"
                    aria-hidden="true"
                  />
                  Featured listings
                </h2>
                <p className="section-subtitle">
                  Hand-picked items chosen by our team.
                </p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------ Recent items -------------------------- */}
      <section className="container-page py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">Recently added</h2>
            <p className="section-subtitle">
              Fresh finds from sellers across Kenya.
            </p>
          </div>
          <Link
            href="/marketplace?sort=newest"
            className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-800 sm:inline-flex"
          >
            See more <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {recent.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Package}
            title="No listings yet"
            description="Be the first to sell your pre-loved household items."
            actionLabel="Start selling"
            actionHref="/plans"
            className="mt-8"
          />
        )}
      </section>

      {/* -------------------------------- Near you ---------------------------- */}
      <section className="bg-sand-100/70 py-14">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title flex items-center gap-2">
                <MapPin className="h-6 w-6 text-forest-600" aria-hidden="true" />
                Items near you
              </h2>
              <p className="section-subtitle">
                Showing pre-loved finds in{" "}
                <span className="font-semibold text-forest-700">{nearCounty}</span>{" "}
                — choose your county to see what&apos;s close by.
              </p>
            </div>
            <NearYouSelect value={nearCounty} />
          </div>
          {nearListings.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {nearListings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MapPin}
              title={`Nothing in ${nearCounty} right now`}
              description="Try another county, or check back soon — new items arrive daily."
              actionLabel="Browse all of Kenya"
              actionHref="/marketplace"
              className="mt-8"
            />
          )}
        </div>
      </section>

      {/* ------------------------------ How it works -------------------------- */}
      <section className="container-page py-14">
        <h2 className="section-title">How it works</h2>
        <p className="section-subtitle">
          Selling your pre-loved household items takes minutes.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step, i) => (
            <div key={step.title} className="card relative p-6">
              <span className="absolute right-5 top-5 font-display text-4xl font-semibold text-sand-200">
                {i + 1}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-700 text-white">
                <step.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------- Why sell with us ------------------------ */}
      <section className="bg-forest-800 py-14">
        <div className="container-page">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
            Why sell with us
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-forest-100/80 sm:text-base">
            Whether you&apos;re relocating, upgrading, downsizing, decluttering
            or raising cash — your household items deserve a second home.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whySell.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-forest-700 bg-forest-900/60 p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/15 text-gold-300">
                  <item.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-white">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-forest-100/75">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- Safety ------------------------------- */}
      <section className="container-page py-14">
        <SafetyNotice text={settings.safetyNotice} />
      </section>

      {/* ------------------------------ Seller CTA ---------------------------- */}
      <section className="container-page pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-forest-700 to-forest-900 px-8 py-12 sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/15 blur-2xl"
          />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl">
                Ready to turn your unused items into cash?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-forest-100/85 sm:text-base">
                Create your seller account, pick a subscription that fits, and
                list your items today. Buyers in your county are waiting.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-forest-100/80">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-gold-300" aria-hidden="true" />
                  Email &amp; phone verified sellers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gold-300" aria-hidden="true" />
                  Friendly, human support
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="btn-gold btn-lg">
                Become a seller
              </Link>
              <Link
                href="/plans"
                className="btn btn-lg border border-forest-400/60 text-forest-50 hover:bg-forest-800"
              >
                View subscription plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
