import Link from "next/link";
import type { Metadata } from "next";
import {
  BadgeCheck,
  CreditCard,
  ListChecks,
  Sparkles,
  Star,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatKes } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seller subscription plans",
  description:
    "Simple monthly, 3-month and annual seller subscriptions for listing pre-owned household items on Sokoni Nyumbani. Pay with M-Pesa.",
};

function durationLabel(days: number): string {
  if (days >= 360) return "per year";
  if (days >= 80 && days <= 100) return "per 3 months";
  return `every ${days} days`;
}

export default async function PlansPage() {
  const [plans, session] = await Promise.all([
    prisma.subscriptionPlan
      .findMany({
        where: { active: true },
        orderBy: [{ orderIndex: "asc" }, { priceKes: "asc" }],
      })
      .catch(() => []),
    getSession(),
  ]);

  const authed = Boolean(session.authUser);

  return (
    <div>
      {/* Header */}
      <section className="bg-gradient-to-b from-forest-800 to-forest-900 py-14 sm:py-16">
        <div className="container-page max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-forest-500/60 bg-forest-700/40 px-3.5 py-1.5 text-xs font-medium text-forest-100">
            <Sparkles className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
            Sell with Sokoni Nyumbani
          </p>
          <h1 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">
            One subscription. All your items.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-forest-100/85 sm:text-base">
            Browsing is always free for buyers. Sellers pick a subscription to
            unlock listings — no per-item fees, no commissions on your sales.
            Pay securely with M-Pesa and start listing in minutes.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="container-page py-14">
        {plans.length === 0 ? (
          <div className="card mx-auto max-w-xl p-8 text-center">
            <p className="font-medium text-ink-900">
              Subscription plans are being set up.
            </p>
            <p className="mt-2 text-sm text-ink-500">
              Please check back shortly — or contact support and we&apos;ll
              walk you through selling with us.
            </p>
            <Link href="/contact" className="btn-primary btn-md mt-5">
              Contact support
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => {
              const features = plan.features
                .split("\n")
                .map((f) => f.trim())
                .filter(Boolean);
              const highlight = i === 1 || plans.length === 1;
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
                  <h2 className="text-center font-display text-xl font-semibold text-ink-900">
                    {plan.name}
                  </h2>
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
                    <li className="flex items-start gap-2.5 text-sm text-ink-700">
                      <ListChecks
                        className="mt-0.5 h-4 w-4 shrink-0 text-forest-600"
                        aria-hidden="true"
                      />
                      {plan.maxActiveListings} active listings at a time
                    </li>
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
                    <li className="flex items-start gap-2.5 text-sm text-ink-700">
                      <BadgeCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-forest-600"
                        aria-hidden="true"
                      />
                      Unlimited buyer enquiries via WhatsApp &amp; phone
                    </li>
                  </ul>
                  <div className="mt-6">
                    {authed ? (
                      <Link
                        href="/dashboard/subscription"
                        className={cn(
                          "btn-md w-full",
                          highlight ? "btn-primary" : "btn-secondary"
                        )}
                      >
                        Choose {plan.name}
                      </Link>
                    ) : (
                      <Link
                        href={`/register?next=${encodeURIComponent(
                          "/dashboard/subscription"
                        )}`}
                        className={cn(
                          "btn-md w-full",
                          highlight ? "btn-primary" : "btn-secondary"
                        )}
                      >
                        Start selling
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Payment info */}
      <section className="bg-forest-50/70 py-14">
        <div className="container-page grid gap-8 sm:grid-cols-3">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-white">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold text-ink-900">Pay with M-Pesa</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">
                Subscriptions are paid via M-Pesa (Lipa na M-Pesa). Your plan
                activates only after the payment is verified — never before.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-white">
              <Star className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold text-ink-900">Verified sellers</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">
                Sellers verify their email and phone before listings go live —
                building a community buyers can trust.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-white">
              <BadgeCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold text-ink-900">No hidden fees</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-600">
                You keep 100% of what you sell. We never take a cut of your
                sale or charge buyers anything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-14">
        <div className="card mx-auto max-w-2xl p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            Ready to give your items a second life?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-ink-600">
            Create your free account, verify your email and phone, pick a plan,
            and your items could be live today.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={authed ? "/dashboard/listings/new" : "/register"}
              className="btn-primary btn-lg"
            >
              {authed ? "Create a listing" : "Become a seller"}
            </Link>
            <Link href="/marketplace" className="btn-secondary btn-lg">
              Browse the marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
