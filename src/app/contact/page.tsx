import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle, Mail, MessageCircle, Phone } from "lucide-react";

import { ContactForm } from "@/components/forms/contact-form";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & help",
  description:
    "Get help with buying, selling, subscriptions, payments or safety on Sokoni Nyumbani. Browse FAQs or send our support team a message.",
};

const FAQS = [
  {
    q: "Do I need an account to buy?",
    a: "No. Browsing, searching and contacting sellers is completely free and works without an account. Accounts are only for people who want to sell.",
  },
  {
    q: "How do I contact a seller?",
    a: "Open any listing and tap “Contact seller”. After acknowledging the safety notice you can reach them on WhatsApp or by phone, depending on their preference.",
  },
  {
    q: "Why do sellers pay a subscription?",
    a: "The subscription keeps the marketplace spam-free and supports moderation, verification and hosting. It replaces per-item fees and sales commissions — you keep everything you earn.",
  },
  {
    q: "How do I pay for a subscription?",
    a: "With M-Pesa. After choosing a plan you'll get an STK push prompt on your phone. Your subscription activates only after the payment is verified — never before.",
  },
  {
    q: "Is Sokoni Nyumbani involved in my sale?",
    a: "No. We connect buyers and sellers, but the transaction — agreeing price, payment and collection — happens directly between you and the other party. Please read the safety guide before meeting anyone.",
  },
  {
    q: "How do I report a scam or suspicious listing?",
    a: "Use the Report button on the listing or seller card. You can also message us here. Reports are confidential and reviewed by our moderation team.",
  },
  {
    q: "A seller asked me to send a deposit. Should I?",
    a: "No. Never send money before seeing an item in person. Requests for deposits or 'booking fees' are the most common scam pattern — report them.",
  },
  {
    q: "Can I change my plan later?",
    a: "Yes. You can upgrade or renew any time from your dashboard's Subscription page. Any remaining time on a current plan is extended, not lost.",
  },
];

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div>
      <section className="bg-gradient-to-b from-forest-800 to-forest-900 py-14 sm:py-16">
        <div className="container-page max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-forest-500/60 bg-forest-700/40 px-3.5 py-1.5 text-xs font-medium text-forest-100">
            <HelpCircle className="h-3.5 w-3.5 text-gold-300" aria-hidden="true" />
            We&apos;re here to help
          </p>
          <h1 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">
            Contact &amp; help
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-forest-100/85 sm:text-base">
            Questions about buying, selling, subscriptions or safety? Check the
            FAQs below — or send us a message and a real human will reply.
          </p>
        </div>
      </section>

      <section className="container-page py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr,1.4fr]">
          {/* Contact channels */}
          <div className="space-y-5">
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Talk to us
              </h2>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                  <a
                    href={`mailto:${settings.supportEmail}`}
                    className="font-medium text-ink-800 hover:text-forest-700"
                  >
                    {settings.supportEmail}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                  <span className="font-medium text-ink-800">
                    {settings.supportPhone}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden="true" />
                  <a
                    href={`https://wa.me/${settings.supportWhatsapp}?text=${encodeURIComponent(
                      "Hi Sokoni Nyumbani support,"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ink-800 hover:text-forest-700"
                  >
                    Chat on WhatsApp
                  </a>
                </li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-ink-500">
                Support hours: Monday – Saturday, 8am – 6pm EAT. For urgent
                safety concerns, report the listing immediately — reports are
                actioned first.
              </p>
            </div>

            <div className="rounded-2xl border border-gold-300 bg-gold-50 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gold-900">
                Reporting something urgent?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-700">
                If you suspect a scam, use the Report button on the listing
                itself — that sends our moderators everything they need in one
                tap.
              </p>
              <Link href="/safety" className="btn-secondary btn-sm mt-4">
                Safety guide
              </Link>
            </div>
          </div>

          {/* Message form */}
          <div className="card p-6 sm:p-8">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Send us a message
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              We usually reply within one working day.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-forest-50/70 py-12">
        <div className="container-page">
          <h2 className="section-title">Frequently asked questions</h2>
          <p className="section-subtitle">
            The questions we hear most often.
          </p>
          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.q} className="card group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-ink-400 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 border-t border-sand-100 pt-3 text-sm leading-relaxed text-ink-600">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
