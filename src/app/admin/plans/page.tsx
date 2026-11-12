import type { Metadata } from "next";
import { Banknote, Users } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  adminUpsertPlanAction,
  adminTogglePlanAction,
} from "@/app/actions/admin-actions";
import { EmptyState } from "@/components/empty-state";
import { formatKes } from "@/lib/format";
import { param, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Manage plans" };

function durationLabel(days: number): string {
  if (days >= 360) return "12 months";
  if (days >= 80 && days <= 100) return "3 months";
  return `${days} days`;
}

export default async function AdminPlansPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const done = param(sp.done);
  const error = param(sp.error);

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ orderIndex: "asc" }, { priceKes: "asc" }],
    include: {
      _count: {
        select: {
          subscriptions: { where: { status: "ACTIVE", endsAt: { gt: new Date() } } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Subscription plans</h1>
        <p className="section-subtitle">
          Prices, durations, listing limits and promos — all editable here.
          Changes apply to new subscriptions immediately.
        </p>
      </div>

      {done && (
        <p className="rounded-2xl border border-forest-200 bg-forest-50 px-5 py-4 text-sm font-medium text-forest-900">
          {done === "toggled"
            ? "Plan visibility updated."
            : "Plan saved. It's live on the plans page."}
        </p>
      )}
      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {/* New plan */}
      <details className="card p-5">
        <summary className="cursor-pointer list-none font-display text-base font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
          ➕ Create a new plan
        </summary>
        <form action={adminUpsertPlanAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="plan-name" className="label">
              Name
            </label>
            <input
              id="plan-name"
              name="name"
              className="input"
              placeholder="e.g. Quarterly Seller"
              required
              minLength={2}
              maxLength={60}
            />
          </div>
          <div>
            <label htmlFor="plan-desc" className="label">
              Short description
            </label>
            <input
              id="plan-desc"
              name="description"
              className="input"
              placeholder="Shown under the plan name"
              required
              minLength={5}
              maxLength={300}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="plan-price" className="label">
                Price (KSh)
              </label>
              <input
                id="plan-price"
                name="priceKes"
                type="number"
                min={0}
                step={1}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="plan-days" className="label">
                Duration (days)
              </label>
              <input
                id="plan-days"
                name="durationDays"
                type="number"
                min={1}
                max={3650}
                defaultValue={30}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="plan-max" className="label">
                Max listings
              </label>
              <input
                id="plan-max"
                name="maxActiveListings"
                type="number"
                min={1}
                max={1000}
                defaultValue={10}
                className="input"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="plan-badge" className="label">
                Badge <span className="text-ink-400">(optional)</span>
              </label>
              <input
                id="plan-badge"
                name="badge"
                className="input"
                placeholder="e.g. Most popular"
                maxLength={30}
              />
            </div>
            <div>
              <label htmlFor="plan-promo" className="label">
                Promo text <span className="text-ink-400">(optional)</span>
              </label>
              <input
                id="plan-promo"
                name="promoText"
                className="input"
                placeholder="e.g. Save 25%"
                maxLength={60}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="plan-features" className="label">
              Features <span className="text-ink-400">(one per line)</span>
            </label>
            <textarea
              id="plan-features"
              name="features"
              rows={4}
              className="input"
              placeholder={"Listing appears in featured row\nPriority moderation\n…"}
              maxLength={1000}
            />
          </div>
          <div className="flex items-end gap-4">
            <div>
              <label htmlFor="plan-order" className="label">
                Sort order
              </label>
              <input
                id="plan-order"
                name="orderIndex"
                type="number"
                min={0}
                max={999}
                defaultValue={plans.length}
                className="input"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 pb-2.5 text-sm text-ink-800">
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
            <button type="submit" className="btn-primary btn-md">
              Create plan
            </button>
          </div>
        </form>
      </details>

      {/* Existing plans */}
      {plans.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No plans yet"
          description="Create your first subscription plan above — sellers can't sign up without one."
        />
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <details key={plan.id} className="card p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="flex flex-wrap items-center gap-2 font-medium text-ink-900">
                    {plan.name}
                    {plan.badge && (
                      <span className="badge bg-gold-100 text-gold-800">
                        {plan.badge}
                      </span>
                    )}
                    <span
                      className={cn(
                        "badge",
                        plan.active
                          ? "bg-forest-100 text-forest-800"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {plan.active ? "active" : "hidden"}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-500">
                    {formatKes(plan.priceKes)} · {durationLabel(plan.durationDays)} ·{" "}
                    up to {plan.maxActiveListings} listings
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-500">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {plan._count.subscriptions} active
                </span>
              </summary>

              <div className="mt-5 border-t border-sand-100 pt-5">
                <form action={adminUpsertPlanAction} className="grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="id" value={plan.id} />
                  <div>
                    <label htmlFor={`edit-name-${plan.id}`} className="label">
                      Name
                    </label>
                    <input
                      id={`edit-name-${plan.id}`}
                      name="name"
                      className="input"
                      defaultValue={plan.name}
                      required
                      minLength={2}
                      maxLength={60}
                    />
                  </div>
                  <div>
                    <label htmlFor={`edit-desc-${plan.id}`} className="label">
                      Description
                    </label>
                    <input
                      id={`edit-desc-${plan.id}`}
                      name="description"
                      className="input"
                      defaultValue={plan.description}
                      required
                      minLength={5}
                      maxLength={300}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label htmlFor={`edit-price-${plan.id}`} className="label">
                        Price (KSh)
                      </label>
                      <input
                        id={`edit-price-${plan.id}`}
                        name="priceKes"
                        type="number"
                        min={0}
                        step={1}
                        className="input"
                        defaultValue={plan.priceKes}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`edit-days-${plan.id}`} className="label">
                        Days
                      </label>
                      <input
                        id={`edit-days-${plan.id}`}
                        name="durationDays"
                        type="number"
                        min={1}
                        max={3650}
                        className="input"
                        defaultValue={plan.durationDays}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor={`edit-max-${plan.id}`} className="label">
                        Max listings
                      </label>
                      <input
                        id={`edit-max-${plan.id}`}
                        name="maxActiveListings"
                        type="number"
                        min={1}
                        max={1000}
                        className="input"
                        defaultValue={plan.maxActiveListings}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`edit-badge-${plan.id}`} className="label">
                        Badge
                      </label>
                      <input
                        id={`edit-badge-${plan.id}`}
                        name="badge"
                        className="input"
                        defaultValue={plan.badge ?? ""}
                        maxLength={30}
                      />
                    </div>
                    <div>
                      <label htmlFor={`edit-promo-${plan.id}`} className="label">
                        Promo text
                      </label>
                      <input
                        id={`edit-promo-${plan.id}`}
                        name="promoText"
                        className="input"
                        defaultValue={plan.promoText ?? ""}
                        maxLength={60}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor={`edit-features-${plan.id}`} className="label">
                      Features (one per line)
                    </label>
                    <textarea
                      id={`edit-features-${plan.id}`}
                      name="features"
                      rows={4}
                      className="input"
                      defaultValue={plan.features}
                      maxLength={1000}
                    />
                  </div>
                  <div className="flex items-end gap-4">
                    <div>
                      <label htmlFor={`edit-order-${plan.id}`} className="label">
                        Sort order
                      </label>
                      <input
                        id={`edit-order-${plan.id}`}
                        name="orderIndex"
                        type="number"
                        min={0}
                        max={999}
                        className="input"
                        defaultValue={plan.orderIndex}
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2.5 pb-2.5 text-sm text-ink-800">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={plan.active}
                        className="h-4 w-4 rounded accent-forest-700"
                      />
                      Active
                    </label>
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="submit" className="btn-primary btn-md">
                      Save plan
                    </button>
                  </div>
                </form>
                <form action={adminTogglePlanAction} className="mt-3 border-t border-sand-100 pt-3">
                  <input type="hidden" name="id" value={plan.id} />
                  <button type="submit" className="btn-secondary btn-sm">
                    {plan.active ? "Hide from plans page" : "Show on plans page"}
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
