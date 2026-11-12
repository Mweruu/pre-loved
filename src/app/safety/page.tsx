import Link from "next/link";
import type { Metadata } from "next";
import {
  Banknote,
  Eye,
  Flag,
  Handshake,
  MapPin,
  MessageSquareWarning,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react";

import { SafetyNotice } from "@/components/safety-notice";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Safety & security",
  description:
    "Buyer and seller safety guidance for Sokoni Nyumbani — how to avoid scams, meet safely, verify payments and report problems.",
};

const buyerTips = [
  {
    icon: Eye,
    title: "Inspect before you pay",
    text: "See and test the item in person before any money changes hands. If a seller refuses a viewing, walk away.",
  },
  {
    icon: MapPin,
    title: "Meet in safe places",
    text: "Choose public, well-lit or mutually agreed locations — estates, malls, busy office receptions. Take a friend for high-value items.",
  },
  {
    icon: Banknote,
    title: "Never prepay strangers",
    text: "Do not send deposits or 'booking fees' to reserve an item. That is the most common scam pattern on classifieds platforms.",
  },
  {
    icon: Phone,
    title: "Verify payments yourself",
    text: "Check money has actually arrived in your own M-Pesa app or bank statement. Screenshots and SMS 'confirmations' are not proof.",
  },
  {
    icon: UserCheck,
    title: "Ask questions",
    text: "Why is it being sold? How old is it? Any faults? Honest sellers welcome questions — evasion is a red flag.",
  },
  {
    icon: MessageSquareWarning,
    title: "Report problems fast",
    text: "Use the Report button on any listing or seller profile. Our moderation team reviews every report.",
  },
];

const sellerTips = [
  {
    icon: Banknote,
    title: "Confirm money before handover",
    text: "Check your own M-Pesa or bank balance before releasing the item. Watch out for fake SMS confirmations and edited screenshots.",
  },
  {
    icon: Handshake,
    title: "Agree terms upfront",
    text: "Price, delivery or collection, and timing — agree everything in writing on WhatsApp before meeting.",
  },
  {
    icon: Truck,
    title: "Be careful with deliveries",
    text: "If you offer delivery, agree payment first or meet at delivery. Never ship an item before receiving full payment.",
  },
  {
    icon: ShieldCheck,
    title: "Protect personal data",
    text: "Share only what a buyer needs. Your listing already carries your preferred contact — no need to send IDs or PINs.",
  },
];

export default async function SafetyPage() {
  const settings = await getSettings();

  return (
    <div>
      <section className="bg-gradient-to-b from-forest-800 to-forest-900 py-14 sm:py-16">
        <div className="container-page max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 bg-gold-500/10 px-3.5 py-1.5 text-xs font-medium text-gold-200">
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Read before you buy or sell
          </p>
          <h1 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">
            Safety &amp; security
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-forest-100/85 sm:text-base">
            Most people on Sokoni Nyumbani are honest folks selling things
            they no longer need. But like any marketplace, a few bad actors
            exist. These habits will keep you safe.
          </p>
        </div>
      </section>

      {/* Full notice */}
      <section className="container-page py-12">
        <SafetyNotice text={settings.safetyNotice} />
      </section>

      {/* Buyer guidance */}
      <section className="container-page py-8">
        <h2 className="section-title">For buyers</h2>
        <p className="section-subtitle">
          Six habits that make buying second-hand safe and pleasant.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {buyerTips.map((tip) => (
            <div key={tip.title} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
                <tip.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3.5 font-semibold text-ink-900">{tip.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                {tip.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Seller guidance */}
      <section className="bg-forest-50/70 py-12">
        <div className="container-page">
          <h2 className="section-title">For sellers</h2>
          <p className="section-subtitle">
            Get paid in full, every time.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {sellerTips.map((tip) => (
              <div key={tip.title} className="card flex gap-4 p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-600">
                  <tip.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-ink-900">{tip.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    {tip.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How we protect the community */}
      <section className="container-page py-12">
        <h2 className="section-title">How we protect the community</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: UserCheck,
              title: "Verified sellers",
              text: "Sellers confirm their email and phone number before listings go live.",
            },
            {
              icon: Eye,
              title: "Moderated listings",
              text: "Every listing is reviewed before it appears in the marketplace.",
            },
            {
              icon: Flag,
              title: "One-tap reporting",
              text: "Any listing or seller can be reported instantly — guests included.",
            },
            {
              icon: ShieldCheck,
              title: "Honest limits",
              text: "We do not guarantee transactions or hold funds — and we say so clearly.",
            },
          ].map((item) => (
            <div key={item.title} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3.5 font-semibold text-ink-900">
                {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-14">
        <div className="card mx-auto max-w-2xl p-8 text-center">
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            Seen something suspicious?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-ink-600">
            Report the listing from its page — or reach our support team
            directly. Reports are confidential.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/contact" className="btn-primary btn-lg">
              Contact support
            </Link>
            <Link href="/marketplace" className="btn-secondary btn-lg">
              Back to browsing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
