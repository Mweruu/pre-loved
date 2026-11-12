import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, CircleCheck, FlaskConical, History } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { SubscribeButton } from "@/components/forms/subscribe-button";
import {
  PaymentMethodBadge,
  PaymentStatusBadge,
} from "@/components/badges";
import { isMpesaConfigured } from "@/lib/mpesa";
import { formatKes, formatDate, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My subscription" };

function durationLabel(days: number): string {
  if (days >= 360) return "per year";
  if (days >= 80 && days <= 100) return "per 3 months";
  return `every ${days} days`;
}

export default async function SubscriptionPage() {
  const { profile } = await requireUser("/dashboard/subscription");

  const [subscription, plans, payments] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: profile.id, status: "ACTIVE", endsAt: { gt: new Date() } },
      orderBy: { endsAt: "desc" },
      include: { plan: true },
    }),
    prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: [{ orderIndex: "asc" }, { priceKes: "asc" }],
    }),
    prisma.payment.findMany({
      where: { userId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { plan: true },
    }),
  ]);

  const activeCount = await prisma.listing.count({
    where: { sellerId: profile.id, status: { in: ["ACTIVE", "RESERVED", "PENDING_APPROVAL"] } },
  });

  const simulationMode = !isMpesaConfigured();
  const daysLeft = subscription ? daysUntil(subscription.endsAt) : 0;
  const usedPercent = subscription
    ? Math.min(100, Math.round((activeCount / subscription.maxActiveListings) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">My subscription</h1>
        <p className="section-subtitle">
          One plan, unlimited buyer enquiries, no commissions on your sales.
        </p>
      </div>

      {/* Current subscription */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Current plan
            </p>
            {subscription ? (
              <>
                <p className="mt-1 flex flex-wrap items-center gap-2 font-display text-xl font-semibold text-ink-900">
                  {subscription.plan.name}
                  <span className="badge bg-forest-100 text-forest-800">
                    active
                  </span>
                </p>
                <p className="mt-1.5 text-sm text-ink-500">
                  {daysLeft > 0
                    ? `Expires on ${formatDate(subscription.endsAt)} · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
                    : "This plan has just expired — renew below to keep listing."}
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 font-display text-xl font-semibold text-ink-900">
                  No active subscription
                </p>
                <p className="mt-1.5 text-sm text-ink-500">
                  Pick a plan below to start publishing listings.
                </p>
              </>
            )}
          </div>
          {subscription && (
            <p className="shrink-0 rounded-xl border border-sand-200 bg-sand-50 px-4 py-2 text-sm text-ink-700">
              <span className="font-semibold text-ink-900">{activeCount}</span>{" "}
              / {subscription.maxActiveListings} listing slots in use
            </p>
          )}
        </div>
        {subscription && (
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-sand-200">
            <div
              className={cn(
                "h-full rounded-full",
                usedPercent >= 100 ? "bg-red-500" : "bg-forest-600"
              )}
              style={{ width: `${Math.max(usedPercent, 4)}%` }}
            />
          </div>
        )}
      </div>

      {/* Simulation mode notice */}
      {simulationMode && (
        <div className="rounded-2xl border border-purple-300 bg-purple-50 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-purple-900">
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            SIMULATION MODE — M-Pesa not configured
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-purple-800">
            Live Safaricom Daraja credentials are not set up on this
            deployment, so payments run in a clearly-flagged simulation. You
            can complete the checkout flow end-to-end; payments will be
            recorded as <strong>Simulated</strong>, and subscriptions still
            only activate after the simulated payment is confirmed. Configure
            MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET and MPESA_PASSKEY to
            switch to real STK pushes.
          </p>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {subscription ? "Renew or change plan" : "Choose a plan"}
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Upgrading extends from your current plan&apos;s end date — you never
          lose remaining time.
        </p>
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => {
            const features = plan.features
              .split("\n")
              .map((f) => f.trim())
              .filter(Boolean);
            const highlight = i === 1 || plans.length === 1;
            const isCurrent = subscription?.planId === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "card relative flex flex-col p-6",
                  highlight && "border-forest-500 shadow-lift"
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-ink-950">
                    {plan.badge}
                  </span>
                )}
                {plan.promoText && (
                  <p className="mb-2 text-center text-xs font-semibold text-gold-700">
                    {plan.promoText}
                  </p>
                )}
                <h3 className="text-center font-display text-xl font-semibold text-ink-900">
                  {plan.name}
                </h3>
                <p className="mt-1 text-center text-xs text-ink-500">
                  {plan.description}
                </p>
                <p className="mt-5 text-center">
                  <span className="font-display text-4xl font-semibold text-forest-700">
                    {formatKes(plan.priceKes)}
                  </span>
                  <span className="ml-1.5 text-xs font-medium text-ink-500">
                    {durationLabel(plan.durationDays)}
                  </span>
                </p>
                <p className="mt-2 text-center text-xs font-medium text-ink-600">
                  Up to {plan.maxActiveListings} active listings
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-ink-700"
                    >
                      <BadgeCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-forest-600"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <p className="flex items-center justify-center gap-2 rounded-xl border border-forest-200 bg-forest-50 px-4 py-2.5 text-sm font-semibold text-forest-800">
                      <CircleCheck className="h-4 w-4" aria-hidden="true" />
                      Your current plan
                    </p>
                  ) : (
                    <SubscribeButton
                      planId={plan.id}
                      planName={plan.name}
                      highlight={highlight}
                      label={subscription ? `Switch to ${plan.name}` : `Get ${plan.name}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment history */}
      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <History className="h-5 w-5 text-forest-600" aria-hidden="true" />
          Payment history
        </h2>
        {payments.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-sand-300 bg-sand-50 px-4 py-8 text-center text-sm text-ink-500">
            No payments yet. Your subscription payments will appear here.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const unfinished =
                    payment.status === "PENDING" || payment.status === "VERIFYING";
                  return (
                    <tr key={payment.id}>
                      <td className="whitespace-nowrap">
                        {unfinished ? (
                          <Link
                            href={`/dashboard/subscription/pay/${payment.id}`}
                            className="font-medium text-forest-700 hover:underline"
                          >
                            {formatDate(payment.createdAt)} →
                          </Link>
                        ) : (
                          formatDate(payment.createdAt)
                        )}
                      </td>
                      <td>{payment.plan.name}</td>
                      <td className="whitespace-nowrap font-medium">
                        {formatKes(payment.amount)}
                      </td>
                      <td>
                        <PaymentMethodBadge method={payment.method} />
                      </td>
                      <td>
                        <PaymentStatusBadge status={payment.status} />
                        {payment.status === "FAILED" && payment.failureReason && (
                          <span className="mt-1 block max-w-[16rem] truncate text-xs text-red-600">
                            {payment.failureReason}
                          </span>
                        )}
                      </td>
                      <td className="font-mono text-xs text-ink-500">
                        {payment.mpesaReceipt ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {payments.some((p) => p.status === "PENDING" || p.status === "VERIFYING") && (
          <p className="mt-3 text-xs text-ink-500">
            Unfinished checkouts are marked with a link — open one to complete
            or cancel it.
          </p>
        )}
      </div>
    </div>
  );
}
