import Link from "next/link";
import type { Metadata } from "next";
import { PackageSearch, Search, SlidersHorizontal } from "lucide-react";
import type { Prisma, ListingStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { ProductCard } from "@/components/product-card";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/empty-state";
import { SafetyNotice } from "@/components/safety-notice";
import { CONDITIONS, COUNTIES, SORT_OPTIONS, type ConditionValue } from "@/lib/constants";
import {
  MARKETPLACE_STATUSES,
  marketplaceSellerFilter,
  sweepExpiries,
} from "@/lib/listing-utils";
import { buildQuery, param, paramList } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse household items",
  description:
    "Search and filter pre-owned household items across Kenya by category, county, price and condition.",
};

const PAGE_SIZE = 12;

function parseSort(sort: string | undefined): { key: string; dir: "asc" | "desc" } {
  switch (sort) {
    case "price-asc":
      return { key: "price", dir: "asc" };
    case "price-desc":
      return { key: "price", dir: "desc" };
    default:
      return { key: "createdAt", dir: "desc" };
  }
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await sweepExpiries();
  const sp = await searchParams;

  const q = param(sp.q)?.trim() ?? "";
  const categorySlug = param(sp.category) ?? "";
  const subSlug = param(sp.sub) ?? "";
  const county = param(sp.county) ?? "";
  const conditions: ConditionValue[] = paramList(sp.condition).filter(
    (c): c is ConditionValue => CONDITIONS.some((x) => x.value === c)
  );
  const minPrice = Number(param(sp.min) ?? "") || undefined;
  const maxPrice = Number(param(sp.max) ?? "") || undefined;
  const sort = param(sp.sort) ?? "newest";
  const statusTab = param(sp.status) ?? "available";
  const page = Math.max(1, Number(param(sp.page) ?? 1) || 1);

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { orderIndex: "asc" },
    include: {
      subcategories: { orderBy: { name: "asc" } },
      _count: { select: { listings: { where: { status: "ACTIVE" } } } },
    },
  });

  const selectedCategory = categories.find((c) => c.slug === categorySlug);

  const statusFilter: ListingStatus[] =
    statusTab === "all"
      ? [...MARKETPLACE_STATUSES]
      : statusTab === "sold"
        ? ["SOLD"]
        : ["ACTIVE", "RESERVED"];

  const priceFilter: Prisma.IntFilter = {};
  if (minPrice !== undefined) priceFilter.gte = minPrice;
  if (maxPrice !== undefined) priceFilter.lte = maxPrice;

  const where: Prisma.ListingWhereInput = {
    status: { in: statusFilter },
    ...(await marketplaceSellerFilter()),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(subSlug
      ? { subcategory: { slug: subSlug, category: { slug: categorySlug || undefined } } }
      : {}),
    ...(county ? { county } : {}),
    ...(conditions.length ? { condition: { in: conditions } } : {}),
    ...((minPrice !== undefined || maxPrice !== undefined) ? { price: priceFilter } : {}),
  };

  const { key: sortKey, dir: sortDir } = parseSort(sort);
  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { [sortKey]: sortDir },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { orderBy: { orderIndex: "asc" } },
        category: true,
        subcategory: true,
        seller: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query = buildQuery(
    {
      q,
      category: categorySlug,
      sub: subSlug,
      county,
      min: minPrice,
      max: maxPrice,
      sort,
      status: statusTab,
    },
    { condition: conditions }
  );

  const hasFilters = Boolean(
    q || categorySlug || subSlug || county || conditions.length || minPrice || maxPrice
  );

  return (
    <div className="container-page py-10">
      {/* Heading + search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="section-title">Marketplace</h1>
          <p className="section-subtitle">
            {total.toLocaleString("en-KE")} pre-loved household item
            {total === 1 ? "" : "s"} listed across Kenya.
          </p>
        </div>
        <form action="/marketplace" method="get" className="flex gap-2">
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search items…"
              aria-label="Search items"
              className="input w-64 pl-10"
            />
          </div>
          <button type="submit" className="btn-primary btn-md">
            Search
          </button>
        </form>
      </div>

      {/* Category chips */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/marketplace${buildQuery({ q, sort, status: statusTab })}`}
          className={`badge border px-3 py-1.5 transition ${
            !categorySlug
              ? "border-forest-700 bg-forest-700 text-white"
              : "border-sand-300 bg-white text-ink-700 hover:border-forest-400"
          }`}
        >
          All categories
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/marketplace${buildQuery({ q, sort, status: statusTab, category: category.slug })}`}
            className={`badge border px-3 py-1.5 transition ${
              categorySlug === category.slug
                ? "border-forest-700 bg-forest-700 text-white"
                : "border-sand-300 bg-white text-ink-700 hover:border-forest-400"
            }`}
          >
            {category.name}
            <span className="ml-1 opacity-60">{category._count.listings}</span>
          </Link>
        ))}
      </div>

      {/* Filters + results */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[280px,1fr]">
        <aside>
          <form
            action="/marketplace"
            method="get"
            className="card sticky top-24 space-y-5 p-5"
          >
            <input type="hidden" name="q" value={q} />
            <input type="hidden" name="sort" value={sort} />
            <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
            </div>

            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <div>
                <label htmlFor="sub" className="label">
                  Subcategory
                </label>
                <select id="sub" name="sub" defaultValue={subSlug} className="input">
                  <option value="">All of {selectedCategory.name}</option>
                  {selectedCategory.subcategories.map((sub) => (
                    <option key={sub.id} value={sub.slug}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <input type="hidden" name="category" value={categorySlug} />
              </div>
            )}
            {!selectedCategory && (
              <input type="hidden" name="category" value={categorySlug} />
            )}

            <div>
              <label htmlFor="county" className="label">
                County
              </label>
              <select id="county" name="county" defaultValue={county} className="input">
                <option value="">All counties</option>
                {COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="label">Condition</legend>
              <div className="space-y-1.5">
                {CONDITIONS.map((condition) => (
                  <label
                    key={condition.value}
                    className="flex cursor-pointer items-center gap-2 text-sm text-ink-700"
                  >
                    <input
                      type="checkbox"
                      name="condition"
                      value={condition.value}
                      defaultChecked={conditions.includes(condition.value)}
                      className="h-4 w-4 rounded accent-forest-700"
                    />
                    {condition.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="min" className="label">
                Price range (KSh)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="min"
                  name="min"
                  type="number"
                  min={0}
                  placeholder="Min"
                  defaultValue={minPrice ?? ""}
                  className="input"
                />
                <span className="text-ink-400">–</span>
                <input
                  name="max"
                  type="number"
                  min={0}
                  placeholder="Max"
                  defaultValue={maxPrice ?? ""}
                  className="input"
                  aria-label="Maximum price"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="label">
                Listing status
              </label>
              <select id="status" name="status" defaultValue={statusTab} className="input">
                <option value="available">Available now</option>
                <option value="sold">Sold only</option>
                <option value="all">Everything (incl. sold)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button type="submit" className="btn-primary btn-md w-full">
                Apply filters
              </button>
              <Link href="/marketplace" className="btn-ghost btn-md w-full">
                Clear all
              </Link>
            </div>
          </form>

          <div className="mt-5">
            <SafetyNotice compact />
          </div>
        </aside>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-ink-500">
              Page {page} of {totalPages}
            </p>
            <form action="/marketplace" method="get" className="flex items-center gap-2">
              {q && <input type="hidden" name="q" value={q} />}
              {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
              {county && <input type="hidden" name="county" value={county} />}
              {conditions.map((c) => (
                <input key={c} type="hidden" name="condition" value={c} />
              ))}
              <label htmlFor="sort" className="text-sm text-ink-500">
                Sort by
              </label>
              <select id="sort" name="sort" defaultValue={sort} className="input w-auto py-2 text-sm">
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-secondary btn-sm">
                Go
              </button>
            </form>
          </div>

          {listings.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PackageSearch}
              title="No items match your search"
              description={
                hasFilters
                  ? "Try widening your filters — or clear them to browse everything."
                  : "No items have been listed yet. Check back soon!"
              }
              actionLabel="Clear filters"
              actionHref="/marketplace"
              className="mt-5"
            />
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/marketplace"
            query={query}
          />
        </div>
      </div>
    </div>
  );
}
