import type { Metadata } from "next";
import { Tags, Trash2 } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  adminUpsertCategoryAction,
  adminUpsertSubcategoryAction,
  adminDeleteSubcategoryAction,
} from "@/app/actions/admin-actions";
import { EmptyState } from "@/components/empty-state";
import { CategoryIcon, ICON_OPTIONS, iconLabel } from "@/components/category-icon";
import { param } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Manage categories" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const done = param(sp.done);
  const error = param(sp.error);

  const categories = await prisma.category.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      subcategories: { orderBy: { name: "asc" } },
      _count: { select: { listings: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Categories</h1>
        <p className="section-subtitle">
          Categories and subcategories structure the marketplace. Deactivating
          a category hides it from sellers; listings keep their category.
        </p>
      </div>

      {done && (
        <p className="rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4 text-sm font-medium text-forest-900">
          Saved. Changes are live across the site.
        </p>
      )}
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {/* New category */}
      <details className="card p-5">
        <summary className="cursor-pointer list-none font-display text-base font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
          ➕ Create a new category
        </summary>
        <form action={adminUpsertCategoryAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-cat-name" className="label">
              Name
            </label>
            <input
              id="new-cat-name"
              name="name"
              className="input"
              placeholder="e.g. Home Office"
              required
              minLength={2}
              maxLength={60}
            />
          </div>
          <div>
            <label htmlFor="new-cat-icon" className="label">
              Icon
            </label>
            <select id="new-cat-icon" name="icon" className="input" defaultValue="package">
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {iconLabel(icon)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="new-cat-order" className="label">
              Sort order
            </label>
            <input
              id="new-cat-order"
              name="orderIndex"
              type="number"
              min={0}
              max={999}
              defaultValue={categories.length}
              className="input"
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-800">
              <input
                type="checkbox"
                name="active"
                defaultChecked
                className="h-4 w-4 rounded accent-forest-700"
              />
              Active
            </label>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="new-cat-desc" className="label">
              Description <span className="text-ink-400">(optional)</span>
            </label>
            <input
              id="new-cat-desc"
              name="description"
              className="input"
              placeholder="Short line shown on the category card"
              maxLength={300}
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary btn-md">
              Create category
            </button>
          </div>
        </form>
      </details>

      {/* Existing categories */}
      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Create your first category above to structure the marketplace."
        />
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <details key={category.id} className="card p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
                    <CategoryIcon icon={category.icon} className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-medium text-ink-900">
                      {category.name}
                      {!category.active && (
                        <span className="badge ml-2 bg-amber-100 text-amber-800">
                          inactive
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-ink-500">
                      {category._count.listings} listing
                      {category._count.listings === 1 ? "" : "s"} ·{" "}
                      {category.subcategories.length} subcategor
                      {category.subcategories.length === 1 ? "y" : "ies"} ·{" "}
                      {category.slug}
                    </span>
                  </span>
                </span>
                <span className="text-xs font-medium text-forest-700">
                  Edit ▾
                </span>
              </summary>

              <div className="mt-5 space-y-6 border-t border-sand-100 pt-5">
                {/* Edit category */}
                <form
                  action={adminUpsertCategoryAction}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <input type="hidden" name="id" value={category.id} />
                  <div>
                    <label htmlFor={`cat-name-${category.id}`} className="label">
                      Name
                    </label>
                    <input
                      id={`cat-name-${category.id}`}
                      name="name"
                      className="input"
                      defaultValue={category.name}
                      required
                      minLength={2}
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <label htmlFor={`cat-icon-${category.id}`} className="label">
                      Icon
                    </label>
                    <select
                      id={`cat-icon-${category.id}`}
                      name="icon"
                      className="input"
                      defaultValue={category.icon}
                    >
                      {ICON_OPTIONS.map((icon) => (
                        <option key={icon} value={icon}>
                          {iconLabel(icon)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`cat-desc-${category.id}`} className="label">
                      Description
                    </label>
                    <input
                      id={`cat-desc-${category.id}`}
                      name="description"
                      className="input"
                      defaultValue={category.description ?? ""}
                      maxLength={300}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`cat-order-${category.id}`} className="label">
                        Sort order
                      </label>
                      <input
                        id={`cat-order-${category.id}`}
                        name="orderIndex"
                        type="number"
                        min={0}
                        max={999}
                        defaultValue={category.orderIndex}
                        className="input"
                      />
                    </div>
                    <div className="flex items-end pb-2.5">
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-800">
                        <input
                          type="checkbox"
                          name="active"
                          defaultChecked={category.active}
                          className="h-4 w-4 rounded accent-forest-700"
                        />
                        Active
                      </label>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit" className="btn-primary btn-sm">
                      Save category
                    </button>
                  </div>
                </form>

                {/* Subcategories */}
                <div>
                  <p className="text-sm font-semibold text-ink-900">
                    Subcategories
                  </p>
                  {category.subcategories.length === 0 ? (
                    <p className="mt-2 text-xs text-ink-500">
                      None yet — add one below.
                    </p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {category.subcategories.map((sub) => (
                        <li
                          key={sub.id}
                          className="flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50 py-1.5 pl-3.5 pr-1.5 text-sm"
                        >
                          {sub.name}
                          <form action={adminDeleteSubcategoryAction}>
                            <input type="hidden" name="id" value={sub.id} />
                            <button
                              type="submit"
                              className="rounded-lg p-1 text-ink-400 transition hover:bg-red-50 hover:text-red-600"
                              title={`Delete "${sub.name}"`}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form
                    action={adminUpsertSubcategoryAction}
                    className="mt-3 flex gap-2"
                  >
                    <input type="hidden" name="categoryId" value={category.id} />
                    <input
                      type="text"
                      name="name"
                      placeholder="New subcategory name"
                      className="input text-sm"
                      required
                      minLength={2}
                      maxLength={60}
                    />
                    <button type="submit" className="btn-secondary btn-sm shrink-0">
                      Add
                    </button>
                  </form>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
