import Link from "next/link";
import type { Metadata } from "next";
import {
  HandHeart,
  Leaf,
  MapPin,
  MessageCircle,
  Package,
  Recycle,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { SafetyNotice } from "@/components/safety-notice";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Sokoni Nyumbani is Kenya's marketplace for pre-owned household items — helping homes declutter, relocate and find pre-loved treasures affordably.",
};

const values = [
  {
    icon: Recycle,
    title: "Second life first",
    text: "Every sofa, fridge or cot re-used is one less item in a landfill. We make re-use the easy choice for Kenyan homes.",
  },
  {
    icon: ShieldCheck,
    title: "Safety before sales",
    text: "We verify sellers' emails and phones, moderate every listing and make reporting easy. We never pretend to guarantee transactions — honesty builds trust.",
  },
  {
    icon: MapPin,
    title: "Local by design",
    text: "Items are surfaced county-by-county so buyers find things they can actually inspect and collect nearby.",
  },
  {
    icon: Users,
    title: "Community powered",
    text: "Buyers browse free. Sellers pay one honest subscription. No commissions, no hidden charges, no games.",
  },
];

export default async function AboutPage() {
  const settings = await getSettings();

  return (
    <div>
      <section className="bg-gradient-to-b from-forest-800 to-forest-900 py-14 sm:py-16">
        <div className="container-page max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-forest-500/60 bg-forest-700/40 px-3.5 py-1.5 text-xs font-medium text-forest-100">
            <Sparkles className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
            About {settings.siteName}
          </p>
          <h1 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">
            {settings.tagline}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-forest-100/85 sm:text-base">
            Sokoni Nyumbani — &ldquo;the market at home&rdquo; — is a Kenyan
            marketplace for pre-owned household items. Moving abroad?
            Upgrading the living room? Emptying a relative&apos;s house? We help
            you turn what you no longer need into cash, and help families
            furnish their homes for less.
          </p>
        </div>
      </section>

      {/* What we do */}
      <section className="container-page py-14">
        <h2 className="section-title">What we do</h2>
        <p className="section-subtitle">
          A simple, honest marketplace connecting Kenyan buyers and sellers of
          pre-loved household items.
        </p>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
              <Package className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-semibold text-ink-900">
              For buyers — always free
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Browse, search and filter thousands of pre-owned items by
              category, county, price and condition. Contact sellers directly
              on WhatsApp or phone — no accounts, no buyer fees.
            </p>
          </div>
          <div className="card p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
              <HandHeart className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-semibold text-ink-900">
              For sellers — one subscription
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Verify your email and phone, pick a monthly, 3-month or annual
              plan, pay with M-Pesa, and list up to your plan&apos;s limit.
              You keep every shilling you sell for.
            </p>
          </div>
          <div className="card p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 font-semibold text-ink-900">
              For Kenya — less waste
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Every completed sale keeps a useful item in use. Re-use is the
              most affordable and climate-friendly way to furnish a home.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-forest-50/70 py-14">
        <div className="container-page">
          <h2 className="section-title">What we stand for</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="card flex gap-4 p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-forest-700 text-white">
                  <value.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-ink-900">{value.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    {value.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honest scope note */}
      <section className="container-page py-14">
        <div className="card mx-auto max-w-2xl p-7">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
            <MessageCircle className="h-5 w-5 text-forest-600" aria-hidden="true" />
            What we are — and are not
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-600">
            Sokoni Nyumbani is a meeting place, not a shop. We do not sell the
            items, hold your money, deliver goods, or take part in the
            handshake between buyer and seller. Transactions happen directly
            between you and the other party — so please read and follow our
            safety guidance, meet in safe places, and inspect before you pay.
          </p>
          <Link href="/safety" className="btn-secondary btn-md mt-5">
            Read the safety guide
          </Link>
        </div>
      </section>

      <section className="container-page pb-14">
        <SafetyNotice text={settings.safetyNotice} />
      </section>
    </div>
  );
}
